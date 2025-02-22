import { FunnelAnalysis, FunnelOption, KeyMetric, SankeyData, SimulationOption } from './types';

// Mock funnel options
export const mockFunnelOptions: FunnelOption[] = [
  {
    id: 'fnl-mock-1',
    name: 'Product Launch Funnel',
    description: 'A test funnel for product launch campaign with path optimization',
    simulationCount: 2,
    lastSimulated: new Date('2024-03-15'),
  },
  {
    id: 'fnl-mock-2',
    name: 'Onboarding Funnel',
    description: 'Customer onboarding and feature adoption funnel',
    simulationCount: 2,
    lastSimulated: new Date('2024-03-10'),
  },
];

// Mock simulation options by funnel
export const mockSimulationOptionsByFunnel: Record<string, SimulationOption[]> = {
  'fnl-mock-1': [
    {
      id: 'sim-mock-1',
      createdAt: new Date('2024-03-15'),
      status: 'complete',
      completeCount: 10,
      conversionRate: 0.4, // 40% overall conversion
    },
    {
      id: 'sim-mock-2',
      createdAt: new Date('2024-03-14'),
      status: 'complete',
      completeCount: 10,
      conversionRate: 0.35, // 35% overall conversion
    },
  ],
  'fnl-mock-2': [
    {
      id: 'sim-mock-3',
      createdAt: new Date('2024-03-10'),
      status: 'complete',
      completeCount: 10,
      conversionRate: 0.45, // 45% overall conversion
    },
    {
      id: 'sim-mock-4',
      createdAt: new Date('2024-03-09'),
      status: 'complete',
      completeCount: 10,
      conversionRate: 0.42, // 42% overall conversion
    },
  ],
};

// Mock Sankey data for different funnels
const mockSankeyDataFunnel1: SankeyData = {
  nodes: [
    { id: 'stg-mock-1', name: 'Awareness', type: 'stage', value: 10 },
    { id: 'stg-mock-2a', name: 'Features Path', type: 'path', value: 5 },
    { id: 'stg-mock-2b', name: 'Pricing Path', type: 'path', value: 3 },
    { id: 'stg-mock-3', name: 'Decision', type: 'stage', value: 4 },
    { id: 'stg-mock-drop-off', name: 'Drop Off', type: 'stage', value: 6 },
  ],
  links: [
    { source: 'stg-mock-1', target: 'stg-mock-2a', value: 5 },
    { source: 'stg-mock-1', target: 'stg-mock-2b', value: 3 },
    { source: 'stg-mock-2a', target: 'stg-mock-3', value: 4 },
    { source: 'stg-mock-2b', target: 'stg-mock-3', value: 2 },
    { source: 'stg-mock-1', target: 'stg-mock-drop-off', value: 2 },
    { source: 'stg-mock-2a', target: 'stg-mock-drop-off', value: 1 },
    { source: 'stg-mock-2b', target: 'stg-mock-drop-off', value: 1 },
  ],
};

const mockSankeyDataFunnel2: SankeyData = {
  nodes: [
    { id: 'stg-mock-4', name: 'Welcome', type: 'stage', value: 10 },
    { id: 'stg-mock-5a', name: 'Tutorial Path', type: 'path', value: 6 },
    { id: 'stg-mock-5b', name: 'Skip Path', type: 'path', value: 4 },
    { id: 'stg-mock-6', name: 'Setup', type: 'stage', value: 5 },
    { id: 'stg-mock-drop-off-2', name: 'Drop Off', type: 'stage', value: 5 },
  ],
  links: [
    { source: 'stg-mock-4', target: 'stg-mock-5a', value: 6 },
    { source: 'stg-mock-4', target: 'stg-mock-5b', value: 4 },
    { source: 'stg-mock-5a', target: 'stg-mock-6', value: 4 },
    { source: 'stg-mock-5b', target: 'stg-mock-6', value: 1 },
    { source: 'stg-mock-5a', target: 'stg-mock-drop-off-2', value: 2 },
    { source: 'stg-mock-5b', target: 'stg-mock-drop-off-2', value: 3 },
  ],
};

