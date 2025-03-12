import type { Funnel } from '@/types/funnel';

export async function getProjectFunnels(projectId: string): Promise<Funnel[]> {
  // Dummy data for preview
  const dummyFunnels: Funnel[] = [
    {
      id: '1',
      name: 'Product Discovery Funnel',
      description:
        'Track how users discover and explore our main product features through the website and documentation.',
      status: 'active',
      projectId,
    },
    {
      id: '2',
      name: 'Free Trial Conversion',
      description:
        'Analyze the journey from free trial signup to paid subscription conversion, identifying key decision points.',
      status: 'active',
      projectId,
    },
    {
      id: '3',
      name: 'Enterprise Sales Pipeline',
      description:
        'Monitor the B2B sales process from initial contact through demo requests to contract signing.',
      status: 'draft',
      projectId,
    },
    {
      id: '4',
      name: 'Content Marketing Journey',
      description:
        'Track user engagement from blog posts and resources to newsletter signups and product interest.',
      status: 'active',
      projectId,
    },
    {
      id: '5',
      name: 'Mobile App Onboarding',
      description:
        'Optimize the mobile app first-time user experience and feature adoption process.',
      status: 'draft',
      projectId,
    },
    {
      id: '6',
      name: 'Customer Retention Flow',
      description:
        'Analyze patterns in customer engagement and identify early churn risk indicators.',
      status: 'archived',
      projectId,
    },
    {
      id: '7',
      name: 'Social Media Campaign',
      description:
        'Track conversion from social media engagement to website visits and eventual signups.',
      status: 'active',
      projectId,
    },
    {
      id: '8',
      name: 'Email Marketing Sequence',
      description:
        'Measure the effectiveness of our nurture email sequence and its conversion rates.',
      status: 'draft',
      projectId,
    },
    {
      id: '9',
      name: 'Support Ticket Resolution',
      description:
        'Monitor the customer support journey from ticket creation to resolution and satisfaction.',
      status: 'active',
      projectId,
    },
    {
      id: '10',
      name: 'Product Upgrade Path',
      description: 'Track how users discover and adopt premium features, leading to plan upgrades.',
      status: 'active',
      projectId,
    },
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return dummyFunnels;
}
