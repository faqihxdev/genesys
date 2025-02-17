'use server';

import env from '@/env';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Sign up a new user with email and password
 * @param credentials - User signup credentials
 */
export const signUp = createAction({
  validator: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    inviteCode: z.string().min(1, 'Invite code is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { email, password, inviteCode } = input;

    // Verify invite code first
    const { data: isValid, error: verifyError } = await verifyInviteCode({ code: inviteCode });
    if (verifyError) return fail(verifyError);
    if (!isValid) {
      return fail({ message: 'Invalid invite code', status: 400 });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('[Auth/signUp]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return data.user as User;
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Sign in a user with email and password
 * @param credentials - User signin credentials
 */
export const signIn = createAction({
  validator: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { email, password } = input;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth/signIn]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return { user: data.user as User };
  },
});

/**
 * @description Sign in a user with Google OAuth
 */
export const signInWithGoogle = createAction({
  validator: null,
  requireAuth: false,
  actionFn: async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[Auth/signInWithGoogle]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return null;
  },
});

/**
 * @description Sign out the current user
 */
export const signOut = createAction({
  validator: null,
  requireAuth: true,
  actionFn: async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth/signOut]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return null;
  },
});

/**
 * @description Get the current authenticated user
 */
export const getCurrentUser = createAction({
  validator: null,
  requireAuth: false,
  actionFn: async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (error.code === 'refresh_token_not_found') {
        return null;
      }

      console.error('[Auth/getCurrentUser]:', JSON.stringify(error, null, 2));
      return fail({ message: error.message, status: 401 });
    }

    return user as User;
  },
});

/**
 * @description Verify if the invite code is valid
 * @param code - The invite code to verify
 */
export const verifyInviteCode = createAction({
  validator: z.object({
    code: z.string().min(1, 'Invite code is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const inviteCode = env.INVITE_CODE;

    if (!inviteCode) {
      console.error('[Auth/verifyInviteCode]: INVITE_CODE not set in environment variables');
      return fail({ message: 'Server configuration error', status: 500 });
    }

    return input.code === inviteCode;
  },
});

/**
 * @description Refresh the current session
 */
export const refreshSession = createAction({
  validator: null,
  requireAuth: false,
  actionFn: async () => {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Auth/refreshSession]:', error);
      return fail({ message: error.message, status: 401 });
    }

    try {
      // Get authenticated user data
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) return fail({ message: userError.message, status: 401 });

      return {
        session,
        user: user as User,
      };
    } catch (error) {
      console.error('[refreshSession]:', error);
      return {
        session,
        user: null,
      };
    }
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Request a password reset for a user
 * @param credentials - Password reset credentials
 */
export const resetPassword = createAction({
  validator: z.object({
    email: z.string().email('Invalid email format'),
    redirectTo: z.string().min(1, 'Redirect URL is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: input.redirectTo,
    });

    if (error) {
      console.error('[Auth/resetPassword]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return null;
  },
});

/**
 * @description Update user's password
 * @param credentials - New password credentials
 */
export const updatePassword = createAction({
  validator: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: input.password,
    });

    if (error) {
      console.error('[Auth/updatePassword]:', error);
      return fail({ message: error.message, status: 401 });
    }

    return null;
  },
});
