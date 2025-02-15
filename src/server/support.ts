'use server';

import { db } from '@/db';
import { supportTickets, ticketResponses } from '@/db/schema/support';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new support ticket
 * @param input - The ticket creation input
 * @returns Promise with the created ticket
 */
export const createSupportTicket = createAction({
  validator: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    category: z.enum(['technical', 'billing', 'feature', 'other'], {
      required_error: 'Please select a category',
    }),
    priority: z.enum(['low', 'medium', 'high'], {
      required_error: 'Please select a priority',
    }),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(1000, 'Description must not exceed 1000 characters'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: currentUser.id,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        description: input.description,
      })
      .returning();

    return ticket;
  },
});

/**
 * @description Add a response to a support ticket
 * @param input - The response creation input
 * @returns Promise with the created response
 */
export const addTicketResponse = createAction({
  validator: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
    message: z.string().min(1, 'Message is required'),
    isFromSupport: z.boolean().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    return await db.transaction(async (tx) => {
      // Create the response
      const [response] = await tx
        .insert(ticketResponses)
        .values({
          ticketId: input.ticketId,
          userId: currentUser.id,
          message: input.message,
          isFromSupport: input.isFromSupport || false,
        })
        .returning();

      // Update the ticket's lastResponseAt
      await tx
        .update(supportTickets)
        .set({
          lastResponseAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, input.ticketId));

      return response;
    });
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get all support tickets for a user
 * @returns Promise with the user's tickets
 */
export const getUserTickets = createAction({
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const tickets = await db.query.supportTickets.findMany({
      where: eq(supportTickets.userId, currentUser.id),
      with: {
        responses: true,
      },
      orderBy: desc(supportTickets.createdAt),
    });

    return tickets;
  },
});

/**
 * @description Get a support ticket by ID
 * @param input - The input object containing ticketId
 * @returns Promise with the ticket data
 */
export const getTicketById = createAction({
  validator: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const ticket = await db.query.supportTickets.findFirst({
      where: and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, currentUser.id)),
      with: {
        responses: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Update a support ticket
 * @param input - The ticket update input
 * @returns Promise with the updated ticket
 */
export const updateTicket = createAction({
  validator: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
    subject: z.string().min(5, 'Subject must be at least 5 characters').optional(),
    category: z.enum(['technical', 'billing', 'feature', 'other']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
    status: z
      .enum([
        'open',
        'in-progress',
        'waiting-for-customer',
        'waiting-for-support',
        'resolved',
        'closed',
      ])
      .optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if ticket exists and belongs to user
    const [existingTicket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, currentUser.id)));

    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Update ticket
    const updateData: Partial<typeof supportTickets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.subject) updateData.subject = input.subject;
    if (input.category) updateData.category = input.category;
    if (input.priority) updateData.priority = input.priority;
    if (input.description) updateData.description = input.description;
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, currentUser.id)))
      .returning();

    return updatedTicket;
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Delete a support ticket
 * @param input - The input object containing ticketId
 * @returns Promise with success status
 */
export const deleteTicket = createAction({
  validator: z.object({
    ticketId: z.string().min(1, 'Ticket ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [deletedTicket] = await db
      .delete(supportTickets)
      .where(and(eq(supportTickets.id, input.ticketId), eq(supportTickets.userId, currentUser.id)))
      .returning();

    return !!deletedTicket;
  },
});
