'use server';

import type { User } from '@/db/schema/auth';
import { getAuth } from '@/lib/auth';
import { getRuntimeConfig } from '@/lib/runtime';
import { headers } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { createAction, fail } from './_utils';

function toUser(user: {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return { ...user, image: user.image ?? null };
}

export const signUp = createAction({
  name: 'signUp',
  validator: z.object({
    email: z.string().email(),
    password: z.string().min(10).max(128),
    inviteCode: z.string().min(1),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const expected = getRuntimeConfig().inviteCode;
    if (!expected) return fail({ message: 'Registration is not configured', status: 503 });
    const actualBytes = Buffer.from(input.inviteCode);
    const expectedBytes = Buffer.from(expected);
    if (
      actualBytes.length !== expectedBytes.length ||
      !timingSafeEqual(actualBytes, expectedBytes)
    ) {
      return fail({ message: 'Invalid invite code', status: 400 });
    }
    const result = await getAuth({ allowSignUp: true }).api.signUpEmail({
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        name: input.email.split('@')[0],
      },
      headers: await headers(),
    });
    return toUser(result.user);
  },
});

export const signIn = createAction({
  name: 'signIn',
  validator: z.object({ email: z.string().email(), password: z.string().min(1).max(128) }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    const result = await getAuth().api.signInEmail({ body: input, headers: await headers() });
    return { user: toUser(result.user) };
  },
});

export const signOut = createAction({
  name: 'signOut',
  validator: null,
  requireAuth: true,
  actionFn: async () => {
    await getAuth().api.signOut({ headers: await headers() });
    return null;
  },
});

export const getCurrentUser = createAction({
  name: 'getCurrentUser',
  validator: null,
  requireAuth: false,
  actionFn: async () => {
    const session = await getAuth().api.getSession({ headers: await headers() });
    return session ? toUser(session.user) : null;
  },
});

export const updatePassword = createAction({
  name: 'updatePassword',
  validator: z.object({
    currentPassword: z.string().min(1).max(128),
    password: z.string().min(10).max(128),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    await getAuth().api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.password,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    return null;
  },
});
