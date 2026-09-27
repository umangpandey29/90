import React from 'react';
import { useLocation, Link } from 'wouter';
import { Target, Check, Zap, Trophy, Shield, ArrowRight, Flame, Clock, BarChart3 } from 'lucide-react';
import { loginWithGoogle } from '@/lib/firebase';
import { BannerAd, InContentAd, SidebarAd, MobileAd } from '@/components/AdSlots';

export const LandingPage: React.FC = () => {
  const [_, setLocation] = useLocation();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setLocation('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary font-display text-lg sm:text-xl text-primary-foreground">FC</span>
            <div>
              <span className="block font-display text-base sm:text-lg leading-none">Final Comeback</span>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[.18em] text-muted-foreground">90-Day Study System</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#syllabus" className="hover:text-foreground transition">Syllabus</a>
            <a href="#methodology" className="hover:text-foreground transition">Methodology</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="px-3 py-2 text-xs sm:text-sm font-bold text-foreground hover:opacity-80 transition">
              Sign In
            </Link>
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm hover:opacity-95 transition"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Ad slot 1: Hero banner */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 pt-4">
        <BannerAd adsEnabled={true} slotName="landing-hero-top" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 py-12 sm:py-16 lg:py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent shrink-0" /> Official Rolling 90-Day Curriculum & Ritual Tracker
          </div>
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1]">
            Master Class 9 Syllabus in 90 Deliberate Days.
          </h1>
          <p className="text-base sm:text-xl leading-relaxed text-muted-foreground">
            A precision study framework designed for serious students. Featuring rolling schedules, backlog tracking, Base/Mid/Peak mastery ratings, and secure multi-device cloud sync.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={handleGoogleLogin}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-sm sm:text-base font-bold text-primary-foreground shadow-lg hover:opacity-95 transition"
            >
              Sign In with Google <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Ad slot 2: In-content */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        <InContentAd adsEnabled={true} slotName="landing-mid-content" />
      </div>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-[1440px] px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
        <div className="mb-10 sm:mb-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Built for academic excellence</p>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl">Everything you need to conquer Class 9</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Rolling 90-Day Logic</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Skipping calendar days never auto-advances your study plan. Unfinished days accumulate in your backlog queue so no content is ever skipped or lost.
            </p>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Base / Mid / Peak Ratings</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Truthful self-evaluation turns weak areas into actionable revision tasks. Automatically route Base-rated topics to your weak areas queue.
            </p>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Secure Cloud Sync</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your progress, notes, revision logs, and custom start dates persist securely across sessions and devices with Firebase authentication.
            </p>
          </div>
        </div>
      </section>

      {/* Ad slot 3 & 4: Sidebar & Mobile */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 space-y-4">
        <SidebarAd adsEnabled={true} slotName="landing-bottom-sidebar" />
        <MobileAd adsEnabled={true} slotName="landing-bottom-mobile" />
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10 sm:py-12 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Final Comeback. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/landing" className="hover:text-foreground">Home</Link>
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
