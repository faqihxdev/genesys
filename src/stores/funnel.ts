import { BuilderNodeType } from '@/components/funnel-builder/blocks/types';
import { Tag } from '@/types/tag';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@xyflow/react';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';

const defaultTags: Tag[] = [
  { value: 'marketing', label: 'Marketing', color: '#ef4444' },
  { value: 'support', label: 'Support', color: '#ef4444' },
  { value: 'lead', label: 'Lead', color: '#eab308' },
  { value: 'new', label: 'New', color: '#22c55e' },
];

export const tagsAtom = atom<Tag[]>(defaultTags);
export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);
export const workflowIdAtom = atom<string>(nanoid());
export const workflowNameAtom = atom<string>('');
export const selectedNodeAtom = atom<{ id: string; type: BuilderNodeType } | null>(null);
export const activeSidebarAtom = atom<'node-properties' | 'available-nodes' | 'none'>('none');

// Actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveWorkflowAtom = atom(null, (get: any) => {
  return {
    id: get(workflowIdAtom),
    name: get(workflowNameAtom),
    nodes: get(nodesAtom),
    edges: get(edgesAtom),
  };
});

export const setWorkflowAtom = atom(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (get: any, set: any, workflow: { id: string; name: string; nodes: Node[]; edges: Edge[] }) => {
    set(workflowIdAtom, workflow.id);
    set(workflowNameAtom, workflow.name);
    set(nodesAtom, workflow.nodes);
    set(edgesAtom, workflow.edges);
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onNodesChangeAtom = atom(null, (get: any, set: any, changes: NodeChange[]) => {
  set(nodesAtom, (prevNodes: Node[]) => applyNodeChanges(changes, prevNodes));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onEdgesChangeAtom = atom(null, (get: any, set: any, changes: EdgeChange[]) => {
  set(edgesAtom, (prevEdges: Edge[]) => applyEdgeChanges(changes, prevEdges));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onConnectAtom = atom(null, (get: any, set: any, connection: Connection) => {
  const newEdge: Edge = { ...connection, id: nanoid(), type: 'deletable' };
  set(edgesAtom, (prevEdges: Edge[]) => addEdge(newEdge, prevEdges));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteNodeAtom = atom(null, (get: any, set: any, node: Node) => {
  set(nodesAtom, (prevNodes: Node[]) => prevNodes.filter((n) => n.id !== node.id));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteEdgeAtom = atom(null, (get: any, set: any, edge: Edge) => {
  set(edgesAtom, (prevEdges: Edge[]) => prevEdges.filter((e) => e.id !== edge.id));
});

export const setActiveSidebarAtom = atom(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (get: any, set: any, panel: 'node-properties' | 'available-nodes' | 'none') => {
    set(activeSidebarAtom, panel);
  }
);

export const showNodePropertiesOfAtom = atom(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (get: any, set: any, node: { id: string; type: BuilderNodeType }) => {
    set(selectedNodeAtom, node);
    set(activeSidebarAtom, 'node-properties');
  }
);

export const setSelectedNodeAtom = atom(
  null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (get: any, set: any, node: { id: string; type: BuilderNodeType } | null) => {
    set(selectedNodeAtom, node);
  }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setTagsAtom = atom(null, (get: any, set: any, tags: Tag[]) => {
  set(tagsAtom, tags);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createTagAtom = atom(null, (get: any, set: any, tag: Tag) => {
  set(tagsAtom, (prevTags: Tag[]) => [...prevTags, tag]);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateTagAtom = atom(null, (get: any, set: any, tag: Tag, newTag: Tag) => {
  set(tagsAtom, (prevTags: Tag[]) => prevTags.map((t) => (t.value === tag.value ? newTag : t)));
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteTagAtom = atom(null, (get: any, set: any, tag: Tag) => {
  set(tagsAtom, (prevTags: Tag[]) => prevTags.filter((t) => t.value !== tag.value));
});
