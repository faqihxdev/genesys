'use client';

import { Button } from '@/components/custom/button';
import { Spinner } from '@/components/custom/spinner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ProjectExtended } from '@/db/schema/project';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { cn, withQuery } from '@/lib/utils';
import { deleteProject, getDefaultProjectCandidates, updateProject } from '@/server/projects';
import { useMutation } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Settings, Star, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ProjectDialog } from './_project-dialog';
import { SelectDefaultProjectDialog } from './_select-default-project-dialog';

interface ProjectActionsProps {
  project: ProjectExtended;
}

export function ProjectActions({ project }: ProjectActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectDefaultDialogOpen, setSelectDefaultDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: updateProjectMutation, isPending: isUpdating } = useMutation({
    mutationFn: withQuery(updateProject),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getCurrentUserProjects(),
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
        queryKey: queryKey.projects.getCurrentUserProjects(),
        exact: false,
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getProjectById({ projectId: project.id }),
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
      updateProjectMutation({ projectId: project.id, isDefault: true });
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
            {isUpdating ? (
              <>
                <Spinner size='sm' />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Star className='h-4 w-4' />
                {project.isDefault ? 'Unset as Default' : 'Set as Default'}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/project/${project.id}/settings`)}>
            <Settings className='h-4 w-4' />
            Project Settings
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
                    {isDeleting ? (
                      <>
                        <Spinner size='sm' />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash className='h-4 w-4' />
                        Delete Project
                      </>
                    )}
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
              {isDeleting ? (
                <>
                  <Spinner size='sm' />
                  <span>Deleting...</span>
                </>
              ) : (
                'Delete Project'
              )}
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
            updateProjectMutation({ projectId: project.id, isDefault: false });
          }
          if (deleteDialogOpen) {
            deleteProjectMutation();
          }
        }}
      />
    </>
  );
}
