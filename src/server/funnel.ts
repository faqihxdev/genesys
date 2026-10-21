'use server';

/**
 * @file Funnel management utilities
 * @description Functions for fetching and managing funnels and their related data
 */

import { db } from '@/db';
import { generateId, ID_LENGTH } from '@/db/schema/_utils';
import {
  funnels,
  FunnelWithStages,
  stageItems,
  StageLink,
  stageLinks,
  stages,
  StageWithItems,
} from '@/db/schema/funnel';
import { simulations } from '@/db/schema/simulation';
import { chunks } from '@/lib/chunks';
import { getStartingStage } from '@/lib/funnel-graph';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAction, createProfanityRefinement, fail } from './_utils';
import { requireProjectAccess } from './authorization';

/**
 * Get all funnels for a project with complete nested data
 * @param input - The project ID
 * @returns All funnels with their stages and stage items
 */
export const getFunnelsWithFullData = createAction({
  name: 'getFunnelsWithFullData',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'project', id: input.projectId },
    });

    try {
      // Get all funnels for the project
      const funnelList = await db.query.funnels.findMany({
        where: eq(funnels.projectId, input.projectId),
        orderBy: (funnels, { desc }) => [desc(funnels.createdAt)],
      });

      if (funnelList.length === 0) {
        return [];
      }

      // Get funnel IDs for batch query
      const funnelIds = funnelList.map((funnel) => funnel.id);

      // Get all stages for these funnels in a single query
      const allStages = await db.query.stages.findMany({
        where: inArray(stages.funnelId, funnelIds),
        orderBy: (stages, { asc }) => [asc(stages.createdAt)],
      });

      // Get all stage links for these funnels in a single query
      const allStageLinks = await db.query.stageLinks.findMany({
        where: inArray(stageLinks.funnelId, funnelIds),
      });

      if (allStages.length === 0) {
        // Return funnels with empty stages arrays
        return funnelList.map((funnel) => ({
          ...funnel,
          stages: [],
          stageLinks: allStageLinks.filter((link) => link.funnelId === funnel.id),
        }));
      }

      // Get stage IDs for batch query
      const stageIds = allStages.map((stage) => stage.id);

      // Get all stage items in a single query
      const allStageItems = await db.query.stageItems.findMany({
        where: inArray(stageItems.stageId, stageIds),
        orderBy: (stageItems, { asc }) => [asc(stageItems.createdAt)],
      });

      // Create a map of stage items by stage ID for quick lookup
      const stageItemsByStageIdMap = allStageItems.reduce(
        (acc, item) => {
          if (!acc[item.stageId]) {
            acc[item.stageId] = [];
          }
          acc[item.stageId].push(item);
          return acc;
        },
        {} as Record<string, typeof allStageItems>
      );

      // Create a map of stages by funnel ID for quick lookup
      const stagesByFunnelIdMap = allStages.reduce(
        (acc, stage) => {
          if (!acc[stage.funnelId]) {
            acc[stage.funnelId] = [];
          }

          // Add items to the stage
          const stageWithItems: StageWithItems = {
            ...stage,
            items: stageItemsByStageIdMap[stage.id] || [],
          };

          acc[stage.funnelId].push(stageWithItems);
          return acc;
        },
        {} as Record<string, StageWithItems[]>
      );

      // Create a map of stage links by funnel ID for quick lookup
      const stageLinksByFunnelIdMap = allStageLinks.reduce(
        (acc, link) => {
          if (!acc[link.funnelId]) {
            acc[link.funnelId] = [];
          }
          acc[link.funnelId].push(link);
          return acc;
        },
        {} as Record<string, StageLink[]>
      );

      // Assemble the final result
      const result = funnelList.map((funnel) => ({
        ...funnel,
        stages: stagesByFunnelIdMap[funnel.id] || [],
        stageLinks: stageLinksByFunnelIdMap[funnel.id] || [],
      })) as FunnelWithStages[];

      return result;
    } catch (error) {
      console.error('[getFunnelsWithFullData]:', error);
      return fail({
        message: 'Failed to fetch funnels',
        status: 500,
      });
    }
  },
});

