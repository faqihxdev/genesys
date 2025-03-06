import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
import { projects } from './project';

/**
 * Persona config type enum
 * Defines whether the persona configuration is a preset or custom
 */
export const personaConfigTypeEnum = pgEnum('persona_config_type', ['preset', 'custom']);

/**
 * Persona config table
 * Represents a configuration for generating multiple personas with specific characteristics
 */
export const personaConfigs = pgTable(
  'persona_configs',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'pcg-' }))
      .primaryKey(),
    projectId: text() // FK: which project is this persona config for?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: text().notNull(), // user reference: name of the persona config
    description: text(), // user reference: description of the persona config
    type: personaConfigTypeEnum().notNull().default('custom'), // config is preset or custom
    size: integer().notNull(), // number of personas to generate
    constraints: text().notNull(), // custom constraints to generate the persona
    demographics: jsonb().notNull(), // demographics of the persona (age, gender, location, etc.)
    psychographics: jsonb().notNull(), // psychographics of the persona (values, interests, personal traits, etc.)
    behavior: jsonb().notNull(), // behavior of the persona (budget, brand affinity, responsiveness, etc.)
    ...timestamps,
  },
  (table) => [
    index('persona_config_project_id_idx').on(table.projectId),
    index('persona_config_name_idx').on(table.name),
    index('persona_config_type_idx').on(table.type),
  ]
);

/**
 * Persona table
 * Represents an individual persona generated from a persona config
 */
export const personas = pgTable(
  'personas',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'prs-' }))
      .primaryKey(),
    personaConfigId: text() // FK: which persona config is this persona for?
      .references(() => personaConfigs.id, { onDelete: 'cascade' })
      .notNull(),
    name: text().notNull(), // user reference: name of the persona
    description: text(), // user reference: description of the persona
    demographic: jsonb().notNull(), // demographic of the persona (age, gender, location, etc.)
    psychographic: jsonb().notNull(), // psychographic of the persona (values, interests, personal traits, etc.)
    behavior: jsonb().notNull(), // behavior of the persona (budget, brand affinity, responsiveness, etc.)
    ...timestamps,
  },
  (table) => [
    index('persona_persona_config_id_idx').on(table.personaConfigId),
    index('persona_name_idx').on(table.name),
  ]
);

/**
 * One persona config to one project and many personas
 */
export const personaConfigsRelations = relations(personaConfigs, ({ one, many }) => ({
  project: one(projects, {
    fields: [personaConfigs.projectId],
    references: [projects.id],
  }),
  personas: many(personas),
}));

/**
 * One persona to one persona config
 */
export const personasRelations = relations(personas, ({ one }) => ({
  config: one(personaConfigs, {
    fields: [personas.personaConfigId],
    references: [personaConfigs.id],
  }),
}));

// Inferred types
export type PersonaConfig = typeof personaConfigs.$inferSelect;
export type NewPersonaConfig = typeof personaConfigs.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type PersonaConfigType = (typeof personaConfigTypeEnum.enumValues)[number];

// Extended types
export interface PersonaConfigWithPersonas extends PersonaConfig {
  personas: Persona[];
}

export interface PersonaDemographic {
  age?: number;
  gender?: string;
  location?: string;
  income?: number;
  education?: string;
  occupation?: string;
  maritalStatus?: string;
  ethnicity?: string;
  [key: string]: unknown;
}

export interface PersonaPsychographic {
  values?: string[];
  interests?: string[];
  personalityTraits?: string[];
  lifestyleChoices?: string[]; // minimalist, luxury-seeking, eco-friendly, etc
  mediaConsumptionPreferences?: string[];
  [key: string]: unknown;
}

export interface PersonaBehavior {
  budget?: number;
  brandAffinity?: string;
  responsiveness?: string;
  spendingHabits?: string; // frugal, impulsive, etc.
  decisionMakingSpeed?: string; // quick, research-driven, etc.
  responseToMarketing?: string; // discount-oriented, quality-oriented, etc., 
  [key: string]: unknown;
}
