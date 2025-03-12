import { HeaderWithIcon } from '@/components/funnel-builder/ui/header-with-icon';
import { selectedNodeAtom, setSelectedNodeAtom } from '@/stores/funnel';
import { useNodes, useReactFlow } from '@xyflow/react';
import { produce } from 'immer';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import { TagsNodeData } from '../../../nodes/tags-node/tags.node';
import { BuilderNode } from '../../../types';
import SidebarPanelWrapper from '../../_components/sidebar-panel-wrapper';
import { NodeListItem } from './_components/node-list-item';
import { NodePropertyPanel } from './_components/node-propery-panel';
import { useNodeList } from './hooks/use-node-list';
import IntroductionPropertyPanel from './property-panels/introduction-property-panel';

export function NodePropertiesPanel() {
  const [selectedNode] = useAtom(selectedNodeAtom);
  const setSelectedNode = useAtom(setSelectedNodeAtom)[1];
  const nodes = useNodes();
  const nodeList = useNodeList(nodes);
  const { setNodes } = useReactFlow();

  const onNodeClick = (id: string) => {
    setNodes((nds) =>
      produce(nds, (draft) => {
        draft.forEach((node) => {
          node.selected = node.id === id;
        });
      })
    );

    setSelectedNode({
      id,
      type: nodeList.find((n) => n.id === id)?.type as BuilderNode,
    });
  };

  const selectedNodeData = useMemo(() => {
    return nodes.find((n) => n.id === selectedNode?.id)?.data;
  }, [nodes, selectedNode?.id]);

  return (
    <SidebarPanelWrapper>
      <div className='h-80 w-80 flex flex-col'>
        <div className='flex items-center text-sm h-10 px-4 border-b border-t-0 select-none shrink-0 border-card-foreground/10 bg-card/80 text-center text-card-foreground/60 gap-x-2 font-semibold'>
          <HeaderWithIcon icon='Layers' title='Stages in Funnel' />
        </div>

        <div className='flex w-full  flex-col gap-1 p-1.5 overflow-y-auto'>
          {nodeList.map((node) => (
            <NodeListItem
              key={node.id}
              id={
                node.type === BuilderNode.START || node.type === BuilderNode.END
                  ? undefined
                  : node.id
              }
              title={
                node.type === BuilderNode.TAGS
                  ? (node.data as TagsNodeData)?.name || node.detail.title
                  : node.detail.title
              }
              icon={node.detail.icon}
              selected={selectedNode?.id === node.id}
              onClick={() => {
                onNodeClick(node.id);
              }}
            />
          ))}
        </div>
      </div>

      <div className='w-80 max-h-[360px] 2xl:max-h-[594px] flex flex-col'>
        <div className='flex items-center text-sm h-10 px-4 border-b border-t select-none shrink-0 border-card-foreground/10 bg-card/80 text-center text-card-foreground/60 gap-x-2 font-semibold'>
          <HeaderWithIcon icon='Settings' title='Stage Properties' />
        </div>

        <div className='flex w-full  flex-col  overflow-y-auto'>
          {selectedNode ? (
            <NodePropertyPanel
              id={selectedNode.id}
              type={selectedNode.type}
              data={selectedNodeData}
            />
          ) : (
            <IntroductionPropertyPanel />
          )}
        </div>
      </div>
    </SidebarPanelWrapper>
  );
}
