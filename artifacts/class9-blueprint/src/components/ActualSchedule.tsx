import React from 'react';
import { useLocation } from 'wouter';
import { ChevronRight } from 'lucide-react';
import type { DayState } from '@/App';
import { subjectColor, subjectShort, RatingPill, StatusPill } from '@/App';
import { BannerAd, InContentAd, SidebarAd, MobileAd } from '@/components/AdSlots';

type ActualScheduleProps = {
  days: DayState[];
  startDate: string;
};

export const ActualSchedule: React.FC<ActualScheduleProps> = ({ days, startDate }) => {
  const [_, setLocation] = useLocation();
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();

  const scheduleItems = days.map((item) => {
    const assigned = new Date(start.getTime() + (item.day - 1) * 86400000);
    const isMissed = assigned < now && item.status !== 'complete';
    return {
      ...item,
      assignedDate: assigned.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isMissed,
    };
  });

  return (
    <div className="space-y-6">
      <BannerAd adsEnabled={true} slotName="schedule-top" />

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Chronological log</p>
        <h1 className="font-display text-4xl tracking-tight">My Actual Schedule</h1>
        <p className="text-sm text-muted-foreground">A complete timeline tracking study days, assigned dates, actual completion, performance, and revision status.</p>
      </div>

      <InContentAd adsEnabled={true} slotName="schedule-mid" />

      <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pr-4">Study Day</th>
              <th className="pb-3 px-4">Assigned Date</th>
              <th className="pb-3 px-4">Chapter & Subject</th>
              <th className="pb-3 px-4">Status</th>
              <th className="pb-3 px-4">Performance</th>
              <th className="pb-3 pl-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {scheduleItems.map((item) => (
              <tr key={item.day} className="hover:bg-muted/40 transition">
                <td className="py-3.5 pr-4 font-display font-bold">
                  Day {item.day}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                  {item.assignedDate}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${subjectColor[item.subject]}`}>
                      {subjectShort[item.subject]}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground line-clamp-1">{item.chapter}</span>
                </td>
                <td className="py-3.5 px-4">
                  <StatusPill status={item.status} />
                  {item.isMissed && <span className="block mt-1 text-[10px] text-destructive font-semibold">Missed / Backlog</span>}
                </td>
                <td className="py-3.5 px-4">
                  <RatingPill rating={item.rating} />
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <button
                    onClick={() => setLocation(`/journey/day/${item.day}`)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted transition"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SidebarAd adsEnabled={true} slotName="schedule-bottom-sidebar" />
      <MobileAd adsEnabled={true} slotName="schedule-bottom-mobile" />
    </div>
  );
};
