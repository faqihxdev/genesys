import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { AnyPgColumn, boolean, index, pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
import { projects } from './project';

/**
 * Funnel table schema
 * Represents a marketing/sales funnel with multiple stages
 */
export const funnels = pgTable(
  'funnels',
  {
    id: varchar({ length: ID_LENGTH })
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'fnl-' }))
      .primaryKey(),
    projectId: varchar({ length: ID_LENGTH }) // FK: which project is this funnel for?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar({ length: 256 }).notNull(), // user reference: name of the funnel
    description: text(), // user reference: description of the funnel
    ...timestamps,
  },
  (table) => [
    index('funnel_project_id_idx').on(table.projectId),
    index('funnel_name_idx').on(table.name),
  ]
);

/**
 * Stages table schema
 * Represents a stage in a funnel where personas interact with content
 * Stages form a tree structure where parentId null indicates root/first stage
 * and hasChild indicates if the stage has any child stages
 */
export const stages = pgTable(
  'stages',
  {
    id: varchar({ length: ID_LENGTH })
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'stg-' }))
      .primaryKey(),
    funnelId: varchar({ length: ID_LENGTH }) // FK: which funnel is this stage for?
      .references(() => funnels.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: varchar({ length: ID_LENGTH }) // FK: parent stage, null means this is a root/first stage
      .references((): AnyPgColumn => stages.id, { onDelete: 'set null' }),
    hasChild: boolean().notNull().default(false), // Indicates if this stage has any child stages
    name: varchar({ length: 256 }).notNull(), // name of the stage
    description: text(), // description of the stage
    ...timestamps,
  },
  (table) => [
    index('stage_funnel_id_idx').on(table.funnelId),
    index('stage_parent_id_idx').on(table.parentId),
    index('stage_name_idx').on(table.name),
  ]
);

/**
 * Stage item type enum
 * Defines the types of content that can be added to a stage
 */
export const stageItemTypeEnum = pgEnum('stage_item_type', ['text', 'image', 'video']);

/**
 * Stage items table schema
 * Represents content items within a stage that personas interact with
 */
export const stageItems = pgTable(
  'stage_items',
  {
    id: varchar({ length: ID_LENGTH })
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sti-' }))
      .primaryKey(),
    stageId: varchar({ length: ID_LENGTH }) // FK: which stage is this item for?
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar({ length: 256 }).notNull(), // name of the item
    description: text(), // description of the item
    type: stageItemTypeEnum().notNull(), // type of the item (text, image, video)
    content: text().notNull(), // text: string, image: url, video: url
    ...timestamps,
  },
  (table) => [
    index('stage_item_stage_id_idx').on(table.stageId),
    index('stage_item_name_idx').on(table.name),
    index('stage_item_type_idx').on(table.type),
  ]
);

/**
 * One funnel to one project and many stages
 */
export const funnelsRelations = relations(funnels, ({ one, many }) => ({
  project: one(projects, {
    fields: [funnels.projectId],
    references: [projects.id],
  }),
  stages: many(stages),
}));

/**
 * One stage to one funnel and many stage items
 * Also includes self-referential parent-child relationship
 */
export const stagesRelations = relations(stages, ({ one, many }) => ({
  funnel: one(funnels, {
    fields: [stages.funnelId],
    references: [funnels.id],
  }),
  items: many(stageItems),
  parent: one(stages, {
    fields: [stages.parentId],
    references: [stages.id],
  }),
  children: many(stages, { relationName: 'parent' }),
}));

/**
 * One stage item to one stage
 */
export const stageItemsRelations = relations(stageItems, ({ one }) => ({
  stage: one(stages, {
    fields: [stageItems.stageId],
    references: [stages.id],
  }),
}));

// Inferred types
export type Funnel = typeof funnels.$inferSelect;
export type NewFunnel = typeof funnels.$inferInsert;
export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;
export type StageItem = typeof stageItems.$inferSelect;
export type NewStageItem = typeof stageItems.$inferInsert;
export type StageItemType = (typeof stageItemTypeEnum.enumValues)[number];

// Extended types
export interface FunnelWithStages extends Funnel {
  stages: Stage[];
}

export interface StageWithItems extends Stage {
  items: StageItem[];
}
