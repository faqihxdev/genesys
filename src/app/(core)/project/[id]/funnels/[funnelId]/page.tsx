import { FlowBuilderPage } from '../_components/funnel-builder';
import { getWorkflow } from '../_services/get-workflow';

interface WorkflowPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Workflow({ searchParams }: WorkflowPageProps) {
  const resolvedParams = await searchParams;
  const workflow = await getWorkflow(resolvedParams.funnelId as string);
  return <FlowBuilderPage workflow={workflow} />;
}
