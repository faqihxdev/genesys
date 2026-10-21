import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { ID_LENGTH, timestamps } from './_utils';
import { funnels, stages } from './funnel';
import { personaConfigs, personas } from './persona';
import { responseStages } from './response';
import { enumColumn, index, integer, primaryKey, sqliteTable, text } from './sqlite';

/**
 * Simulation status enum
 * Defines the possible states of a simulation
 */
export const simulationStatusEnum = enumColumn('simulation_status', [
  'idle', // Initial state
  'processing', // Currently running
  'complete', // Successfully completed
  'error', // Failed with error
  'cancelled', // Cancelled by user
]);

/**
 * Simulation parameter interface
 * Defines configuration options for a simulation
 */
export interface SimulationParameters {
  maxPathsPerPersona?: number; // Maximum number of paths a persona can explore (for branching funnels)
  detailedResponses?: boolean; // Whether to generate detailed responses or just proceed decisions
  temperatureOverride?: number; // Optional override for OpenAI temperature setting
  includeReasons?: boolean; // Whether to include detailed reasoning in responses
  customPromptAdditions?: string; // Custom instructions to add to the prompt
}

/**
 * Simulations table schema
 * Represents a simulation run of personas through a funnel
 * completeCount: prevents calling the responses table to check progress
 */
export const simulations = sqliteTable(
  'simulations',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sim-' }))
      .primaryKey(),
    funnelId: text('funnel_id') // FK: which funnel is this simulation for?
      .references(() => funnels.id, { onDelete: 'cascade' })
      .notNull(),
    personaConfigId: text('persona_config_id') // FK: which persona config is this simulation for?
      .references(() => personaConfigs.id, { onDelete: 'cascade' })
      .notNull(),
    status: simulationStatusEnum('simulation_status').notNull().default('idle'), // status of the simulation
    completeCount: integer('complete_count').notNull().default(0), // Number of personas that completed the simulation
    totalCount: integer('total_count').notNull().default(0), // Total number of personas in the simulation
    parametersJson: text('parameters_json'), // JSON string of the persona config snapshot at the time of simulation
    error: text('error'), // Error message if the simulation failed
    ...timestamps,
  },
  (table) => [
    index('simulation_funnel_id_idx').on(table.funnelId),
    index('simulation_persona_config_id_idx').on(table.personaConfigId),
    index('simulation_status_idx').on(table.status),
  ]
);

export const simulationPersonas = sqliteTable(
  'simulation_personas',
  {
    simulationId: text('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    personaId: text('persona_id')
      .notNull()
      .references(() => personas.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['processing', 'complete', 'error'] })
      .notNull()
      .default('processing'),
    error: text('error'),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.simulationId, table.personaId] })]
);

/**
 * Simulation stage status enum
 * Defines the possible states of a simulation stage
 */
export const simulationStageStatusEnum = enumColumn('simulation_stage_status', [
  'idle', // Initial state
  'processing', // Currently processing
  'complete', // Successfully completed
  'error', // Failed with error
  'skipped', // Stage was skipped (persona didn't proceed to this stage)
]);

/**
 * Simulation stages table schema
 * Represents the progress of personas through each stage in a simulation
 */
export const simulationStages = sqliteTable(
  'simulation_stages',
  {
    simulationId: text('simulation_id')
      .references(() => simulations.id, { onDelete: 'cascade' })
      .notNull(),
    stageId: text('stage_id')
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    status: simulationStageStatusEnum('simulation_stage_status').notNull().default('idle'),
    completeCount: integer('complete_count').notNull().default(0), // Number of personas that completed the stage
    error: text('error'), // Error message if processing the stage failed
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.simulationId, table.stageId] }),
    index('simulation_stage_simulation_id_idx').on(table.simulationId),
    index('simulation_stage_stage_id_idx').on(table.stageId),
    index('simulation_stage_status_idx').on(table.status),
  ]
);

/**
 * One simulation to one funnel and one persona config and many stages
 */
export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  funnel: one(funnels, {
    fields: [simulations.funnelId],
    references: [funnels.id],
  }),
  personaConfig: one(personaConfigs, {
    fields: [simulations.personaConfigId],
    references: [personaConfigs.id],
  }),
  stages: many(simulationStages),
  responseStages: many(responseStages),
}));

/**
 * One simulation stage to one simulation and one stage
 */
export const simulationStagesRelations = relations(simulationStages, ({ one }) => ({
  simulation: one(simulations, {
    fields: [simulationStages.simulationId],
    references: [simulations.id],
  }),
  stage: one(stages, {
    fields: [simulationStages.stageId],
    references: [stages.id],
  }),
}));

// Inferred types
export type Simulation = typeof simulations.$inferSelect;
export type NewSimulation = typeof simulations.$inferInsert;
export type SimulationStage = typeof simulationStages.$inferSelect;
export type NewSimulationStage = typeof simulationStages.$inferInsert;
export type SimulationStatus = (typeof simulationStatusEnum.enumValues)[number];
export type SimulationStageStatus = (typeof simulationStageStatusEnum.enumValues)[number];

// Extended types
export interface SimulationWithStages extends Simulation {
  stages: SimulationStage[];
  funnel: import('./funnel').Funnel;
  personaConfig: import('./persona').PersonaConfig;
}

export interface SimulationStageWithDetails extends SimulationStage {
  simulation: Simulation;
  stage: import('./funnel').Stage;
}
