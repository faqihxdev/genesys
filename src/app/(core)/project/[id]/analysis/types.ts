import { Funnel, Stage, StageItem } from '@/db/schema/funnel';
import { Simulation } from '@/db/schema/simulation';
import { Summary, SummaryStage, SummaryStageItem } from '@/db/schema/summary';

// Extended types for the analysis page
export interface FunnelOption {
  id: string;
  name: string;
  description: string;
  simulationCount: number;
  lastSimulated: Date;
}

export interface SimulationOption {
  id: string;
  createdAt: Date;
  status: string;
  completeCount: number;
  conversionRate: number;
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
  stage: Stage;
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
}

export interface ComparisonAnalysis {
  base: FunnelAnalysis;
  compare: FunnelAnalysis;
  diffMetrics: KeyMetric[];
}