// Base mock funnel analysis for reuse
const baseMockAnalysis: FunnelAnalysis = {
  funnel: {
    id: 'fnl-mock-1',
    projectId: 'prj-mock-1',
    name: 'Product Launch Funnel',
    description: 'A test funnel for product launch campaign with path optimization',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    deletedAt: null,
  },
  simulation: {
    id: 'sim-mock-1',
    funnelId: 'fnl-mock-1',
    personaConfigId: 'pcg-mock-1',
    status: 'complete',
    completeCount: 10,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    deletedAt: null,
  },
  summary: {
    id: 'sum-mock-1',
    simulationId: 'sim-mock-1',
    conversionRate: '0.40',
    sentiment: '0.65',
    summary:
      'The funnel shows strong initial engagement with effective path segmentation. Features path performed better than pricing path, suggesting technical users are more likely to convert.',
    recommendation:
      'Consider enhancing the pricing path with more value propositions and ROI examples to improve conversion. The features path is performing well but could be optimized further.',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    deletedAt: null,
  },
  stages: [
    {
      id: 'sms-mock-1',
      simulationId: 'sim-mock-1',
      stageId: 'stg-mock-1',
      conversionRate: '0.80',
      sentiment: '0.70',
      summary:
        'Strong initial engagement with clear value proposition. Hero text and product video effectively capture attention.',
      recommendation:
        'Consider A/B testing different hero messages to optimize initial engagement further.',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-1',
        funnelId: 'fnl-mock-1',
        parentId: null,
        childId: null,
        name: 'Awareness',
        description: 'Landing page to introduce the product',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
        deletedAt: null,
      },
      items: [
        {
          id: 'smi-mock-1',
          simulationId: 'sim-mock-1',
          stageItemId: 'sti-mock-1',
          sentiment: '0.75',
          summary: 'Hero text effectively communicates value proposition',
          recommendation: 'Test alternative headlines focusing on specific benefits',
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15'),
          deletedAt: null,
          item: {
            id: 'sti-mock-1',
            stageId: 'stg-mock-1',
            name: 'Hero Text',
            description: 'Main landing page copy',
            type: 'text',
            content: 'Discover the future of productivity with our revolutionary AI-powered tool',
            createdAt: new Date('2024-03-15'),
            updatedAt: new Date('2024-03-15'),
            deletedAt: null,
          },
        },
      ],
      metrics: [
        {
          label: 'Bounce Rate',
          value: '20%',
          description: 'Percentage of users who left without interaction',
        },
        {
          label: 'Avg. Time Spent',
          value: '45s',
          description: 'Average time spent on awareness stage',
        },
      ],
    },
    {
      id: 'sms-mock-2a',
      simulationId: 'sim-mock-1',
      stageId: 'stg-mock-2a',
      conversionRate: '0.80',
      sentiment: '0.75',
      summary:
        'Features path shows high engagement with technical users. Detailed product demonstrations and specifications resonate well.',
      recommendation:
        'Consider adding more interactive demos and technical deep-dives to further engage this segment.',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-2a',
        funnelId: 'fnl-mock-1',
        parentId: 'stg-mock-1',
        childId: 'stg-mock-3',
        name: 'Features Path',
        description: 'Detailed product features and capabilities',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Feature Engagement',
          value: '85%',
          description: 'Percentage of users who interacted with feature demos',
        },
        {
          label: 'Avg. Time Spent',
          value: '3m 20s',
          description: 'Average time spent exploring features',
        },
      ],
    },
    {
      id: 'sms-mock-2b',
      simulationId: 'sim-mock-1',
      stageId: 'stg-mock-2b',
      conversionRate: '0.67',
      sentiment: '0.60',
      summary:
        'Pricing path shows moderate engagement. Value proposition is clear but some users find pricing complex.',
      recommendation:
        'Simplify pricing tiers and add more ROI examples to strengthen value proposition.',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-2b',
        funnelId: 'fnl-mock-1',
        parentId: 'stg-mock-1',
        childId: 'stg-mock-3',
        name: 'Pricing Path',
        description: 'Pricing plans and value proposition',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Price Calculator Usage',
          value: '60%',
          description: 'Percentage of users who used ROI calculator',
        },
        {
          label: 'Plan Comparison Time',
          value: '2m 45s',
          description: 'Average time comparing plans',
        },
      ],
    },
    {
      id: 'sms-mock-3',
      simulationId: 'sim-mock-1',
      stageId: 'stg-mock-3',
      conversionRate: '0.75',
      sentiment: '0.70',
      summary:
        'Decision stage shows strong conversion from both paths, with slightly higher rates from the features path.',
      recommendation:
        'Add social proof and case studies to boost confidence in the final decision stage.',
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date('2024-03-15'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-3',
        funnelId: 'fnl-mock-1',
        parentId: null,
        childId: null,
        name: 'Decision',
        description: 'Checkout and purchase process',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Cart Abandonment',
          value: '25%',
          description: 'Percentage of users who abandoned checkout',
        },
        {
          label: 'Avg. Checkout Time',
          value: '1m 30s',
          description: 'Average time to complete purchase',
        },
      ],
    },
  ],
  metrics: [
    {
      label: 'Overall Conversion',
      value: '40%',
      description: 'Total conversion rate from start to finish',
    },
    {
      label: 'Avg. Sentiment',
      value: '0.65',
      description: 'Average sentiment score across all stages',
    },
    {
      label: 'Features Path Conv.',
      value: '80%',
      description: 'Conversion rate for features path',
    },
    {
      label: 'Pricing Path Conv.',
      value: '67%',
      description: 'Conversion rate for pricing path',
    },
  ],
  sankey: mockSankeyDataFunnel1,
};

