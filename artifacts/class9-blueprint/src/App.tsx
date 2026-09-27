import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BarChart3, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Download, Filter, Flame, Grid2X2, ListChecks, Menu, Moon, NotebookPen, RotateCcw, Save, Search, Settings, Sun, Target, Trash2, Trophy, Upload, X, Zap, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { blueprint, checklistItems, milestones, months, ratingDefinitions, type Month, type PlanDay, type Rating, type Status, type Subject } from '@/lib/blueprint';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { AuthBar } from '@/components/AuthBar';
import { BacklogView } from '@/components/BacklogView';
import { ActualSchedule } from '@/components/ActualSchedule';
import { BannerAd, InContentAd, SidebarAd, MobileAd } from '@/components/AdSlots';
import { LandingPage } from '@/components/LandingPage';
import { LoginPage } from '@/components/LoginPage';

export type DayState = PlanDay & { status: Status; rating: Rating | null; notes: string; revision1: boolean; revision2: boolean; microScribe: string; completionTimestamp?: number };
export type SettingsState = { name: string; startDate: string; theme: 'light' | 'dark'; adsEnabled: boolean };
type Store = { 
  days: DayState[]; 
  settings: SettingsState; 
  checklist: boolean[]; 
  syncStatus: 'synced' | 'local' | 'syncing';
  currentUser: User | null;
  authLoading: boolean;
  updateDay: (day: number, patch: Partial<DayState>) => void; 
  resetDay: (day: number) => void; 
  resetAll: () => void; 
  updateSettings: (patch: Partial<SettingsState>) => void; 
  toggleChecklist: (index: number) => void;
};

const defaultSettings: SettingsState = { name: '', startDate: new Date().toISOString().split('T')[0], theme: 'light', adsEnabled: true };
const makeDays = (): DayState[] => blueprint.map((item) => ({ ...item, status: 'not-started', rating: null, notes: '', revision1: false, revision2: false, microScribe: '' }));
const StoreContext = createContext<Store | null>(null);

export function useBlueprint() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Blueprint store is not available');
  return value;
}

function usePersistentStore(): Store {
  const [days, setDays] = useState<DayState[]>(() => {
    try { const raw = localStorage.getItem('class9-blueprint-days'); return raw ? JSON.parse(raw) : makeDays(); } catch { return makeDays(); }
  });
  const [settings, setSettings] = useState<SettingsState>(() => {
    try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem('class9-blueprint-settings') || '{}')) }; } catch { return defaultSettings; }
  });
  const [checklist, setChecklist] = useState<boolean[]>(() => {
    try { return JSON.parse(localStorage.getItem('class9-blueprint-checklist') || '[]').concat([false, false, false, false]).slice(0, 4); } catch { return [false, false, false, false]; }
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local' | 'syncing'>('local');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth & Cloud Sync listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        setSyncStatus('syncing');
        try {
          // Load settings
          const settingsRef = doc(db, 'user_settings', user.uid);
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
            const data = settingsSnap.data() as SettingsState;
            setSettings(data);
            localStorage.setItem('class9-blueprint-settings', JSON.stringify(data));
          } else {
            // Save initial settings to Firestore
            await setDoc(settingsRef, { ...settings, userId: user.uid, updatedAt: new Date().toISOString() });
          }

          // Load progress
          const progressCol = collection(db, 'users', user.uid, 'progress');
          const progressSnap = await getDocs(progressCol);
          if (!progressSnap.empty) {
            const remoteDays = makeDays();
            progressSnap.forEach((docSnap) => {
              const dData = docSnap.data();
              const idx = remoteDays.findIndex((d) => d.day === dData.dayNumber);
              if (idx !== -1) {
                remoteDays[idx] = { ...remoteDays[idx], ...dData };
              }
            });
            setDays(remoteDays);
            localStorage.setItem('class9-blueprint-days', JSON.stringify(remoteDays));
          }

          // Load readiness
          const readinessRef = doc(db, 'users', user.uid, 'readiness', 'main');
          const readinessSnap = await getDoc(readinessRef);
          if (readinessSnap.exists()) {
            const items = readinessSnap.data().items as boolean[];
            if (Array.isArray(items) && items.length === 4) {
              setChecklist(items);
              localStorage.setItem('class9-blueprint-checklist', JSON.stringify(items));
            }
          }

          setSyncStatus('synced');
        } catch (e) {
          console.warn("Cloud sync load fallback to local:", e);
          setSyncStatus('local');
        }
      } else {
        setSyncStatus('local');
      }
    });
    return () => unsubscribe();
  }, []);

  // Save to localStorage
  useEffect(() => { localStorage.setItem('class9-blueprint-days', JSON.stringify(days)); }, [days]);
  useEffect(() => { 
    localStorage.setItem('class9-blueprint-settings', JSON.stringify(settings)); 
    document.documentElement.classList.toggle('dark', settings.theme === 'dark'); 
  }, [settings]);
  useEffect(() => { localStorage.setItem('class9-blueprint-checklist', JSON.stringify(checklist)); }, [checklist]);

  // Sync helpers
  const syncDayToCloud = async (dayNumber: number, dayData: DayState) => {
    if (!auth.currentUser) return;
    setSyncStatus('syncing');
    try {
      const path = `users/${auth.currentUser.uid}/progress/day_${dayNumber}`;
      const ref = doc(db, path);
      await setDoc(ref, {
        userId: auth.currentUser.uid,
        dayNumber,
        status: dayData.status,
        performance: dayData.rating || null,
        notes: dayData.notes || '',
        revision1: dayData.revision1,
        revision2: dayData.revision2,
        microScribe: dayData.microScribe || '',
        completionTimestamp: dayData.completionTimestamp || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSyncStatus('synced');
    } catch (e) {
      console.warn("Cloud day sync error:", e);
      setSyncStatus('local');
    }
  };

  const syncSettingsToCloud = async (newSettings: SettingsState) => {
    if (!auth.currentUser) return;
    setSyncStatus('syncing');
    try {
      const path = `user_settings/${auth.currentUser.uid}`;
      const ref = doc(db, path);
      await setDoc(ref, { ...newSettings, userId: auth.currentUser.uid, updatedAt: new Date().toISOString() }, { merge: true });
      setSyncStatus('synced');
    } catch (e) {
      console.warn("Cloud settings sync error:", e);
      setSyncStatus('local');
    }
  };

  const syncChecklistToCloud = async (newChecklist: boolean[]) => {
    if (!auth.currentUser) return;
    setSyncStatus('syncing');
    try {
      const path = `users/${auth.currentUser.uid}/readiness/main`;
      const ref = doc(db, path);
      await setDoc(ref, { userId: auth.currentUser.uid, items: newChecklist, updatedAt: new Date().toISOString() }, { merge: true });
      setSyncStatus('synced');
    } catch (e) {
      console.warn("Cloud checklist sync error:", e);
      setSyncStatus('local');
    }
  };

  return {
    days, settings, checklist, syncStatus, currentUser, authLoading,
    updateDay: (day, patch) => {
      setDays((current) => current.map((item) => {
        if (item.day === day) {
          const isCompletingNow = patch.status === 'complete' && item.status !== 'complete';
          const updated = { 
            ...item, 
            ...patch, 
            completionTimestamp: isCompletingNow ? Date.now() : (patch.status === 'not-started' ? undefined : item.completionTimestamp) 
          };
          syncDayToCloud(day, updated);
          return updated;
        }
        return item;
      }));
    },
    resetDay: (day) => {
      setDays((current) => current.map((item) => {
        if (item.day === day) {
          const resetItem = { ...item, status: 'not-started' as Status, rating: null, notes: '', revision1: false, revision2: false, microScribe: '', completionTimestamp: undefined };
          syncDayToCloud(day, resetItem);
          return resetItem;
        }
        return item;
      }));
    },
    resetAll: async () => {
      const fresh = makeDays();
      setDays(fresh);
      setChecklist([false, false, false, false]);
      localStorage.setItem('class9-blueprint-days', JSON.stringify(fresh));
      localStorage.setItem('class9-blueprint-checklist', JSON.stringify([false, false, false, false]));

      if (auth.currentUser) {
        setSyncStatus('syncing');
        try {
          const uid = auth.currentUser.uid;
          const batchPromises = fresh.map((d) => {
            const ref = doc(db, 'users', uid, 'progress', `day_${d.day}`);
            return setDoc(ref, {
              userId: uid,
              dayNumber: d.day,
              status: 'not-started',
              performance: null,
              notes: '',
              revision1: false,
              revision2: false,
              microScribe: '',
              completionTimestamp: null,
              updatedAt: new Date().toISOString()
            });
          });
          const readinessRef = doc(db, 'users', uid, 'readiness', 'main');
          const resetReadiness = setDoc(readinessRef, {
            userId: uid,
            items: [false, false, false, false],
            updatedAt: new Date().toISOString()
          });
          await Promise.all([...batchPromises, resetReadiness]);
          setSyncStatus('synced');
        } catch (e) {
          console.error("Cloud reset error:", e);
          setSyncStatus('local');
        }
      }
    },
    updateSettings: (patch) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        syncSettingsToCloud(next);
        return next;
      });
    },
    toggleChecklist: (index) => {
      setChecklist((current) => {
        const next = current.map((value, i) => i === index ? !value : value);
        syncChecklistToCloud(next);
        return next;
      });
    },
  };
}