/**
 * Get a funnel with all its stages, stage items, and stage links
 * @param input - The funnel ID
 * @returns The funnel data with all related information
 */
export const getFunnelWithFullData = createAction({
  name: 'getFunnelWithFullData',
  validator: z.object({
    funnelId: z.string().min(1, 'Funnel ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'funnel', id: input.funnelId },
    });

    try {
      // Get the funnel
      const funnel = await db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
      });

      if (!funnel) {
        return fail({
          message: 'Funnel not found',
          status: 404,
        });
      }

      // Get all stages for this funnel
      const stagesData = await db.query.stages.findMany({
        where: eq(stages.funnelId, input.funnelId),
      });

      // Get all stage items for these stages
      const stageIds = stagesData.map((stage: typeof stages.$inferSelect) => stage.id);
      const stageItemsData =
        stageIds.length > 0
          ? await db.query.stageItems.findMany({
              where: inArray(stageItems.stageId, stageIds),
            })
          : [];

      // Get all stage links for this funnel
      const stageLinksData = await db.query.stageLinks.findMany({
        where: eq(stageLinks.funnelId, input.funnelId),
      });

      // Map stage items to their respective stages
      const mappedStages = stagesData.map((stage: typeof stages.$inferSelect) => {
        const items = stageItemsData
          .filter((item) => item.stageId === stage.id)
          .map((item) => ({
            id: `item-${item.id}`,
            name: item.name,
            description: item.description,
            type: item.type,
            content: item.content,
          }));

        return {
          ...stage,
          items,
        };
      });

      // Return the complete funnel data
      return {
        ...funnel,
        stages: mappedStages,
        stageLinks: stageLinksData,
      };
    } catch (error) {
      console.error('[getFunnelWithFullData]:', error);
      return fail({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      });
    }
  },
});

/**
 * Get a single funnel with complete nested data
 * @param input - The funnel ID
 * @returns The funnel with its stages and stage items
 */
export const getFunnelWithFullDataOriginal = createAction({
  name: 'getFunnelWithFullData',
  validator: z.object({
    funnelId: z.string().min(1, 'Funnel ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'funnel', id: input.funnelId },
    });

    try {
      // Get the funnel
      const funnel = await db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
      });

      if (!funnel) {
        return fail({
          message: 'Funnel not found',
          status: 404,
        });
      }

      // Get all stages for this funnel
      const stageList = await db.query.stages.findMany({
        where: eq(stages.funnelId, funnel.id),
        orderBy: (stages, { asc }) => [asc(stages.createdAt)],
      });

      // Get all stage links for this funnel
      const stageLinkList = await db.query.stageLinks.findMany({
        where: eq(stageLinks.funnelId, funnel.id),
      });

      if (stageList.length === 0) {
        return {
          ...funnel,
          stages: [],
          stageLinks: stageLinkList,
        } as FunnelWithStages;
      }

      // Get all stage IDs
      const stageIds = stageList.map((stage) => stage.id);

      // Get all stage items in a single query
      const allStageItems = await db.query.stageItems.findMany({
        where: inArray(stageItems.stageId, stageIds),
        orderBy: (stageItems, { asc }) => [asc(stageItems.createdAt)],
      });

      // Create a map of stage items by stage ID for quick lookup
      const stageItemsByStageIdMap = allStageItems.reduce(
        (acc, item) => {
          if (!acc[item.stageId]) {
            acc[item.stageId] = [];
          }
          acc[item.stageId].push(item);
          return acc;
        },
        {} as Record<string, typeof allStageItems>
      );

      // Add items to each stage
      const stagesWithItems: StageWithItems[] = stageList.map((stage) => ({
        ...stage,
        items: stageItemsByStageIdMap[stage.id] || [],
      }));

      // Assemble the final result
      const result = {
        ...funnel,
        stages: stagesWithItems,
        stageLinks: stageLinkList,
      } as FunnelWithStages;

      return result;
    } catch (error) {
      console.error('[getFunnelWithFullData]:', error);
      return fail({
        message: 'Failed to fetch funnel',
        status: 500,
      });
    }
  },
});

/**
 * Create a new funnel
 * @param input - The funnel data
 * @returns The created funnel
 */
