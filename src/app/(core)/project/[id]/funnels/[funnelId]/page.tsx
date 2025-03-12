import { FlowBuilderPage } from '../_components/funnel-builder';
import { getWorkflow } from '../_services/get-workflow';

export default async function Workflow({ params }: { params: { id: string; funnelId: string } }) {
  const workflow = await getWorkflow(params.funnelId);

  return <FlowBuilderPage workflow={workflow} />;
}
