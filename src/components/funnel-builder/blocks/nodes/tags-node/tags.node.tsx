import { type Node, type NodeProps, Position } from "@xyflow/react";
import { nanoid } from "nanoid";
import { isEmpty } from "radash";
import { memo, useCallback, useMemo, useState } from "react";
import { BaseNodeData, BuilderNode, RegisterNodeMetadata } from "../../types";
import { getNodeDetail } from "../../utils";
import { useDeleteNode } from "@/hooks/use-delete-node";
import CustomHandle from "@/components/funnel-builder/handles/custom-handler";
import { useAtom } from "jotai";
import { showNodePropertiesOfAtom, tagsAtom } from "@/stores/funnel";
import {
  NodeCard,
  NodeCardContent,
  NodeCardDescription,
  NodeCardFooter,
  NodeCardHeader,
} from "@/components/funnel-builder/ui/node-card";
import { Badge } from "@/components/ui/badge";
import TagsNodePropertyPanel from "../../sidebar/panels/node-properties/property-panels/tags-property";
import { Icon } from "@iconify/react/dist/iconify.js";

const NODE_TYPE = BuilderNode.TAGS;

export interface TagsNodeData extends BaseNodeData {
  tags: string[];
  description: string;
  name: string;
  options: {
    id: string;
    option: {
      id: number;
      name: string;
      description?: string;
      type: "text" | "image";
      content: string; // Text content or image URL
    }
  }[];
}

const badgeStyle = (color: string) => ({
  borderColor: `${color}20`,
  backgroundColor: `${color}30`,
  color,
});

type TagsNodeProps = NodeProps<Node<TagsNodeData, typeof NODE_TYPE>>;

export function TagsNode({ id, isConnectable, selected, data }: TagsNodeProps) {
  const meta = useMemo(() => getNodeDetail(NODE_TYPE), []);
  const showNodeProperties = useAtom(showNodePropertiesOfAtom)[1];
  const [tags] = useAtom(tagsAtom);
  const [sourceHandleId] = useState<string>(nanoid());
  const deleteNode = useDeleteNode();

  const handleDeleteNode = () => {
    deleteNode(id);
  };

  const handleShowNodeProperties = useCallback(() => {
    showNodeProperties({ id, type: NODE_TYPE });
  }, [id, showNodeProperties]);

  // Count text and image options
  const textOptionCount = useMemo(() =>
    data.options.filter(option => option.option.type === "text").length,
    [data.options]
  );

  const imageOptionCount = useMemo(() =>
    data.options.filter(option => option.option.type === "image").length,
    [data.options]
  );

  return (
    <NodeCard data-selected={selected} onDoubleClick={handleShowNodeProperties}>
      <NodeCardHeader
        icon={meta.icon}
        title={data.name || meta.title}
        handleDeleteNode={handleDeleteNode}
        handleShowNodeProperties={handleShowNodeProperties}
        gradientColor={meta.gradientColor}
      />

      <NodeCardContent>
        <div className="flex flex-col p-4">
          <div className="line-clamp-4 mt-2 text-sm leading-snug">
            {isEmpty(data.description) ? (
              <span className="text-card-foreground italic">
                Stage description is empty
              </span>
            ) : (
              data.description
            )}
          </div>
        </div>

        <NodeCardDescription
          description=""
          badges={
            <div className="line-clamp-1 flex gap-2 flex-wrap text-sm leading-snug">
              {data.options.length === 0 ? (
                <span className="text-card-foreground italic">
                  No items added
                </span>
              ) : (
                <>
                  {textOptionCount > 0 && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15 flex items-center gap-1">
                      {textOptionCount} x
                      <Icon icon="material-symbols:text-fields" className="h-3.5 w-3.5" />
                    </Badge>
                  )}
                  {imageOptionCount > 0 && (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15 flex items-center gap-1">
                      {imageOptionCount} x
                      <Icon icon="material-symbols:image" className="h-3.5 w-3.5" />
                    </Badge>
                  )}
                </>
              )}
            </div>
          }
        />

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

export const metadata: RegisterNodeMetadata<TagsNodeData> = {
  type: NODE_TYPE,
  node: memo(TagsNode),
  detail: {
    icon: "material-symbols:credit-card",
    title: "Stage",
    description:
      "Press to add stage to build your funnel simulator",
    gradientColor: "pink",
  },
  connection: {
    inputs: 1,
    outputs: 1,
  },
  defaultData: {
    tags: ["marketing", "new"],
    description: "",
    name: "",
    options: [],
  },
  propertyPanel: TagsNodePropertyPanel,
};