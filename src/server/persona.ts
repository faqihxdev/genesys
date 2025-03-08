'use server';

/**
 * @file Persona generation and management utilities
 * @description Functions for generating personas and working with persona configurations
 */

import { db } from '@/db';
import {
  NewPersonaConfig,
  PersonaConfig,
  personaConfigs,
  personas,
  Traits,
  TraitsConfig,
  TraitsConfigSchema,
} from '@/db/schema/persona';
import env from '@/env';
import { generatePersonaTraitsFromConfig } from '@/lib/persona-utils';
import { count, eq, inArray } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';
import { createAction, fail } from './_utils';

/**
 * Create a new persona configuration
 * @param input - The persona configuration data
 * @returns The newly created persona configuration
 */
export const createPersonaConfig = createAction({
  name: 'createPersonaConfig',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['preset', 'custom']).default('custom'),
    size: z.number().int().min(1, 'Size must be at least 1').max(100, 'Size cannot exceed 100'),
    constraints: z.string().default(''),
    traitsConfig: TraitsConfigSchema,
  }),
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
  validator: z.object({
    id: z.string().min(1, 'Persona config ID is required'),
  }),
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
 * @returns Array of persona configurations with persona counts
 */
export const getPersonaConfigsByProject = createAction({
  name: 'getPersonaConfigsByProject',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Get all configs for the project
      const configs = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.projectId, input.projectId))
        .orderBy(personaConfigs.createdAt);

      // Get persona counts for each config using a single efficient query
      const personaCounts = await db
        .select({
          personaConfigId: personas.personaConfigId,
          count: count(),
        })
        .from(personas)
        .where(
          inArray(
            personas.personaConfigId,
            configs.map((config) => config.id)
          )
        )
        .groupBy(personas.personaConfigId);

      // Create a map of config ID to persona count
      const countMap: Record<string, number> = {};
      personaCounts.forEach((item) => {
        countMap[item.personaConfigId] = Number(item.count);
      });

      // Add persona count to each config
      const configsWithCounts = configs.map((config) => ({
        ...config,
        personaCount: countMap[config.id] || 0,
      }));

      return configsWithCounts;
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
  validator: z.object({
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
  }),
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

      // Important: Check for undefined, not just truthy values
      if (input.name !== undefined) updateValues.name = input.name;
      if (input.description !== undefined) updateValues.description = input.description;
      if (input.size !== undefined) updateValues.size = input.size;
      if (input.constraints !== undefined) updateValues.constraints = input.constraints;
      if (input.traitsConfig !== undefined) updateValues.traitsConfig = input.traitsConfig;

      // Update the persona config
      const [updatedConfig] = await db
        .update(personaConfigs)
        .set(updateValues)
        .where(eq(personaConfigs.id, input.id))
        .returning();

      if (!updatedConfig) {
        return fail({ message: 'Failed to update persona configuration', status: 500 });
      }

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
 * @param input - Object containing the persona config ID to delete
 * @returns True if deleted successfully
 */
