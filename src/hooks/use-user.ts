import { getSession } from '@/server/auth';
import { withQuery } from '@/utils';
import { queryClient } from '@/utils/query-client';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Query keys for caching
export const USER_QUERY_KEYS = {
  session: ['session'] as const,
} as const;

/**
 * @description Hook for managing user session and auth state
 * Primarily used for UI state management and real-time session updates
 * Does NOT handle auth protection (that's done server-side)
 */
export function useUser() {
  const router = useRouter();
  const supabase = createClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch session query for UI updates
  const { data, isLoading } = useQuery({
    queryKey: USER_QUERY_KEYS.session,
    queryFn: withQuery(getSession),
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
      await queryClient.resetQueries({ queryKey: USER_QUERY_KEYS.session });
    } catch (error) {
      console.error('[useUser/signOut]:', error);
      throw error;
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    isLoading,
    isAuthenticated: !!data?.session,
    session: data?.session,
    user: data?.user,
    signOut,
    isSigningOut,
  };
}