// For the onboarding funnel (fnl-mock-2), we need to create its own stages
const onboardingFunnelAnalysis: FunnelAnalysis = {
  funnel: {
    id: 'fnl-mock-2',
    projectId: 'prj-mock-1',
    name: 'Onboarding Funnel',
    description: 'Customer onboarding and feature adoption funnel',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
    deletedAt: null,
  },
  simulation: {
    id: 'sim-mock-3',
    funnelId: 'fnl-mock-2',
    personaConfigId: 'pcg-mock-1',
    status: 'complete',
    completeCount: 10,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
    deletedAt: null,
  },
  summary: {
    id: 'sum-mock-2',
    simulationId: 'sim-mock-3',
    conversionRate: '0.45',
    sentiment: '0.70',
    summary:
      'The onboarding funnel demonstrates high engagement with the tutorial path. Users who complete the tutorial are significantly more likely to complete setup.',
    recommendation:
      'Focus on improving the skip path experience and consider adding incentives for tutorial completion.',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
    deletedAt: null,
  },
  stages: [
    {
      id: 'sms-mock-4',
      simulationId: 'sim-mock-3',
      stageId: 'stg-mock-4',
      conversionRate: '0.90',
      sentiment: '0.75',
      summary:
        'Welcome stage shows excellent engagement with clear path options. Users appreciate the choice between guided and self-paced onboarding.',
      recommendation:
        'Add short video previews of each path to help users make more informed decisions.',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-4',
        funnelId: 'fnl-mock-2',
        parentId: null,
        childId: null,
        name: 'Welcome',
        description: 'Initial onboarding welcome screen',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Path Selection Time',
          value: '45s',
          description: 'Average time to choose a path',
        },
        {
          label: 'Welcome Video Views',
          value: '85%',
          description: 'Percentage who watched welcome video',
        },
      ],
    },
    {
      id: 'sms-mock-5a',
      simulationId: 'sim-mock-3',
      stageId: 'stg-mock-5a',
      conversionRate: '0.85',
      sentiment: '0.80',
      summary:
        'Tutorial path shows high completion rates and positive sentiment. Interactive elements are particularly effective.',
      recommendation:
        'Add more interactive exercises and progress tracking to maintain engagement.',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-5a',
        funnelId: 'fnl-mock-2',
        parentId: 'stg-mock-4',
        childId: 'stg-mock-6',
        name: 'Tutorial Path',
        description: 'Guided tutorial experience',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Tutorial Completion',
          value: '85%',
          description: 'Percentage completing all tutorials',
        },
        {
          label: 'Avg. Tutorial Time',
          value: '12m',
          description: 'Average time in tutorials',
        },
      ],
    },
    {
      id: 'sms-mock-5b',
      simulationId: 'sim-mock-3',
      stageId: 'stg-mock-5b',
      conversionRate: '0.25',
      sentiment: '0.45',
      summary:
        'Skip path shows lower engagement and higher drop-off rates. Users often struggle without guidance.',
      recommendation:
        'Add contextual help and quick-start guides for users choosing the skip path.',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-5b',
        funnelId: 'fnl-mock-2',
        parentId: 'stg-mock-4',
        childId: 'stg-mock-6',
        name: 'Skip Path',
        description: 'Direct setup without tutorial',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Help Usage',
          value: '75%',
          description: 'Percentage accessing help docs',
        },
        {
          label: 'Setup Attempts',
          value: '2.5',
          description: 'Average setup attempts',
        },
      ],
    },
    {
      id: 'sms-mock-6',
      simulationId: 'sim-mock-3',
      stageId: 'stg-mock-6',
      conversionRate: '0.65',
      sentiment: '0.70',
      summary:
        'Setup completion shows strong variance between paths. Tutorial path users complete setup more successfully.',
      recommendation:
        'Implement a hybrid approach allowing quick setup with optional guided elements.',
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10'),
      deletedAt: null,
      stage: {
        id: 'stg-mock-6',
        funnelId: 'fnl-mock-2',
        parentId: null,
        childId: null,
        name: 'Setup',
        description: 'Final setup and configuration',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
        deletedAt: null,
      },
      items: [],
      metrics: [
        {
          label: 'Setup Success',
          value: '65%',
          description: 'First-try setup success rate',
        },
        {
          label: 'Config Completion',
          value: '85%',
          description: 'Optional config completion rate',
        },
      ],
    },
  ],
  metrics: [
    {
      label: 'Overall Conversion',
      value: '45%',
      description: 'Total conversion rate from start to finish',
    },
    {
      label: 'Avg. Sentiment',
      value: '0.70',
      description: 'Average sentiment score across all stages',
    },
    {
      label: 'Tutorial Path Conv.',
      value: '85%',
      description: 'Conversion rate for tutorial path',
    },
    {
      label: 'Skip Path Conv.',
      value: '25%',
      description: 'Conversion rate for skip path',
    },
  ],
  sankey: mockSankeyDataFunnel2,
};

