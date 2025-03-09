'use server';

/**
 * @file Simulation management utilities
 * @description Functions for creating, managing, and processing simulations
 */

import { db } from '@/db';
import { funnels } from '@/db/schema/funnel';
import { personaConfigs, personas } from '@/db/schema/persona';
import { SimulationTaskPayload } from '@/db/schema/queue';
import {
  NewSimulation,
  NewSimulationStage,
  simulations,
  simulationStages,
} from '@/db/schema/simulation';
import { enqueueSimulationTask } from '@/lib/supabase/queue-service';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createAction, fail } from './_utils';
import { getFunnelWithFullData } from './funnel';

/**
 * Create a new simulation
 * @param input - The simulation creation parameters
 * @returns The newly created simulation with initialized stages
 */
export const createSimulation = createAction({
  name: 'createSimulation',
  validator: z.object({
    funnelId: z.string().min(1, 'Funnel ID is required'),
    personaConfigId: z.string().min(1, 'Persona Config ID is required'),
    parameters: z
      .object({
        maxPathsPerPersona: z.number().int().min(1).optional(),
        detailedResponses: z.boolean().optional(),
        temperatureOverride: z.number().min(0).max(2).optional(),
        includeReasons: z.boolean().optional(),
        customPromptAdditions: z.string().optional(),
      })
      .optional(),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    try {
      // Get the funnel with all its stages
      const funnel = await db.query.funnels.findFirst({
        where: eq(funnels.id, input.funnelId),
        with: {
          stages: true,
        },
      });

      if (!funnel) {
        return fail({
          message: 'Funnel not found',
          status: 404,
        });
      }

      // Get the persona config
      const personaConfig = await db.query.personaConfigs.findFirst({
        where: eq(personaConfigs.id, input.personaConfigId),
      });

      if (!personaConfig) {
        return fail({
          message: 'Persona config not found',
          status: 404,
        });
      }

      // Get all personas for this config
      const personaList = await db.query.personas.findMany({
        where: eq(personas.personaConfigId, input.personaConfigId),
      });

      if (personaList.length === 0) {
        return fail({
          message: 'No personas found for this config',
          status: 400,
        });
      }

      // Create a new simulation record
      const parametersJson = input.parameters ? JSON.stringify(input.parameters) : null;
      const newSimulation: NewSimulation = {
        funnelId: input.funnelId,
        personaConfigId: input.personaConfigId,
        status: 'idle',
        completeCount: 0,
        totalCount: personaList.length,
        parametersJson,
      };

      // Insert the simulation
      const [createdSimulation] = await db.insert(simulations).values(newSimulation).returning();

      if (!createdSimulation) {
        return fail({
          message: 'Failed to create simulation',
          status: 500,
        });
      }

      // Initialize simulation stages
      const simulationStagesValues: NewSimulationStage[] = funnel.stages.map((stage) => ({
        simulationId: createdSimulation.id,
        stageId: stage.id,
        status: 'idle',
        completeCount: 0,
        totalCount: personaList.length,
      }));

      // Insert all simulation stages
      await db.insert(simulationStages).values(simulationStagesValues);

      // Queue the simulation for processing
      await queueSimulationInitialChunks(createdSimulation.id);

      return {
        ...createdSimulation,
        stages: simulationStagesValues,
      };
    } catch (error) {
      console.error('[createSimulation]:', error);
      return fail({
        message: 'An error occurred while creating the simulation',
        status: 500,
      });
    }
  },
});

/**
 * Get the status of a simulation
 * @param input - The simulation ID
 * @returns The simulation status with progress information
 */
export const getSimulationStatus = createAction({
  name: 'getSimulationStatus',
  validator: z.object({
    simulationId: z.string().min(1, 'Simulation ID is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    try {
      // Get the simulation with its stages
      const simulation = await db.query.simulations.findFirst({
        where: eq(simulations.id, input.simulationId),
        with: {
          stages: true,
        },
      });

      if (!simulation) {
        return fail({
          message: 'Simulation not found',
          status: 404,
        });
      }

      // Calculate progress percentage
      const progress =
        simulation.totalCount > 0
          ? Math.round((simulation.completeCount / simulation.totalCount) * 100)
          : 0;

      // Get all stages in process
      const activeStages = simulation.stages.filter((stage) => stage.status === 'processing');

      return {
        id: simulation.id,
        status: simulation.status,
        progress,
        completeCount: simulation.completeCount,
        totalCount: simulation.totalCount,
        activeStages: activeStages.length,
        totalStages: simulation.stages.length,
        createdAt: simulation.createdAt,
        updatedAt: simulation.updatedAt,
        error: simulation.error,
      };
    } catch (error) {
      console.error('[getSimulationStatus]:', error);
      return fail({
        message: 'An error occurred while getting the simulation status',
        status: 500,
      });
    }
  },
});

/**
 * Cancel a simulation
 * @param input - The simulation ID
 * @returns The updated simulation
 */
export const cancelSimulation = createAction({
  name: 'cancelSimulation',
  validator: z.object({
    simulationId: z.string().min(1, 'Simulation ID is required'),
  }),
  requireAuth: false,
  actionFn: async ({ input }) => {
    try {
      // Get the simulation
      const simulation = await db.query.simulations.findFirst({
        where: eq(simulations.id, input.simulationId),
      });

      if (!simulation) {
        return fail({
          message: 'Simulation not found',
          status: 404,
        });
      }

      if (simulation.status === 'complete' || simulation.status === 'error') {
        return fail({
          message: `Cannot cancel a simulation that is already ${simulation.status}`,
          status: 400,
        });
      }

      // Update the simulation status
      const [updatedSimulation] = await db
        .update(simulations)
        .set({
          status: 'cancelled',
          error: 'Cancelled by user',
        })
        .where(eq(simulations.id, input.simulationId))
        .returning();

      // Update all in-progress stages to skipped
      await db
        .update(simulationStages)
        .set({
          status: 'skipped',
          error: 'Simulation cancelled by user',
        })
        .where(
          and(
            eq(simulationStages.simulationId, input.simulationId),
            eq(simulationStages.status, 'processing')
          )
        );

      return updatedSimulation;
    } catch (error) {
      console.error('[cancelSimulation]:', error);
      return fail({
        message: 'An error occurred while cancelling the simulation',
        status: 500,
      });
    }
  },
});

/**
 * Queue initial chunks for a simulation
 * This function is called after creating a simulation
 * @param simulationId - The ID of the simulation to queue
 * @returns True if successful, false otherwise
 */
async function queueSimulationInitialChunks(simulationId: string): Promise<boolean> {
  try {
    // Get the simulation
    const simulation = await db.query.simulations.findFirst({
      where: eq(simulations.id, simulationId),
    });

    if (!simulation) {
      console.error(`[queueSimulationInitialChunks] Simulation ${simulationId} not found`);
      return false;
    }

    // Get the personas for this simulation
    const personaList = await db.query.personas.findMany({
      where: eq(personas.personaConfigId, simulation.personaConfigId),
    });

    if (personaList.length === 0) {
      console.error(
        `[queueSimulationInitialChunks] No personas found for simulation ${simulationId}`
      );
      return false;
    }

    // Get the funnel with all its data
    const funnel = await withQuery(getFunnelWithFullData)({ funnelId: simulation.funnelId });
    if (!funnel || funnel.stages.length === 0) {
      console.error(
        `[queueSimulationInitialChunks] Funnel data invalid for simulation ${simulationId}`
      );
      return false;
    }

    // Find all starting stages (those with no incoming links)
    const allStageIds = funnel.stages.map((stage) => stage.id);
    const linkedToStageIds = funnel.stageLinks.map((link) => link.toStageId);
    const startingStageIds = allStageIds.filter((id) => !linkedToStageIds.includes(id));

    if (startingStageIds.length === 0) {
      console.error(
        `[queueSimulationInitialChunks] No starting stages found for funnel ${simulation.funnelId}`
      );
      return false;
    }

    // Create a chunk for each persona for each starting stage
    let queuedCount = 0;
    for (const persona of personaList) {
      for (const stageId of startingStageIds) {
        const chunkId = uuidv4();
        const message: SimulationTaskPayload = {
          simulationId,
          personaId: persona.id,
          stageId,
          chunkId,
        };

        const taskId = await enqueueSimulationTask(message);
        if (taskId) {
          queuedCount++;
        }
      }
    }

    // Update the simulation status to processing
    await db
      .update(simulations)
      .set({ status: 'processing' })
      .where(eq(simulations.id, simulationId));

    console.log(
      `[queueSimulationInitialChunks] Queued ${queuedCount} chunks for simulation ${simulationId}`
    );
    return true;
  } catch (error) {
    console.error('[queueSimulationInitialChunks]:', error);
    return false;
  }
}

/**
 * Helper function to run withQuery from utils
 */
import { withQuery } from '@/lib/utils';