export const deletePersonaConfig = createAction({
  name: 'deletePersonaConfig',
  validator: z.object({
    id: z.string().min(1, 'Persona config ID is required'),
  }),
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Compare persona configs to determine if traits configuration has changed
 * @param oldConfig - The old persona configuration
 * @param newConfig - The new persona configuration
 * @returns True if the traits configuration has changed
 */
const hasTraitsConfigChanged = (oldConfig: PersonaConfig, newConfig: PersonaConfig): boolean => {
  // Compare size (number of personas)
  if (oldConfig.size !== newConfig.size) {
    console.log(
      `[hasTraitsConfigChanged]: Size changed from ${oldConfig.size} to ${newConfig.size}`
    );
    return true;
  }

  // Compare constraints
  if (oldConfig.constraints !== newConfig.constraints) {
    console.log('[hasTraitsConfigChanged]: Constraints changed');
    return true;
  }

  // Compare traits configuration - deep comparison needed
  if (!oldConfig.traitsConfig || !newConfig.traitsConfig) {
    // If either is missing, consider it a change
    console.log('[hasTraitsConfigChanged]: One of the configs is missing traitsConfig');
    return true;
  }

  const oldTraitsConfig = oldConfig.traitsConfig as TraitsConfig;
  const newTraitsConfig = newConfig.traitsConfig as TraitsConfig;

  try {
    // Convert both to strings for deep comparison
    // Sort keys to ensure consistent ordering
    const oldConfigStr = JSON.stringify(oldTraitsConfig, Object.keys(oldTraitsConfig).sort());
    const newConfigStr = JSON.stringify(newTraitsConfig, Object.keys(newTraitsConfig).sort());

    const hasChanged = oldConfigStr !== newConfigStr;

    if (hasChanged) {
      console.log('[hasTraitsConfigChanged]: Traits configuration has changed');
    }

    return hasChanged;
  } catch (error) {
    // If comparison fails for any reason, consider it a change to be safe
    console.error('[hasTraitsConfigChanged]: Error comparing traits configs:', error);
    return true;
  }
};

/**
 * Generate a persona name and description using OpenAI based on traits
 * @param traits - The persona traits
 * @param constraints - Any constraints from the persona config
 * @returns Promise with name and description
 */
async function generatePersonaNameAndDescription(
  traits: Traits,
  constraints: string
): Promise<{ name: string; description: string }> {
  try {
    // Only include essential traits to reduce token size and improve speed
    const essentialTraits = {
      demographics: traits.demographics,
      psychographics: traits.psychographics,
      behavior: traits.behavior,
      // Exclude the full personalityFrameworks object to reduce token count
      // Include only key personality aspects for persona generation
      personalityType: {
        openness: traits.personalityFrameworks.bigFive.openness,
        extraversion: traits.personalityFrameworks.bigFive.extraversion,
        emotionalStyle: traits.personalityFrameworks.consumerDecisionMaking.emotional,
      },
    };

    // Use a retry mechanism for API call resilience
    let attempt = 0;
    const maxAttempts = 3;
    let result = null;

    while (attempt < maxAttempts && !result) {
      try {
        attempt++;

        if (attempt > 1) {
          // Add a short delay between retries
          await delay(500 * attempt); // Exponential backoff
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Use GPT-4o mini, OpenAI's fastest model
          messages: [
            {
              role: 'system',
              content:
                'You are an expert persona creator. Generate a realistic name and personality description based on the provided traits. Be concise and efficient.',
            },
            {
              role: 'user',
              content: `Create a persona name and description based on these traits: ${JSON.stringify(essentialTraits)}
                ${constraints ? `\nConstraints: ${constraints}` : ''}
                
                The description should expand on the traits to create a realistic personality in under 400 characters.`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'generate_persona_details',
                parameters: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'A realistic full name for the persona',
                    },
                    description: {
                      type: 'string',
                      description:
                        "A rich description of the persona's personality based on the traits (under 400 characters)",
                      maxLength: 400,
                    },
                  },
                  required: ['name', 'description'],
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'generate_persona_details' } },
          max_tokens: 500, // Limit token usage for faster response
          temperature: 0.7, // Slightly lower temperature for faster and more consistent results
        });

        // Get the first tool call from the response
        const toolCall = completion.choices[0].message.tool_calls?.[0];
        if (!toolCall) {
          continue; // Try again if no tool call
        }

        // Parse the arguments and validate
        try {
          const parsedResult = JSON.parse(toolCall.function.arguments);

          // Validate the expected structure
          if (!parsedResult.name || !parsedResult.description) {
            continue; // Try again if missing required fields
          }

          result = parsedResult;
        } catch {
          continue; // Try again if parsing fails
        }
      } catch (apiError) {
        // Only throw if this was the last attempt
        if (attempt >= maxAttempts) {
          throw apiError;
        }
      }
    }

    // If we didn't get a valid result after all attempts, throw an error
    if (!result) {
      throw new Error('Failed to generate persona details after maximum retry attempts');
    }

    return result as { name: string; description: string };
  } catch (error) {
    console.error('[generatePersonaNameAndDescription]: ERROR in OpenAI call:', error);
    throw new Error('Failed to generate persona name and description');
  }
}

// Utility function to delay execution for a specified time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate personas for a persona configuration
 * @param input - Object containing the persona config ID
 * @returns The updated persona configuration with personas
 */
