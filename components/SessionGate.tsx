'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

const PUBLIC_PATHS = new Set<string>(['/login']);

export function SessionGate({ children }: { children: React.ReactNode }) {
  const { email, ready } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (PUBLIC_PATHS.has(pathname || '')) return;
    if (!email) {
      router.replace('/login');
    }
  }, [email, ready, router, pathname]);

  return <>{children}</>;
}


