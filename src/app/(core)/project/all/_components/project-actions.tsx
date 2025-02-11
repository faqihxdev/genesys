'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ProjectExtended } from '@/server/db/schema/project';
import { deleteProject, getDefaultProjectCandidates, updateProject } from '@/server/projects';
import { cn, withQuery } from '@/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProjectDialog } from './project-dialog';
import { SelectDefaultProjectDialog } from './select-default-project-dialog';

interface ProjectActionsProps {
  project: ProjectExtended;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectDefaultDialogOpen, setSelectDefaultDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: updateProjectMutation, isPending: isUpdating } = useMutation({
    mutationFn: async (data: { isDefault: boolean }) => {
      if (!user?.id) throw new Error('User not found');

      const result = await withQuery(updateProject)({
        id: project.id,
        userId: user.id,
        ...data,
      });

      // Check if the update was successful
      if (!result) {
        throw new Error('Failed to update project');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['projects'],
        refetchType: 'all',
      });
      toast({
        title: 'Project updated',
        description: project.isDefault
          ? 'Project is no longer set as default.'
          : 'Project has been set as default.',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('[ProjectActions/updateProject]:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const { mutate: deleteProjectMutation, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');

      // If trying to delete default project, check for alternatives
      if (project.isDefault) {
        const candidates = await withQuery(getDefaultProjectCandidates)({
          userId: user.id,
          excludeProjectId: project.id,
        });
        if (!candidates?.length) {
          throw new Error('Cannot delete the only default project');
        }
        setSelectDefaultDialogOpen(true);
        return;
      }

      return withQuery(deleteProject)({ projectId: project.id });
    },
    onSuccess: () => {
      // Invalidate all related queries including the sidebar project queries
      queryClient.invalidateQueries({
        queryKey: ['projects'],
        exact: false,
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: ['projects', 'detail'],
        exact: false,
        refetchType: 'all',
      });
      toast({
        title: 'Project deleted',
        description: 'Project has been deleted successfully.',
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      router.push('/project/all');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleDefault = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // If trying to unset default, check for alternatives
      if (project.isDefault) {
        const candidates = await withQuery(getDefaultProjectCandidates)({
          userId: user.id,
          excludeProjectId: project.id,
        });
        if (!candidates?.length) {
          toast({
            title: 'Error',
            description: 'You must have at least one default project.',
            variant: 'destructive',
          });
          return;
        }
        setSelectDefaultDialogOpen(true);
        return;
      }

      // Set as default
      updateProjectMutation({ isDefault: true });
    } catch (error) {
      console.error('[ProjectActions/toggleDefault]:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update project status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' disabled={isUpdating}>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <ProjectDialog
            mode='edit'
            project={project}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className='h-4 w-4' />
                Edit Project
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            onClick={toggleDefault}
            disabled={isUpdating}
            className={cn(isUpdating && 'opacity-50 cursor-not-allowed')}
          >
            <Star className='h-4 w-4' />
            {isUpdating ? 'Updating...' : project.isDefault ? 'Remove Default' : 'Set as Default'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className='text-destructive'
                    disabled={project.role !== 'owner' || isDeleting || project.isDefault}
                  >
                    <Trash className='h-4 w-4' />
                    Delete Project
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {project.isDefault && (
                <TooltipContent>
                  <p>You cannot delete a default project</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectMutation()}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SelectDefaultProjectDialog
        open={selectDefaultDialogOpen}
        onOpenChange={setSelectDefaultDialogOpen}
        currentProjectId={project.id}
        onSuccess={() => {
          // After selecting new default, proceed with original action
          if (project.isDefault) {
            updateProjectMutation({ isDefault: false });
          }
          if (deleteDialogOpen) {
            deleteProjectMutation();
          }
        }}
      />
    </>
  );
}
