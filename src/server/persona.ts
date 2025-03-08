'use server';

/**
 * @file Persona generation and management utilities
 * @description Functions for generating personas and working with persona configurations
 */

import { db } from '@/db';
import { NewPersonaConfig, personaConfigs, personas, TraitsConfigSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// ==================================================
// SERVER ACTIONS
// ==================================================

// Input validators
const personaConfigValidator = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['preset', 'custom']).default('custom'),
  size: z.number().int().min(1, 'Size must be at least 1').max(100, 'Size cannot exceed 100'),
  constraints: z.string().default(''),
  traitsConfig: TraitsConfigSchema,
});

const personaConfigIdValidator = z.object({
  id: z.string().min(1, 'Persona config ID is required'),
});

const projectIdValidator = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

const updatePersonaConfigValidator = z.object({
  id: z.string().min(1, 'Persona config ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  size: z
    .number()
    .int()
    .min(1, 'Size must be at least 1')
    .max(100, 'Size cannot exceed 100')
    .optional(),
  constraints: z.string().optional(),
  traitsConfig: TraitsConfigSchema.optional(),
});

/**
 * Create a new persona configuration
 * @param input - The persona configuration data
 * @returns The newly created persona configuration
 */
export const createPersonaConfig = createAction({
  name: 'createPersonaConfig',
  validator: personaConfigValidator,
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Create the persona config in the database
      const [newConfig] = await db
        .insert(personaConfigs)
        .values({
          projectId: input.projectId,
          name: input.name,
          description: input.description || '',
          type: input.type,
          size: input.size,
          constraints: input.constraints || '',
          traitsConfig: input.traitsConfig,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newConfig) {
        return fail({ message: 'Failed to create persona configuration', status: 500 });
      }

      // Note: Personas will be generated in a separate step

      return newConfig;
    } catch (error) {
      console.error('[createPersonaConfig]:', error);
      return fail({
        message: 'Failed to create persona configuration',
        status: 500,
      });
    }
  },
});

/**
 * Get a persona configuration by ID
 * @param input - Object containing the persona config ID
 * @returns The persona configuration with its personas
 */
export const getPersonaConfigById = createAction({
  name: 'getPersonaConfigById',
  validator: personaConfigIdValidator,
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Get the persona config from the database
      const config = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.id, input.id))
        .limit(1);

      if (config.length === 0) {
        return fail({ message: 'Persona configuration not found', status: 404 });
      }

      // Get associated personas
      const personasList = await db
        .select()
        .from(personas)
        .where(eq(personas.personaConfigId, input.id));

      return {
        ...config[0],
        personas: personasList,
      };
    } catch (error) {
      console.error('[getPersonaConfigById]:', error);
      return fail({
        message: 'Failed to get persona configuration',
        status: 500,
      });
    }
  },
});

/**
 * Get all persona configurations for a project
 * @param input - Object containing the project ID
 * @returns Array of persona configurations
 */
export const getPersonaConfigsByProject = createAction({
  name: 'getPersonaConfigsByProject',
  validator: projectIdValidator,
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      const configs = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.projectId, input.projectId))
        .orderBy(personaConfigs.createdAt);

      return configs;
    } catch (error) {
      console.error('[getPersonaConfigsByProject]:', error);
      return fail({
        message: 'Failed to get persona configurations',
        status: 500,
      });
    }
  },
});

/**
 * Update a persona configuration
 * @param input - The updated persona configuration data
 * @returns The updated persona configuration
 */
export const updatePersonaConfig = createAction({
  name: 'updatePersonaConfig',
  validator: updatePersonaConfigValidator,
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Check if the persona config exists
      const existingConfig = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.id, input.id))
        .limit(1);

      if (existingConfig.length === 0) {
        return fail({ message: 'Persona configuration not found', status: 404 });
      }

      // Prepare update values
      const updateValues: Partial<NewPersonaConfig> = {
        updatedAt: new Date(),
      };

      if (input.name) updateValues.name = input.name;
      if (input.description !== undefined) updateValues.description = input.description;
      if (input.size) updateValues.size = input.size;
      if (input.constraints !== undefined) updateValues.constraints = input.constraints;
      if (input.traitsConfig) updateValues.traitsConfig = input.traitsConfig;

      // Update the persona config
      const [updatedConfig] = await db
        .update(personaConfigs)
        .set(updateValues)
        .where(eq(personaConfigs.id, input.id))
        .returning();

      if (!updatedConfig) {
        return fail({ message: 'Failed to update persona configuration', status: 500 });
      }

      // Note: Personas will be generated in a separate step

      return updatedConfig;
    } catch (error) {
      console.error('[updatePersonaConfig]:', error);
      return fail({
        message: 'Failed to update persona configuration',
        status: 500,
      });
    }
  },
});

/**
 * Delete a persona configuration
 * @param input - Object containing the persona config ID
 * @returns True if deleted successfully
 */
export const deletePersonaConfig = createAction({
  name: 'deletePersonaConfig',
  validator: personaConfigIdValidator,
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Check if the persona config exists
      const existingConfig = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.id, input.id))
        .limit(1);

      if (existingConfig.length === 0) {
        return fail({ message: 'Persona configuration not found', status: 404 });
      }

      // Delete the persona config (this will cascade delete personas)
      const deleted = await db
        .delete(personaConfigs)
        .where(eq(personaConfigs.id, input.id))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('[deletePersonaConfig]:', error);
      return fail({
        message: 'Failed to delete persona configuration',
        status: 500,
      });
    }
  },
});
