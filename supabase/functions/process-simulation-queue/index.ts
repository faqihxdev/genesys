/**
 * Supabase Edge Function for processing simulation queue
 * This function will be deployed to Supabase Edge Functions and triggered by a cron job
 */

// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
// @ts-ignore
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

// Track OpenAI API call count (shared globally across tasks)
let openaiCallCount = 0;

/**
 * Process an individual task from the queue.
 * This function replicates the original background processing code but is now per-task.
 */
async function processTask(task: any): Promise<void> {
  let taskId: string | undefined;
  try {
    taskId = task.id;
    // Parse the payload – stored as JSON string or an object.
    let message: SimulationChunkMessage;
    try {
      if (typeof task.payload === 'string') {
        message = JSON.parse(task.payload);
      } else {
        message = task.payload as SimulationChunkMessage;
      }
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

    // Mark task as processing to prevent other workers from picking it up (1 minute visibility timeout)
    const visibleAfter = new Date();
    visibleAfter.setMinutes(visibleAfter.getMinutes() + 1);
    const { error: updateError } = await supabase
      .from('queue_tasks')
      .update({
        queue_task_status: 'processing',
        processing_started_at: new Date().toISOString(),
        visible_after: visibleAfter.toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      throw new Error(`Failed to mark task as processing: ${updateError.message}`);
    }

    // Reset OpenAI call counter for this task
    openaiCallCount = 0;

    // Process the simulation chunk
    await processSimulationChunk(message);

    // Mark task as completed
    const { error: completeError } = await supabase
      .from('queue_tasks')
      .update({
        queue_task_status: 'completed',
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (completeError) {
      throw new Error(`Failed to mark task as completed: ${completeError.message}`);
    }

    // Reset counter for next run
    openaiCallCount = 0;
  } catch (error) {
    console.error('Error processing simulation queue task:', error);
    console.error(`Processing failed for task ${taskId} with ${openaiCallCount} OpenAI API calls`);
    openaiCallCount = 0;
    // Mark task as failed if a taskId is present
    if (taskId) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const { error: failError } = await supabase
        .from('queue_tasks')
        .update({
          queue_task_status: 'failed',
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
  }
}

// @ts-ignore
// Main Deno serve function to handle HTTP requests
Deno.serve(async (req) => {
  // IMPORTANT! DANGER: This will call openai in parallel for each persona
  // Process up to 20 tasks concurrently in the background.
  (async () => {
    const startTime = performance.now();

    // First, always check for and cleanup stale tasks (including resetting stuck processing tasks)
    const cleanupResult = await cleanupStaleTasks();
    if (cleanupResult.cleanedUp) {
      console.log(`✅ Cleanup completed | ${cleanupResult.count} tasks processed during cleanup`);
    }

    // Then, query for pending tasks to process
    const { data: tasks, error: queryError } = await supabase
      .from('queue_tasks')
      .select('*')
      .eq('queue_name', 'simulation_tasks')
      .eq('queue_task_status', 'pending')
      .lt('visible_after', new Date().toISOString())
      .limit(20);

    if (queryError) {
      throw new Error(`Failed to query pending tasks: ${queryError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks in queue to process');
      return;
    }

    console.log('Processing simulation queue...');

    // Process all tasks concurrently.
    await Promise.allSettled(tasks.map((task: any) => processTask(task)));
    const endTime = performance.now();
    console.log(
      `✅ Batch processing completed in ${((endTime - startTime) / 1000).toFixed(2)}s | Processed ${tasks.length} tasks`
    );
  })();

  // Return an immediate response (processing runs in the background).
  return new Response(
    JSON.stringify({
      status: 'accepted',
      message: 'Processing started in background',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 202,
    }
  );
});

/**
 * Clean up stale tasks that have been stuck in processing state
 * @returns Object with cleanup results
 */
async function cleanupStaleTasks(): Promise<{ cleanedUp: boolean; count: number }> {
  try {
    // Calculate the date threshold for old tasks (1 day ago)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Calculate threshold for stale processing tasks (1 minute ago)
    // This is shorter than the 5-minute visibility timeout but gives some buffer for normal task completion
    const staleProcessingThreshold = new Date();
    staleProcessingThreshold.setMinutes(staleProcessingThreshold.getMinutes() - 1);

    // 1. Reset stale processing tasks to pending
    const { error: staleError, data: updatedTasks } = await supabase
      .from('queue_tasks')
      .update({
        queue_task_status: 'pending',
        visible_after: new Date().toISOString(), // Make immediately visible
        processing_started_at: null, // Clear the processing timestamp
      })
      .eq('queue_name', 'simulation_tasks')
      .eq('queue_task_status', 'processing')
      .lt('processing_started_at', staleProcessingThreshold.toISOString())
      .select();

    const staleCount = updatedTasks?.length || 0;

    if (staleError) {
      console.error('[cleanupStaleTasks] Error resetting stale processing tasks:', staleError);
    } else if (staleCount > 0) {
      console.log(`Reset ${staleCount} stale processing tasks to pending`);
    }

    // 2. Delete completed or cancelled tasks
    const { error: completedError, count: completedCount } = await supabase
      .from('queue_tasks')
      .delete({ count: 'exact' })
      .in('queue_task_status', ['completed', 'cancelled']);

    if (completedError) {
      console.error(
        '[cleanupStaleTasks] Error deleting completed/cancelled tasks:',
        completedError
      );
    }

    // 3. Delete any tasks older than 1 day regardless of status
    const { error: oldTasksError, count: oldTasksCount } = await supabase
      .from('queue_tasks')
      .delete({ count: 'exact' })
      .lt('created_at', oneDayAgo.toISOString());

    if (oldTasksError) {
      console.error('[cleanupStaleTasks] Error deleting old tasks:', oldTasksError);
    }

    // Calculate total count of affected tasks
    const totalProcessed = staleCount + (completedCount || 0) + (oldTasksCount || 0);

    return {
      cleanedUp: totalProcessed > 0,
      count: totalProcessed,
    };
  } catch (error) {
    console.error('Error cleaning up tasks:', error);
    return { cleanedUp: false, count: 0 };
  }
}

/**
 * Process a simulation chunk.
 * Implements the OpenAI integration for simulating persona responses to funnel stages.
 */
async function processSimulationChunk(chunk: SimulationChunkMessage): Promise<void> {
  console.log(
    `Processing | chunk: ${chunk.chunkId} | simulation: ${chunk.simulationId} | persona: ${chunk.personaId} | stage: ${chunk.stageId}`
  );
  try {
    // Update simulation status to indicate progress.
    const { error: updateError } = await supabase
      .from('simulations')
      .update({ simulation_status: 'processing' })
      .eq('id', chunk.simulationId);
    if (updateError) {
      throw new Error(`Failed to update simulation status: ${updateError.message}`);
    }

    // Step 1: Get simulation data and parameters.
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('*, funnel:funnel_id(*), personaConfig:persona_config_id(*)')
      .eq('id', chunk.simulationId)
      .single();
    if (simulationError || !simulationData) {
      throw new Error(
        `Failed to get simulation: ${simulationError?.message || 'No data returned'}`
      );
    }

    // Step 2: Get persona data.
    const { data: personaData, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', chunk.personaId)
      .single();
    if (personaError || !personaData) {
      throw new Error(`Failed to get persona: ${personaError?.message || 'No data returned'}`);
    }

    // Step 3: Get stage and simulation stage data.
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
      .select('*, complete_count')
      .eq('simulation_id', chunk.simulationId)
      .eq('stage_id', chunk.stageId)
      .single();
    if (simulationStageError || !simulationStageData) {
      throw new Error(
        `Failed to get simulation stage: ${simulationStageError?.message || 'No data returned'}`
      );
    }

    // Update stage status to processing.
    const { error: updateStageError } = await supabase
      .from('simulation_stages')
      .update({ simulation_stage_status: 'processing' })
      .eq('simulation_id', chunk.simulationId)
      .eq('stage_id', chunk.stageId);
    if (updateStageError) {
      throw new Error(`Failed to update stage status: ${updateStageError.message}`);
    }

    // Step 4: Get items for this stage.
    const { data: stageItems, error: stageItemsError } = await supabase
      .from('stage_items')
      .select('*')
      .eq('stage_id', chunk.stageId)
      .order('created_at', { ascending: true });
    if (stageItemsError || !stageItems || stageItems.length === 0) {
      throw new Error(
        `Failed to get stage items: ${stageItemsError?.message || 'No items found for stage'}`
      );
    }

    // Step 5: Generate persona responses using OpenAI.
    const simulationResponse = await generatePersonaResponse(personaData, stageData, stageItems);

    // Step 6: Save the responses to the database.
    // Save stage-level response.
    const { error: responseStageError } = await supabase.from('response_stages').insert({
      id: generateId({ length: 13, prefix: 'rst-' }),
      simulation_id: chunk.simulationId,
      persona_id: chunk.personaId,
      stage_id: chunk.stageId,
      proceed: simulationResponse.proceedDecision.proceed,
      proceed_reason: simulationResponse.proceedDecision.reason,
      next_stage_id: simulationResponse.proceedDecision.proceed
        ? await findNextStageId(chunk.simulationId, chunk.stageId, chunk.personaId)
        : null,
    });
    if (responseStageError) {
      throw new Error(`Failed to save stage response: ${responseStageError.message}`);
    }

    // Save item-level responses concurrently.
    await Promise.all(
      simulationResponse.itemResponses.map(async (itemResponse) => {
        const sentimentValue = convertSentimentToDecimal(itemResponse.sentiment);
        const { error: responseError } = await supabase.from('responses').insert({
          id: generateId({ length: 13, prefix: 'res-' }),
          simulation_id: chunk.simulationId,
          persona_id: chunk.personaId,
          stage_id: chunk.stageId,
          stage_item_id: itemResponse.itemId,
          response: itemResponse.response,
          sentiment: sentimentValue,
        });
        if (responseError) {
          throw new Error(`Failed to save item response: ${responseError.message}`);
        }
      })
    );

    // Step 7: Update simulation stage status to complete.
    const { error: completeStageError } = await supabase
      .from('simulation_stages')
      .update({
        simulation_stage_status: 'complete',
        // complete_count: simulationStageData.complete_count + 1,
      })
      .eq('simulation_id', chunk.simulationId)
      .eq('stage_id', chunk.stageId);

    const { error: incError } = await supabase.rpc('increment_stage_complete_count', {
      p_simulation_id: chunk.simulationId,
      p_stage_id: chunk.stageId,
    });

    if (incError) {
      throw new Error(`Failed to increment stage complete count: ${incError.message}`);
    }

    if (completeStageError) {
      throw new Error(`Failed to update stage status to complete: ${completeStageError.message}`);
    }

    // Step 8: If persona proceeds, queue the next stage.
    if (simulationResponse.proceedDecision.proceed) {
      const nextStageId = await findNextStageId(chunk.simulationId, chunk.stageId, chunk.personaId);
      if (nextStageId) {
        const { error: queueError } = await supabase.from('queue_tasks').insert({
          id: generateId({ length: 13, prefix: 'task-' }),
          queue_name: 'simulation_tasks',
          payload: JSON.stringify({
            simulationId: chunk.simulationId,
            personaId: chunk.personaId,
            stageId: nextStageId,
            chunkId: `${chunk.simulationId}-${chunk.personaId}-${nextStageId}`,
          }),
          queue_task_status: 'pending',
          visible_after: new Date().toISOString(),
        });
        if (queueError) {
          throw new Error(`Failed to queue next stage: ${queueError.message}`);
        }
        console.log(
          `Queued next stage ${nextStageId} | simulation: ${chunk.simulationId} | persona: ${chunk.personaId}`
        );
      }
    }

    // Step 9: Update simulation progress and check if simulation is complete.
    await updateSimulationProgress(chunk.simulationId);
    console.log(
      `Successfully processed | chunk: ${chunk.chunkId} | simulation: ${chunk.simulationId}`
    );
  } catch (error) {
    console.error(
      `Error processing | chunk: ${chunk.chunkId} | simulation: ${chunk.simulationId}`,
      error
    );
    await supabase
      .from('simulation_stages')
      .update({ simulation_stage_status: 'error' })
      .eq('simulation_id', chunk.simulationId)
      .eq('stage_id', chunk.stageId);
    await supabase.from('queue_tasks').insert({
      id: generateId({ length: 13, prefix: 'task-' }),
      queue_name: 'simulation_failed_tasks',
      payload: JSON.stringify({
        chunk,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          time: new Date().toISOString(),
        },
      }),
      queue_task_status: 'pending',
      visible_after: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Generate a persona's response to a funnel stage.
 */
async function generatePersonaResponse(
  persona: any,
  stage: any,
  items: any[]
): Promise<SimulationResponse> {
  try {
    const personaPrompt = formatPersonaForPrompt(persona);
    const stagePrompt = formatStageForPrompt(stage, items);
    const systemInstructions = getSystemInstructions();
    const userPrompt = `Please simulate how this persona would interact with the following marketing funnel stage:
    
    ${personaPrompt}
    
    ${stagePrompt}
    
    Respond with detailed item responses and a proceed decision.`;

    let attempt = 0;
    const maxAttempts = 3;
    let result: SimulationResponse | null = null;
    const temperature = 0.7;

    while (attempt < maxAttempts && !result) {
      try {
        attempt++;
        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          console.log(`Retry attempt ${attempt} | persona: ${persona.id} | stage: ${stage.id}`);
        }

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstructions },
            { role: 'user', content: userPrompt },
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
                          itemId: { type: 'string', description: 'ID of the funnel item' },
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
                          description: 'Whether the persona would proceed',
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
        openaiCallCount++;
        const toolCall = completion.choices[0].message.tool_calls?.[0];
        if (!toolCall) {
          throw new Error('No tool call in response');
        }
        const args = JSON.parse(toolCall.function.arguments);
        const responseItemIds = args.itemResponses.map((r: any) => r.itemId);
        const stageItemIds = items.map((item) => item.id);
        const formatMismatch = responseItemIds.some((responseId: string) => {
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
          args.itemResponses.forEach((response: any) => {
            if (!stageItemIds.includes(response.itemId)) {
              const closestMatch = stageItemIds.find(
                (stageId) => response.itemId.includes(stageId) || stageId.includes(response.itemId)
              );
              if (closestMatch) {
                response.itemId = closestMatch;
              }
            }
          });
        }
        const updatedResponseItemIds = args.itemResponses.map((r: any) => r.itemId);
        const missingItemIds = stageItemIds.filter((id) => !updatedResponseItemIds.includes(id));
        if (missingItemIds.length > 0) {
          console.error('Missing responses for items:', missingItemIds);
          console.error('Expected items:', stageItemIds);
          console.error('Received responses for:', updatedResponseItemIds);
          throw new Error('Not all items have responses');
        }
        const extraItemIds = updatedResponseItemIds.filter(
          (id: string) => !stageItemIds.includes(id)
        );
        if (extraItemIds.length > 0) {
          console.warn('Received responses for items not in the stage:', extraItemIds);
        }
        result = {
          itemResponses: args.itemResponses,
          proceedDecision: args.proceedDecision,
        };
      } catch (apiError) {
        console.error('API Error:', apiError);
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
 * Format a persona for prompt.
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
 * Format a stage for prompt.
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
 * Generate system instructions based on custom prompt additions.
 */
function getSystemInstructions(): string {
  return `You are a sophisticated AI simulating how a specific persona interacts with marketing content. 
Your task is to realistically model how the given persona would respond to each item in a marketing funnel stage.
Provide detailed, nuanced responses explaining the persona's thoughts, feelings, and reactions.
Include clear reasoning behind each reaction and decision.

For each item, determine:
1. How the persona would react
2. Their sentiment (positive, neutral, negative)

Finally, decide if the persona would proceed to the next stage or drop off, with clear reasoning.

You must respond using the tools provided, with no additional commentary.`;
}

/**
 * Find the next stage ID based on stage links.
 */
async function findNextStageId(
  simulationId: string,
  currentStageId: string,
  personaId?: string
): Promise<string | null> {
  try {
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('funnel_id')
      .eq('id', simulationId)
      .single();
    if (simulationError || !simulationData) {
      console.error('Error getting funnel ID:', simulationError);
      return null;
    }
    const { data: stageLinks, error: stageLinksError } = await supabase
      .from('stage_links')
      .select('to_stage_id')
      .eq('funnel_id', simulationData.funnel_id)
      .eq('from_stage_id', currentStageId);
    if (stageLinksError || !stageLinks || stageLinks.length === 0) {
      return null;
    }
    if (stageLinks.length === 1) {
      return stageLinks[0].to_stage_id;
    }
    if (stageLinks.length > 1 && personaId) {
      return await askPersonaForNextStage(
        simulationId,
        personaId,
        currentStageId,
        stageLinks.map((link: { to_stage_id: string }) => link.to_stage_id)
      );
    }
    return stageLinks[0].to_stage_id;
  } catch (error) {
    console.error('Error finding next stage:', error);
    return null;
  }
}

/**
 * Ask the persona to choose which next stage they would prefer to proceed to.
 */
async function askPersonaForNextStage(
  simulationId: string,
  personaId: string,
  currentStageId: string,
  nextStageIds: string[]
): Promise<string | null> {
  try {
    console.log(
      `Asking | persona: ${personaId} | simulation: ${simulationId} | stage: ${currentStageId}`
    );
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();
    if (personaError || !persona) {
      console.error('Error getting persona:', personaError);
      return null;
    }
    const { data: currentStage, error: currentStageError } = await supabase
      .from('stages')
      .select('*')
      .eq('id', currentStageId)
      .single();
    if (currentStageError || !currentStage) {
      console.error('Error getting current stage:', currentStageError);
      return null;
    }
    const { data: nextStages, error: nextStagesError } = await supabase
      .from('stages')
      .select('*')
      .in('id', nextStageIds);
    if (nextStagesError || !nextStages || nextStages.length === 0) {
      console.error('Error getting next stages:', nextStagesError);
      return null;
    }
    const personaPrompt = formatPersonaForPrompt(persona);
    const nextStagesPrompt = nextStages
      .map(
        (stage: { id: string; name: string; description?: string }) =>
          `STAGE OPTION:
ID: ${stage.id}
Name: ${stage.name}
Description: ${stage.description || 'No description provided'}
`
      )
      .join('\n\n');
    const userPrompt = `Based on your characteristics and preferences, please choose which of the following stages you would prefer to proceed to next:
    
${personaPrompt}

You have just completed this stage:
Name: ${currentStage.name}
Description: ${currentStage.description || 'No description provided'}

Please choose from these options:
${nextStagesPrompt}

Select the stage that best matches your preferences and explain your choice.`;

    let attempt = 0;
    const maxAttempts = 3;
    let chosenStageId: string | null = null;
    while (attempt < maxAttempts && !chosenStageId) {
      try {
        attempt++;
        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          console.log(`Retry attempt ${attempt} for persona choice ${personaId}`);
        }
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are simulating the decision-making process of a specific persona navigating through a marketing funnel. Your task is to choose which next stage the persona would prefer to proceed to based on their characteristics and preferences.',
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
                name: 'choose_next_stage',
                description: 'Choose which stage the persona would prefer to proceed to next',
                parameters: {
                  type: 'object',
                  properties: {
                    chosenStageId: {
                      type: 'string',
                      description: 'ID of the chosen next stage',
                    },
                    reason: {
                      type: 'string',
                      description: 'The reason for choosing this stage',
                    },
                  },
                  required: ['chosenStageId', 'reason'],
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'choose_next_stage' } },
          temperature: 0.7,
          max_tokens: 1024,
        });
        openaiCallCount++;
        const toolCall = completion.choices[0].message.tool_calls?.[0];
        if (!toolCall) {
          throw new Error('No tool call in response');
        }
        const args = JSON.parse(toolCall.function.arguments);
        if (!nextStageIds.includes(args.chosenStageId)) {
          console.error('Chosen stage ID is not in the provided options', {
            chosenStageId: args.chosenStageId,
            options: nextStageIds,
          });
          const closestMatch = nextStageIds.find(
            (id) => args.chosenStageId.includes(id) || id.includes(args.chosenStageId)
          );
          if (closestMatch) {
            chosenStageId = closestMatch;
            console.log(`Fixed stage ID to closest match: ${closestMatch}`);
          } else {
            throw new Error('Invalid stage ID choice');
          }
        } else {
          chosenStageId = args.chosenStageId;
        }
        console.log(`Persona ${personaId} chose stage ${chosenStageId}: ${args.reason}`);
      } catch (apiError) {
        console.error('API Error:', apiError);
        if (attempt >= maxAttempts) {
          throw apiError;
        }
      }
    }
    return chosenStageId;
  } catch (error) {
    console.error('Error asking persona for next stage choice:', error);
    return null;
  }
}

/**
 * Update the simulation progress based on completed responses.
 */
async function updateSimulationProgress(simulationId: string): Promise<void> {
  try {
    const { count: completeCount, error: countError } = await supabase
      .from('response_stages')
      .select('*', { count: 'exact', head: true })
      .eq('simulation_id', simulationId)
      .is('next_stage_id', null);
    if (countError) {
      throw new Error(`Failed to count completed responses: ${countError.message}`);
    }
    const { data: simulationData, error: simulationError } = await supabase
      .from('simulations')
      .select('total_count, simulation_status')
      .eq('id', simulationId)
      .single();
    if (simulationError || !simulationData) {
      throw new Error(`Failed to get simulation data: ${simulationError?.message || 'No data'}`);
    }
    await supabase
      .from('simulations')
      .update({ complete_count: completeCount || 0 })
      .eq('id', simulationId);
    if (
      completeCount === simulationData.total_count &&
      simulationData.simulation_status !== 'complete' &&
      simulationData.simulation_status !== 'error'
    ) {
      await supabase
        .from('simulations')
        .update({ simulation_status: 'complete' })
        .eq('id', simulationId);
      console.log(`Simulation | id: ${simulationId} | completed successfully!`);
    }
  } catch (error) {
    console.error(`Error updating simulation progress | id: ${simulationId}:`, error);
    throw error;
  }
}

/**
 * Generates a unique ID with configurable total length (including prefix).
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

// Helper function to convert sentiment string to decimal value.
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
