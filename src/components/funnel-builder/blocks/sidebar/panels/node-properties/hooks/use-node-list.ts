import { useMemo } from 'react';

import { getNodeDetail } from '@/components/funnel-builder/blocks/utils';
import type { Node } from '@xyflow/react';
import { BuilderNode } from '../../../../types';

export function useNodeList(nodes: Node[]) {
  return useMemo(() => {
    return nodes
      .slice()
      .sort((a, b) => {
        if (a.type === BuilderNode.START) return -1;
        if (b.type === BuilderNode.START) return 1;
        if (a.type === BuilderNode.END) return 1;
        if (b.type === BuilderNode.END) return -1;
        return 0;
      })
      .map((n) => ({
        ...n,
        detail: getNodeDetail(n.type),
      }));
  }, [nodes]);
}
