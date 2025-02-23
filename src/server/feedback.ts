'use server';

import { db } from '@/db';
import { feedback } from '@/db/schema/feedback';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new feedback
 * @param input - The feedback creation input
 * @returns Promise with the created feedback
 */
export const createFeedback = createAction({
  name: 'createFeedback',
  validator: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    type: z.enum(['bug', 'feature', 'improvement', 'other'], {
      required_error: 'Please select a feedback type',
    }),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
    satisfaction: z.enum(
      ['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied'],
      {
        required_error: 'Please rate your satisfaction',
      }
    ),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        userId: currentUser.id,
        title: input.title,
        type: input.type,
        description: input.description,
        satisfaction: input.satisfaction,
      })
      .returning();

    return newFeedback;
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get all feedback for a user
 * @returns Promise with the user's feedback
 */
export const getUserFeedback = createAction({
  name: 'getUserFeedback',
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const userFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, currentUser.id))
      .orderBy(desc(feedback.createdAt));

    return userFeedback;
  },
});

/**
 * @description Get a feedback by ID
 * @param input - The input object containing feedbackId
 * @returns Promise with the feedback data
 */
export const getFeedbackById = createAction({
  name: 'getFeedbackById',
  validator: z.object({
    feedbackId: z.string().min(1, 'Feedback ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [userFeedback] = await db
      .select()
      .from(feedback)
      .where(and(eq(feedback.id, input.feedbackId), eq(feedback.userId, currentUser.id)));

    if (!userFeedback) {
      return fail({ message: 'Feedback not found', status: 404 });
    }

    return userFeedback;
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Update a feedback
 * @param input - The feedback update input
 * @returns Promise with the updated feedback
 */
export const updateFeedback = createAction({
  name: 'updateFeedback',
  validator: z.object({
    feedbackId: z.string().min(1, 'Feedback ID is required'),
    title: z.string().min(5, 'Title must be at least 5 characters').optional(),
    type: z.enum(['bug', 'feature', 'improvement', 'other']).optional(),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    satisfaction: z
      .enum(['very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied'])
      .optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if feedback exists and belongs to user
    const [existingFeedback] = await db
      .select()
      .from(feedback)
      .where(and(eq(feedback.id, input.feedbackId), eq(feedback.userId, currentUser.id)));

    if (!existingFeedback) {
      return fail({ message: 'Feedback not found', status: 404 });
    }

    // Update feedback
    const updateData: Partial<typeof feedback.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title) updateData.title = input.title;
    if (input.type) updateData.type = input.type;
    if (input.description) updateData.description = input.description;
    if (input.satisfaction) updateData.satisfaction = input.satisfaction;

    const [updatedFeedback] = await db
      .update(feedback)
      .set(updateData)
      .where(and(eq(feedback.id, input.feedbackId), eq(feedback.userId, currentUser.id)))
      .returning();

    return updatedFeedback;
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Delete a feedback
 * @param input - The input object containing feedbackId
 * @returns Promise with success status
 */
export const deleteFeedback = createAction({
  name: 'deleteFeedback',
  validator: z.object({
    feedbackId: z.string().min(1, 'Feedback ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [deletedFeedback] = await db
      .delete(feedback)
      .where(and(eq(feedback.id, input.feedbackId), eq(feedback.userId, currentUser.id)))
      .returning();

    return !!deletedFeedback;
  },
});
