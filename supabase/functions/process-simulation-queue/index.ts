/**
 * Supabase Edge Function for processing simulation queue
 * This function will be deployed to Supabase Edge Functions and triggered by a cron job
 */

// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'; // @ts-ignore
import OpenAI from 'https://esm.sh/openai@4.17.0';

// Environment variables will be injected by Supabase
// @ts-ignore
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''; // @ts-ignore
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; // @ts-ignore
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

// Create Supabase client with default schema
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Define interfaces for our data structures
interface SimulationChunkMessage {
  simulationId: string;
  personaId: string;
  stageId: string;
  chunkId: string;
  retry?: number;
}

interface SimulationErrorDetails {
  message: string;
  stack?: string;
  time: string;
}

// Interface for persona's response to a funnel item
interface ItemResponse {
  itemId: string;
  response: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Interface for the proceed decision for a stage
interface ProceedDecision {
  proceed: boolean;
  reason: string;
}

// Interface for the complete simulation response
interface SimulationResponse {
  itemResponses: ItemResponse[];
  proceedDecision: ProceedDecision;
}

// Track OpenAI API call count
let openaiCallCount = 0;
// @ts-ignore
// Main Deno serve function to handle HTTP requests
Deno.serve(async (req) => {
  // Record start time for overall processing
  const processingStartTime = Date.now();
  console.log('Processing simulation queue...');

  // Start processing in the background, but don't await it
  const processingPromise = (async () => {
    // Define taskId at a higher scope so it's available in catch block
    let taskId: string | undefined;

    try {
      // Get a pending task from our custom queue
      // Find a task that is in pending status
      const { data: tasks, error: queryError } = await supabase
        .from('queue_tasks')
        .select('*')
        .eq('queue_name', 'simulation_tasks')
        .eq('status', 'pending')
        .lt('visible_after', new Date().toISOString())
        .limit(1);

      if (queryError) {
        throw new Error(`Failed to query pending tasks: ${queryError.message}`);
      }

      // If no messages in queue, return early
      if (!tasks || tasks.length === 0) {
        console.log('No tasks in queue to process');
        return;
      }

      const task = tasks[0];
      taskId = task.id; // Assign to the variable in the outer scope

      // Parse the payload - it's stored as a JSON string in the database
      let message: SimulationChunkMessage;
      try {
        // If the payload is already a string, parse it
        if (typeof task.payload === 'string') {
          message = JSON.parse(task.payload);
          console.log(`Parsed string payload for task ${taskId}`);
        }
        // If the payload is already an object (due to automatic parsing)
        else {
          message = task.payload as SimulationChunkMessage;
          console.log(`Using object payload for task ${taskId}`);
        }

        // Validate the message has required fields
        if (!message.simulationId || !message.personaId || !message.stageId) {
          console.error(`Invalid payload structure for task ${taskId}:`, message);
          throw new Error(`Invalid payload structure: missing required fields`);
        }
      } catch (parseError) {
        console.error(`Failed to parse payload for task ${taskId}:`, task.payload);
        throw new Error(
          `Failed to parse task payload: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        );
      }

      // Mark task as processing to prevent other workers from picking it up
      // Set visibility timeout to 5 minutes
      const visibleAfter = new Date();
      visibleAfter.setMinutes(visibleAfter.getMinutes() + 5);

      const { error: updateError } = await supabase
        .from('queue_tasks')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
          visible_after: visibleAfter.toISOString(),
        })
        .eq('id', taskId);

      if (updateError) {
        throw new Error(`Failed to mark task as processing: ${updateError.message}`);
      }

      // Process the task
      await processSimulationChunk(message);

      // Mark task as completed
      const { error: completeError } = await supabase
        .from('queue_tasks')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (completeError) {
        throw new Error(`Failed to mark task as completed: ${completeError.message}`);
      }

      // Reset counter for next run
      openaiCallCount = 0;
    } catch (error) {
      console.error('Error processing simulation queue:', error);

      // Log the error processing time
      const totalProcessingTime = Date.now() - processingStartTime;
      console.error(
        `Processing failed after ${totalProcessingTime}ms with ${openaiCallCount} OpenAI API calls`
      );

      // Reset counter for next run
      openaiCallCount = 0;

      // We can only mark the task as failed if we have a task ID
      try {
        // Only proceed if taskId is defined (we've actually retrieved a task)
        if (taskId) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;

          // Mark task as failed and store error details
          const { error: failError } = await supabase
            .from('queue_tasks')
            .update({
              status: 'failed',
              error_message: errorMessage,
              error_details: {
                message: errorMessage,
                stack: errorStack,
                time: new Date().toISOString(),
              },
              processing_completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

          if (failError) {
            console.error(`Failed to mark task as failed: ${failError.message}`);
          }
        }
      } catch (failHandlingError) {
        console.error('Error while handling failure:', failHandlingError);
      }
    }
  })();

  // Return an immediate response (within the 5000ms timeout limit)
  return new Response(
    JSON.stringify({
      status: 'accepted',
      message: 'Processing started in background',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 202, // 202 Accepted status code indicates the request has been accepted for processing
    }
  );
});

/**
 * Process a simulation chunk
 * Implements the OpenAI integration for simulating persona responses to funnel stages
 * @param chunk - The simulation chunk message
 */
async function processSimulationChunk(chunk: SimulationChunkMessage): Promise<void> {
  console.log(
    `Processing chunk ${chunk.chunkId} for simulation ${chunk.simulationId}, persona ${chunk.personaId}, stage ${chunk.stageId}`
  );

  try {
    // Update the simulation status to indicate progress
    const { error: updateError } = await supabase
      .from('simulations')
      .update({ status: 'processing' })
      .eq('id', chunk.simulationId);

    if (updateError) {
      throw new Error(`Failed to update simulation status: ${updateError.message}`);
    }

    // Step 1: Get the simulation data and parameters
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('*, funnel:funnelId(*), personaConfig:personaConfigId(*)')
      .eq('id', chunk.simulationId)
      .single();

    if (simulationError || !simulationData) {
      throw new Error(
        `Failed to get simulation: ${simulationError?.message || 'No data returned'}`
      );
    }

    // Parse simulation parameters if they exist
    const parameters = simulationData.parametersJson
      ? JSON.parse(simulationData.parametersJson)
      : undefined;

    // Step 2: Get the persona data
    const { data: personaData, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', chunk.personaId)
      .single();

    if (personaError || !personaData) {
      throw new Error(`Failed to get persona: ${personaError?.message || 'No data returned'}`);
    }

    // Step 3: Get the stage and simulation stage data
    const { data: stageData, error: stageError } = await supabase
      .from('stages')
      .select('*')
      .eq('id', chunk.stageId)
      .single();

    if (stageError || !stageData) {
      throw new Error(`Failed to get stage: ${stageError?.message || 'No data returned'}`);
    }

    const { data: simulationStageData, error: simulationStageError } = await supabase
      .from('simulation_stages')
      .select('*')
      .eq('simulationId', chunk.simulationId)
      .eq('stageId', chunk.stageId)
      .single();

    if (simulationStageError || !simulationStageData) {
      throw new Error(
        `Failed to get simulation stage: ${simulationStageError?.message || 'No data returned'}`
      );
    }

    // Update the stage status to processing
    const { error: updateStageError } = await supabase
      .from('simulation_stages')
      .update({ status: 'processing' })
      .eq('simulationId', chunk.simulationId)
      .eq('stageId', chunk.stageId);

    if (updateStageError) {
      throw new Error(`Failed to update stage status: ${updateStageError.message}`);
    }

    // Step 4: Get the items for this stage
    const { data: stageItems, error: stageItemsError } = await supabase
      .from('stage_items')
      .select('*')
      .eq('stageId', chunk.stageId)
      .order('createdAt', { ascending: true });

    if (stageItemsError || !stageItems || stageItems.length === 0) {
      throw new Error(
        `Failed to get stage items: ${stageItemsError?.message || 'No items found for stage'}`
      );
    }

    // Step 5: Generate persona responses using OpenAI
    const simulationResponse = await generatePersonaResponse(
      personaData,
      stageData,
      stageItems,
      parameters
    );

    // Step 6: Save the responses to the database
    // First, store the stage-level response (proceed decision)
    const { error: responseStageError } = await supabase.from('response_stages').insert({
      id: generateId({ length: 13, prefix: 'rst-' }), // Use generateId with length 13 and 'rst-' prefix
      simulationId: chunk.simulationId,
      personaId: chunk.personaId,
      stageId: chunk.stageId,
      proceed: simulationResponse.proceedDecision.proceed,
      proceedReason: simulationResponse.proceedDecision.reason,
      // If proceed is true, find the next stage ID from stage links
      // If proceed is false, leave nextStageId as null
      nextStageId: simulationResponse.proceedDecision.proceed
        ? await findNextStageId(chunk.simulationId, chunk.stageId)
        : null,
    });

    if (responseStageError) {
      throw new Error(`Failed to save stage response: ${responseStageError.message}`);
    }

    // Then, store each item-level response
    for (const itemResponse of simulationResponse.itemResponses) {
      // Convert sentiment string to decimal value
      const sentimentValue = convertSentimentToDecimal(itemResponse.sentiment);

      const { error: responseError } = await supabase.from('responses').insert({
        id: generateId({ length: 13, prefix: 'res-' }), // Use generateId with length 13 and 'res-' prefix
        simulationId: chunk.simulationId,
        personaId: chunk.personaId,
        stageId: chunk.stageId,
        stageItemId: itemResponse.itemId, // Note: the column is called stageItemId in the schema
        response: itemResponse.response,
        sentiment: sentimentValue,
      });

      if (responseError) {
        throw new Error(`Failed to save item response: ${responseError.message}`);
      }
    }

    // Step 7: Update simulation stage status to complete
    const { error: completeStageError } = await supabase
      .from('simulation_stages')
      .update({ status: 'complete' })
      .eq('simulationId', chunk.simulationId)
      .eq('stageId', chunk.stageId);

    if (completeStageError) {
      throw new Error(`Failed to update stage status to complete: ${completeStageError.message}`);
    }

    // Step 8: If persona proceeds, queue the next stage
    if (simulationResponse.proceedDecision.proceed) {
      const nextStageId = await findNextStageId(chunk.simulationId, chunk.stageId);

      if (nextStageId) {
        // Queue the next stage for processing
        const { error: queueError } = await supabase.from('queue_tasks').insert({
          id: generateId({ length: 13, prefix: 'task-' }), // Add ID field with task- prefix
          queue_name: 'simulation_tasks',
          payload: JSON.stringify({
            simulationId: chunk.simulationId,
            personaId: chunk.personaId,
            stageId: nextStageId,
            chunkId: `${chunk.simulationId}-${chunk.personaId}-${nextStageId}`,
          }),
          status: 'pending',
          visible_after: new Date().toISOString(),
        });

        if (queueError) {
          throw new Error(`Failed to queue next stage: ${queueError.message}`);
        }

        console.log(
          `Queued next stage ${nextStageId} for simulation ${chunk.simulationId}, persona ${chunk.personaId}`
        );
      }
    }

    // Step 9: Update simulation counts and check if simulation is complete
    await updateSimulationProgress(chunk.simulationId);

    // Keep the success log
    console.log(
      `Successfully processed chunk ${chunk.chunkId} for simulation ${chunk.simulationId}`
    );
  } catch (error) {
    // Handle errors
    console.error(`Error processing chunk ${chunk.chunkId}:`, error);

    // Update the stage status to error
    await supabase
      .from('simulation_stages')
      .update({ status: 'error' })
      .eq('simulationId', chunk.simulationId)
      .eq('stageId', chunk.stageId);

    // Save error details to dead letter queue
    await supabase.from('queue_tasks').insert({
      id: generateId({ length: 13, prefix: 'task-' }), // Add ID field with task- prefix
      queue_name: 'simulation_failed_tasks',
      payload: JSON.stringify({
        chunk,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          time: new Date().toISOString(),
        },
      }),
      status: 'pending',
      visible_after: new Date().toISOString(),
    });

    // Re-throw the error for the outer handler
    throw error;
  }
}

/**
 * Generate a persona's response to a funnel stage
 * @param persona - The persona data
 * @param stage - The funnel stage
 * @param items - The items in the stage
 * @param parameters - Optional simulation parameters
 * @returns - The simulation response
 */
async function generatePersonaResponse(
  persona: any,
  stage: any,
  items: any[],
  parameters?: any
): Promise<SimulationResponse> {
  try {
    // Format the persona for prompt
    const personaPrompt = formatPersonaForPrompt(persona);

    // Format the stage and items for prompt
    const stagePrompt = formatStageForPrompt(stage, items);

    // Create system instructions based on parameters
    const systemInstructions = getSystemInstructions(parameters);

    // Create the user prompt but don't log it
    const userPrompt = `Please simulate how this persona would interact with the following marketing funnel stage:
    
    ${personaPrompt}
    
    ${stagePrompt}
    
    Respond with detailed item responses and a proceed decision.`;

    // Setup retries for reliability
    let attempt = 0;
    const maxAttempts = 3;
    let result: SimulationResponse | null = null;

    // Use the passed temperature or default
    const temperature = parameters?.temperatureOverride ?? 0.7;

    while (attempt < maxAttempts && !result) {
      try {
        attempt++;

        if (attempt > 1) {
          // Add exponential backoff for retries
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          console.log(`Retry attempt ${attempt} for persona ${persona.id}, stage ${stage.id}`);
        }

        // Call OpenAI API with tool calls for structured output
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Using GPT-4o for optimal performance
          messages: [
            {
              role: 'system',
              content: systemInstructions,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'provide_simulation_results',
                description:
                  'Submit the results of the persona simulation with item responses and proceed decision',
                parameters: {
                  type: 'object',
                  properties: {
                    itemResponses: {
                      type: 'array',
                      description: 'Responses to each item in the stage',
                      items: {
                        type: 'object',
                        properties: {
                          itemId: {
                            type: 'string',
                            description: 'ID of the funnel item',
                          },
                          response: {
                            type: 'string',
                            description: "The persona's response to this item",
                          },
                          sentiment: {
                            type: 'string',
                            enum: ['positive', 'neutral', 'negative'],
                            description: 'The sentiment of the response',
                          },
                        },
                        required: ['itemId', 'response', 'sentiment'],
                      },
                    },
                    proceedDecision: {
                      type: 'object',
                      description: 'Decision about whether to proceed to the next stage',
                      properties: {
                        proceed: {
                          type: 'boolean',
                          description: 'Whether the persona would proceed to the next stage',
                        },
                        reason: {
                          type: 'string',
                          description: 'The reason for the proceed decision',
                        },
                      },
                      required: ['proceed', 'reason'],
                    },
                  },
                  required: ['itemResponses', 'proceedDecision'],
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'provide_simulation_results' } },
          temperature,
          max_tokens: 2048,
        });

        // Increment OpenAI call count
        openaiCallCount++;

        // Extract the tool call from the response
        const toolCall = completion.choices[0].message.tool_calls?.[0];

        if (!toolCall) {
          throw new Error('No tool call in response');
        }

        // Parse the tool call arguments
        const args = JSON.parse(toolCall.function.arguments);

        // Validate that all items have responses
        const responseItemIds = args.itemResponses.map((r: any) => r.itemId);
        const stageItemIds = items.map((item) => item.id);

        // Check if the response item IDs match the expected format
        const formatMismatch = responseItemIds.some((responseId: string) => {
          // Check if the response ID is a substring or has extra characters
          return (
            !stageItemIds.includes(responseId) &&
            stageItemIds.some(
              (stageId) => responseId.includes(stageId) || stageId.includes(responseId)
            )
          );
        });

        if (formatMismatch) {
          console.warn(
            'Possible item ID format mismatch detected. The response IDs may not exactly match the expected format.'
          );

          // Try to fix the item IDs by matching them to the closest stage item ID
          args.itemResponses.forEach((response: any) => {
            if (!stageItemIds.includes(response.itemId)) {
              // Find the closest matching stage item ID
              const closestMatch = stageItemIds.find(
                (stageId) => response.itemId.includes(stageId) || stageId.includes(response.itemId)
              );

              if (closestMatch) {
                response.itemId = closestMatch;
              }
            }
          });
        }

        // Re-check for missing items after potential fixes
        const updatedResponseItemIds = args.itemResponses.map((r: any) => r.itemId);
        const missingItemIds = stageItemIds.filter((id) => !updatedResponseItemIds.includes(id));

        if (missingItemIds.length > 0) {
          console.error('Missing responses for items:', missingItemIds);
          console.error('Expected items:', stageItemIds);
          console.error('Received responses for:', updatedResponseItemIds);
          throw new Error('Not all items have responses');
        }

        // Check for extra items that weren't in the original list
        const extraItemIds = updatedResponseItemIds.filter(
          (id: string) => !stageItemIds.includes(id)
        );
        if (extraItemIds.length > 0) {
          console.warn('Received responses for items not in the stage:', extraItemIds);
        }

        // Construct the result
        result = {
          itemResponses: args.itemResponses,
          proceedDecision: args.proceedDecision,
        };
      } catch (apiError) {
        console.error('API Error:', apiError);

        // Only throw if this was the last attempt
        if (attempt >= maxAttempts) {
          throw apiError;
        }
      }
    }

    if (!result) {
      throw new Error(`Failed to generate simulation response after ${maxAttempts} attempts`);
    }

    return result;
  } catch (error) {
    console.error('Error generating persona response:', error);
    throw error;
  }
}

/**
 * Format a persona for prompt
 */
function formatPersonaForPrompt(persona: any): string {
  const traits = persona.traits || {};

  return `
PERSONA PROFILE:
Name: ${persona.name}
Description: ${persona.description || 'No description provided'}

Demographics: 
${Object.entries(traits.demographics || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

Psychographics:
${Object.entries(traits.psychographics || {})
  .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
  .join('\n')}

Behavior:
${Object.entries(traits.behavior || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

Personality:
- Openness: ${traits.personalityFrameworks?.bigFive?.openness || 'Average'}
- Conscientiousness: ${traits.personalityFrameworks?.bigFive?.conscientiousness || 'Average'}
- Extraversion: ${traits.personalityFrameworks?.bigFive?.extraversion || 'Average'}
- Agreeableness: ${traits.personalityFrameworks?.bigFive?.agreeableness || 'Average'}
- Neuroticism: ${traits.personalityFrameworks?.bigFive?.neuroticism || 'Average'}
- Decision Making: ${traits.personalityFrameworks?.consumerDecisionMaking?.emotional || 'Balanced'} 
  `;
}

/**
 * Format a stage for prompt
 */
function formatStageForPrompt(stage: any, items: any[]): string {
  const formattedItems = items
    .map(
      (item) => `Item ID: ${item.id}
Title: ${item.title}
Content: ${item.content || 'N/A'}
${item.imageUrl ? `Image: ${item.imageUrl}` : ''}
${item.callToAction ? `Call to Action: ${item.callToAction}` : ''}`
    )
    .join('\n\n');

  return `FUNNEL STAGE:
Name: ${stage.name}
Description: ${stage.description || 'N/A'}

STAGE ITEMS:
${formattedItems}`;
}

/**
 * Generate system instructions based on parameters
 */
function getSystemInstructions(parameters?: any): string {
  return `You are a sophisticated AI simulating how a specific persona interacts with marketing content. 
Your task is to realistically model how the given persona would respond to each item in a marketing funnel stage.
${
  parameters?.detailedResponses
    ? "Provide detailed, nuanced responses explaining the persona's thoughts, feelings, and reactions."
    : 'Keep responses concise but authentic to the persona.'
}
${
  parameters?.includeReasons
    ? 'Include clear reasoning behind each reaction and decision.'
    : 'Focus on the outcomes rather than detailed reasoning.'
}
${parameters?.customPromptAdditions || ''}

For each item, determine:
1. How the persona would react
2. Their sentiment (positive, neutral, negative)

Finally, decide if the persona would proceed to the next stage or drop off, with clear reasoning.

You must respond using the tools provided, with no additional commentary.`;
}

/**
 * Find the next stage ID based on stage links
 */
async function findNextStageId(
  simulationId: string,
  currentStageId: string
): Promise<string | null> {
  try {
    // Get the funnel ID first to scope our search
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('funnelId')
      .eq('id', simulationId)
      .single();

    if (simulationError || !simulationData) {
      console.error('Error getting funnel ID:', simulationError);
      return null;
    }

    // Get stage links for this funnel with the current stage as the source
    const { data: stageLinks, error: stageLinksError } = await supabase
      .from('stage_links')
      .select('toStageId')
      .eq('funnelId', simulationData.funnelId)
      .eq('fromStageId', currentStageId);

    if (stageLinksError || !stageLinks || stageLinks.length === 0) {
      return null;
    }

    // If there are multiple possible next stages, choose one
    // In a more advanced implementation, we could use OpenAI to decide which path to take
    // For now, just take the first one
    return stageLinks[0].toStageId;
  } catch (error) {
    console.error('Error finding next stage:', error);
    return null;
  }
}

/**
 * Update the simulation progress based on completed responses
 * @param simulationId - The ID of the simulation to update
 */
async function updateSimulationProgress(simulationId: string): Promise<void> {
  try {
    // Count total completed responses
    const { count: completeCount, error: countError } = await supabase
      .from('response_stages')
      .select('*', { count: 'exact', head: true })
      .eq('simulationId', simulationId);

    if (countError) {
      throw new Error(`Failed to count completed responses: ${countError.message}`);
    }

    // Get the simulation data with the correct fields
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('totalCount, status')
      .eq('id', simulationId)
      .single();

    if (simulationError || !simulationData) {
      throw new Error(`Failed to get simulation data: ${simulationError?.message || 'No data'}`);
    }

    // Update the completeCount field
    await supabase
      .from('simulations')
      .update({ completeCount: completeCount || 0 })
      .eq('id', simulationId);

    // Check if simulation is complete
    if (
      completeCount === simulationData.totalCount &&
      simulationData.status !== 'complete' &&
      simulationData.status !== 'error'
    ) {
      // All responses are done, mark simulation as complete
      await supabase.from('simulations').update({ status: 'complete' }).eq('id', simulationId);

      console.log(`Simulation ${simulationId} completed successfully!`);
    }
  } catch (error) {
    console.error('Error updating simulation progress:', error);
    throw error;
  }
}

/**
 * Generates a unique ID with configurable total length (including prefix)
 * @param options Configuration options for ID generation
 * @returns A string in the format '[prefix]xxxx-xxxx' with total specified length
 * @example
 * generateId({ length: 12, prefix: 'prj-' }) // => 'prj-kjd3-ce7'
 * generateId({ length: 8 }) // => 'k3m5-n2p'
 */
function generateId({ length = 10, prefix = '' }) {
  if (prefix && (length < prefix.length || !/^[a-z0-9_-]+$/.test(prefix))) throw Error('invalid');
  const c = 'abcdefghijkmnopqrstuvwxyz23456789',
    g = 4,
    p = prefix ? prefix.length : 0,
    R = length - p;
  let u = 0;
  const a = [];
  while (u < R) {
    const L = u + g >= R ? R - u : g;
    let s = '';
    for (let i = 0; i < L; i++) s += c[(Math.random() * c.length) | 0];
    a.push(s);
    u += L + (u + g >= R ? 0 : 1);
  }
  return (prefix || '') + a.join('-');
}

// Helper function to convert sentiment string to decimal value
function convertSentimentToDecimal(sentiment: string): number {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 1.0;
    case 'neutral':
      return 0.0;
    case 'negative':
      return -1.0;
    default:
      console.warn(`Unknown sentiment value: ${sentiment}, defaulting to neutral (0.0)`);
      return 0.0;
  }
}
