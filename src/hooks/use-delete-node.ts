import { deleteEdgeAtom, deleteNodeAtom } from '@/stores/funnel';
import { getConnectedEdges, useReactFlow } from '@xyflow/react';
import { useAtom } from 'jotai';
import { useCallback } from 'react';

export function useDeleteNode() {
  const { getNode, getEdges, deleteElements } = useReactFlow();
  const deleteNode = useAtom(deleteNodeAtom)[1];
  const deleteEdge = useAtom(deleteEdgeAtom)[1];

  return useCallback(
    (id: string) => {
      const node = getNode(id);
      if (!node) return;

      const edges = getEdges();
      const connectedEdges = getConnectedEdges([node], edges);

      deleteElements({ nodes: [node], edges: connectedEdges }).then();
      deleteNode(node);
      for (const edge of connectedEdges) {
        deleteEdge(edge);
      }
    },
    [deleteElements, getEdges, getNode, deleteNode, deleteEdge]
  );
}
