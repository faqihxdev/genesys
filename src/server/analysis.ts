'use server';

import { FunnelAnalysis, StageAnalysis } from '@/app/(core)/project/[id]/analysis/types';
import { db } from '@/db';
import {
  funnels,
  projects,
  simulationStages,
  simulations,
  stageItems,
  stageLinks,
  stages,
  summary,
  summaryStageItems,
  summaryStages,
} from '@/db/schema';
import { personas } from '@/db/schema/persona';
import { ResponseWithDetails, responses } from '@/db/schema/response';
import env from '@/env';
import { desc, eq, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * @description Generate a summary using OpenAI based on the provided data and scope
 * @param data - The data to summarize
 * @param scope - The scope of the summary (simulation, stage, or item)
 * @returns Promise with summary and recommendation
 */
async function generateOpenAISummary(data: {
  responses: ResponseWithDetails[];
  conversionRate?: number;
  sentiment: number;
  scope: 'simulation' | 'stage' | 'stageItem';
  name?: string;
  content?: string;
  childSummaries?: Array<{
    name: string;
    summary: string;
    recommendation: string;
    sentiment: number;
    conversionRate?: number;
  }>;
}): Promise<{ summary: string; recommendation: string }> {
  const { responses, conversionRate, sentiment, scope, name, content, childSummaries } = data;

  // Create a prompt based on the scope
  let prompt = '';
  switch (scope) {
    case 'simulation':
      prompt = `Analyze this marketing funnel simulation by reviewing the summaries of all its stages:
      
      Overall Metrics:
      - Total Responses: ${responses.length}
      - Conversion Rate: ${(conversionRate! * 100).toFixed(1)}%
      - Average Sentiment: ${sentiment.toFixed(2)}
      
      Stage Summaries:
      ${childSummaries!
        .map(
          (s) => `
      Stage: ${s.name}
      - Conversion Rate: ${(s.conversionRate! * 100).toFixed(1)}%
      - Sentiment: ${s.sentiment.toFixed(2)}
      - Summary: ${s.summary}
      - Recommendations: ${s.recommendation}
      `
        )
        .join('\n')}
      
      Based on these stage-level insights, provide:
      1. A comprehensive summary of the entire funnel's performance (max 300 characters)
      2. Strategic recommendations for improving the overall funnel effectiveness (max 300 characters)`;
      break;

    case 'stage':
      prompt = `Analyze this funnel stage "${name}" by reviewing the summaries of all its content items:
      
      Stage Metrics:
      - Total Interactions: ${responses.length}
      - Average Sentiment: ${sentiment.toFixed(2)}
      
      Content Item Summaries:
      ${childSummaries!
        .map(
          (s) => `
      Item: ${s.name}
      - Sentiment: ${s.sentiment.toFixed(2)}
      - Summary: ${s.summary}
      - Recommendations: ${s.recommendation}
      `
        )
        .join('\n')}
      
      Based on these content-level insights, provide:
      1. A comprehensive summary of the stage's performance (max 300 characters)
      2. Strategic recommendations for improving the stage effectiveness (max 300 characters)`;
      break;

    case 'stageItem':
      prompt = `Analyze this content item "${name}":
      Content: ${content}
      
      Metrics:
      - Total Interactions: ${responses.length}
      - Average Sentiment: ${sentiment.toFixed(2)}
      
      User Responses:
      ${responses
        .slice(0, 5)
        .map((r) => `- ${r.response} (Sentiment: ${Number(r.sentiment).toFixed(2)})`)
        .join('\n')}
      
      Provide:
      1. A detailed analysis of how users responded to this specific content (max 300 characters)
      2. Concrete recommendations for improving this content's effectiveness (max 300 characters)`;
      break;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'o3-mini-2025-01-31',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert marketing funnel analyst. Provide concise, actionable insights. Keep summary and recommendation under 300 characters each.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'provide_analysis',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'A concise summary of the analysis (max 300 characters)',
                  maxLength: 300,
                },
                recommendation: {
                  type: 'string',
                  description:
                    'Specific, actionable recommendations for improvement (max 300 characters)',
                  maxLength: 300,
                },
              },
              required: ['summary', 'recommendation'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'provide_analysis' } },
    });

    // Get the first tool call from the response
    const toolCall = completion.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call found in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    return result as { summary: string; recommendation: string };
  } catch (error) {
    console.error('[generateOpenAISummary]:', error);
    throw new Error('Failed to generate summary using OpenAI');
  }
}