export const createFunnel = createAction({
  name: 'createFunnel',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    name: z
      .string()
      .min(1, 'Funnel name is required')
      .max(256, 'Funnel name is too long')
      .refine(...createProfanityRefinement('Funnel name contains inappropriate language')),
    description: z
      .string()
      .max(1000, 'Description is too long')
      .optional()
      .refine(...createProfanityRefinement('Funnel description contains inappropriate language')),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'project', id: input.projectId },
    });

    try {
      // Create the funnel
      const [newFunnel] = await db
        .insert(funnels)
        .values({
          projectId: input.projectId,
          name: input.name,
          description: input.description,
        })
        .returning();

      return newFunnel;
    } catch (error) {
      console.error('[createFunnel]:', error);
      return fail({
        message: 'Failed to create funnel',
        status: 500,
      });
    }
  },
});

/**
 * Save a funnel flow with its stages, stage items, and stage links
 * @param input - The funnel flow data including nodes and edges
 * @returns Success status and any error message
 */
const stageNodeSchema = z.object({
  id: z.string(),
  originalId: z.string().optional(),
  data: z.object({
    name: z.string().min(1).max(120),
    description: z.string().max(2000).nullish(),
    options: z
      .array(
        z.object({
          originalId: z.string().optional(),
          option: z.object({
            name: z.string().max(120),
            description: z.string().max(2000).nullish(),
            type: z.enum(['text', 'image', 'video']),
            content: z.string().max(10000),
          }),
        })
      )
      .max(20)
      .default([]),
  }),
});

