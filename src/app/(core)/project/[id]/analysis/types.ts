import { Funnel, StageItem } from '@/db/schema/funnel';
import { Simulation } from '@/db/schema/simulation';
import { Summary, SummaryStage, SummaryStageItem } from '@/db/schema/summary';

/**
 * @description Type definitions for funnel analysis with dependency tree
 *
 * Type Dependency Tree:
 *
 * ComparisonAnalysis
 * └── FunnelAnalysis
 *     ├── Funnel (from @/db/schema/funnel)
 *     ├── Simulation (from @/db/schema/simulation)
 *     ├── Summary (from @/db/schema/summary)
 *     ├── StageAnalysis
 *     │   ├── SummaryStage (from @/db/schema/summary)
 *     │   ├── Stage (from @/db/schema/funnel)
 *     │   ├── SummaryStageItem (from @/db/schema/summary)
 *     │   ├── StageItem (from @/db/schema/funnel)
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
