import { getFunnelWithFullData } from '@/server/funnel';
import type { Edge, Node } from '@xyflow/react';
import { nanoid } from 'nanoid';

export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  sidebar: {
    active: 'node-properties' | 'available-nodes' | 'none';
    panels: {
      nodeProperties: {
        selectedNode: { id: string; type: string } | null;
      };
    };
  };
}

/**
 * @description Retrieves the workflow data for a funnel
 * @param {string} funnelId - The ID of the funnel to retrieve workflow data for
 * @returns {Promise<Workflow>} The workflow data or a default workflow if errors occur
 */
export const getWorkflow = async (funnelId: string): Promise<Workflow> => {
  try {
    if (!funnelId) {
      throw new Error('Funnel ID is required');
    }

    // Get the funnel data from the database
    const funnelResult = await getFunnelWithFullData({ funnelId });

    if (funnelResult.error) {
      console.error('Error fetching funnel:', funnelResult.error);
      throw new Error(funnelResult.error.message);
    }

    const funnel = funnelResult.data;

    if (!funnel) {
      throw new Error('Funnel not found');
    }

    // Create the base nodes (start and end)
    const startNode: Node = {
      id: 'start-node',
      type: 'start',
      position: { x: 0, y: 267 },
      deletable: false,
      data: { label: 'Start', deletable: false },
      measured: { width: 96, height: 42 },
    };

    const endNode: Node = {
      id: 'end-node',
      type: 'end',
      position: { x: 1440, y: 272 },
      deletable: false,
      data: { label: 'End', deletable: true },
      measured: { width: 90, height: 42 },
    };

    const nodes: Node[] = [startNode, endNode];
    const edges: Edge[] = [];

    // Convert stages to nodes
    const stageNodes = funnel.stages.map((stage, index) => {
      // Position the stage node between start and end
      const xPosition = 400 + index * 300;

      // Create a node for each stage
      const stageNode: Node = {
        id: stage.id,
        type: 'tags',
        position: { x: xPosition, y: 267 },
        data: {
          description: stage.description || '',
          name: stage.name || '', // Add the stage name from the database
          tags: [],
          options: stage.items.map((item, itemIndex) => ({
            id: nanoid(),
            originalId: item.id,
            option: {
              id: itemIndex, // Use the index as a fallback for display order
              name: item.name,
              description: item.description || '', // Add the description from the database
              type: item.type,
              content: item.content,
            },
          })),
        },
      };

      return stageNode;
    });

    // Add stage nodes to the nodes array
    nodes.push(...stageNodes);

    // Create edges based on stage links
    if (stageNodes.length > 0) {
      // Connect start to first stage
      edges.push({
        id: nanoid(),
        source: startNode.id,
        target: stageNodes[0].id,
        type: 'deletable',
      });

      // Connect last stage to end
      edges.push({
        id: nanoid(),
        source: stageNodes[stageNodes.length - 1].id,
        target: endNode.id,
        type: 'deletable',
      });

      // Connect stages based on stage links
      funnel.stageLinks.forEach((link) => {
        const sourceNode = stageNodes.find((node) => node.id === link.fromStageId);
        const targetNode = stageNodes.find((node) => node.id === link.toStageId);

        if (sourceNode && targetNode) {
          edges.push({
            id: nanoid(),
            source: sourceNode.id,
            target: targetNode.id,
            type: 'deletable',
          });
        }
      });
    }

    return {
      id: funnel.id,
      name: funnel.name,
      nodes,
      edges,
      sidebar: {
        active: 'available-nodes',
        panels: {
          nodeProperties: {
            selectedNode: null,
          },
        },
      },
    };
  } catch (error) {
    console.error('Error in getWorkflow:', error);

    // Return a default workflow if there's an error
    return {
      id: funnelId || nanoid(),
      name: 'New Workflow',
      edges: [],
      nodes: [
        {
          id: 'start-node',
          type: 'start',
          position: { x: 0, y: 267 },
          deletable: false,
          data: { label: 'Start', deletable: false },
          measured: { width: 96, height: 42 },
        },
        {
          id: 'end-node',
          type: 'end',
          position: { x: 1440, y: 272 },
          deletable: false,
          data: { label: 'End', deletable: true },
          measured: { width: 90, height: 42 },
        },
      ],
      sidebar: {
        active: 'available-nodes',
        panels: {
          nodeProperties: {
            selectedNode: null,
          },
        },
      },
    };
  }
};
