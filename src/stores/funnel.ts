import { atom } from "jotai";
import { nanoid } from "nanoid";
import {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
} from "@xyflow/react";
import { Tag } from "@/types/tag";
import { BuilderNodeType } from "@/components/funnel-builder/blocks/types";

const defaultTags: Tag[] = [
    { value: "marketing", label: "Marketing", color: "#ef4444" },
    { value: "support", label: "Support", color: "#ef4444" },
    { value: "lead", label: "Lead", color: "#eab308" },
    { value: "new", label: "New", color: "#22c55e" },
];

export const tagsAtom = atom<Tag[]>(defaultTags);
export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);
export const workflowIdAtom = atom<string>(nanoid());
export const workflowNameAtom = atom<string>("");
export const selectedNodeAtom = atom<{ id: string; type: BuilderNodeType } | null>(null);
export const activeSidebarAtom = atom<"node-properties" | "available-nodes" | "none">("none");

// Actions
export const saveWorkflowAtom = atom(null, (get: any) => {
    return {
        id: get(workflowIdAtom),
        name: get(workflowNameAtom),
        nodes: get(nodesAtom),
        edges: get(edgesAtom),
    };
});

export const setWorkflowAtom = atom(null, (get: any, set: any, workflow: { id: string; name: string; nodes: Node[]; edges: Edge[] }) => {
    set(workflowIdAtom, workflow.id);
    set(workflowNameAtom, workflow.name);
    set(nodesAtom, workflow.nodes);
    set(edgesAtom, workflow.edges);
});

export const onNodesChangeAtom = atom(null, (get: any, set: any, changes: NodeChange[]) => {
    set(nodesAtom, (prevNodes: Node[]) => applyNodeChanges(changes, prevNodes));
});

export const onEdgesChangeAtom = atom(null, (get: any, set: any, changes: EdgeChange[]) => {
    set(edgesAtom, (prevEdges: Edge[]) => applyEdgeChanges(changes, prevEdges));
});

export const onConnectAtom = atom(null, (get: any, set: any, connection: Connection) => {
    const newEdge: Edge = { ...connection, id: nanoid(), type: "deletable" };
    set(edgesAtom, (prevEdges: Edge[]) => addEdge(newEdge, prevEdges));
});

export const deleteNodeAtom = atom(null, (get: any, set: any, node: Node) => {
    set(nodesAtom, (prevNodes: Node[]) => prevNodes.filter((n) => n.id !== node.id));
});

export const deleteEdgeAtom = atom(null, (get: any, set: any, edge: Edge) => {
    set(edgesAtom, (prevEdges: Edge[]) => prevEdges.filter((e) => e.id !== edge.id));
});

export const setActiveSidebarAtom = atom(null, (get: any, set: any, panel: "node-properties" | "available-nodes" | "none") => {
    set(activeSidebarAtom, panel);
});

export const showNodePropertiesOfAtom = atom(null, (get: any, set: any, node: { id: string; type: BuilderNodeType }) => {
    set(selectedNodeAtom, node);
    set(activeSidebarAtom, "node-properties");
});

export const setSelectedNodeAtom = atom(null, (get: any, set: any, node: { id: string; type: BuilderNodeType } | null) => {
    set(selectedNodeAtom, node);
});

export const setTagsAtom = atom(null, (get: any, set: any, tags: Tag[]) => {
    set(tagsAtom, tags);
});

export const createTagAtom = atom(null, (get: any, set: any, tag: Tag) => {
    set(tagsAtom, (prevTags: Tag[]) => [...prevTags, tag]);
});

export const updateTagAtom = atom(null, (get: any, set: any, tag: Tag, newTag: Tag) => {
    set(tagsAtom, (prevTags: Tag[]) => prevTags.map((t) => (t.value === tag.value ? newTag : t)));
});

export const deleteTagAtom = atom(null, (get: any, set: any, tag: Tag) => {
    set(tagsAtom, (prevTags: Tag[]) => prevTags.filter((t) => t.value !== tag.value));
});