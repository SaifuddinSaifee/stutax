'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type SessionState = {
  email: string | null;
  setEmail: (email: string | null) => void;
  clear: () => void;
  ready: boolean;
};

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmailState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('session:email');
      if (stored) setEmailState(stored);
    } catch {}
    setReady(true);
  }, []);

  const setEmail = useCallback((value: string | null) => {
    setEmailState(value);
    try {
      if (value) localStorage.setItem('session:email', value);
      else localStorage.removeItem('session:email');
    } catch {}
  }, []);

  const clear = useCallback(() => setEmail(null), [setEmail]);

  const value = useMemo<SessionState>(() => ({ email, setEmail, clear, ready }), [email, setEmail, clear, ready]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

export function useApi() {
  const { email } = useSession();
  const withAuth = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      if (email) headers.set('x-user-email', email);
      return fetch(input, { ...init, headers });
    },
    [email]
  );
  return withAuth;
}


