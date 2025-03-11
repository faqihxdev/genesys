import { getWorkflow } from "../_services/get-workflow";
import { FlowBuilderPage } from "../_components/funnel-builder";

export default async function Workflow({ params }: { params: { id: string, funnelId: string } }) {
    const workflow = await getWorkflow(params.funnelId);

    return <FlowBuilderPage workflow={workflow} />
}