import { relations } from 'drizzle-orm';
import { decimal, index, pgTable, text } from 'drizzle-orm/pg-core';
import { generateId, ID_LENGTH, timestamps } from './_utils';
import { stageItems, stages } from './funnel';
import { simulations } from './simulation';

/**
 * Summary table schema
 * Contains the overall summary and analysis for a simulation
 */
export const summary = pgTable(
  'summary',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sum-' }))
      .primaryKey(),
    simulationId: text('simulation_id') // which simulation is this summary for?
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    conversionRate: decimal('conversion_rate', { precision: 3, scale: 2 }).notNull(), // conversion rate of the simulation
    sentiment: decimal('sentiment', { precision: 3, scale: 2 }).notNull(), // sentiment score of the simulation
    summary: text('summary').notNull(), // summary of the simulation response
    recommendation: text('recommendation').notNull(), // recommendation for the simulation response
    ...timestamps,
  },
  (table) => [
    index('summary_simulation_id_idx').on(table.simulationId),
    index('summary_conversion_rate_idx').on(table.conversionRate),
    index('summary_sentiment_idx').on(table.sentiment),
  ]
);

/**
 * Summary stages table schema
 * Contains summary and analysis for each stage in a simulation
 */
export const summaryStages = pgTable(
  'summary_stages',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sms-' }))
      .primaryKey(),
    simulationId: text('simulation_id') // which simulation is this summary stage for?
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    stageId: text('stage_id') // which stage is this summary stage for?
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    conversionRate: decimal('conversion_rate', { precision: 3, scale: 2 }).notNull(), // conversion rate of the stage
    sentiment: decimal('sentiment', { precision: 3, scale: 2 }).notNull(), // sentiment score of the stage
    summary: text('summary').notNull(), // summary of the stage
    recommendation: text('recommendation').notNull(), // recommendation for the stage
    ...timestamps,
  },
  (table) => [
    index('summary_stage_simulation_id_idx').on(table.simulationId),
    index('summary_stage_stage_id_idx').on(table.stageId),
    index('summary_stage_conversion_rate_idx').on(table.conversionRate),
    index('summary_stage_sentiment_idx').on(table.sentiment),
  ]
);

/**
 * Summary stage items table schema
 * Contains summary and analysis for each stage item in a simulation
 */
export const summaryStageItems = pgTable(
  'summary_stage_items',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'smi-' }))
      .primaryKey(),
    simulationId: text('simulation_id') // which simulation is this summary stage item for?
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    stageItemId: text('stage_item_id') // which stage item is this summary stage item for?
      .references(() => stageItems.id, { onDelete: 'cascade' })
      .notNull(),
    sentiment: decimal('sentiment', { precision: 3, scale: 2 }).notNull(), // sentiment score of the stage item
    summary: text('summary').notNull(), // summary of the stage item
    recommendation: text('recommendation').notNull(), // recommendation for the stage item
    ...timestamps,
  },
  (table) => [
    index('summary_stage_item_simulation_id_idx').on(table.simulationId),
    index('summary_stage_item_stage_item_id_idx').on(table.stageItemId),
    index('summary_stage_item_sentiment_idx').on(table.sentiment),
  ]
);

/**
 * One summary to one simulation
 */
export const summaryRelations = relations(summary, ({ one }) => ({
  simulation: one(simulations, {
    fields: [summary.simulationId],
    references: [simulations.id],
  }),
}));

/**
 * One summary stage to one simulation and one stage
 */
export const summaryStagesRelations = relations(summaryStages, ({ one }) => ({
  simulation: one(simulations, {
    fields: [summaryStages.simulationId],
    references: [simulations.id],
  }),
  stage: one(stages, {
    fields: [summaryStages.stageId],
    references: [stages.id],
  }),
}));

/**
 * One summary stage item to one simulation and one stage item
 */
export const summaryStageItemsRelations = relations(summaryStageItems, ({ one }) => ({
  simulation: one(simulations, {
    fields: [summaryStageItems.simulationId],
    references: [simulations.id],
  }),
  stageItem: one(stageItems, {
    fields: [summaryStageItems.stageItemId],
    references: [stageItems.id],
  }),
}));

// Inferred types
export type Summary = typeof summary.$inferSelect;
export type NewSummary = typeof summary.$inferInsert;
export type SummaryStage = typeof summaryStages.$inferSelect;
export type NewSummaryStage = typeof summaryStages.$inferInsert;
export type SummaryStageItem = typeof summaryStageItems.$inferSelect;
export type NewSummaryStageItem = typeof summaryStageItems.$inferInsert;

// Extended types
export interface SummaryWithDetails extends Summary {
  simulation: import('./simulation').Simulation;
}

export interface SummaryStageWithDetails extends SummaryStage {
  simulation: import('./simulation').Simulation;
  stage: import('./funnel').Stage;
}

export interface SummaryStageItemWithDetails extends SummaryStageItem {
  simulation: import('./simulation').Simulation;
  stageItem: import('./funnel').StageItem;
}

export interface SummaryAnalysis {
  totalSimulations: number;
  averageConversionRate: number;
  averageSentiment: number;
  topRecommendation: string[];
  commonIssues: string[];
}
