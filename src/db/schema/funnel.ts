import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { ID_LENGTH, timestamps } from './_utils';
import { projects } from './project';
import { enumColumn, index, sqliteTable, text } from './sqlite';

/**
 * Funnel table schema
 * Represents a marketing/sales funnel with multiple stages
 */
export const funnels = sqliteTable(
  'funnels',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'fnl-' }))
      .primaryKey(),
    projectId: text('project_id') // FK: which project is this funnel for?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(), // user reference: name of the funnel
    description: text('description'), // user reference: description of the funnel
    ...timestamps,
  },
  (table) => [
    index('funnel_project_id_idx').on(table.projectId),
    index('funnel_name_idx').on(table.name),
  ]
);

/**
 * Stages table schema
 * Represents a stage in a funnel where personas interact with content.
 * Removed parentId and childId fields to allow unlimited branching via a separate relationship table.
 */
export const stages = sqliteTable(
  'stages',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'stg-' }))
      .primaryKey(),
    funnelId: text('funnel_id') // FK: which funnel is this stage for?
      .references(() => funnels.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(), // name of the stage
    description: text('description'), // description of the stage
    ...timestamps,
  },
  (table) => [
    index('stage_funnel_id_idx').on(table.funnelId),
    index('stage_name_idx').on(table.name),
  ]
);

/**
 * Stage links table schema
 * Represents directed relationships (edges) between stages.
 * This allows a stage to have multiple parents or children.
 */
export const stageLinks = sqliteTable(
  'stage_links',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sln-' }))
      .primaryKey(),
    funnelId: text('funnel_id') // FK: which funnel is this relationship for?
      .references(() => funnels.id, { onDelete: 'cascade' })
      .notNull(),
    fromStageId: text('from_stage_id') // FK: the parent (source) stage
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    toStageId: text('to_stage_id') // FK: the child (target) stage
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index('stage_links_funnel_id_idx').on(table.funnelId),
    index('stage_links_from_stage_id_idx').on(table.fromStageId),
    index('stage_links_to_stage_id_idx').on(table.toStageId),
  ]
);

/**
 * Stage item type enum
 * Defines the types of content that can be added to a stage
 */
export const stageItemTypeEnum = enumColumn('stage_item_type', ['text', 'image', 'video']);

/**
 * Stage items table schema
 * Represents content items within a stage that personas interact with
 */
export const stageItems = sqliteTable(
  'stage_items',
  {
    id: text('id')
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'sti-' }))
      .primaryKey(),
    stageId: text('stage_id') // FK: which stage is this item for?
      .references(() => stages.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(), // name of the item
    description: text('description'), // description of the item
    type: stageItemTypeEnum('stage_item_type').notNull(), // type of the item (text, image, video)
    content: text('content').notNull(), // text: string, image: URL, video: URL
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
 * One stage to one funnel and many stage items.
 * Parent/child relationships are now handled via stageLinks.
 */
export const stagesRelations = relations(stages, ({ one, many }) => ({
  funnel: one(funnels, {
    fields: [stages.funnelId],
    references: [funnels.id],
  }),
  items: many(stageItems),
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

/**
 * Stage links relations
 * Represents the directed connections between stages.
 */
export const stageLinksRelations = relations(stageLinks, ({ one }) => ({
  funnel: one(funnels, {
    fields: [stageLinks.funnelId],
    references: [funnels.id],
  }),
  fromStage: one(stages, {
    fields: [stageLinks.fromStageId],
    references: [stages.id],
  }),
  toStage: one(stages, {
    fields: [stageLinks.toStageId],
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
export type StageLink = typeof stageLinks.$inferSelect;
export type NewStageLink = typeof stageLinks.$inferInsert;

// Extended types
export interface FunnelWithStages extends Funnel {
  stages: StageWithItems[];
  stageLinks: StageLink[];
}

export interface StageWithItems extends Stage {
  items: StageItem[];
}
