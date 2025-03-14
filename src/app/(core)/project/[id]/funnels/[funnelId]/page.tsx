import { FlowBuilderPage } from '../_components/funnel-builder';
import { getWorkflow } from '../_services/get-workflow';

interface WorkflowPageProps {
  params: Promise<{
    funnelId: string;
    id: string; // project id
  }>;
}

export default async function Workflow({ params }: WorkflowPageProps) {
  // Await the params object before accessing its properties
  const { funnelId } = await params;
  const workflow = await getWorkflow(funnelId);

  // The demo user restriction is handled client-side in the SaveFlowButton component
  return <FlowBuilderPage workflow={workflow} />;
}
