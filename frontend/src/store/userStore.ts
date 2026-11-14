import { create } from 'zustand';
import { User, MatchPreferences } from '@/types';

// Read localStorage once at module load (runs only in the browser, skipped in SSR)
function readLocalStorage(): { user: User | null; token: string | null } {
  if (typeof window === 'undefined') return { user: null, token: null };
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) return { user: JSON.parse(userStr), token };
  } catch { /* ignore corrupt data */ }
  return { user: null, token: null };
}

interface UserState {
  user: User | null;
  token: string | null;
  preferences: MatchPreferences;
  setUser: (user: User, token: string) => void;
  setPreferences: (prefs: MatchPreferences) => void;
  logout: () => void;
  /** @deprecated Call once on app mount to keep legacy code working */
  hydrate: () => void;
}

const initial = readLocalStorage();

export const useUserStore = create<UserState>((set) => ({
  user: initial.user,
  token: initial.token,
  preferences: {},

  setUser: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  setPreferences: (preferences) => set({ preferences }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  // No-op — state is already initialised eagerly above.
  // Kept for backward-compat so any call site doesn't need to change.
  hydrate: () => {
    const { user, token } = readLocalStorage();
    set({ user, token });
  },
}));
