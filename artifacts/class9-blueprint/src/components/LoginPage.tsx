import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { loginWithGoogle, auth } from '@/lib/firebase';
import { Shield, ArrowRight, Check, Sparkles } from 'lucide-react';
import { BannerAd, InContentAd, SidebarAd, MobileAd } from '@/components/AdSlots';

export const LoginPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      setLocation('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 sm:h-20 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-12">
          <Link href="/landing" className="flex items-center gap-2 sm:gap-3">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary font-display text-lg sm:text-xl text-primary-foreground">FC</span>
            <div>
              <span className="block font-display text-base sm:text-lg leading-none">Final Comeback</span>
              <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[.18em] text-muted-foreground">Secure Portal</span>
            </div>
          </Link>
          <Link href="/landing" className="text-xs font-bold text-muted-foreground hover:text-foreground">
            ← Home
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="mx-auto max-w-md w-full px-4 py-8 sm:py-12">
        <div className="mb-4">
          <BannerAd adsEnabled={true} />
        </div>

        <div className="rounded-3xl border border-card-border bg-card p-6 sm:p-8 shadow-xl">
          <div className="text-center space-y-2 mb-8">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl tracking-tight">Welcome Back</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Sign in to sync your 90-day progress across all your devices.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-primary py-3.5 px-4 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0" /> Secure 256-bit encrypted authentication
          </div>
        </div>

        <div className="mt-4">
          <InContentAd adsEnabled={true} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 Final Comeback. All rights reserved.</p>
      </footer>
    </div>
  );
};
