import {
  Funnel,
  Simulation,
  StageItem,
  Summary,
  SummaryStage,
  SummaryStageItem,
} from '@/db/schema';

/**
 * @description Type definitions for funnel analysis with dependency tree
 *
 * Type Dependency Tree:
 *
 * ComparisonAnalysis
 * └── FunnelAnalysis
 *     ├── Funnel (from funnel table)
 *     ├── Simulation (from simulation table)
 *     ├── Summary (from summary table)
 *     ├── StageAnalysis
 *     │   ├── SummaryStage (from summary_stages table)
 *     │   ├── Stage (from stages table)
 *     │   ├── SummaryStageItem (from summary_stages table)
 *     │   ├── StageItem (from stage_items table)
 *     │   └── KeyMetric
 *     ├── KeyMetric
 *     └── SankeyData
 *         ├── SankeyNode
 *         └── SankeyLink
 *
 * FunnelOption (standalone)
 * SimulationOption (standalone)
 */

// Extended types for the analysis page
export interface FunnelOption {
  id: string;
  name: string;
  description: string | null;
  simulationCount: number;
  lastSimulated: Date;
}

export interface SimulationOption {
  id: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  completeCount: number;
  createdAt: Date;
  hasSummary: boolean;
}

export interface StageLink {
  id: string;
  fromStageId: string;
  toStageId: string;
}

export interface SankeyNode {
  id: string;
  name: string;
  type: 'stage' | 'path';
  value: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface KeyMetric {
  label: string;
  value: number | string;
  description?: string;
}

export interface StageAnalysis extends SummaryStage {
  stage: {
    id: string;
    name: string;
    description?: string | null;
    items: Array<{
      id: string;
      name: string;
    }>;
  };
  items: Array<SummaryStageItem & { item: StageItem }>;
  metrics: KeyMetric[];
}

export interface FunnelAnalysis {
  funnel: Funnel;
  simulation: Simulation;
  summary: Summary;
  stages: StageAnalysis[];
  metrics: KeyMetric[];
  sankey: SankeyData;
  stageLinks: StageLink[];
}

export interface ComparisonAnalysis {
  base: FunnelAnalysis;
  compare: FunnelAnalysis;
  diffMetrics: KeyMetric[];
}