/**
 * @description Generate comprehensive summaries for a simulation, including stage and item level analysis
 * @param simulationId - The ID of the simulation to analyze
 * @returns Promise with the generated summaries
 */
export const generateSimulationSummary = createAction({
  name: 'generateSimulationSummary',
  validator: z.object({
    simulationId: z.string().min(1, 'Simulation ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const startTime = performance.now();
    console.log(
      '[generateSimulationSummary]: Starting analysis for simulation',
      input.simulationId
    );

    // Start a transaction for atomic operations
    return await db.transaction(async (tx) => {
      console.log('[generateSimulationSummary]: Checking for existing summaries');

      // Check if summaries already exist
      const existingSummary = await tx
        .select()
        .from(summary)
        .where(eq(summary.simulationId, input.simulationId))
        .limit(1);

      if (existingSummary.length > 0) {
        console.log('[generateSimulationSummary]: Summary already exists');
        return fail({
          message: 'Summary already exists for this simulation',
          status: 409,
        });
      }

      console.log('[generateSimulationSummary]: Fetching simulation responses');

      // Get all responses for the simulation with their related data
      const simulationResponses = (await tx
        .select({
          id: responses.id,
          simulationId: responses.simulationId,
          personaId: responses.personaId,
          stageId: responses.stageId,
          stageItemId: responses.stageItemId,
          response: responses.response,
          sentiment: responses.sentiment,
          proceed: responses.proceed,
          proceedReason: responses.proceedReason,
          createdAt: responses.createdAt,
          updatedAt: responses.updatedAt,
          deletedAt: responses.deletedAt,
          stage: {
            id: stages.id,
            name: stages.name,
            description: stages.description,
          },
          stageItem: {
            id: stageItems.id,
            name: stageItems.name,
            content: stageItems.content,
          },
          persona: {
            id: personas.id,
            name: personas.name,
          },
          simulation: {
            id: simulations.id,
            status: simulations.status,
          },
        })
        .from(responses)
        .innerJoin(stages, eq(responses.stageId, stages.id))
        .innerJoin(stageItems, eq(responses.stageItemId, stageItems.id))
        .innerJoin(personas, eq(responses.personaId, personas.id))
        .innerJoin(simulations, eq(responses.simulationId, simulations.id))
        .where(eq(responses.simulationId, input.simulationId))) as unknown as ResponseWithDetails[];

      if (simulationResponses.length === 0) {
        console.log('[generateSimulationSummary]: No responses found');
        return fail({
          message: 'No responses found for this simulation',
          status: 404,
        });
      }

      console.log('[generateSimulationSummary]: Fetching simulation details');

      // Get simulation details
      const [simulation] = await tx
        .select({
          id: simulations.id,
          funnelId: simulations.funnelId,
          personaConfigId: simulations.personaConfigId,
          status: simulations.status,
          completeCount: simulations.completeCount,
          funnel: {
            id: funnels.id,
            name: funnels.name,
            description: funnels.description,
          },
        })
        .from(simulations)
        .innerJoin(funnels, eq(simulations.funnelId, funnels.id))
        .where(eq(simulations.id, input.simulationId))
        .limit(1);

      if (!simulation) {
        console.log('[generateSimulationSummary]: Simulation not found');
        return fail({
          message: 'Simulation not found',
          status: 404,
        });
      }

      console.log('[generateSimulationSummary]: Generating stage item summaries');

      // First, generate summaries for all stage items
      const itemResponses = simulationResponses.reduce(
        (acc, response) => {
          const itemId = response.stageItemId;
          if (!acc[itemId]) acc[itemId] = [];
          acc[itemId].push(response);
          return acc;
        },
        {} as Record<string, ResponseWithDetails[]>
      );

      const itemSummaryPromises = Object.entries(itemResponses).map(async ([itemId, responses]) => {
        console.log('[generateSimulationSummary]: Analyzing stage item', itemId);

        const itemSentiment =
          responses.reduce((acc, r) => acc + Number(r.sentiment), 0) / responses.length;

        const itemAnalysis = await generateOpenAISummary({
          responses,
          sentiment: itemSentiment,
          scope: 'stageItem',
          name: responses[0].stageItem.name,
          content: responses[0].stageItem.content,
        });

        return {
          id: itemId,
          name: responses[0].stageItem.name,
          stageId: responses[0].stageId,
          sentiment: itemSentiment,
          summary: itemAnalysis.summary,
          recommendation: itemAnalysis.recommendation,
          dbRecord: {
            simulationId: input.simulationId,
            stageItemId: itemId,
            sentiment: itemSentiment.toString(),
            summary: itemAnalysis.summary,
            recommendation: itemAnalysis.recommendation,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        };
      });

      const itemSummaries = await Promise.all(itemSummaryPromises);
      console.log('[generateSimulationSummary]: Saving stage item summaries');
      await tx.insert(summaryStageItems).values(itemSummaries.map((s) => s.dbRecord));

      console.log('[generateSimulationSummary]: Generating stage summaries');

      // Then, generate summaries for all stages using item summaries
      const stageResponses = simulationResponses.reduce(
        (acc, response) => {
          const stageId = response.stageId;
          if (!acc[stageId]) acc[stageId] = [];
          acc[stageId].push(response);
          return acc;
        },
        {} as Record<string, ResponseWithDetails[]>
      );

      const stageSummaryPromises = Object.entries(stageResponses).map(
        async ([stageId, responses]) => {
          console.log('[generateSimulationSummary]: Analyzing stage', stageId);

          const stageSentiment =
            responses.reduce((acc, r) => acc + Number(r.sentiment), 0) / responses.length;
          const stageConversionRate = responses.filter((r) => r.proceed).length / responses.length;

          // Get all item summaries for this stage
          const stageItemSummaries = itemSummaries
            .filter((item) => item.stageId === stageId)
            .map((item) => ({
              name: item.name,
              sentiment: item.sentiment,
              summary: item.summary,
              recommendation: item.recommendation,
            }));

          const stageAnalysis = await generateOpenAISummary({
            responses,
            sentiment: stageSentiment,
            scope: 'stage',
            name: responses[0].stage.name,
            childSummaries: stageItemSummaries,
          });

          return {
            id: stageId,
            name: responses[0].stage.name,
            sentiment: stageSentiment,
            conversionRate: stageConversionRate.toString(),
            summary: stageAnalysis.summary,
            recommendation: stageAnalysis.recommendation,
            dbRecord: {
              simulationId: input.simulationId,
              stageId,
              conversionRate: stageConversionRate.toString(),
              sentiment: stageSentiment.toString(),
              summary: stageAnalysis.summary,
              recommendation: stageAnalysis.recommendation,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
            },
          };
        }
      );

      const stageSummaries = await Promise.all(stageSummaryPromises);
      console.log('[generateSimulationSummary]: Saving stage summaries');
      await tx.insert(summaryStages).values(stageSummaries.map((s) => s.dbRecord));

      console.log('[generateSimulationSummary]: Generating overall simulation summary');

      // Finally, generate overall simulation summary using stage summaries
      const overallSentiment =
        simulationResponses.reduce((acc, r) => acc + Number(r.sentiment), 0) /
        simulationResponses.length;
      const conversionRate = simulation.completeCount / simulationResponses.length;

      const overallAnalysis = await generateOpenAISummary({
        responses: simulationResponses,
        conversionRate,
        sentiment: overallSentiment,
        scope: 'simulation',
        childSummaries: stageSummaries.map((stage) => ({
          name: stage.name,
          sentiment: stage.sentiment,
          conversionRate: Number(stage.conversionRate),
          summary: stage.summary,
          recommendation: stage.recommendation,
        })),
      });

      console.log('[generateSimulationSummary]: Saving overall summary');

      // Create overall summary
      const [createdSummary] = await tx
        .insert(summary)
        .values({
          simulationId: input.simulationId,
          conversionRate: conversionRate.toString(),
          sentiment: overallSentiment.toString(),
          summary: overallAnalysis.summary,
          recommendation: overallAnalysis.recommendation,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })
        .returning();

      console.log('[generateSimulationSummary]: Analysis completed successfully');
      const endTime = performance.now();
      console.log(`[generateSimulationSummary]: Time taken: ${endTime - startTime} milliseconds`);
      return createdSummary;
    });
  },
});

interface SimulationQueryResult {
  id: string;
  funnelId: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  completeCount: number;
  createdAt: Date;
  funnel: {
    id: string;
    name: string;
    stages: Array<{
      id: string;
      name: string;
      items: Array<{
        id: string;
        name: string;
      }>;
    }>;
  };
}

interface StageAnalysisWithMetrics {
  id: string;
  stage: {
    id: string;
    name: string;
    items: Array<{ id: string; name: string }>;
  };
  items: Array<{
    item: { id: string; name: string };
    simulationId: string;
    stageItemId: string;
    sentiment: string;
    summary: string;
    recommendation: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }>;
  simulationId: string;
  stageId: string;
  conversionRate: string;
  sentiment: string;
  summary: string;
  recommendation: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  metrics: Array<{
    label: string;
    value: string | number;
    description: string;
  }>;
}

/**
 * @description Get comprehensive analysis data for a simulation
 * @param simulationId - The ID of the simulation to analyze
 * @returns Promise with the complete funnel analysis data
 */
export const getSimulationAnalysis = createAction({
  name: 'getSimulationAnalysis',
  validator: z.object({
    simulationId: z.string().min(1, 'Simulation ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    console.log('[getSimulationAnalysis]: Fetching analysis for simulation', input.simulationId);

    // Get simulation with funnel details
    const simulationResult = await db
      .select({
        id: simulations.id,
        funnelId: simulations.funnelId,
        status: simulations.status,
        completeCount: simulations.completeCount,
        createdAt: simulations.createdAt,
        funnel: {
          id: funnels.id,
          name: funnels.name,
        },
      })
      .from(simulations)
      .innerJoin(funnels, eq(simulations.funnelId, funnels.id))
      .where(eq(simulations.id, input.simulationId))
      .limit(1);

    // If no simulation is found, return an error
    if (!simulationResult.length) {
      return fail({
        message: 'Simulation not found',
        status: 404,
      });
    }

    // Get the simulation
    const [simulation] = simulationResult;

    // Get simulation stages data for completion counts
    const simulationStagesData = await db
      .select({
        stageId: simulationStages.stageId,
        completeCount: simulationStages.completeCount,
        status: simulationStages.status,
      })
      .from(simulationStages)
      .where(eq(simulationStages.simulationId, input.simulationId));

    // Create a map of stage completion counts
    const stageCompletionMap = simulationStagesData.reduce(
      (acc, curr) => {
        acc[curr.stageId] = curr.completeCount;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get funnel stages and their links
    const stagesResult = await db
      .select({
        id: stages.id,
        name: stages.name,
        items: {
          id: stageItems.id,
          name: stageItems.name,
        },
      })
      .from(stages)
      .innerJoin(stageItems, eq(stageItems.stageId, stages.id))
      .where(eq(stages.funnelId, simulation.funnelId));

    // Get stage links
    const stageLinksResult = await db
      .select()
      .from(stageLinks)
      .where(eq(stageLinks.funnelId, simulation.funnelId));

    // Group items by stage
    const stageMap = stagesResult.reduce(
      (acc, curr) => {
        if (!acc[curr.id]) {
          acc[curr.id] = {
            id: curr.id,
            name: curr.name,
            items: [],
          };
        }
        acc[curr.id].items.push(curr.items);
        return acc;
      },
      {} as Record<
        string,
        {
          id: string;
          name: string;
          items: Array<{ id: string; name: string }>;
        }
      >
    );

    const simulationWithStages: SimulationQueryResult = {
      ...simulation,
      funnel: {
        ...simulation.funnel,
        stages: Object.values(stageMap),
      },
    };

    // Get summary data
    const [simulationSummary] = await db
      .select()
      .from(summary)
      .where(eq(summary.simulationId, input.simulationId));

    if (!simulationSummary) {
      return fail({
        message:
          'No analysis summary exists for this simulation. Please generate one first or contact support if the issue persists.',
        status: 404,
      });
    }

    // Get stage summaries
    const stageSummaries = await db
      .select()
      .from(summaryStages)
      .where(eq(summaryStages.simulationId, input.simulationId));

    // Get stage item summaries
    const stageItemSummaries = await db
      .select()
      .from(summaryStageItems)
      .where(eq(summaryStageItems.simulationId, input.simulationId));

    // Transform data into StageAnalysis array
    const analysisStages: StageAnalysisWithMetrics[] = simulationWithStages.funnel.stages.map(
      (stage) => {
        const stageSummary = stageSummaries.find((s) => s.stageId === stage.id);
        if (!stageSummary) throw new Error(`Stage summary not found for stage ${stage.id}`);

        const stageItems = stage.items.map((item) => {
          const itemSummary = stageItemSummaries.find((s) => s.stageItemId === item.id);
          if (!itemSummary) throw new Error(`Item summary not found for item ${item.id}`);

          return {
            ...itemSummary,
            item,
          };
        });

        // Calculate stage metrics
        const metrics = [
          {
            label: 'Conversion Rate',
            value: `${(Number(stageSummary.conversionRate) * 100).toFixed(1)}%`,
            description: 'Percentage of personas that proceeded from this stage',
          },
          {
            label: 'Sentiment Score',
            value: Number(stageSummary.sentiment).toFixed(2),
            description: 'Average sentiment score for this stage',
          },
        ];

        return {
          ...stageSummary,
          stage,
          items: stageItems,
          metrics,
        };
      }
    );

    // Calculate overall metrics
    const metrics = [
      {
        label: 'Overall Conversion',
        value: `${(Number(simulationSummary.conversionRate) * 100).toFixed(1)}%`,
        description: 'End-to-end funnel conversion rate',
      },
      {
        label: 'Average Sentiment',
        value: Number(simulationSummary.sentiment).toFixed(2),
        description: 'Overall sentiment score across all stages',
      },
    ];

    // Generate Sankey nodes: use simulation_stages.completedCount as incoming value for each stage
    const nodes = analysisStages.map((stage) => ({
      id: stage.stage.id,
      name: stage.stage.name,
      type: 'stage' as const,
      value: stageCompletionMap[stage.stage.id] || 0,
    }));

    // Helper function to get child stages of a given stage
    const getChildStages = (stageId: string): StageAnalysisWithMetrics[] => {
      const childStageIds = stageLinksResult
        .filter((link) => link.fromStageId === stageId)
        .map((link) => link.toStageId);
      return analysisStages.filter((stage) => childStageIds.includes(stage.stage.id));
    };

    // Helper function to check if a stage is an end stage (no outgoing links)
    const isEndStage = (stageId: string): boolean => {
      return !stageLinksResult.some((link) => link.fromStageId === stageId);
    };

    // Build links for the Sankey diagram
    const links = analysisStages.flatMap((stage) => {
      const stageId = stage.stage.id;
      const stageCompletionCount = stageCompletionMap[stageId] || 0;
      const conversionRate = Number(stage.conversionRate);
      const childStages = getChildStages(stageId);

      const stageLinks = [];

      if (childStages.length > 0) {
        // For stages with children, use the stage's completion count * conversion rate
        const proceedingValue = stageCompletionCount * conversionRate;

        // Distribute the proceeding value among child stages proportionally
        const totalChildCompletions = childStages.reduce(
          (sum, child) => sum + (stageCompletionMap[child.stage.id] || 0),
          0
        );

        childStages.forEach((child) => {
          const childCompletionCount = stageCompletionMap[child.stage.id] || 0;
          const proportion =
            totalChildCompletions > 0
              ? childCompletionCount / totalChildCompletions
              : 1 / childStages.length;

          stageLinks.push({
            source: stageId,
            target: child.stage.id,
            value: proceedingValue * proportion,
          });
        });
      } else {
        // For end stages, use the conversion rate to determine completed count
        const completedCount = stageCompletionCount * conversionRate;
        stageLinks.push({
          source: stageId,
          target: 'completed',
          value: completedCount,
        });
      }

      // Add drop-off link using conversion rate
      const dropOffCount = stageCompletionCount * (1 - conversionRate);
      if (dropOffCount > 0) {
        stageLinks.push({
          source: stageId,
          target: `${stageId}-drop`,
          value: dropOffCount,
        });
      }

      return stageLinks;
    });

    // Calculate the completed node value by summing the completed counts of end stages
    const completedNode = {
      id: 'completed',
      name: 'Completed',
      type: 'path' as const,
      value: analysisStages
        .filter((stage) => isEndStage(stage.stage.id))
        .reduce((sum, stage) => {
          const stageCompletionCount = stageCompletionMap[stage.stage.id] || 0;
          const conversionRate = Number(stage.conversionRate);
          return sum + stageCompletionCount * conversionRate;
        }, 0),
    };

    // Create drop-off nodes using conversion rates
    const dropOffNodes = analysisStages.map((stage) => {
      const stageCompletionCount = stageCompletionMap[stage.stage.id] || 0;
      const conversionRate = Number(stage.conversionRate);
      return {
        id: `${stage.stage.id}-drop`,
        name: 'Drop Off',
        type: 'path' as const,
        value: stageCompletionCount * (1 - conversionRate),
      };
    });

    const sankey = {
      nodes: [...nodes, completedNode, ...dropOffNodes],
      links,
    };

    // Create the complete simulation object with all required properties
    const completeSimulation = {
      id: simulationWithStages.id,
      funnelId: simulationWithStages.funnelId,
      status: simulationWithStages.status,
      completeCount: simulationWithStages.completeCount,
      createdAt: simulationWithStages.createdAt,
      updatedAt: new Date(), // Set to current date as it's not in the query
      deletedAt: null, // Set to null as it's not in the query
      personaConfigId: 'default', // Set to default as it's not in the query
    };

    // Create the complete funnel object with all required properties
    const completeFunnel = {
      id: simulationWithStages.funnel.id,
      name: simulationWithStages.funnel.name,
      description: null,
      projectId: 'default', // Set to default as it's not in the query
      createdAt: new Date(), // Set to current date as it's not in the query
      updatedAt: new Date(), // Set to current date as it's not in the query
      deletedAt: null, // Set to null as it's not in the query
    };

    const analysis: FunnelAnalysis = {
      funnel: completeFunnel,
      simulation: completeSimulation,
      summary: simulationSummary,
      stages: analysisStages as unknown as StageAnalysis[],
      metrics,
      sankey,
      stageLinks: stageLinksResult,
    };

    return analysis;
  },
});

/**
 * @description Get all funnels with simulations for a project
 * @param projectId - The ID of the project
 * @returns Promise with the list of funnels that have simulations
 */
export const getProjectFunnelsWithSimulations = createAction({
  name: 'getProjectFunnelsWithSimulations',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    // Single optimized query combining project check and funnel data
    const funnelsWithSimulations = await db
      .select({
        id: funnels.id,
        name: funnels.name,
        description: funnels.description,
        simulationCount: sql<number>`count(DISTINCT ${simulations.id})`,
        lastSimulated: sql<Date>`max(${simulations.createdAt})`,
      })
      .from(funnels)
      .innerJoin(projects, eq(projects.id, funnels.projectId))
      .innerJoin(simulations, eq(funnels.id, simulations.funnelId))
      .where(eq(funnels.projectId, input.projectId))
      .groupBy(funnels.id, funnels.name, funnels.description)
      .having(sql`count(DISTINCT ${simulations.id}) > 0`);

    if (!funnelsWithSimulations.length) {
      return fail({
        message: 'No funnels with simulations found for this project',
        status: 404,
      });
    }

    return funnelsWithSimulations;
  },
});

/**
 * @description Get all simulations for a funnel
 * @param funnelId - The ID of the funnel
 * @returns Promise with the list of simulations
 */
export const getFunnelSimulations = createAction({
  name: 'getFunnelSimulations',
  validator: z.object({
    funnelId: z.string().min(1, 'Funnel ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    // First check if funnel exists
    const funnel = await db.select().from(funnels).where(eq(funnels.id, input.funnelId)).limit(1);

    if (!funnel.length) {
      return fail({
        message: 'Funnel not found',
        status: 404,
      });
    }

    // Get simulations with summary check
    const funnelSimulations = await db
      .select({
        id: simulations.id,
        status: simulations.status,
        completeCount: simulations.completeCount,
        createdAt: simulations.createdAt,
      })
      .from(simulations)
      .where(eq(simulations.funnelId, input.funnelId))
      .orderBy(desc(simulations.createdAt));

    if (!funnelSimulations.length) {
      return fail({
        message: 'No simulations found for this funnel',
        status: 404,
      });
    }

    // Get all summaries for these simulations
    const summaries = await db
      .select({
        simulationId: summary.simulationId,
      })
      .from(summary)
      .where(
        sql`${summary.simulationId} IN (${funnelSimulations
          .map((s) => s.id)
          .join(',')}) AND ${summary.deletedAt} IS NULL`
      );

    // Create a Set of simulation IDs that have summaries for O(1) lookup
    const simulationsWithSummaries = new Set(summaries.map((s) => s.simulationId));

    // Map the results to include hasSummary flag
    const results = funnelSimulations.map((simulation) => ({
      ...simulation,
      hasSummary: simulationsWithSummaries.has(simulation.id),
    }));

    return results;
  },
});
