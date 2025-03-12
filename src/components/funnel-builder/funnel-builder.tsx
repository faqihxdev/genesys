'use client';

import { useAddNodeOnEdgeDrop } from '@/hooks/use-add-node-on-edge-drop';
import { useDeleteKeyCode } from '@/hooks/use-delete-key-code';
import { useDragDropFlowBuilder } from '@/hooks/use-drag-drop-flow-builder';
import { useIsValidConnection } from '@/hooks/use-is-valid-connection';
import { useNodeAutoAdjust } from '@/hooks/use-node-auto-adjust';
import { cn } from '@/lib/utils';
import {
  deleteEdgeAtom,
  deleteNodeAtom,
  edgesAtom,
  nodesAtom,
  onConnectAtom,
  onEdgesChangeAtom,
  onNodesChangeAtom,
  workflowNameAtom,
} from '@/stores/funnel';
import { Icon } from '@iconify/react/dist/iconify.js';
import {
  Background,
  type EdgeTypes,
  type NodeChange,
  ReactFlow,
  SelectionMode,
  useReactFlow,
} from '@xyflow/react';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import AddNodeFloatingMenu from './add-node-floating-menu/add-node-floating-menu';
import { NODE_TYPES } from './blocks';
import { BuilderNode } from './blocks/types';
import { FlowContextMenu } from './context-menu/flow-context-menu';
import CustomControls from './controls/custom-controls';
import CustomDeletableEdge from './edges/custom-deletable-edge';
import { SaveFlowButton } from './ui/save-flow-button';

const edgeTypes: EdgeTypes = {
  deletable: CustomDeletableEdge,
};

export const FlowBuilder = () => {
  const router = useRouter();
  const [name] = useAtom(workflowNameAtom);
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const onNodesChange = useAtom(onNodesChangeAtom)[1];
  const onEdgesChange = useAtom(onEdgesChangeAtom)[1];
  const onConnect = useAtom(onConnectAtom)[1];
  const deleteNode = useAtom(deleteNodeAtom)[1];
  const deleteEdge = useAtom(deleteEdgeAtom)[1];
  const { getNodes } = useReactFlow();

  const { handleOnEdgeDropConnectEnd, floatingMenuWrapperRef, handleAddConnectedNode } =
    useAddNodeOnEdgeDrop();

  const deleteKeyCode = useDeleteKeyCode();

  const [onDragOver, onDrop] = useDragDropFlowBuilder();
  const isValidConnection = useIsValidConnection(nodes, edges);

  const autoAdjustNode = useNodeAutoAdjust();

  const handleAutoAdjustNodeAfterNodeMeasured = useCallback(
    (id: string) => {
      setTimeout(() => {
        const node = getNodes().find((n) => n.id === id);
        if (!node) {
          return;
        }

        if (node.measured === undefined) {
          handleAutoAdjustNodeAfterNodeMeasured(id);
          return;
        }

        autoAdjustNode(node);
      });
    },
    [autoAdjustNode, getNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      try {
        const filteredChanges = changes.map((change) => {
          if (change.type === 'select') {
            const node = nodes.find((n) => n.id === change.id);
            if (node && (node.type === BuilderNode.START || node.type === BuilderNode.END)) {
              return { ...change, selected: false };
            }
          }
          return change;
        });

        // For dimension changes, only queue them for auto-adjustment
        // Don't try to modify node properties directly
        filteredChanges.forEach((change) => {
          if (change.type === 'dimensions') {
            // Just trigger auto-adjust after dimensions are updated via onNodesChange
            setTimeout(() => {
              const node = getNodes().find((n) => n.id === change.id);
              if (node && node.measured) {
                autoAdjustNode(node);
              }
            }, 0);
          }

          if (change.type === 'add') {
            handleAutoAdjustNodeAfterNodeMeasured(change.item.id);
          }
        });

        onNodesChange(filteredChanges);
      } catch (error) {
        console.error('Error in handleNodesChange:', error);
      }
    },
    [autoAdjustNode, getNodes, handleAutoAdjustNodeAfterNodeMeasured, onNodesChange, nodes]
  );

  const handleDeleteElements = useCallback(() => {
    const selectedNodes = nodes.filter(
      (node) => node.selected && node.type !== BuilderNode.START && node.type !== BuilderNode.END
    );
    const selectedEdges = edges.filter((edge) => edge.selected);

    selectedNodes.forEach((node) => deleteNode(node));
    selectedEdges.forEach((edge) => deleteEdge(edge));
  }, [nodes, edges, deleteNode, deleteEdge]);

  return (
    <>
      <Card className='h-14 bg-card rounded-none border-0 border-b border-border py-2 px-4 w-auto items-center flex justify-between shadow-sm'>
        <div className='inline-flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className='text-primary-foreground font-bold'
            onClick={() => router.back()}
          >
            <Icon icon='ion:arrow-back-outline' className='size-6 text-card-foreground' />
          </Button>
          <h1 className='text-card-foreground font-bold'>{name || 'Untitled Funnel'}</h1>
        </div>

        {name !== '' && (
          <div className='inline-flex items-center gap-2'>
            <SaveFlowButton />
          </div>
        )}
      </Card>
      <div className='relative w-full h-full'>
        <FlowContextMenu>
          <ReactFlow
            proOptions={{ hideAttribution: true }}
            onInit={({ fitView }) => fitView().then()}
            nodeTypes={NODE_TYPES}
            nodes={nodes}
            onNodesChange={handleNodesChange}
            edgeTypes={edgeTypes}
            edges={edges}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={handleOnEdgeDropConnectEnd}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStop={(_, node) => {
              autoAdjustNode(node);
            }}
            onNodesDelete={handleDeleteElements}
            isValidConnection={isValidConnection}
            selectionMode={SelectionMode.Full}
            multiSelectionKeyCode='Control'
            selectionOnDrag={true}
            selectionKeyCode={null}
            deleteKeyCode={deleteKeyCode}
            snapGrid={[16, 16]}
            snapToGrid
            fitView
          >
            <Background gap={24} />
            <CustomControls />
          </ReactFlow>
        </FlowContextMenu>
      </div>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 backdrop-blur-3xl transition-all',
          'opacity-0 bg-zinc-800/0 backdrop-saturate-100 pointer-events-none'
        )}
      >
        <div ref={floatingMenuWrapperRef} className='relative size-full'>
          <AddNodeFloatingMenu onNodeAdd={handleAddConnectedNode} />
        </div>
      </div>
    </>
  );
};