export const saveFlow = createAction({
  name: 'saveFlow',
  validator: z.object({
    funnelId: z.string().min(1),
    nodes: z.array(z.any()).min(1).max(100),
    edges: z.array(z.object({ source: z.string(), target: z.string() }).passthrough()).max(100),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'funnel', id: input.funnelId },
    });
    const funnel = await db.query.funnels.findFirst({ where: eq(funnels.id, input.funnelId) });
    if (!funnel) return fail({ message: 'Funnel not found', status: 404 });
    const active = await db.query.simulations.findFirst({
      where: and(eq(simulations.funnelId, input.funnelId), eq(simulations.status, 'processing')),
    });
    if (active)
      return fail({
        message: 'Wait for the active simulation or cancel it before editing this funnel.',
        status: 409,
      });
    const start = input.nodes.find((node) => node.type === 'start');
    const end = input.nodes.find((node) => node.type === 'end');
    if (!start || !end)
      return fail({ message: 'The funnel needs Start and End nodes.', status: 400 });
    const nodes = z
      .array(stageNodeSchema)
      .min(1)
      .max(20)
      .parse(input.nodes.filter((node) => node.type === 'tags'));
    if (nodes.reduce((count, node) => count + node.data.options.length, 0) > 60)
      return fail({ message: 'A funnel can contain at most 60 content items.', status: 400 });
    if (new Set(nodes.map((node) => node.id)).size !== nodes.length)
      return fail({ message: 'Stage IDs must be unique.', status: 400 });
    const graphLinks = [
      ...new Map(
        input.edges
          .filter(
            (edge) =>
              nodes.some((node) => node.id === edge.source) &&
              nodes.some((node) => node.id === edge.target)
          )
          .map((edge) => [edge.source + ':' + edge.target, { from: edge.source, to: edge.target }])
      ).values(),
    ];
    let root: string;
    try {
      root = getStartingStage(
        nodes.map((node) => node.id),
        graphLinks
      );
    } catch (error) {
      return fail({
        message: error instanceof Error ? error.message : 'Invalid funnel',
        status: 400,
      });
    }
    const startEdges = input.edges.filter((edge) => edge.source === start.id);
    if (startEdges.length !== 1 || startEdges[0].target !== root)
      return fail({ message: 'Connect Start to the first stage.', status: 400 });
    const existingStages = await db
      .select()
      .from(stages)
      .where(eq(stages.funnelId, input.funnelId));
    const existingIds = existingStages.map((stage) => stage.id);
    const existingItems = existingIds.length
      ? await db.select().from(stageItems).where(inArray(stageItems.stageId, existingIds))
      : [];
    const idMap = new Map(
      nodes.map((node) => [
        node.id,
        existingIds.includes(node.originalId ?? node.id)
          ? (node.originalId ?? node.id)
          : generateId({ length: ID_LENGTH, prefix: 'stg-' }),
      ])
    );
    const stageRows = nodes.map((node) => ({
      id: idMap.get(node.id)!,
      funnelId: input.funnelId,
      name: node.data.name,
      description: node.data.description ?? null,
    }));
    const itemRows = nodes.flatMap((node) =>
      node.data.options.map((option) => ({
        id: existingItems.some(
          (item) => item.id === option.originalId && item.stageId === idMap.get(node.id)
        )
          ? option.originalId!
          : generateId({ length: ID_LENGTH, prefix: 'sti-' }),
        stageId: idMap.get(node.id)!,
        name: option.option.name,
        description: option.option.description ?? null,
        type: option.option.type,
        content: option.option.content,
      }))
    );
    const removedStages = existingIds.filter((id) => !stageRows.some((stage) => stage.id === id));
    const removedItems = existingItems
      .map((item) => item.id)
      .filter((id) => !itemRows.some((item) => item.id === id));
    const linkRows = graphLinks.map((link) => ({
      funnelId: input.funnelId,
      fromStageId: idMap.get(link.from)!,
      toStageId: idMap.get(link.to)!,
    }));
    await db.batch([
      db.delete(stageLinks).where(eq(stageLinks.funnelId, input.funnelId)),
      ...(removedItems.length
        ? [db.delete(stageItems).where(inArray(stageItems.id, removedItems))]
        : []),
      ...(removedStages.length ? [db.delete(stages).where(inArray(stages.id, removedStages))] : []),
      ...chunks(stageRows, 5).map((values) =>
        db
          .insert(stages)
          .values(values)
          .onConflictDoUpdate({
            target: stages.id,
            set: {
              name: sql`excluded.name`,
              description: sql`excluded.description`,
              updatedAt: new Date(),
            },
          })
      ),
      ...chunks(itemRows, 5).map((values) =>
        db
          .insert(stageItems)
          .values(values)
          .onConflictDoUpdate({
            target: stageItems.id,
            set: {
              name: sql`excluded.name`,
              description: sql`excluded.description`,
              type: sql`excluded.stage_item_type`,
              content: sql`excluded.content`,
              updatedAt: new Date(),
            },
          })
      ),
      ...chunks(linkRows, 5).map((values) => db.insert(stageLinks).values(values)),
      db.update(funnels).set({ updatedAt: new Date() }).where(eq(funnels.id, input.funnelId)),
    ]);
    revalidatePath(`/project/${funnel.projectId}/funnels`);
    return { success: true };
  },
});

/**
 * Delete a funnel
 * @param input - The funnel ID
 * @returns Success status and any error message
 */
export const deleteFunnel = createAction({
  name: 'deleteFunnel',
  validator: z.object({
    funnelId: z.string(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'funnel', id: input.funnelId },
    });

    try {
      // Get existing funnel to retrieve projectId for path revalidation
      const existingFunnel = await db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
      });

      if (!existingFunnel) {
        return fail({
          message: 'Funnel not found',
          status: 404,
        });
      }

      // Delete all stage links for this funnel
      await db.delete(stageLinks).where(eq(stageLinks.funnelId, input.funnelId));

      // Get all stages for this funnel
      const funnelStages = await db.query.stages.findMany({
        where: eq(stages.funnelId, input.funnelId),
      });

      // Delete all stage items for each stage
      for (const stage of funnelStages) {
        await db.delete(stageItems).where(eq(stageItems.stageId, stage.id));
      }

      // Delete all stages for this funnel
      await db.delete(stages).where(eq(stages.funnelId, input.funnelId));

      // Finally, delete the funnel itself
      await db.delete(funnels).where(eq(funnels.id, input.funnelId));

      // Revalidate the path to update the UI
      revalidatePath(`/project/${existingFunnel.projectId}/funnels`);

      return { success: true };
    } catch (error) {
      console.error('[deleteFunnel]:', error);
      return fail({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      });
    }
  },
});
