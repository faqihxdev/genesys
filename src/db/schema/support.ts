import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';

/**
 * Support ticket category enum
 */
export const ticketCategoryEnum = pgEnum('ticket_category', [
  'technical',
  'billing',
  'feature',
  'other',
]);

/**
 * Support ticket priority enum
 */
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high']);

/**
 * Support ticket status enum
 */
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in-progress',
  'waiting-for-customer',
  'waiting-for-support',
  'resolved',
  'closed',
]);

/**
 * Support tickets table schema
 */
export const supportTickets = pgTable('support_tickets', {
  id: text('id')
    .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'tkt-' }))
    .primaryKey(),
  userId: text('user_id').notNull(), // FK: which user created this ticket?
  subject: text('subject').notNull(),
  category: ticketCategoryEnum('ticket_category').notNull(),
  priority: ticketPriorityEnum('ticket_priority').notNull(),
  description: text('description').notNull(),
  status: ticketStatusEnum('ticket_status').notNull().default('open'),
  lastResponseAt: timestamp('last_response_at', { mode: 'date' }), // Track last response time
  resolvedAt: timestamp('resolved_at', { mode: 'date' }), // Track when ticket was resolved
  ...timestamps,
});

/**
 * Support ticket responses table schema
 * For tracking communication history
 */
export const ticketResponses = pgTable('ticket_responses', {
  id: text('id')
    .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'trs-' }))
    .primaryKey(),
  ticketId: text('ticket_id')
    .references(() => supportTickets.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(), // FK: who made this response?
  message: text('message').notNull(),
  isFromSupport: boolean('is_from_support').notNull().default(false), // Whether this response is from support team
  ...timestamps,
});

/**
 * Relations
 */
export const supportTicketsRelations = relations(supportTickets, ({ many }) => ({
  responses: many(ticketResponses),
}));

export const ticketResponsesRelations = relations(ticketResponses, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketResponses.ticketId],
    references: [supportTickets.id],
  }),
}));

// Inferred types
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type TicketResponse = typeof ticketResponses.$inferSelect;
export type NewTicketResponse = typeof ticketResponses.$inferInsert;
export type TicketCategory = (typeof ticketCategoryEnum.enumValues)[number];
export type TicketPriority = (typeof ticketPriorityEnum.enumValues)[number];
export type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];

// Extended types
export interface SupportTicketExtended extends SupportTicket {
  responses: TicketResponse[];
}
