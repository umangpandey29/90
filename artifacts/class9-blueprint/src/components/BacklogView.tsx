import React from 'react';
import { useLocation } from 'wouter';
import { Check, ChevronRight, Clock } from 'lucide-react';
import type { DayState } from '@/App';
import { subjectColor, subjectShort } from '@/App';
import { BannerAd, InContentAd, SidebarAd, MobileAd } from '@/components/AdSlots';

type BacklogProps = {
  days: DayState[];
  startDate: string;
};

export const BacklogView: React.FC<BacklogProps> = ({ days, startDate }) => {
  const [_, setLocation] = useLocation();
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  
  const backlogDays = days.filter((item) => {
    const assigned = new Date(start.getTime() + (item.day - 1) * 86400000);
    return assigned < now && item.status !== 'complete';
  });

  return (
    <div className="space-y-6">
      <BannerAd adsEnabled={true} />

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Unfinished review queue</p>
        <h1 className="font-display text-4xl tracking-tight">Backlog ({backlogDays.length} days)</h1>
        <p className="text-sm text-muted-foreground">Missed calendar days accumulate here as actionable study days without deleting any content.</p>
      </div>

      <InContentAd adsEnabled={true} />

      {backlogDays.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {backlogDays.map((day) => {
            const assignedDateStr = new Date(start.getTime() + (day.day - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <button
                key={day.day}
                onClick={() => setLocation(`/journey/day/${day.day}`)}
                className="group card-lift w-full rounded-2xl border border-card-border bg-card p-4 text-left transition hover:border-ring focus-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-destructive/10 text-destructive font-display">
                    <span className="font-mono text-[9px] uppercase">day</span>
                    <span className="text-lg leading-none">{day.day}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${subjectColor[day.subject]}`}>
                        {subjectShort[day.subject]}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Due {assignedDateStr}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 font-semibold text-foreground">{day.chapter}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{day.target}</p>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl">Zero backlog!</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">You are completely caught up on your assigned study schedule. Excellent discipline.</p>
        </div>
      )}

      <SidebarAd adsEnabled={true} />
      <MobileAd adsEnabled={true} />
    </div>
  );
};
