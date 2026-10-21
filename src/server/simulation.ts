'use server';

/**
 * @file Simulation management utilities
 * @description Functions for creating, managing, and processing simulations
 */

import { db } from '@/db';
import { funnels, stageLinks } from '@/db/schema/funnel';
import { personaConfigs, personas } from '@/db/schema/persona';
import {
  NewSimulation,
  NewSimulationStage,
  simulationPersonas,
  simulations,
  simulationStages,
} from '@/db/schema/simulation';
import { chunks } from '@/lib/chunks';
import { enqueueSimulationJobs } from '@/lib/simulation-queue';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';
import { AuthorizationError, requireProjectAccess } from './authorization';

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
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const [funnelMembership, personaMembership] = await Promise.all([
      requireProjectAccess({
        userId: currentUser.id,
        resource: { kind: 'funnel', id: input.funnelId },
      }),
      requireProjectAccess({
        userId: currentUser.id,
        resource: { kind: 'persona-config', id: input.personaConfigId },
      }),
    ]);

    if (funnelMembership.projectId !== personaMembership.projectId) {
      throw new AuthorizationError(
        'Funnel and persona configuration must belong to the same project'
      );
    }

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

      // Get the complete persona config with traits config
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

      // Store the entire persona config as JSON for historical reference
      // This ensures we keep a snapshot of the persona config at the time of simulation
      const parametersJson = JSON.stringify(personaConfig);

      // Create a new simulation record
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
      await db.batch([
        db.insert(simulationStages).values(simulationStagesValues.slice(0, 5)),
        ...chunks(simulationStagesValues.slice(5), 5).map((values) =>
          db.insert(simulationStages).values(values)
        ),
      ]);

      // Queue the simulation for processing
      const queued = await queueSimulationInitialChunks(createdSimulation.id);
      if (!queued) {
        await db
          .update(simulations)
          .set({
            status: 'error',
            error: 'Failed to queue all simulation tasks',
          })
          .where(eq(simulations.id, createdSimulation.id));

        return fail({
          message: 'Failed to queue simulation tasks',
          status: 500,
        });
      }

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
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'simulation', id: input.simulationId },
    });

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
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    await requireProjectAccess({
      userId: currentUser.id,
      resource: { kind: 'simulation', id: input.simulationId },
    });

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
      console.error(
        `[Simulation/queueSimulationInitialChunks]: Simulation ${simulationId} not found`
      );
      return false;
    }

    // Get the personas for this simulation
    const personaList = await db.query.personas.findMany({
      where: eq(personas.personaConfigId, simulation.personaConfigId),
    });

    if (personaList.length === 0) {
      console.error(
        `[Simulation/queueSimulationInitialChunks]: No personas found for simulation ${simulationId}`
      );
      return false;
    }

    const [funnel, funnelStageLinks] = await Promise.all([
      db.query.funnels.findFirst({
        where: eq(funnels.id, simulation.funnelId),
        with: {
          stages: true,
        },
      }),
      db.select().from(stageLinks).where(eq(stageLinks.funnelId, simulation.funnelId)),
    ]);

    if (!funnel || funnel.stages.length === 0) {
      console.error(
        `[Simulation/queueSimulationInitialChunks]: Funnel data invalid for simulation ${simulationId}`
      );
      return false;
    }

    // Find all starting stages (those with no incoming links)
    const allStageIds = funnel.stages.map((stage) => stage.id);
    const linkedToStageIds = funnelStageLinks.map((link) => link.toStageId);
    const startingStageIds = allStageIds.filter((id) => !linkedToStageIds.includes(id));

    if (startingStageIds.length !== 1) {
      console.error(
        `[Simulation/queueSimulationInitialChunks]: No starting stages found for funnel ${simulation.funnelId}`
      );
      return false;
    }

    const progressRows = personaList.map((persona) => ({ simulationId, personaId: persona.id }));
    await db.batch([
      db.update(simulations).set({ status: 'processing' }).where(eq(simulations.id, simulationId)),
      ...chunks(progressRows, 5).map((values) => db.insert(simulationPersonas).values(values)),
    ]);
    await enqueueSimulationJobs(
      personaList.map((persona) => ({
        simulationId,
        personaId: persona.id,
        stageId: startingStageIds[0],
        visited: [],
      }))
    );

    return true;
  } catch (error) {
    console.error('[Simulation/queueSimulationInitialChunks]: ', error);
    return false;
  }
}

/**
 * Get any active simulations for a funnel
 * @param input - The funnel ID
 * @returns The active simulation if it exists, or null
 */
export const getActiveFunnelSimulation = createAction({
  name: 'getActiveFunnelSimulation',
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
      // Find any simulation for this funnel that is not complete, cancelled, or errored
      const activeSimulation = await db.query.simulations.findFirst({
        where: and(eq(simulations.funnelId, input.funnelId), eq(simulations.status, 'processing')),
        with: {
          stages: true,
        },
        orderBy: (simulations, { desc }) => [desc(simulations.createdAt)],
      });

      if (!activeSimulation) {
        return null;
      }

      // Calculate progress percentage
      const progress =
        activeSimulation.totalCount > 0
          ? Math.round((activeSimulation.completeCount / activeSimulation.totalCount) * 100)
          : 0;

      // Get all stages in process
      const activeStages = activeSimulation.stages.filter((stage) => stage.status === 'processing');

      return {
        id: activeSimulation.id,
        status: activeSimulation.status,
        progress,
        completeCount: activeSimulation.completeCount,
        totalCount: activeSimulation.totalCount,
        activeStages: activeStages.length,
        totalStages: activeSimulation.stages.length,
        createdAt: activeSimulation.createdAt,
        updatedAt: activeSimulation.updatedAt,
        error: activeSimulation.error,
      };
    } catch (error) {
      console.error('[getActiveFunnelSimulation]:', error);
      return null;
    }
  },
});
