'use server';

/**
 * @file Funnel management utilities
 * @description Functions for fetching and managing funnels and their related data
 */

import { db } from '@/db';
import {
  funnels,
  FunnelWithStages,
  stageItems,
  StageLink,
  stageLinks,
  stages,
  StageWithItems,
} from '@/db/schema/funnel';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAction, fail } from './_utils';

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
  requireAuth: false,
  actionFn: async ({ input }) => {
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
  requireAuth: false,
  actionFn: async ({ input }) => {
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
  requireAuth: false,
  actionFn: async ({ input }) => {
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
    name: z.string().min(1, 'Funnel name is required').max(256, 'Funnel name is too long'),
    description: z.string().max(1000, 'Description is too long').optional(),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
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
export const saveFlow = createAction({
  name: 'saveFlow',
  validator: z.object({
    funnelId: z.string().min(1, 'Funnel ID is required'),
    nodes: z.array(z.any()).min(1, 'At least one node is required'),
    edges: z.array(z.any()),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    try {
      // Get existing funnel
      const existingFunnel = await db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
      });

      if (!existingFunnel) {
        return fail({
          message: 'Funnel not found',
          status: 404,
        });
      }

      // Find the start and end nodes
      const startNode = input.nodes.find((node) => node.type === 'start');
      const endNode = input.nodes.find((node) => node.type === 'end');

      if (!startNode || !endNode) {
        return fail({
          message: 'Start or end node not found',
          status: 400,
        });
      }

      // Find the stage node (tags node)
      const stageNodes = input.nodes.filter((node) => node.type === 'tags');

      if (stageNodes.length === 0) {
        return fail({
          message: 'No stage nodes found',
          status: 400,
        });
      }

      // Check if all stage nodes have names
      const nodesWithoutNames = stageNodes.filter((node) => !node.data.name);
      if (nodesWithoutNames.length > 0) {
        return fail({
          message: 'All stages must have names',
          status: 400,
        });
      }

      // Delete existing stage links for this funnel
      await db.delete(stageLinks).where(eq(stageLinks.funnelId, input.funnelId));

      // Get all existing stages for this funnel
      const existingStages = await db.query.stages.findMany({
        where: eq(stages.funnelId, input.funnelId),
      });

      // Create a map of existing stages by ID for quick lookup
      const existingStagesMap = existingStages.reduce(
        (acc, stage) => {
          acc[stage.id] = stage;
          return acc;
        },
        {} as Record<string, (typeof existingStages)[0]>
      );

      // Track which existing stages are still being used
      const usedExistingStageIds = new Set<string>();

      // Create new stages and their items
      const stageInserts = [];

      for (const stageNode of stageNodes) {
        let stageId: string;

        // Check if this is an existing stage
        if (stageNode.originalId && existingStagesMap[stageNode.originalId]) {
          // Update existing stage
          stageId = stageNode.originalId;
          usedExistingStageIds.add(stageId);

          // Update stage data
          await db
            .update(stages)
            .set({
              name: stageNode.data.name, // Use the stage name from node data
              description: stageNode.data.description || null,
            })
            .where(eq(stages.id, stageId));

          // Delete existing stage items
          await db.delete(stageItems).where(eq(stageItems.stageId, stageId));
        } else {
          // Create new stage
          const [newStage] = await db
            .insert(stages)
            .values({
              funnelId: input.funnelId,
              name: stageNode.data.name, // Use the stage name from node data
              description: stageNode.data.description || null,
            })
            .returning();

          stageId = newStage.id;
        }

        stageInserts.push({
          node: stageNode,
          stageId,
        });

        // Create stage items
        if (stageNode.data.options && stageNode.data.options.length > 0) {
          for (const option of stageNode.data.options) {
            await db.insert(stageItems).values({
              stageId: stageId,
              name: option.option.name,
              description: option.option.description || null, // Use the description from the option data
              type: option.option.type,
              content: option.option.content,
            });
          }
        }
      }

      // Delete stages that are no longer used
      for (const stage of existingStages) {
        if (!usedExistingStageIds.has(stage.id)) {
          // Delete stage items first
          await db.delete(stageItems).where(eq(stageItems.stageId, stage.id));
          // Then delete the stage
          await db.delete(stages).where(eq(stages.id, stage.id));
        }
      }

      // Create stage links based on connections
      for (const edge of input.edges) {
        // Find source and target nodes
        const sourceNode = input.nodes.find((node) => node.id === edge.source);
        const targetNode = input.nodes.find((node) => node.id === edge.target);

        if (!sourceNode || !targetNode) continue;

        // Skip if either source or target is not a stage node
        if (sourceNode.type === 'start' && targetNode.type === 'tags') {
          // This is the first stage in the flow
          const targetStageInsert = stageInserts.find((insert) => insert.node.id === targetNode.id);
          if (targetStageInsert) {
            // No need to create a link, but we could mark this as the first stage if needed
          }
        } else if (sourceNode.type === 'tags' && targetNode.type === 'end') {
          // This is the last stage in the flow
          const sourceStageInsert = stageInserts.find((insert) => insert.node.id === sourceNode.id);
          if (sourceStageInsert) {
            // No need to create a link, but we could mark this as the last stage if needed
          }
        } else if (sourceNode.type === 'tags' && targetNode.type === 'tags') {
          // This is a link between two stages
          const sourceStageInsert = stageInserts.find((insert) => insert.node.id === sourceNode.id);
          const targetStageInsert = stageInserts.find((insert) => insert.node.id === targetNode.id);

          if (sourceStageInsert && targetStageInsert) {
            await db.insert(stageLinks).values({
              funnelId: input.funnelId,
              fromStageId: sourceStageInsert.stageId,
              toStageId: targetStageInsert.stageId,
            });
          }
        }
      }

      // Revalidate the path to update the UI
      revalidatePath(`/project/${existingFunnel.projectId}/funnels`);

      return { success: true };
    } catch (error) {
      console.error('[saveFlow]:', error);
      return fail({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      });
    }
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
  requireAuth: false,
  actionFn: async ({ input }) => {
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
