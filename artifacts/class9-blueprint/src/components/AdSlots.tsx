import React from 'react';

type AdProps = {
  type?: 'banner' | 'in-content' | 'sidebar' | 'mobile';
  className?: string;
  adsEnabled?: boolean;
};

export const AdSlot: React.FC<AdProps> = ({ type = 'banner', className = '', adsEnabled = true }) => {
  if (!adsEnabled) return null;

  // Render stable placeholder container for Google AdSense / Google Ads integration
  // Ad UX: Stable height/width, never covers content or buttons, non-intrusive.
  const containerStyles = {
    banner: 'my-6 w-full h-[90px] rounded-xl border border-border/60 bg-card/60 flex items-center justify-center overflow-hidden text-xs text-muted-foreground/60 select-none',
    'in-content': 'my-8 w-full h-[120px] rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center overflow-hidden text-xs text-muted-foreground/60 select-none',
    sidebar: 'my-4 w-full h-[250px] rounded-xl border border-border/60 bg-card/60 flex items-center justify-center overflow-hidden text-xs text-muted-foreground/60 select-none',
    mobile: 'my-4 w-full h-[50px] rounded-lg border border-border/60 bg-card/60 flex items-center justify-center overflow-hidden text-[10px] text-muted-foreground/60 select-none',
  }[type];

  return (
    <div data-testid={`ad-slot-${type}`} className={`${containerStyles} ${className}`}>
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">Sponsored Ad Space</span>
        <span className="text-[11px] text-muted-foreground/70 font-medium">Class 9 Academic Partner · AdSense Slot ({type})</span>
      </div>
    </div>
  );
};

export const BannerAd: React.FC<{ adsEnabled?: boolean }> = ({ adsEnabled }) => <AdSlot type="banner" adsEnabled={adsEnabled} />;
export const InContentAd: React.FC<{ adsEnabled?: boolean }> = ({ adsEnabled }) => <AdSlot type="in-content" adsEnabled={adsEnabled} />;
export const SidebarAd: React.FC<{ adsEnabled?: boolean }> = ({ adsEnabled }) => <AdSlot type="sidebar" adsEnabled={adsEnabled} />;
export const MobileAd: React.FC<{ adsEnabled?: boolean }> = ({ adsEnabled }) => <AdSlot type="mobile" adsEnabled={adsEnabled} />;
