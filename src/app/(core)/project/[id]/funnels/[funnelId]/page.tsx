import { FlowBuilderPage } from '../_components/funnel-builder';
import { getWorkflow } from '../_services/get-workflow';

export default async function Workflow({ params }: { params: { id: string; funnelId: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const workflow = await getWorkflow(resolvedParams.funnelId);
  return <FlowBuilderPage workflow={workflow} />;
}
