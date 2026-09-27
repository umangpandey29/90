import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logoutUser } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { LogIn, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';

type AuthBarProps = {
  syncStatus: 'synced' | 'local' | 'syncing';
};

export const AuthBar: React.FC<AuthBarProps> = ({ syncStatus }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status Badge */}
      <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground font-mono" title={`Sync status: ${syncStatus}`}>
        {syncStatus === 'synced' && <><Cloud className="h-3 w-3 text-emerald-600 shrink-0" /><span className="hidden sm:inline">Synced</span></>}
        {syncStatus === 'syncing' && <><RefreshCw className="h-3 w-3 animate-spin text-accent shrink-0" /><span className="hidden sm:inline">Syncing...</span></>}
        {syncStatus === 'local' && <><CloudOff className="h-3 w-3 text-amber-500 shrink-0" /><span className="hidden sm:inline">Local</span></>}
      </div>

      {user ? (
        <div className="flex items-center gap-1.5">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="h-7 w-7 rounded-full border border-border shrink-0" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-xs shrink-0">
              {user.email?.slice(0, 1).toUpperCase() || 'U'}
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition focus-ring"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition focus-ring shadow-sm"
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[100px] sm:max-w-none">Sign In</span>
        </button>
      )}
    </div>
  );
};
