'use server';

import type { User } from '@/db/schema';
import env from '@/env';
import { createClient } from '@/lib/supabase/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { createAction, fail } from './_utils';

/**
 * @description Compares a submitted invite code without leaking matching-prefix timing.
 * @param code - Submitted invite code
 * @returns Whether the code matches the configured invite code
 */
function isInviteCodeValid(code: string): boolean {
  const expected = Buffer.from(env.INVITE_CODE);
  const submitted = Buffer.from(code);

  return expected.length === submitted.length && timingSafeEqual(expected, submitted);
}

// ==================================================
// CREATE
// ==================================================

/**
 * @description Sign up a new user with email and password
 * @param credentials - User signup credentials
 */
export const signUp = createAction({
  name: 'signUp',
  validator: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    inviteCode: z.string().min(1, 'Invite code is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { email, password, inviteCode } = input;

    if (!isInviteCodeValid(inviteCode)) {
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
  name: 'signIn',
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
 * @description Sign out the current user
 */
export const signOut = createAction({
  name: 'signOut',
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
  name: 'getCurrentUser',
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
 * @description Refresh the current session
 */
export const refreshSession = createAction({
  name: 'refreshSession',
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
  name: 'resetPassword',
  validator: z.object({
    email: z.string().email('Invalid email format'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(input.email);

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
  name: 'updatePassword',
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