// Update the mock analysis data
export const mockAnalysisByFunnel: Record<string, Record<string, FunnelAnalysis>> = {
  'fnl-mock-1': {
    'sim-mock-1': baseMockAnalysis,
    'sim-mock-2': {
      ...baseMockAnalysis,
      simulation: {
        ...baseMockAnalysis.simulation,
        id: 'sim-mock-2',
      },
      metrics: baseMockAnalysis.metrics.map((metric: KeyMetric) => ({
        ...metric,
        value:
          typeof metric.value === 'string' && metric.value.endsWith('%')
            ? (parseFloat(metric.value) * 0.9).toFixed(1) + '%'
            : metric.value,
      })),
    },
  },
  'fnl-mock-2': {
    'sim-mock-3': onboardingFunnelAnalysis,
    'sim-mock-4': {
      ...onboardingFunnelAnalysis,
      simulation: {
        ...onboardingFunnelAnalysis.simulation,
        id: 'sim-mock-4',
      },
      metrics: onboardingFunnelAnalysis.metrics.map((metric: KeyMetric) => ({
        ...metric,
        value:
          typeof metric.value === 'string' && metric.value.endsWith('%')
            ? (parseFloat(metric.value) * 0.95).toFixed(1) + '%'
            : metric.value,
      })),
    },
  },
};
