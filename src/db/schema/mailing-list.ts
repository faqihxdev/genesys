import { generateId } from '@/db/schema/_utils';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';

/**
 * Mailing list table schema
 * Stores email subscriptions with optional descriptions
 */
export const mailingList = pgTable('mailing_list', {
  id: text('id')
    .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'mal-' }))
    .primaryKey(),
  email: text('email').notNull().unique(), // Max email length according to RFC 5321
  description: text('description'), // Optional description/notes about the subscriber
  ...timestamps,
});

// Inferred types
export type MailingList = typeof mailingList.$inferSelect;
export type NewMailingList = typeof mailingList.$inferInsert;
