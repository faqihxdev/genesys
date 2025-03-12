'use client';

import { Button } from '@/components/custom/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { createFunnel } from '@/server/funnel';
import { useMutation } from '@tanstack/react-query';
import { GitFork } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const funnelSchema = z.object({
  name: z.string().min(1, 'Funnel name is required').max(256, 'Funnel name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
});

type FunnelForm = z.infer<typeof funnelSchema>;

interface FunnelDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
}

export function FunnelDialog({ projectId, trigger }: FunnelDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FunnelForm>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const { mutate: createNewFunnel, isPending } = useMutation({
    mutationFn: withQuery(createFunnel),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (newFunnel: any) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKey.funnel.all(projectId),
      });

      toast({
        title: 'Funnel created',
        description: 'Your new funnel has been created successfully.',
        variant: 'success',
      });

      // Reset form and close dialog
      form.reset();
      setOpen(false);

      // Navigate to the funnel editor
      router.push(`/project/${projectId}/funnels/${newFunnel.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create funnel. Please try again.',
        variant: 'destructive',
      });
    },
  });

  function onSubmit(data: FunnelForm) {
    createNewFunnel({
      ...data,
      projectId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <GitFork className='mr-2 h-4 w-4' />
            Create Funnel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Funnel</DialogTitle>
            <DialogDescription>
              Create a new marketing funnel to analyze how different personas interact with each
              stage of your customer journey.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Funnel Name</Label>
              <Input
                id='name'
                {...form.register('name')}
                placeholder='Enter funnel name'
                disabled={isPending}
              />
              {form.formState.errors.name && (
                <p className='text-sm text-destructive'>{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                {...form.register('description')}
                placeholder='Enter funnel description (optional)'
                disabled={isPending}
              />
              {form.formState.errors.description && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' isLoading={isPending} loadingText='Creating...'>
              Create Funnel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
