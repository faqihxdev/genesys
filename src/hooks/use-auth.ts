'use client';

import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { getCurrentUser, signOut as signOutAction } from '@/server/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: user, isLoading } = useQuery({
    queryKey: queryKey.auth.getCurrentUser(),
    queryFn: withQuery(getCurrentUser),
    retry: false,
    refetchInterval: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
  const signOut = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutAction();
      if (result.error) throw new Error(result.error.message);
      queryClient.clear();
      router.replace('/auth');
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };
  return { isLoading, isAuthenticated: !!user, user, signOut, isSigningOut };
}
