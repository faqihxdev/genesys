import { type Node, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

const NODE_MARGIN = 64;
const NODE_PADDING = 16;

interface NodeCoordinates {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface OverlappingNode {
  directions: {
    direction: 'left' | 'right' | 'top' | 'bottom';
    distance: number;
  }[];
}

function doesNodeOverlap(a: NodeCoordinates, b: NodeCoordinates): OverlappingNode | false {
  const aAdj = {
    x: a.x - NODE_PADDING,
    y: a.y - NODE_PADDING,
    w: a.w + 2 * NODE_PADDING,
    h: a.h + 2 * NODE_PADDING,
  };
  const bAdj = {
    x: b.x - NODE_PADDING,
    y: b.y - NODE_PADDING,
    w: b.w + 2 * NODE_PADDING,
    h: b.h + 2 * NODE_PADDING,
  };

  const doesOverlap =
    aAdj.x < bAdj.x + bAdj.w &&
    aAdj.x + aAdj.w > bAdj.x &&
    aAdj.y < bAdj.y + bAdj.h &&
    aAdj.y + aAdj.h > bAdj.y;
  if (!doesOverlap) return false;

  const position: Record<OverlappingNode['directions'][number]['direction'], number> = {
    top: a.y - b.h - NODE_MARGIN,
    bottom: a.y + a.h + NODE_MARGIN,
    left: a.x - b.w - NODE_MARGIN,
    right: a.x + a.w + NODE_MARGIN,
  };

  const directions = [
    { direction: 'left', distance: Math.abs(b.x - position.left) },
    { direction: 'right', distance: Math.abs(b.x - position.right) },
    { direction: 'top', distance: Math.abs(b.y - position.top) },
    { direction: 'bottom', distance: Math.abs(b.y - position.bottom) },
  ];

  directions.sort((a, b) => a.distance - b.distance);

  return { directions } as OverlappingNode;
}

function getOverlappingNodes(node: NodeCoordinates, nodes: NodeCoordinates[]) {
  return nodes.reduce(
    (acc, n) => {
      const overlap = doesNodeOverlap(node, n);
      if (overlap) {
        acc.push({ ...n, overlap });
      }
      return acc;
    },
    [] as (NodeCoordinates & { overlap: OverlappingNode })[]
  );
}

function moveNode(
  node: NodeCoordinates,
  direction: OverlappingNode['directions'][number]['direction'],
  distance: number
): NodeCoordinates {
  const moveByDirection: Record<string, (pos: number) => number> = {
    left: (pos) => pos - distance,
    right: (pos) => pos + distance,
    top: (pos) => pos - distance,
    bottom: (pos) => pos + distance,
  };

  return {
    id: node.id,
    x: direction === 'left' || direction === 'right' ? moveByDirection[direction](node.x) : node.x,
    y: direction === 'top' || direction === 'bottom' ? moveByDirection[direction](node.y) : node.y,
    w: node.w,
    h: node.h,
  };
}

interface BestMove {
  direction: 'left' | 'right' | 'top' | 'bottom';
  distance: number;
  count: number;
}

function getBestMove(
  overlapNode: ReturnType<typeof getOverlappingNodes>[number],
  allNodes: NodeCoordinates[]
): OverlappingNode['directions'][number] & { count: number } {
  return overlapNode.overlap.directions.reduce<BestMove>(
    (best, direction) => {
      const simulatedNode = moveNode(overlapNode, direction.direction, direction.distance);
      const newOverlappingNodes = getOverlappingNodes(
        simulatedNode,
        allNodes.filter((n) => n.id !== simulatedNode.id)
      );
      const count = newOverlappingNodes.length;
      return count < best.count ? { ...direction, count } : best;
    },
    { direction: 'left', distance: 0, count: Infinity }
  );
}

function applyMove(
  overlapNode: ReturnType<typeof getOverlappingNodes>[number],
  bestMove: OverlappingNode['directions'][number],
  allNodes: NodeCoordinates[],
  movedNodes: Map<string, NodeCoordinates>
) {
  try {
    const movedNode = moveNode(overlapNode, bestMove.direction, bestMove.distance);

    // Update the array without mutating the original elements
    const nodeIndex = allNodes.findIndex((n) => n.id === overlapNode.id);
    if (nodeIndex !== -1) {
      // Replace the node at the index with the moved node
      allNodes[nodeIndex] = { ...movedNode };
    }

    // Store the moved node in the map
    movedNodes.set(overlapNode.id, { ...movedNode });
  } catch (error) {
    console.error('Error in applyMove:', error);
  }
}

function handleNodeOverlaps(
  node: NodeCoordinates,
  allNodes: NodeCoordinates[],
  movedNodes: Map<string, NodeCoordinates>
): boolean {
  const overlappingNodes = getOverlappingNodes(
    node,
    allNodes.filter((n) => n.id !== node.id)
  );
  if (overlappingNodes.length > 0) {
    for (const overlapNode of overlappingNodes) {
      const bestMove = getBestMove(overlapNode, allNodes);
      applyMove(overlapNode, bestMove, allNodes, movedNodes);
    }
    return true;
  }
  return false;
}

function handleOverlaps(
  allNodes: NodeCoordinates[],
  movedNodes: Map<string, NodeCoordinates>
): boolean {
  try {
    let hasOverlap = false;
    for (const currentNode of allNodes) {
      if (handleNodeOverlaps(currentNode, allNodes, movedNodes)) {
        hasOverlap = true;
      }
    }
    return hasOverlap;
  } catch (error) {
    console.error('Error in handleOverlaps:', error);
    return false; // Return false to break the loop in the calling function
  }
}

function calculateCoordinates(node: NodeCoordinates, nodes: NodeCoordinates[]): NodeCoordinates[] {
  try {
    // Create deep copies to avoid modifying frozen objects
    const allNodes = [{ ...node }, ...nodes.map((n) => ({ ...n }))];
    const movedNodes = new Map<string, NodeCoordinates>();
    const MAX_ITERATIONS = 10000;
    let iterations = 0;

    let hasOverlap = true;
    while (hasOverlap && iterations < MAX_ITERATIONS) {
      hasOverlap = handleOverlaps(allNodes, movedNodes);
      iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn('Max iterations reached, there may still be overlaps.');
    }

    return Array.from(movedNodes.values());
  } catch (error) {
    console.error('Error in calculateCoordinates:', error);
    return []; // Return empty array to avoid further errors
  }
}

export function useNodeAutoAdjust() {
  const { getNodes, updateNode } = useReactFlow();

  return useCallback(
    (node: Node) => {
      try {
        // Ensure we're working with a clean copy of the node, not a frozen object
        const currentNodeCoordinates: NodeCoordinates = {
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          w: node.measured?.width || 0,
          h: node.measured?.height || 0,
        };

        const nodes = getNodes().reduce<NodeCoordinates[]>((acc, n) => {
          if (n.id !== currentNodeCoordinates.id) {
            const nodeCoord = {
              id: n.id,
              x: n.position.x,
              y: n.position.y,
              w: n.measured?.width || 0,
              h: n.measured?.height || 0,
            };
            acc.push(nodeCoord);
          }
          return acc;
        }, []);

        const adjustedNodes = calculateCoordinates(currentNodeCoordinates, nodes);

        adjustedNodes.forEach(({ id, x, y }) => {
          const _node = getNodes().find((n) => n.id === id);

          if (_node) {
            // Skip using animate() which may cause issues with frozen objects
            // Just update the position directly
            updateNode(id, {
              position: { x, y },
            });
          }
        });
      } catch (error) {
        console.error('Error in useNodeAutoAdjust:', error);
      }
    },
    [getNodes, updateNode]
  );
}