export const generatePersonas = createAction({
  name: 'generatePersonas',
  validator: z.object({
    personaConfigId: z.string().min(1, 'Persona config ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Get the persona config
      const configResult = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.id, input.personaConfigId))
        .limit(1);

      if (configResult.length === 0) {
        return fail({ message: 'Persona configuration not found', status: 404 });
      }

      const config = configResult[0];
      const traitsConfig = config.traitsConfig as TraitsConfig;

      // Use a transaction to ensure atomicity
      return await db.transaction(async (tx) => {
        // Delete existing personas for this config
        await tx.delete(personas).where(eq(personas.personaConfigId, input.personaConfigId));

        // Generate new personas
        const newPersonas = [];
        const targetCount = config.size;

        // Calculate batch sizes - process in batches for better performance
        // Use smaller batch size to avoid overwhelming the API
        const batchSize = 3;
        const batches = Math.ceil(targetCount / batchSize);

        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
          const batchStart = batchIndex * batchSize;
          const currentBatchSize = Math.min(batchSize, targetCount - batchStart);

          // Create an array of generation promises
          const batchPromises = Array.from({ length: currentBatchSize }).map(async (_, index) => {
            const personaIndex = batchStart + index;

            try {
              // 1. Generate traits
              const traits = generatePersonaTraitsFromConfig(traitsConfig);

              // Add a small delay (200ms) between each OpenAI API call to avoid rate limiting
              if (index > 0) {
                await delay(200);
              }

              // 2. Generate name and description using OpenAI
              const { name, description } = await generatePersonaNameAndDescription(
                traits,
                config.constraints
              );

              return {
                personaConfigId: input.personaConfigId,
                name,
                description,
                traits,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            } catch (error) {
              console.error(
                `[generatePersonas]: Error generating persona ${personaIndex + 1}/${targetCount}:`,
                error
              );
              return null; // Return null for failed generations
            }
          });

          // Wait for all personas in this batch to be generated
          const batchResults = await Promise.all(batchPromises);
          // Filter out null values and ensure proper typing for database insertion
          const validResults = batchResults.filter(
            (
              result
            ): result is {
              personaConfigId: string;
              name: string;
              description: string;
              traits: Traits;
              createdAt: Date;
              updatedAt: Date;
            } => result !== null
          );

          // Insert the batch into the database if we have valid results
          if (validResults.length > 0) {
            const insertedPersonas = await tx.insert(personas).values(validResults).returning();

            newPersonas.push(...insertedPersonas);
          }

          // Add a pause between batches to avoid overwhelming the API (1 second)
          if (batchIndex < batches - 1) {
            await delay(1000);
          }
        }

        return {
          ...config,
          personas: newPersonas,
        };
      });
    } catch (error) {
      console.error('[generatePersonas]: Critical error:', error);
      return fail({
        message: 'Failed to generate personas',
        status: 500,
      });
    }
  },
});

/**
 * Check if personas need to be regenerated after a persona config update
 * @param input - Object containing the old and new persona config
 * @returns True if personas should be regenerated
 */
export const shouldRegeneratePersonas = createAction({
  name: 'shouldRegeneratePersonas',
  validator: z.object({
    oldConfigId: z.string().min(1, 'Old config ID is required'),
    newConfig: z.object({
      id: z.string().min(1),
      size: z.number(),
      constraints: z.string(),
      traitsConfig: z.any(),
    }),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Get the old persona config
      const oldConfigResult = await db
        .select()
        .from(personaConfigs)
        .where(eq(personaConfigs.id, input.oldConfigId))
        .limit(1);

      if (oldConfigResult.length === 0) {
        return fail({ message: 'Old persona configuration not found', status: 404 });
      }

      const oldConfig = oldConfigResult[0];

      // Check if traits configuration has changed
      const needsRegeneration = hasTraitsConfigChanged(oldConfig, input.newConfig as PersonaConfig);

      return needsRegeneration;
    } catch (error) {
      console.error('[shouldRegeneratePersonas]: Error:', error);
      return fail({
        message: 'Failed to check if personas should be regenerated',
        status: 500,
      });
    }
  },
});

/**
 * Update a persona's name and description
 * @param input - Object containing the persona ID and updated fields
 * @returns The updated persona
 */
export const updatePersona = createAction({
  name: 'updatePersona',
  validator: z.object({
    id: z.string().min(1, 'Persona ID is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    try {
      // Check if the persona exists
      const existingPersona = await db
        .select()
        .from(personas)
        .where(eq(personas.id, input.id))
        .limit(1);

      if (existingPersona.length === 0) {
        return fail({ message: 'Persona not found', status: 404 });
      }

      // Update the persona
      const [updatedPersona] = await db
        .update(personas)
        .set({
          name: input.name,
          description: input.description,
          updatedAt: new Date(),
        })
        .where(eq(personas.id, input.id))
        .returning();

      if (!updatedPersona) {
        console.error(`[updatePersona]: Failed to update persona ${input.id}`);
        return fail({ message: 'Failed to update persona', status: 500 });
      }

      return updatedPersona;
    } catch (error) {
      console.error('[updatePersona]: Error:', error);
      return fail({
        message: 'Failed to update persona',
        status: 500,
      });
    }
  },
});