export const subjectColor: Record<Subject, string> = {
  Mathematics: 'bg-[hsl(168_31%_88%)] text-[hsl(168_48%_25%)]',
  Science: 'bg-[hsl(41_92%_82%)] text-[hsl(33_58%_27%)]',
  'Social Science': 'bg-[hsl(284_28%_88%)] text-[hsl(284_32%_36%)]',
  'English & Language': 'bg-[hsl(6_42%_87%)] text-[hsl(6_62%_34%)]',
  'All Subjects': 'bg-[hsl(224_18%_87%)] text-[hsl(224_34%_26%)]',
};
export const subjectShort: Record<Subject, string> = { Mathematics: 'MAT', Science: 'SCI', 'Social Science': 'SST', 'English & Language': 'ENG', 'All Subjects': 'ALL' };

export function ProgressBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${Math.round(value)} percent complete`}><div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function StatusPill({ status }: { status: Status }) {
  const label = status === 'complete' ? 'Complete' : status === 'in-progress' ? 'In progress' : 'Not started';
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[.11em] ${status === 'complete' ? 'bg-[hsl(168_31%_88%)] text-[hsl(168_48%_25%)]' : status === 'in-progress' ? 'bg-accent/35 text-foreground' : 'bg-muted text-muted-foreground'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'complete' ? 'bg-[hsl(168_48%_38%)]' : status === 'in-progress' ? 'bg-[hsl(33_80%_45%)]' : 'bg-muted-foreground/50'}`} />{label}</span>;
}

export function RatingPill({ rating }: { rating: Rating | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">Unrated</span>;
  return <span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${rating === 'Base' ? 'border-[hsl(6_62%_50%_/_.35)] bg-[hsl(6_42%_87%)] text-[hsl(6_62%_34%)]' : rating === 'Mid' ? 'border-[hsl(41_72%_48%_/_.35)] bg-[hsl(41_92%_82%)] text-[hsl(33_58%_27%)]' : 'border-[hsl(168_48%_38%_/_.35)] bg-[hsl(168_31%_88%)] text-[hsl(168_48%_25%)]'}`}>{rating}</span>;
}

export function DayCard({ day, compact = false, onSelect }: { day: DayState; compact?: boolean; onSelect?: (day: number) => void }) {
  return <button data-testid={`card-day-${day.day}`} onClick={() => onSelect?.(day.day)} className={`card-lift group w-full rounded-2xl border border-card-border bg-card p-4 text-left shadow-[0_3px_0_hsl(var(--foreground)/.04)] transition focus-ring ${compact ? 'md:p-3' : ''}`}>
    <div className="flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${day.status === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}><span className="font-mono text-[10px] uppercase">day</span><span className="font-display text-lg leading-none">{day.day}</span></div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectColor[day.subject]}`}>{subjectShort[day.subject]}</span><span className="font-mono text-[10px] text-muted-foreground">{day.date}</span>{day.rating && <RatingPill rating={day.rating} />}</div>
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{day.chapter}</h3>
        {!compact && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{day.target}</p>}
      </div>
      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </div>
    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3"><StatusPill status={day.status} />{(day.revision1 || day.revision2) && <span className="font-mono text-[10px] text-muted-foreground">REV {day.revision1 ? '1' : ''}{day.revision2 ? ' 2' : ''}</span>}</div>
  </button>;
}

