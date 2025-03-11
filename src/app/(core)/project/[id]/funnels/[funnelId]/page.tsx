import { getWorkflow } from "../_services/get-workflow";
import { FlowBuilderPage } from "../_components/funnel-builder";

export default async function Workflow({ params }: { params: { id: string } }) {
    const workflow = await getWorkflow(params.id);

    return <FlowBuilderPage workflow={workflow} />
}