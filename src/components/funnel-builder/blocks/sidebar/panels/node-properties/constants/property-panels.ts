import type { ComponentType } from 'react';
import { NODES } from '../../../..';
import { BuilderNodeType } from '../../../../types';

export const NODE_PROPERTY_PANEL_COMPONENTS: Partial<
  Record<
    BuilderNodeType,
    ComponentType<{
      id: string;
      type: BuilderNodeType;
      data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      updateData: (data: Partial<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    }>
  >
> = NODES.reduce((acc, node) => {
  acc[node.type] = node.propertyPanel;
  return acc;
}, {} as any); // eslint-disable-line @typescript-eslint/no-explicit-any