function Shell({ children }: { children: ReactNode }) {
  const { settings, days, syncStatus } = useBlueprint();
  const [location, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const complete = days.filter((item) => item.status === 'complete').length;

  const start = new Date(`${settings.startDate}T00:00:00`);
  const now = new Date();
  const backlogCount = days.filter((item) => {
    const assigned = new Date(start.getTime() + (item.day - 1) * 86400000);
    return assigned < now && item.status !== 'complete';
  }).length;

  const nav = [
    { href: '/', label: 'Dashboard', icon: Grid2X2 },
    { href: '/journey', label: 'Journey', icon: ListChecks },
    { href: '/today', label: 'Today', icon: Target },
    { href: '/backlog', label: `Backlog${backlogCount ? ` (${backlogCount})` : ''}`, icon: Clock },
    { href: '/schedule', label: 'Actual Schedule', icon: Calendar },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/weak-areas', label: 'Weak areas', icon: Zap },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];
  const globalMatches = search.trim() ? days.filter((item) => `${item.chapter} ${item.target} ${item.subject}`.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];
  return <div className="min-h-[100dvh] bg-background text-foreground">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[246px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2 focus-ring" data-testid="link-brand"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-primary font-display text-xl text-sidebar-primary-foreground">FC</span><span><span className="block font-display text-lg leading-none">Final Comeback</span><span className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">90 day study system</span></span></Link>
      <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/45">Plan</p>
      <nav className="space-y-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replace(/[^a-z]/g, '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${location === href ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Icon className="h-4 w-4" />{label}{href === '/today' && <span className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary" />}{href === '/backlog' && backlogCount > 0 && <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">{backlogCount}</span>}</Link>)}</nav>
      <p className="mb-2 mt-8 px-2 font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/45">Finish line</p>
      <Link href="/readiness" data-testid="link-nav-readiness" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${location === '/readiness' ? 'bg-sidebar-accent font-semibold' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><ClipboardCheck className="h-4 w-4" />Readiness</Link>
      <Link href="/settings" data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${location === '/settings' ? 'bg-sidebar-accent font-semibold' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Settings className="h-4 w-4" />Settings</Link>
      <div className="my-2">
        <SidebarAd adsEnabled={settings.adsEnabled} slotName="shell-sidebar-nav" />
      </div>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/65 p-3"><div className="mb-2 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-wider text-sidebar-foreground/55">Journey complete</span><span className="font-display text-xl">{complete}</span></div><ProgressBar value={complete / .9} color="bg-sidebar-primary" /><p className="mt-2 text-xs text-sidebar-foreground/55">of 90 days logged</p></div>
    </aside>
    <div className="lg:pl-[246px]">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <button data-testid="button-mobile-menu" onClick={() => setMobileNav(true)} className="rounded-lg p-2 hover:bg-muted focus-ring lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input data-testid="input-global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your blueprint" className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />{globalMatches.length > 0 && <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">{globalMatches.map((item) => <button key={item.day} data-testid={`button-search-result-${item.day}`} onClick={() => { setSearch(''); setLocation(`/journey/day/${item.day}`); }} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-muted"><span className="font-mono text-xs text-muted-foreground">D{item.day}</span><span className="truncate">{item.chapter}</span></button>)}</div>}</div>
          <div className="ml-auto flex items-center gap-3">
            <AuthBar syncStatus={syncStatus} />
            <Link href="/settings" data-testid="link-header-settings" className="rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-ring"><Settings className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10">
        {children}
      </main>
    </div>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur lg:hidden">{nav.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-mobile-${label.toLowerCase()}`} className={`flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-semibold ${location === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Icon className="h-4 w-4" /><span>{label.split(' ')[0]}</span></Link>)}</nav>
    {mobileNav && <div className="fixed inset-0 z-50 bg-foreground/30 lg:hidden" onClick={() => setMobileNav(false)}><div className="h-full w-[280px] bg-sidebar p-5 text-sidebar-foreground overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="mb-8 flex items-center justify-between"><span className="font-display text-xl">Final Comeback</span><button data-testid="button-close-mobile-menu" onClick={() => setMobileNav(false)} className="rounded-lg p-2 hover:bg-sidebar-accent"><X className="h-5 w-5" /></button></div>{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileNav(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"><Icon className="h-4 w-4" />{label}</Link>)}<Link href="/readiness" onClick={() => setMobileNav(false)} className="mt-6 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"><ClipboardCheck className="h-4 w-4" />Readiness</Link><Link href="/settings" onClick={() => setMobileNav(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/85 hover:bg-sidebar-accent"><Settings className="h-4 w-4" />Settings</Link></div></div>}
  </div>;
}

function PageTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">{eyebrow}</p><h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>{copy && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{copy}</p>}</div>{action}</div>;
}

function Metric({ label, value, note, icon: Icon, accent = false }: { label: string; value: string; note: string; icon: typeof Target; accent?: boolean }) {
  return <div className={`rounded-2xl border border-card-border p-4 ${accent ? 'bg-primary text-primary-foreground' : 'bg-card'}`}><div className="mb-5 flex items-center justify-between"><span className={`font-mono text-[10px] uppercase tracking-[.15em] ${accent ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{label}</span><Icon className={`h-4 w-4 ${accent ? 'text-accent' : 'text-muted-foreground'}`} /></div><div className="font-display text-4xl">{value}</div><p className={`mt-1 text-xs ${accent ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{note}</p></div>;
}

function Dashboard() {
  const { days, settings } = useBlueprint();
  const [_, setLocation] = useLocation();

  const complete = days.filter((item) => item.status === 'complete').length;
  const remaining = 90 - complete;
  const rated = days.filter((item) => item.rating).length;
  const base = days.filter((item) => item.rating === 'Base').length;
  const streak = getStreak(days);

  // TODAY: lowest-numbered incomplete Study Day
  const next = days.find((item) => item.status !== 'complete') || days[89];

  // Backlog count
  const start = new Date(`${settings.startDate}T00:00:00`);
  const now = new Date();
  const backlogCount = days.filter((item) => {
    const assigned = new Date(start.getTime() + (item.day - 1) * 86400000);
    return assigned < now && item.status !== 'complete';
  }).length;

  // Pace calculation (study days per week based on recent completions or history)
  // Let's compute study days per week over completed items
  const completedItems = days.filter(d => d.status === 'complete');
  let paceText = 'Insufficient data';
  let projectedDateText = 'Estimate pending history';
  let paceStatus = 'Insufficient Data';

  if (completedItems.length >= 2) {
    // Estimate pace based on span
    const timestamps = completedItems.map(d => d.completionTimestamp || start.getTime()).sort((a,b) => a - b);
    const firstTime = timestamps[0];
    const lastTime = timestamps[timestamps.length - 1];
    const daysElapsed = Math.max(1, (lastTime - firstTime) / 86400000);
    const studyDaysPerWeek = Number(((completedItems.length / daysElapsed) * 7).toFixed(1));
    paceText = `${studyDaysPerWeek} study days/week`;

    if (studyDaysPerWeek > 0) {
      const weeksRemaining = remaining / studyDaysPerWeek;
      const projDate = new Date(Date.now() + weeksRemaining * 7 * 86400000);
      projectedDateText = projDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const calendarDaysSinceStart = Math.max(1, (now.getTime() - start.getTime()) / 86400000);
    const expectedComplete = calendarDaysSinceStart * (7/7); // roughly 1 per day or expected arc
    if (complete >= expectedComplete) {
      paceStatus = 'Ahead';
    } else if (complete >= expectedComplete * 0.7) {
      paceStatus = 'On Track';
    } else {
      paceStatus = 'Behind';
    }
  } else if (complete === 1) {
    paceText = '1.0 study day/week (initial)';
    paceStatus = 'On Track';
  }

  const recent = days.filter((item) => item.status === 'complete').slice(-3).reverse();
  const upcoming = days.filter((item) => item.status !== 'complete').slice(0, 4);

  return <>
    <PageTitle 
      eyebrow="Your command centre" 
      title={`Keep going${settings.name ? `, ${settings.name}` : ''}.`} 
      copy="A rolling 90-day study ritual for the full Class 9 syllabus. One focused day at a time." 
      action={<button data-testid="button-start-today" onClick={() => setLocation('/today')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 focus-ring"><Target className="h-4 w-4" />Open today (Day {next.day})</button>} 
    />

    {/* Metrics Grid */}
    <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Days complete" value={`${complete}/90`} note={`${Math.round(complete / .9)}% of the journey`} icon={Check} accent />
      <Metric label="Study days remaining" value={`${remaining}`} note={`Pace: ${paceStatus}`} icon={CalendarDays} />
      <Metric label="Current pace" value={paceText.split(' ')[0]} note={paceText} icon={Flame} />
      <Metric label="Backlog queue" value={`${backlogCount}`} note={backlogCount ? 'Missed assigned days' : 'Zero backlog'} icon={Clock} />
    </section>

    {/* Non-intrusive Banner Ad */}
    <BannerAd adsEnabled={settings.adsEnabled} slotName="dashboard-top-banner" />

    <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Current Required Day</p>
            <h2 className="mt-1 font-display text-2xl">Day {next.day} · {next.date}</h2>
          </div>
          <Link href={`/journey/day/${next.day}`} data-testid="link-next-day" className="rounded-lg p-2 text-muted-foreground hover:bg-muted focus-ring"><ChevronRight className="h-5 w-5" /></Link>
        </div>
        <div className="rounded-xl bg-muted/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectColor[next.subject]}`}>{next.subject}</span>
            <StatusPill status={next.status} />
          </div>
          <h3 className="text-xl font-bold leading-tight">{next.chapter}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{next.target}</p>
          <button data-testid="button-begin-next-day" onClick={() => setLocation(`/journey/day/${next.day}`)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 focus-ring">
            {next.status === 'not-started' ? 'Begin this day' : 'Continue this day'}<ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Journey progress</span>
          <span className="font-mono text-foreground">{complete}/90</span>
        </div>
        <div className="mt-2"><ProgressBar value={complete / .9} /></div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <span>Projected completion:</span>
          <span className="font-mono font-semibold text-foreground">{projectedDateText}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Small wins</p>
            <h2 className="mt-1 font-display text-2xl">Recent check-offs</h2>
          </div>
          <Link href="/analytics" data-testid="link-dashboard-analytics" className="text-xs font-bold text-muted-foreground hover:text-foreground">View data</Link>
        </div>
        {recent.length ? (
          <div className="space-y-3">
            {recent.map((day) => (
              <button key={day.day} data-testid={`button-recent-${day.day}`} onClick={() => setLocation(`/journey/day/${day.day}`)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted focus-ring">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Check className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{day.chapter}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">Day {day.day} · {day.date}</span>
                </span>
                <RatingPill rating={day.rating} />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center py-12 text-center">
            <p className="text-xs text-muted-foreground">Completed study days will appear here.</p>
          </div>
        )}
      </section>
    </div>

    {backlogCount > 0 && (
      <section className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive text-destructive-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-xl text-destructive">Backlog Warning</h3>
            <p className="text-xs text-muted-foreground">You have {backlogCount} assigned study day{backlogCount === 1 ? '' : 's'} remaining in your backlog queue.</p>
          </div>
        </div>
        <Link href="/backlog" className="rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground hover:opacity-90 transition">
          View Backlog
        </Link>
      </section>
    )}

    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Keep the rhythm</p>
          <h2 className="font-display text-2xl">Up next</h2>
        </div>
        <Link href="/journey" data-testid="link-dashboard-journey" className="text-xs font-bold text-muted-foreground hover:text-foreground">See full journey</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{upcoming.map((day) => <DayCard key={day.day} day={day} compact onSelect={(id) => setLocation(`/journey/day/${id}`)} />)}</div>
    </section>

    {/* In-content Ad */}
    <InContentAd adsEnabled={settings.adsEnabled} slotName="dashboard-mid-content" />

    <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-2xl border border-primary/15 bg-primary p-5 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/55">The competency system</p>
            <h2 className="mt-2 font-display text-2xl">Rate what you really know.</h2>
          </div>
          <CircleHelp className="h-5 w-5 text-accent" />
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/70">Base means urgent re-revision. Mid means more problem solving. Peak means full mastery and exam readiness.</p>
        <Link href="/weak-areas" data-testid="link-dashboard-weak-areas" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline">Review weak areas <ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="rounded-2xl border border-card-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Milestones</p>
        <div className="mt-4 space-y-3">{milestones.map((milestone) => <div key={milestone.day} className="flex gap-3"><div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${days[milestone.day - 1].status === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{days[milestone.day - 1].status === 'complete' ? <Check className="h-3.5 w-3.5" /> : milestone.day}</div><div><p className="text-sm font-semibold">{milestone.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{milestone.copy}</p></div></div>)}</div>
      </div>
    </section>

    <MobileAd adsEnabled={settings.adsEnabled} slotName="dashboard-bottom-mobile" />
  </>;
}

function EmptyState({ icon: Icon, title, copy, compact = false }: { icon: typeof Search; title: string; copy: string; compact?: boolean }) {
  return <div className={`grid place-items-center text-center ${compact ? 'py-7' : 'rounded-2xl border border-dashed border-border py-14'}`}><span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></span><p className="font-semibold">{title}</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{copy}</p></div>;
}

function Journey() {
  const { days, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  const [subject, setSubject] = useState('All subjects');
  const [month, setMonth] = useState('All months');
  const [status, setStatus] = useState('All status');
  const [performance, setPerformance] = useState('All performance');
  const [showFilters, setShowFilters] = useState(false);
  const filtered = days.filter((item) => (subject === 'All subjects' || item.subject === subject) && (month === 'All months' || item.month === month) && (status === 'All status' || (status === 'Complete' ? item.status === 'complete' : status === 'Not started' ? item.status === 'not-started' : item.status === 'in-progress')) && (performance === 'All performance' || item.rating === performance));
  
  return <>
    <PageTitle eyebrow="The full syllabus" title="Your journey." copy="Ninety focused days, grouped into three phases. Use filters when you need a closer view." action={<button data-testid="button-toggle-filters" onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:bg-muted focus-ring"><Filter className="h-4 w-4" />Filters {showFilters ? 'on' : ''}</button>} />
    {showFilters && <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">{[['Subject', subject, setSubject, ['All subjects', 'Mathematics', 'Science', 'Social Science', 'English & Language', 'All Subjects']], ['Month', month, setMonth, ['All months', ...months]], ['Status', status, setStatus, ['All status', 'Complete', 'In progress', 'Not started']], ['Performance', performance, setPerformance, ['All performance', 'Base', 'Mid', 'Peak']]].map(([label, value, setter, options]) => <label key={String(label)} className="text-xs font-bold text-muted-foreground">{String(label)}<select data-testid={`select-filter-${String(label).toLowerCase()}`} value={String(value)} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring/20">{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>}
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="journey-top-banner" />

    <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground"><span>{filtered.length} of 90 days shown</span><span className="font-mono">{days.filter((item) => item.status === 'complete').length}/90 complete</span></div>
    
    {months.map((monthName, idx) => { 
      const group = filtered.filter((item) => item.month === monthName); 
      if (!group.length) return null; 
      const phase = monthName === 'October' ? 'Building momentum' : monthName === 'November' ? 'No-backlog November' : 'The final lap'; 
      return (
        <React.Fragment key={monthName}>
          <section className="mb-9">
            <div className="mb-3 flex items-end justify-between border-b border-border pb-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{phase}</p><h2 className="mt-1 font-display text-3xl">{monthName}</h2></div>
              <span className="font-mono text-xs text-muted-foreground">{group.length} days</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{group.map((day) => <DayCard key={day.day} day={day} onSelect={(id) => setLocation(`/journey/day/${id}`)} />)}</div>
          </section>
          {idx === 0 && <InContentAd adsEnabled={settings.adsEnabled} slotName="journey-month1-content" />}
          {idx === 1 && <InContentAd adsEnabled={settings.adsEnabled} slotName="journey-month2-content" />}
        </React.Fragment>
      ); 
    })}
    {!filtered.length && <EmptyState icon={Search} title="No data yet for this view" copy="Try loosening one of the filters to see plan days." />}
    <MobileAd adsEnabled={settings.adsEnabled} slotName="journey-bottom-mobile" />
  </>;
}

function Today() {
  const { days, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  
  // TODAY button must always open the lowest-numbered incomplete Study Day
  const today = days.find((item) => item.status !== 'complete') || days[89];
  const index = today.day - 1;
  const previous = days[index - 1];
  const next = days[index + 1];

  return <>
    <PageTitle eyebrow="Date-driven focus" title="Today's Required Focus." copy={today.status === 'complete' ? 'All caught up! You can review completed days or explore ahead.' : 'The lowest-numbered incomplete study day in your 90-day sequence.'} action={<div className="flex items-center gap-2"><button disabled={!previous} data-testid="button-today-previous" onClick={() => previous && setLocation(`/journey/day/${previous.day}`)} className="rounded-xl border border-border bg-card p-3 text-muted-foreground disabled:opacity-40 hover:bg-muted focus-ring"><ChevronLeft className="h-4 w-4" /></button><button disabled={!next} data-testid="button-today-next" onClick={() => next && setLocation(`/journey/day/${next.day}`)} className="rounded-xl border border-border bg-card p-3 text-muted-foreground disabled:opacity-40 hover:bg-muted focus-ring"><ChevronRight className="h-4 w-4" /></button></div>} />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="today-top-banner" />

    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">Day {today.day}</span>
          <span className="font-mono text-xs text-muted-foreground">{today.date}</span>
          <StatusPill status={today.status} />
        </div>
        <h2 className="mt-6 max-w-3xl font-display text-4xl leading-[1.05] sm:text-5xl">{today.chapter}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{today.target}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button data-testid="button-open-today" onClick={() => setLocation(`/journey/day/${today.day}`)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-ring">
            {today.status === 'complete' ? 'Review day' : 'Open day details'}<ChevronRight className="h-4 w-4" />
          </button>
          <Link href="/journey" data-testid="link-today-journey" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold hover:bg-muted focus-ring">Browse journey</Link>
        </div>
      </section>
      <aside className="rounded-2xl border border-border bg-secondary/50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[.17em] text-muted-foreground">Rolling logic rule</p>
        <div className="mt-8">
          <NotebookPen className="h-8 w-8 text-[hsl(168_48%_38%)]" />
          <p className="mt-5 font-display text-2xl">Skipping calendar days does not auto-advance your study day.</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Today always points to your earliest uncompleted study day. You can also work ahead freely.</p>
        </div>
      </aside>
    </div>

    <InContentAd adsEnabled={settings.adsEnabled} slotName="today-mid-content" />

    <section className="mt-5 grid gap-3 sm:grid-cols-3">{days.slice(Math.max(0, index - 1), Math.min(90, index + 2)).map((day) => <DayCard key={day.day} day={day} compact onSelect={(id) => setLocation(`/journey/day/${id}`)} />)}</section>
    
    <MobileAd adsEnabled={settings.adsEnabled} slotName="today-bottom-mobile" />
  </>;
}

function CalendarView() {
  const { days, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  const [monthIndex, setMonthIndex] = useState(0);
  const selectedMonth = months[monthIndex];
  const monthDays = days.filter((item) => item.month === selectedMonth);
  const offset = monthIndex === 0 ? 3 : monthIndex === 1 ? 6 : 1;
  return <>
    <PageTitle eyebrow="Plan mapped to dates" title="Calendar." copy="A quiet view of every planned study date. Select a day to open its tracker." action={<div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1"><button data-testid="button-calendar-previous" onClick={() => setMonthIndex(Math.max(0, monthIndex - 1))} className="rounded-lg p-2 hover:bg-muted disabled:opacity-30" disabled={!monthIndex}><ChevronLeft className="h-4 w-4" /></button><span className="w-24 text-center font-mono text-xs">{selectedMonth}</span><button data-testid="button-calendar-next" onClick={() => setMonthIndex(Math.min(2, monthIndex + 1))} className="rounded-lg p-2 hover:bg-muted disabled:opacity-30" disabled={monthIndex === 2}><ChevronRight className="h-4 w-4" /></button></div>} />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="calendar-top-banner" />

    <div className="rounded-2xl border border-card-border bg-card p-3 sm:p-5">
      <div className="mb-3 grid grid-cols-7 gap-1 text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:gap-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: offset }).map((_, i) => <div key={`blank-${i}`} className="min-h-24 rounded-xl bg-muted/30 sm:min-h-32" />)}{monthDays.map((day) => <button key={day.day} data-testid={`button-calendar-day-${day.day}`} onClick={() => setLocation(`/journey/day/${day.day}`)} className={`group min-h-24 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:border-ring focus-ring sm:min-h-32 ${day.status === 'complete' ? 'border-[hsl(168_48%_38%_/_.3)] bg-[hsl(168_31%_88%_/_.4)]' : day.status === 'in-progress' ? 'border-accent/50 bg-accent/10' : 'border-border bg-background'}`}><div className="flex items-start justify-between"><span className="font-display text-lg">{day.day - (monthIndex === 0 ? 0 : monthIndex === 1 ? 31 : 60)}</span>{day.status === 'complete' && <Check className="h-3.5 w-3.5 text-[hsl(168_48%_38%)]" />}</div><span className={`mt-2 hidden rounded px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:inline-block ${subjectColor[day.subject]}`}>{subjectShort[day.subject]}</span><p className="mt-2 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{day.chapter.replace(/^Ch \d+: /, '')}</p></button>)}</div>
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-primary" />Complete</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-accent" />In progress</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />Not started</span></div>
    
    <InContentAd adsEnabled={settings.adsEnabled} slotName="calendar-bottom-content" />
    <MobileAd adsEnabled={settings.adsEnabled} slotName="calendar-bottom-mobile" />
  </>;
}

function Subjects() {
  const { days, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  const subjects: Subject[] = ['Mathematics', 'Science', 'Social Science', 'English & Language'];
  return <>
    <PageTitle eyebrow="See the balance" title="Subjects." copy="Keep the rotation honest. Each subject has its own pace inside the single 90-day plan." />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="subjects-top-banner" />

    <div className="grid gap-4 md:grid-cols-2">{subjects.map((subject) => { const list = days.filter((item) => item.subject === subject); const complete = list.filter((item) => item.status === 'complete').length; const base = list.filter((item) => item.rating === 'Base').length; return <section key={subject} className="card-lift rounded-2xl border border-card-border bg-card p-5 sm:p-6"><div className="flex items-start justify-between"><div><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectColor[subject]}`}>{subjectShort[subject]}</span><h2 className="mt-4 font-display text-3xl">{subject}</h2></div><span className="font-display text-3xl">{complete}<small className="font-sans text-sm text-muted-foreground">/{list.length}</small></span></div><div className="mt-5"><ProgressBar value={complete / list.length * 100} color={subject === 'Mathematics' ? 'bg-[hsl(168_48%_38%)]' : subject === 'Science' ? 'bg-[hsl(41_72%_48%)]' : 'bg-[hsl(284_32%_58%)]'} /></div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{complete ? `${Math.round(complete / list.length * 100)}% complete` : 'No data yet'}</span><span>{base ? `${base} Base topics` : 'No Base topics logged'}</span></div><button data-testid={`button-subject-${subjectShort[subject]}`} onClick={() => setLocation(`/journey`)} className="mt-5 flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-xs font-bold hover:bg-muted focus-ring">Open subject plan <ChevronRight className="h-3.5 w-3.5" /></button></section>; })}</div>
    
    <InContentAd adsEnabled={settings.adsEnabled} slotName="subjects-mid-content" />

    <section className="mt-5 rounded-2xl border border-border bg-secondary/50 p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Rotation from the source</p><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><span className="font-bold">October</span><p className="mt-1 text-muted-foreground">Build momentum across Math, Science, and SST.</p></div><div><span className="font-bold">November</span><p className="mt-1 text-muted-foreground">Reach the 75% syllabus milestone without backlog.</p></div><div><span className="font-bold">December</span><p className="mt-1 text-muted-foreground">Complete the syllabus, then test and revise.</p></div></div></section>
    
    <MobileAd adsEnabled={settings.adsEnabled} slotName="subjects-bottom-mobile" />
  </>;
}

function WeakAreas() {
  const { days, updateDay, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  const weak = days.filter((item) => item.rating === 'Base');
  return <>
    <PageTitle eyebrow="Make weak actionable" title="Weak areas." copy="Every Base rating lands here. Revisit it, record revision 1 and 2, then update the rating when the understanding moves." action={<span className="rounded-full bg-[hsl(6_42%_87%)] px-3 py-2 text-xs font-bold text-[hsl(6_62%_34%)]">{weak.length} Base-rated</span>} />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="weakareas-top-banner" />

    {weak.length ? <div className="grid gap-3 lg:grid-cols-2">{weak.map((day) => <article key={day.day} className="rounded-2xl border border-[hsl(6_62%_50%_/_.2)] bg-card p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(6_42%_87%)] font-display text-lg text-[hsl(6_62%_34%)]">{day.day}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${subjectColor[day.subject]}`}>{subjectShort[day.subject]}</span><span className="font-mono text-[10px] text-muted-foreground">{day.date}</span></div><h2 className="mt-2 font-semibold">{day.chapter}</h2><p className="mt-1 text-sm text-muted-foreground">{day.target}</p></div><button data-testid={`button-open-weak-${day.day}`} onClick={() => setLocation(`/journey/day/${day.day}`)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted focus-ring"><ChevronRight className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><button data-testid={`button-revision-one-${day.day}`} onClick={() => updateDay(day.day, { revision1: !day.revision1 })} className={`rounded-lg border px-3 py-2 text-xs font-bold transition focus-ring ${day.revision1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{day.revision1 ? <Check className="mr-1 inline h-3 w-3" /> : null}Revision 1</button><button data-testid={`button-revision-two-${day.day}`} onClick={() => updateDay(day.day, { revision2: !day.revision2 })} className={`rounded-lg border px-3 py-2 text-xs font-bold transition focus-ring ${day.revision2 ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>{day.revision2 ? <Check className="mr-1 inline h-3 w-3" /> : null}Revision 2</button><span className="ml-auto self-center text-[10px] text-muted-foreground">{day.revision1 && day.revision2 ? 'Ready to re-rate' : 'Keep revisiting'}</span></div></article>)}</div> : <EmptyState icon={Zap} title="No data yet in weak areas" copy="Rate a studied topic as Base when it needs urgent re-revision. Honest ratings make this page useful." />}
    
    <InContentAd adsEnabled={settings.adsEnabled} slotName="weakareas-mid-content" />
    <MobileAd adsEnabled={settings.adsEnabled} slotName="weakareas-bottom-mobile" />
  </>;
}

function Analytics() {
  const { days, settings } = useBlueprint();
  const complete = days.filter((item) => item.status === 'complete').length;
  const rated = days.filter((item) => item.rating);
  const ratings = { Base: rated.filter((item) => item.rating === 'Base').length, Mid: rated.filter((item) => item.rating === 'Mid').length, Peak: rated.filter((item) => item.rating === 'Peak').length };
  const streak = getStreak(days);
  return <>
    <PageTitle eyebrow="Evidence, not vibes" title="Analytics." copy="Real completion, performance, streak, and monthly data from your saved check-offs." />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="analytics-top-banner" />

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Completion" value={`${Math.round(complete / .9)}%`} note={`${complete}/90 days complete`} icon={Check} accent /><Metric label="Rated" value={rated.length ? `${rated.length}` : 'No data yet'} note="topics with a performance rating" icon={BarChart3} /><Metric label="Streak" value={streak ? `${streak}` : 'No data yet'} note="consecutive completed days" icon={Flame} /><Metric label="Peak topics" value={ratings.Peak ? `${ratings.Peak}` : 'No data yet'} note="full mastery & exam readiness" icon={Trophy} /></div>
    
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Monthly pace</p><h2 className="font-display text-2xl">The 90-day arc</h2></div><span className="font-mono text-xs text-muted-foreground">days complete</span></div>
        <div className="flex h-56 items-end gap-3 border-b border-l border-border px-3 pb-0 pt-5 sm:gap-6">{months.map((month) => { const all = days.filter((item) => item.month === month); const done = all.filter((item) => item.status === 'complete').length; return <div key={month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="font-mono text-xs">{done || '—'}</span><div className="progress-stripe w-full max-w-20 rounded-t-lg bg-primary transition-all" style={{ height: `${Math.max(done ? done / all.length * 100 : 3, 3)}%` }} /><span className="pb-3 text-xs font-semibold">{month}</span></div>; })}</div>
      </section>
      <section className="rounded-2xl border border-card-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Performance mix</p><h2 className="mt-1 font-display text-2xl">Your honest read</h2>{rated.length ? <div className="mt-6 space-y-5">{(['Peak', 'Mid', 'Base'] as Rating[]).map((rating) => <div key={rating}><div className="mb-2 flex items-center justify-between"><RatingPill rating={rating} /><span className="font-mono text-xs">{ratings[rating]}</span></div><ProgressBar value={ratings[rating] / rated.length * 100} color={rating === 'Base' ? 'bg-[hsl(6_62%_50%)]' : rating === 'Mid' ? 'bg-[hsl(41_72%_48%)]' : 'bg-[hsl(168_48%_38%)]'} /></div>)}</div> : <div className="mt-6"><EmptyState icon={BarChart3} title="No data yet" copy="Complete and rate topics to see performance here." compact /></div>}<div className="mt-7 border-t border-border pt-4"><p className="text-xs leading-relaxed text-muted-foreground">A Base rating is not a setback. It is a precise next action.</p></div>
      </section>
    </div>

    <InContentAd adsEnabled={settings.adsEnabled} slotName="analytics-mid-content" />
    <SidebarAd adsEnabled={settings.adsEnabled} slotName="analytics-bottom-sidebar" />
  </>;
}

function Readiness() {
  const { checklist, toggleChecklist, days, settings } = useBlueprint();
  const done = checklist.filter(Boolean).length;
  return <>
    <PageTitle eyebrow="The final audit" title="Exam readiness." copy="The source blueprint ends with four checks. Use this page when the daily work turns into readiness." action={<span className="font-mono text-sm">{done}/4 checked</span>} />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="readiness-top-banner" />

    <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Final exam readiness checklist</p><h2 className="mt-1 font-display text-3xl">{done === 4 ? 'Ready to walk in.' : 'Keep closing the loop.'}</h2></div><div className="grid h-14 w-14 place-items-center rounded-full border-4 border-primary font-display text-lg">{done}/4</div></div>
        <div className="space-y-3">{checklistItems.map((item, index) => <button key={item} data-testid={`button-checklist-${index}`} onClick={() => toggleChecklist(index)} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition focus-ring ${checklist[index] ? 'border-[hsl(168_48%_38%_/_.35)] bg-[hsl(168_31%_88%_/_.45)]' : 'border-border hover:bg-muted'}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${checklist[index] ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50'}`}>{checklist[index] && <Check className="h-3.5 w-3.5" />}</span><span className={`text-sm leading-relaxed ${checklist[index] ? 'text-foreground' : 'text-muted-foreground'}`}>{item}</span></button>)}</div>
      </div>
      <aside className="rounded-2xl border border-primary/15 bg-primary p-6 text-primary-foreground">
        <Trophy className="h-7 w-7 text-accent" />
        <h2 className="mt-8 font-display text-3xl">The finish line is specific.</h2>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">Do not confuse activity with readiness. The blueprint asks for the syllabus, competency questions, micro-scribe cheat sheets, and Base topics all to be closed.</p>
        <div className="mt-8 border-t border-primary-foreground/15 pt-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-primary-foreground/55">Plan completion</p><p className="mt-1 font-display text-3xl">{days.filter((item) => item.status === 'complete').length}/90</p></div>
      </aside>
    </section>

    <InContentAd adsEnabled={settings.adsEnabled} slotName="readiness-bottom-content" />
    <MobileAd adsEnabled={settings.adsEnabled} slotName="readiness-bottom-mobile" />
  </>;
}

function DayDetail() {
  const { id } = useParams<{ id: string }>();
  const { days, updateDay, resetDay, settings } = useBlueprint();
  const [_, setLocation] = useLocation();
  const day = days.find((item) => item.day === Number(id));
  const [notes, setNotes] = useState(day?.notes || '');
  const [microScribe, setMicroScribe] = useState(day?.microScribe || '');
  useEffect(() => { setNotes(day?.notes || ''); setMicroScribe(day?.microScribe || ''); }, [day?.day]);
  if (!day) return <EmptyState icon={Search} title="Day not found" copy="This day is not part of the 90-day source plan." />;
  const save = () => updateDay(day.day, { notes, microScribe });
  const markComplete = () => updateDay(day.day, { notes, microScribe, status: day.status === 'complete' ? 'in-progress' : 'complete' });
  return <>
    <button data-testid="button-back-from-day" onClick={() => setLocation('/journey')} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground focus-ring"><ChevronLeft className="h-4 w-4" />Back to journey</button>
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="daydetail-top-banner" />

    <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-primary px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">Day {day.day}</span><span className="font-mono text-xs text-muted-foreground">{day.date} · {day.month}</span><StatusPill status={day.status} /></div>
        <h1 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">{day.chapter}</h1>
        <div className="mt-5 rounded-xl bg-secondary/60 p-4"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Target & action plan</p><p className="mt-2 text-base leading-relaxed">{day.target}</p></div>
        <div className="mt-7"><p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">How did it land?</p><div className="grid gap-2 sm:grid-cols-3">{(['Base', 'Mid', 'Peak'] as Rating[]).map((rating) => <button key={rating} data-testid={`button-rating-${rating.toLowerCase()}`} onClick={() => updateDay(day.day, { rating, status: day.status === 'not-started' ? 'in-progress' : day.status })} className={`rounded-xl border p-3 text-left transition focus-ring ${day.rating === rating ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}><div className="flex items-center justify-between"><span className="font-bold">{rating}</span>{day.rating === rating && <Check className="h-4 w-4" />}</div><p className={`mt-1 text-xs leading-relaxed ${day.rating === rating ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{ratingDefinitions[rating]}</p></button>)}</div></div>
        
        <InContentAd adsEnabled={settings.adsEnabled} slotName="daydetail-mid-content" />

        <div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-muted-foreground">Notes<textarea data-testid="textarea-day-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What clicked? What needs another pass?" className="mt-2 min-h-32 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring/20" /></label><label className="text-xs font-bold text-muted-foreground">Micro-scribe<textarea data-testid="textarea-day-microscribe" value={microScribe} onChange={(event) => setMicroScribe(event.target.value)} placeholder="Condense the key idea into a one-page cue." className="mt-2 min-h-32 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring/20" /></label></div>
        <div className="mt-5 flex flex-wrap gap-2"><button data-testid="button-save-day" onClick={save} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:bg-muted focus-ring"><Save className="h-4 w-4" />Save notes</button><button data-testid="button-complete-day" onClick={markComplete} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-ring"><Check className="h-4 w-4" />{day.status === 'complete' ? 'Move back to in progress' : 'Mark complete'}</button><button data-testid="button-reset-day" onClick={() => { if (window.confirm('Reset this day? Your notes and rating will be cleared.')) { resetDay(day.day); setNotes(''); setMicroScribe(''); } }} className="ml-auto inline-flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-destructive hover:bg-destructive/10 focus-ring"><RotateCcw className="h-3.5 w-3.5" />Reset</button></div>
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Revision tracker</p><h2 className="mt-1 font-display text-2xl">Return to it.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Especially important when this topic is Base-rated.</p><div className="mt-5 space-y-2"><button data-testid="button-detail-revision-1" onClick={() => updateDay(day.day, { revision1: !day.revision1 })} className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm font-bold ${day.revision1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>Revision 1 {day.revision1 && <Check className="h-4 w-4" />}</button><button data-testid="button-detail-revision-2" onClick={() => updateDay(day.day, { revision2: !day.revision2 })} className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm font-bold ${day.revision2 ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>Revision 2 {day.revision2 && <Check className="h-4 w-4" />}</button></div></section>
        <SidebarAd adsEnabled={settings.adsEnabled} slotName="daydetail-side-banner" />
        <section className="rounded-2xl border border-border bg-secondary/50 p-5"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Source terminology</p><div className="mt-4 space-y-3">{(['Base', 'Mid', 'Peak'] as Rating[]).map((rating) => <div key={rating} className="flex gap-2"><RatingPill rating={rating} /><p className="text-xs leading-relaxed text-muted-foreground">{ratingDefinitions[rating]}</p></div>)}</div></section>
      </aside>
    </div>

    <MobileAd adsEnabled={settings.adsEnabled} slotName="daydetail-bottom-mobile" />
  </>;
}

function SettingsPage() {
  const { settings, updateSettings, resetAll, days, checklist } = useBlueprint();
  const [name, setName] = useState(settings.name);
  const [startDate, setStartDate] = useState(settings.startDate);
  const [adsEnabled, setAdsEnabled] = useState(settings.adsEnabled);
  const [saved, setSaved] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const saveSettings = () => { 
    updateSettings({ name: name.trim(), startDate, adsEnabled }); 
    setSaved(true); 
    window.setTimeout(() => setSaved(false), 1800); 
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      await resetAll();
      setShowConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const download = (content: string, filename: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); };
  const exportJson = () => download(JSON.stringify({ version: 1, days, settings, checklist }, null, 2), 'class9-blueprint-progress.json', 'application/json');
  const exportCsv = () => download(['Day,Date,Month,Subject,Chapter,Target,Status,Rating,Revision 1,Revision 2,Notes,Micro-scribe', ...days.map((item) => [item.day, item.date, item.month, item.subject, `"${item.chapter.replaceAll('"', '""')}"`, `"${item.target.replaceAll('"', '""')}"`, item.status, item.rating || '', item.revision1, item.revision2, `"${item.notes.replaceAll('"', '""')}"`, `"${item.microScribe.replaceAll('"', '""')}"`].join(','))].join('\n'), 'class9-blueprint-progress.csv', 'text/csv');
  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); if (!parsed || !Array.isArray(parsed.days) || parsed.days.length !== 90 || !parsed.days.every((item: DayState) => typeof item.day === 'number' && typeof item.chapter === 'string')) throw new Error('invalid'); localStorage.setItem('class9-blueprint-days', JSON.stringify(parsed.days)); if (parsed.settings) localStorage.setItem('class9-blueprint-settings', JSON.stringify({ ...defaultSettings, ...parsed.settings })); if (Array.isArray(parsed.checklist) && parsed.checklist.length === 4) localStorage.setItem('class9-blueprint-checklist', JSON.stringify(parsed.checklist)); window.location.reload(); } catch { window.alert('This file is not a valid Class 9 Blueprint export.'); } }; reader.readAsText(file); };

  return <>
    <PageTitle eyebrow="Make it yours" title="Settings & Preferences." copy="Configure your study start date, theme, monetization preference, and account sync." />
    
    <BannerAd adsEnabled={settings.adsEnabled} slotName="settings-top-banner" />

    <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Settings className="h-5 w-5" /></div>
          <div><h2 className="font-display text-2xl">Study ritual config</h2><p className="mt-1 text-sm text-muted-foreground">Set your start date to calibrate rolling calculations.</p></div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-muted-foreground">Student name<input data-testid="input-student-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring/20" /></label>
          <label className="text-xs font-bold text-muted-foreground">Start date (Rolling anchor)<input data-testid="input-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring/20" /></label>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div>
            <h4 className="font-semibold text-sm">Sponsored Ad Spaces</h4>
            <p className="text-xs text-muted-foreground">Enable or disable non-intrusive sponsor ad slots.</p>
          </div>
          <button
            onClick={() => setAdsEnabled(!adsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adsEnabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <button data-testid="button-save-settings" onClick={saveSettings} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 focus-ring"><Save className="h-4 w-4" />{saved ? 'Saved successfully' : 'Save settings'}</button>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Sun className="h-5 w-5" /></div>
          <div><h2 className="font-display text-2xl">Theme</h2><p className="mt-1 text-sm text-muted-foreground">Choose the reading environment you want.</p></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button data-testid="button-theme-light" onClick={() => updateSettings({ theme: 'light' })} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold ${settings.theme === 'light' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}><Sun className="h-4 w-4" />Light</button>
          <button data-testid="button-theme-dark" onClick={() => updateSettings({ theme: 'dark' })} className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold ${settings.theme === 'dark' ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}><Moon className="h-4 w-4" />Dark</button>
        </div>
      </section>
    </div>

    <section className="mt-5 rounded-2xl border border-destructive/20 bg-[hsl(6_42%_87%_/_.4)] p-5 sm:p-7">
      <div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(6_62%_50%)] text-[hsl(44_38%_95%)]"><Trash2 className="h-5 w-5" /></div><div><h2 className="font-display text-2xl">Reset all progress</h2><p className="mt-1 text-sm text-muted-foreground">This clears every status, rating, note, revision, and readiness check from this browser and cloud account.</p></div></div>
      <button data-testid="button-reset-all" onClick={() => setShowConfirm(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 focus-ring"><Trash2 className="h-4 w-4" />Reset everything</button>
    </section>

    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <h3 className="font-display text-xl">Confirm Complete Reset</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to reset all 90 days of study progress, ratings, micro-scribes, and checklist items? <strong className="text-foreground">This action cannot be undone.</strong>
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isResetting}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResetConfirm}
              disabled={isResetting}
              className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-destructive-foreground hover:opacity-90 transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isResetting ? 'Resetting...' : 'Yes, Reset Everything'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>;
}

function getStreak(days: DayState[]) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) { if (days[i].status === 'complete') streak += 1; else break; }
  return streak;
}

function Router() {
  const [location] = useLocation();
  const { days, settings, currentUser, authLoading } = useBlueprint();

  if (authLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Loading Final Comeback...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (location === '/login') {
      return <LoginPage />;
    }
    return <LandingPage />;
  }

  return <Shell><ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/landing" component={LandingPage} />
    <Route path="/journey" component={Journey} />
    <Route path="/journey/day/:id" component={DayDetail} />
    <Route path="/today" component={Today} />
    <Route path="/backlog"><BacklogView days={days} startDate={settings.startDate} /></Route>
    <Route path="/schedule"><ActualSchedule days={days} startDate={settings.startDate} /></Route>
    <Route path="/calendar" component={CalendarView} />
    <Route path="/subjects" component={Subjects} />
    <Route path="/weak-areas" component={WeakAreas} />
    <Route path="/analytics" component={Analytics} />
    <Route path="/readiness" component={Readiness} />
    <Route path="/settings" component={SettingsPage} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary></Shell>;
}

function App() {
  const store = usePersistentStore();
  return <StoreContext.Provider value={store}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></StoreContext.Provider>;
}

export default App;
