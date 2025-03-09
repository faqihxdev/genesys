import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { boolean, decimal, index, pgTable, text } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
import { stageItems, stages } from './funnel';
import { personas } from './persona';
import { simulations } from './simulation';

/**
 * Response table schema
 * Contains the response to a stage item for a persona in a simulation
 * Tracks the interaction and sentiment of a persona with content
 * Note: proceed decision is now handled at the stage level in responseStages
 */
export const responses = pgTable(
  'responses',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'res-' }))
      .primaryKey(),
    simulationId: text() // which simulation is this response for?
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    personaId: text() // which persona is this response for?
      .references(() => personas.id, { onDelete: 'cascade' })
      .notNull(),
    stageId: text() // which stage is this response for?
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    stageItemId: text() // which stage item is this response for?
      .references(() => stageItems.id, { onDelete: 'cascade' })
      .notNull(),
    response: text().notNull(), // general response to the stage item
    sentiment: decimal({ precision: 3, scale: 2 }).notNull(), // sentiment score from -1 to 1
    // Removed proceed and proceedReason as they are now in responseStages
    ...timestamps,
  },
  (table) => [
    index('response_simulation_id_idx').on(table.simulationId),
    index('response_persona_id_idx').on(table.personaId),
    index('response_stage_id_idx').on(table.stageId),
    index('response_stage_item_id_idx').on(table.stageItemId),
    index('response_sentiment_idx').on(table.sentiment),
  ]
);

/**
 * ResponseStage table schema
 * Contains the stage-level decisions for a persona in a simulation
 * Tracks whether the persona proceeds to the next stage and why
 */
export const responseStages = pgTable(
  'response_stages',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'rst-' }))
      .primaryKey(),
    simulationId: text() // which simulation is this response for?
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    personaId: text() // which persona is this response for?
      .references(() => personas.id, { onDelete: 'cascade' })
      .notNull(),
    stageId: text() // which stage is this response for?
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    proceed: boolean().notNull().default(false), // proceed to next stage?
    proceedReason: text().notNull(), // reason for proceeding or not proceeding
    nextStageId: text() // which stage did the persona choose to proceed to (if there are multiple options)
      .references(() => stages.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (table) => [
    index('response_stage_simulation_id_idx').on(table.simulationId),
    index('response_stage_persona_id_idx').on(table.personaId),
    index('response_stage_stage_id_idx').on(table.stageId),
    index('response_stage_proceed_idx').on(table.proceed),
    index('response_stage_next_stage_id_idx').on(table.nextStageId),
  ]
);

/**
 * One response to one simulation, one persona, one stage, and one stage item
 */
export const responsesRelations = relations(responses, ({ one }) => ({
  simulation: one(simulations, {
    fields: [responses.simulationId],
    references: [simulations.id],
  }),
  persona: one(personas, {
    fields: [responses.personaId],
    references: [personas.id],
  }),
  stage: one(stages, {
    fields: [responses.stageId],
    references: [stages.id],
  }),
  stageItem: one(stageItems, {
    fields: [responses.stageItemId],
    references: [stageItems.id],
  }),
}));

/**
 * One responseStage to one simulation, one persona, one stage, and optionally one next stage
 */
export const responseStagesRelations = relations(responseStages, ({ one }) => ({
  simulation: one(simulations, {
    fields: [responseStages.simulationId],
    references: [simulations.id],
  }),
  persona: one(personas, {
    fields: [responseStages.personaId],
    references: [personas.id],
  }),
  stage: one(stages, {
    fields: [responseStages.stageId],
    references: [stages.id],
  }),
  nextStage: one(stages, {
    fields: [responseStages.nextStageId],
    references: [stages.id],
  }),
}));

// Inferred types
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type ResponseStage = typeof responseStages.$inferSelect;
export type NewResponseStage = typeof responseStages.$inferInsert;

// Extended types
export interface ResponseWithDetails extends Response {
  simulation: import('./simulation').Simulation;
  persona: import('./persona').Persona;
  stage: import('./funnel').Stage;
  stageItem: import('./funnel').StageItem;
  proceed?: boolean;
  proceedReason?: string;
}

export interface ResponseStageWithDetails extends ResponseStage {
  simulation: import('./simulation').Simulation;
  persona: import('./persona').Persona;
  stage: import('./funnel').Stage;
  nextStage?: import('./funnel').Stage;
}

export interface ResponseAnalysis {
  averageSentiment: number;
  proceedRate: number;
  totalResponses: number;
  positiveResponses: number;
  negativeResponses: number;
  neutralResponses: number;
}
