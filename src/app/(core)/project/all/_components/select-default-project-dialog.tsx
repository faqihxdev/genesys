'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ProjectExtended } from '@/server/db/schema/project';
import { getDefaultProjectCandidates, updateProject } from '@/server/projects';
import { withQuery } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface SelectDefaultProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProjectId: string;
  onSuccess?: () => void;
}

export function SelectDefaultProjectDialog({
  open,
  onOpenChange,
  currentProjectId,
  onSuccess,
}: SelectDefaultProjectDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available projects for default selection
  const { data: candidates = [] } = useQuery({
    queryKey: ['projects', 'candidates', user?.id, currentProjectId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      const result = await getDefaultProjectCandidates({
        userId: user.id,
        excludeProjectId: currentProjectId,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data || [];
    },
    enabled: !!user?.id && open, // Only fetch when dialog is open
  });

  const { mutate: updateProjectMutation, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) throw new Error('No project selected');
      if (!user?.id) throw new Error('User not found');

      return withQuery(updateProject)({
        id: selectedProjectId,
        userId: user.id,
        isDefault: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects'],
        refetchType: 'all',
      });
      toast({
        title: 'Default project updated',
        description: 'The default project has been updated successfully.',
        variant: 'success',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update default project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Default Project</DialogTitle>
          <DialogDescription>
            Choose a new default project. This will be your primary project when you log in.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='project'>Default Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isPending}
            >
              <SelectTrigger id='project'>
                <SelectValue placeholder='Select a project' />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((project: ProjectExtended) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => updateProjectMutation()}
            disabled={!selectedProjectId || isPending}
          >
            {isPending ? 'Updating...' : 'Update Default'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
