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
 * Get a single funnel with complete nested data
 * @param input - The funnel ID
 * @returns The funnel with its stages and stage items
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
