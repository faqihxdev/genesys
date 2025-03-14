'use client';

import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { createClient } from '@/lib/supabase/client';
import { withQuery } from '@/lib/utils';
import { getCurrentUser } from '@/server/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    queryKey: queryKey.auth.getCurrentUser(),
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
    } = supabase.auth.onAuthStateChange(async (event, _session) => {
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
      await queryClient.resetQueries({ queryKey: queryKey.auth.getCurrentUser() });
    } catch (error) {
      console.error('[useAuth/signOut]:', error);
      throw error;
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * @description Check if current user is the demo account
   * @returns {boolean} True if user email is demo@user.com
   */
  const isDemoUser = !!user && user.email === 'demo@user.com';

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
    signOut,
    isSigningOut,
    isDemoUser,
  };
}
