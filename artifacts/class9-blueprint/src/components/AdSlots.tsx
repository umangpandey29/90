import React, { useEffect } from 'react';

type AdProps = {
  type?: 'banner' | 'in-content' | 'sidebar' | 'mobile';
  className?: string;
  adsEnabled?: boolean;
  adClient?: string;
  adSlotId?: string;
  slotName?: string;
};

export const AdSlot: React.FC<AdProps> = ({
  type = 'banner',
  className = '',
  adsEnabled = true,
  adClient = '',
  adSlotId = '',
  slotName = ''
}) => {
  useEffect(() => {
    if (adsEnabled && adClient && adSlotId) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense trigger error:", e);
      }
    }
  }, [adsEnabled, adClient, adSlotId]);

  if (!adsEnabled) return null;

  const containerStyles = {
    banner: 'my-6 w-full min-h-[90px] rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center text-xs text-muted-foreground select-none',
    'in-content': 'my-8 w-full min-h-[120px] rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center text-xs text-muted-foreground select-none',
    sidebar: 'my-4 w-full min-h-[250px] rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center text-xs text-muted-foreground select-none',
    mobile: 'my-4 w-full min-h-[50px] rounded-lg border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-2 text-center text-xs text-muted-foreground select-none',
  }[type];

  const label = slotName ? `Google AdSense Slot (${slotName})` : `Google AdSense Slot (${type})`;

  return (
    <div data-testid={`ad-slot-${type}`} className={`${containerStyles} ${className}`}>
      {adClient && adSlotId ? (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={adClient}
          data-ad-slot={adSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
          <span className="text-xs text-muted-foreground/80 font-medium">AdSense Placeholder Container</span>
        </div>
      )}
    </div>
  );
};

export const BannerAd: React.FC<{ adsEnabled?: boolean; adClient?: string; adSlotId?: string; slotName?: string; className?: string }> = (props) => <AdSlot type="banner" {...props} />;
export const InContentAd: React.FC<{ adsEnabled?: boolean; adClient?: string; adSlotId?: string; slotName?: string; className?: string }> = (props) => <AdSlot type="in-content" {...props} />;
export const SidebarAd: React.FC<{ adsEnabled?: boolean; adClient?: string; adSlotId?: string; slotName?: string; className?: string }> = (props) => <AdSlot type="sidebar" {...props} />;
export const MobileAd: React.FC<{ adsEnabled?: boolean; adClient?: string; adSlotId?: string; slotName?: string; className?: string }> = (props) => <AdSlot type="mobile" {...props} />;


