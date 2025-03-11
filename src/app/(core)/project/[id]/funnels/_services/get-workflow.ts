import { nanoid } from "nanoid";
import type { Node, Edge } from "@xyflow/react";
import { activeSidebarAtom, nodesAtom, edgesAtom, workflowIdAtom, workflowNameAtom, selectedNodeAtom } from "@/stores/funnel";

export interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  sidebar: {
    active: "node-properties" | "available-nodes" | "none";
    panels: {
      nodeProperties: {
        selectedNode: { id: string; type: string } | null;
      };
    };
  };
}

export const getWorkflow = async (id: string): Promise<Workflow> => {
  // TODO: Get data from API
  return {
    id: nanoid(),
    name: "Sample Workflow",
    edges: [
      {
        id: "27Uqm_guQgYOw81_ibdSu",
        source: "rFM8ixvItA-i-bXblxZ_M",
        target: "nESW80juDe8b5bB_tbmSc",
        type: "deletable",
      },
      {
        id: "aiMB_q-I713SLcttfM6PS",
        source: "nESW80juDe8b5bB_tbmSc",
        target: "5zne5FShP-jUCF1s7823h",
        type: "deletable",
      },
    ],
    nodes: [
      {
        id: "rFM8ixvItA-i-bXblxZ_M",
        type: "start",
        position: { x: 0, y: 267 },
        deletable: false,
        data: { label: "Start", deletable: false },
        measured: { width: 96, height: 42 },
      },
      {
        id: "DtJ7scXmGEA101ommJOKc",
        type: "end",
        position: { x: 1440, y: 272 },
        deletable: false,
        data: { label: "End", deletable: true },
        measured: { width: 90, height: 42 },
      },
    ],
    sidebar: {
      active: "available-nodes",
      panels: {
        nodeProperties: {
          selectedNode: null,
        },
      },
    },
  };
};