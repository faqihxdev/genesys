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
      <div className='flex flex-col h-[calc(100vh-7rem)]'>
        <div className='flex grow divide-x divide-card-foreground/10 border border-border rounded-lg overflow-hidden'>
          <div className='bg-card grow md:bg-transparent mb-20'>
            <FlowBuilder />
          </div>
          <SidebarModule />
        </div>
      </div>
    </ReactFlowProvider>
  );
};
