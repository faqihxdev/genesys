'use client';

import { getCurrentUser } from '@/server/auth';
import { withQuery } from '@/utils';
import { queryClient } from '@/utils/query-client';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Query keys for caching
export const USER_QUERY_KEYS = {
  user: ['user'] as const,
} as const;

/**
 * @description Hook for managing user session and auth state
 * Primarily used for UI state management and real-time session updates
 * Does NOT handle auth protection (that's done server-side)
 */
export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch session query for UI updates
  const { data: user, isLoading } = useQuery({
    queryKey: USER_QUERY_KEYS.user,
    queryFn: withQuery(getCurrentUser),
    retry: false,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  // Listen to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.resetQueries({ queryKey: USER_QUERY_KEYS.user });
    } catch (error) {
      console.error('[useAuth/signOut]:', error);
      throw error;
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    signOut,
    isSigningOut,
  };
}
