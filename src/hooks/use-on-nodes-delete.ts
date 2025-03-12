'use client';

import { selectedNodeAtom, setSelectedNodeAtom } from '@/stores/funnel';
import type { Node } from '@xyflow/react';
import { useAtom } from 'jotai';
import { useCallback } from 'react';

export function useOnNodesDelete(nodes: Node[]) {
  const [nodePropertiesSelectedNode] = useAtom(selectedNodeAtom);
  const setNodePropertiesSelectedNode = useAtom(setSelectedNodeAtom)[1];

  return useCallback(
    (_: Node[]) => {
      if (
        nodePropertiesSelectedNode &&
        !nodes.find((node) => node.id === nodePropertiesSelectedNode.id)
      ) {
        setNodePropertiesSelectedNode(null);
      }
    },
    [nodePropertiesSelectedNode, setNodePropertiesSelectedNode, nodes]
  );
}
