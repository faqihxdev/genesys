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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Project, ProjectExtended } from '@/db/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { createProject, updateProject } from '@/server/projects';
import { currentProjectIdAtom } from '@/stores/project';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(256, 'Project name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  isDefault: z.boolean().default(false),
});

type ProjectForm = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  mode: 'create' | 'edit';
  project?: ProjectExtended;
  trigger?: React.ReactNode;
}

export function ProjectDialog({ mode, project, trigger }: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setCurrentProjectId] = useAtom(currentProjectIdAtom);

  const form = useForm<ProjectForm>({
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (mode === 'edit' && project) {
      form.reset({
        name: project.name,
        description: project.description || '',
        isDefault: project.isDefault,
      });
    }
  }, [mode, project, form]);

  const { data: projects } = useQuery({
    queryKey: queryKey.projects.getCurrentUserProjects(),
    enabled: !!user?.id,
    select: (data: ProjectExtended[]) => data,
  });

  const isFirstProject = !projects?.length;

  // Set isDefault to true for first project
  useEffect(() => {
    if (mode === 'create' && isFirstProject) {
      form.setValue('isDefault', true);
    }
  }, [mode, isFirstProject, form]);

  const { mutate: createNewProject, isPending: isCreating } = useMutation({
    mutationFn: withQuery(createProject),
    onSuccess: (newProject: Project) => {
      // Set as current project
      setCurrentProjectId(newProject.id);

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getCurrentUserProjects(),
      });

      toast({
        title: 'Project created',
        description: 'Your new project has been created successfully.',
        variant: 'success',
      });

      // Reset form and close dialog
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const { mutate: updateExistingProject, isPending: isUpdating } = useMutation({
    mutationFn: withQuery(updateProject),
    onSuccess: () => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getCurrentUserProjects(),
        exact: false,
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.projects.getProjectById({ projectId: project?.id ?? '' }),
        exact: false,
        refetchType: 'all',
      });

      toast({
        title: 'Project updated',
        description: 'Your project has been updated successfully.',
        variant: 'success',
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: ProjectForm) {
    if (mode === 'create') {
      createNewProject(data);
    } else {
      updateExistingProject({ ...data, projectId: project?.id ?? '' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {mode === 'create' ? (
              <>
                <Plus className='h-4 w-4' />
                New Project
              </>
            ) : (
              <>
                <Pencil className='h-4 w-4' />
                Edit Project
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create New Project' : 'Edit Project'}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Add a new project to organize your personas and funnels.'
                : 'Update your project details.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Project Name</Label>
              <Input
                id='name'
                {...form.register('name')}
                placeholder='Enter project name'
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
                placeholder='Enter project description (optional)'
                disabled={isPending}
              />
              {form.formState.errors.description && (
                <p className='text-sm text-destructive'>
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            {mode === 'create' && (
              <div className='flex items-center space-x-2'>
                <Controller
                  name='isDefault'
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      id='isDefault'
                      checked={isFirstProject || field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending || isFirstProject}
                    />
                  )}
                />
                <Label htmlFor='isDefault'>
                  Set as default project
                  {isFirstProject && (
                    <span className='ml-1 text-xs text-muted-foreground'>
                      (Required for first project)
                    </span>
                  )}
                </Label>
              </div>
            )}
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
            <Button
              type='submit'
              isLoading={isPending}
              loadingText={mode === 'create' ? 'Creating...' : 'Updating...'}
            >
              {mode === 'create' ? 'Create Project' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
