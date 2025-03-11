import { useAtom } from "jotai";
import { getConnectedEdges, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { deleteNodeAtom, deleteEdgeAtom } from "@/stores/funnel";

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