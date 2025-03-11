import { type Node, type NodeProps, Position } from "@xyflow/react";
import { nanoid } from "nanoid";
import { memo, useCallback, useMemo, useState } from "react";
import { BaseNodeData, BuilderNode, RegisterNodeMetadata } from "../../types";
import { getNodeDetail } from "../../utils";
import { useDeleteNode } from "@/hooks/use-delete-node";
import CustomHandle from "@/components/funnel-builder/handles/custom-handler";
import TextMessageNodePropertyPanel from "../../sidebar/panels/node-properties/property-panels/text-message-property-panel";
import { useSetAtom } from "jotai";
import { showNodePropertiesOfAtom } from "@/stores/funnel";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  NodeCard,
  NodeCardContent,
  NodeCardDescription,
  NodeCardFooter,
  NodeCardHeader,
} from "@/components/funnel-builder/ui/node-card";

const NODE_TYPE = BuilderNode.TEXT_MESSAGE;

export interface TextMessageNodeData extends BaseNodeData {
  message: string;
  textCount?: number;
  imageCount?: number;
}

type TextMessageNodeProps = NodeProps<Node<TextMessageNodeData, typeof NODE_TYPE>>;

export function TextMessageNode({
  id,
  isConnectable,
  selected,
  data,
}: TextMessageNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);
  const showNodeProperties = useSetAtom(showNodePropertiesOfAtom);
  const [sourceHandleId] = useState<string>(nanoid());
  const deleteNode = useDeleteNode();

  const handleDeleteNode = () => {
    deleteNode(id);
  };

  const handleShowNodeProperties = useCallback(() => {
    showNodeProperties({ id, type: NODE_TYPE });
  }, [id, showNodeProperties]);

  return (
    <NodeCard data-selected={selected} onDoubleClick={handleShowNodeProperties}>
      <NodeCardHeader
        icon={meta.icon}
        title={meta.title}
        handleDeleteNode={handleDeleteNode}
        handleShowNodeProperties={handleShowNodeProperties}
        gradientColor={meta.gradientColor}
      />

      <NodeCardContent>
        <div className="flex flex-col p-4">
          <div className="text-xs font-medium text-card-foreground">
            Content Summary
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-card-foreground/70">
              <span className="font-medium">{data.textCount || 0}</span>
              <span className="text-xs">×</span>
              <div className="flex items-center gap-1.5">
                <Icon icon="ph:text-t-bold" className="size-4" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-card-foreground/70">
              <span className="font-medium">{data.imageCount || 0}</span>
              <span className="text-xs">×</span>
              <div className="flex items-center gap-1.5">
                <Icon icon="ph:image-bold" className="size-4" />
              </div>
            </div>
          </div>
        </div>

        <NodeCardDescription description="Description of this Stage or something" />
        <NodeCardFooter nodeId={id} />
      </NodeCardContent>

      <CustomHandle
        type="target"
        id={sourceHandleId}
        position={Position.Left}
        isConnectable={isConnectable}
      />

      <CustomHandle
        type="source"
        id={sourceHandleId}
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </NodeCard>
  );
}

export const metadata: RegisterNodeMetadata<TextMessageNodeData> = {
  type: NODE_TYPE,
  node: memo(TextMessageNode),
  detail: {
    icon: "mynaui:message-solid",
    title: "Stage 1",
    description: "Description of Stage 1 or something",
  },
  connection: {
    inputs: 1,
    outputs: 1,
  },
  defaultData: {
    message: "",
    textCount: 2,
    imageCount: 1,
  },
  propertyPanel: TextMessageNodePropertyPanel,
};