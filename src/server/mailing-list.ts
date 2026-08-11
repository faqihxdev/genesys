'use server';

import { db } from '@/db';
import { mailingList } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Subscribe to mailing list
 * @param input - The subscription input
 * @returns Promise with the created subscription
 */
export const subscribeToMailingList = createAction({
  name: 'subscribeToMailingList',
  validator: z.object({
    email: z.string().email('Please enter a valid email'),
    description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    // Check if email already exists (including soft deleted)
    const [existingSubscription] = await db
      .select()
      .from(mailingList)
      .where(eq(mailingList.email, input.email));

    if (existingSubscription) {
      if (!existingSubscription.deletedAt) {
        return fail({ message: 'This email is already subscribed', status: 409 });
      }

      // Restore soft deleted subscription
      await db
        .update(mailingList)
        .set({
          description: input.description,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(mailingList.id, existingSubscription.id));

      return { subscribed: true };
    }

    // Create new subscription
    await db.insert(mailingList).values({
      email: input.email,
      description: input.description,
    });

    return { subscribed: true };
  },
});

/**
 * @description Get subscription details by email
 * @param input - The input object containing email
 * @returns Promise with subscription details or null if not found
 */
export const getSubscriptionByEmail = createAction({
  name: 'getSubscriptionByEmail',
  validator: z.object({
    email: z.string().email('Please enter a valid email'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    if (!currentUser.email || currentUser.email.toLowerCase() !== input.email.toLowerCase()) {
      return fail({ message: 'Access denied', status: 403 });
    }

    const [subscription] = await db
      .select()
      .from(mailingList)
      .where(eq(mailingList.email, input.email));

    return subscription ?? null;
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Toggle mailing list subscription
 * @param input - The input object containing email and subscription state
 * @returns Promise with the updated subscription
 */
export const toggleSubscription = createAction({
  name: 'toggleSubscription',
  validator: z.object({
    email: z.string().email('Please enter a valid email'),
    subscribed: z.boolean(),
    description: z.string().max(1000, 'Description must not exceed 1000 characters').optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    if (!currentUser.email || currentUser.email.toLowerCase() !== input.email.toLowerCase()) {
      return fail({ message: 'Access denied', status: 403 });
    }

    const [existingSubscription] = await db
      .select()
      .from(mailingList)
      .where(eq(mailingList.email, input.email));

    if (input.subscribed) {
      // Subscribe/Restore
      if (existingSubscription) {
        // Restore existing subscription
        const [updatedSubscription] = await db
          .update(mailingList)
          .set({
            description: input.description ?? existingSubscription.description,
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(mailingList.id, existingSubscription.id))
          .returning();

        return updatedSubscription;
      } else {
        // Create new subscription
        const [newSubscription] = await db
          .insert(mailingList)
          .values({
            email: input.email,
            description: input.description,
          })
          .returning();

        return newSubscription;
      }
    } else {
      // Unsubscribe (soft delete)
      if (!existingSubscription) {
        return fail({ message: 'Subscription not found', status: 404 });
      }

      const [updatedSubscription] = await db
        .update(mailingList)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mailingList.id, existingSubscription.id))
        .returning();

      return updatedSubscription;
    }
  },
});
