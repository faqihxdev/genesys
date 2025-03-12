import { Button } from '@/components/ui/button';
import { useFlowValidator } from '@/hooks/use-flow-validator';
import { useToast } from '@/hooks/use-toast';
import { saveFlow } from '@/server/funnel';
import { saveWorkflowAtom, workflowIdAtom } from '@/stores/funnel';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Node } from '@xyflow/react';
import { useAtom } from 'jotai';
import { useState } from 'react';

export const SaveFlowButton = () => {
  const saveWorkflow = useAtom(saveWorkflowAtom)[1];
  const [funnelId] = useAtom(workflowIdAtom);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [isValidating, validateFlow] = useFlowValidator(async (isValid) => {
    if (isValid) {
      try {
        setIsSaving(true);
        // Save the workflow to the store
        const workflow = saveWorkflow();

        // Map node IDs to match the expected format in the server action
        // For nodes created from the database, they'll have IDs like "stage-stg-123"
        // For newly created nodes, they'll have random IDs
        const mappedNodes = workflow.nodes.map((node: Node) => {
          // If the node was loaded from the database, extract the original ID
          if (node.id.startsWith('stg-') && node.type === 'tags') {
            return {
              ...node,
              originalId: node.id,
            };
          }
          return node;
        });

        // Save the flow to the database
        const result = await saveFlow({
          funnelId: funnelId,
          nodes: mappedNodes,
          edges: workflow.edges,
        });

        if (!result.error) {
          toast({
            title: 'Flow saved successfully',
            description: 'Your flow has been saved to the database',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Error saving flow',
            description: result.error.message || 'An unknown error occurred',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error saving flow',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({
        title: 'Flow is invalid',
        description: 'Please check if the flow is complete and has no lone nodes',
        variant: 'destructive',
      });
    }
  });

  return (
    <Button
      onClick={validateFlow}
      disabled={isValidating || isSaving}
      variant={'default'}
      size={'sm'}
      className='flex gap-2 bg-primary/90 text-primary-foreground hover:bg-primary/80'
    >
      <Icon icon='fluent:save-28-filled' className='text-primary-foreground' />
      {isSaving ? 'Saving...' : 'Save Flow'}
    </Button>
  );
};
