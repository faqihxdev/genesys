'use client';
import { SidebarModule } from '@/components/funnel-builder/blocks/sidebar/sidebar-module';
import { FlowBuilder } from '@/components/funnel-builder/funnel-builder';
import { setWorkflowAtom } from '@/stores/funnel';
import { ReactFlowProvider } from '@xyflow/react';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

export const FlowBuilderPage = ({
  workflow,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workflow: { id: string; name: string; nodes: any[]; edges: any[] };
}) => {
  const setWorkflow = useSetAtom(setWorkflowAtom);

  useEffect(() => {
    setWorkflow(workflow);
  }, [setWorkflow, workflow]);

  return (
    <ReactFlowProvider>
      <div className='flex flex-col h-dvh'>
        <div className='flex grow divide-x divide-card-foreground/10'>
          <div className='grow bg-card md:bg-transparent'>
            <FlowBuilder />
          </div>
          <SidebarModule />
        </div>
      </div>
    </ReactFlowProvider>
  );
};
