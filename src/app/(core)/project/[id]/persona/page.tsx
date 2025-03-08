'use client';

import { PageTitle } from '@/components/custom/page-title';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonaConfig } from '@/db/schema/persona';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { deletePersonaConfig, getPersonaConfigsByProject } from '@/server/persona';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit, Plus, Trash2, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PersonaConfigForm from './_config-form';

/**
 * @description Persona configuration page that allows viewing and creating persona configs
 * @returns The persona configuration page component
 */
export default function PersonaPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch persona configurations using Tanstack Query
  const { data: configs = [], isLoading } = useQuery({
    queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
    queryFn: () => withQuery(getPersonaConfigsByProject)({ projectId }),
  });

  // Delete a persona configuration
  const handleDelete = async (id: string) => {
    try {
      const result = await withQuery(deletePersonaConfig)({ id });
      if (result) {
        toast({
          title: 'Success',
          variant: 'success',
          description: 'Persona configuration deleted successfully',
        });

        // Invalidate all relevant queries to refresh data
        queryClient.invalidateQueries({
          queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
        });

        // Also invalidate the specific config query in case it's cached
        queryClient.invalidateQueries({
          queryKey: queryKey.persona.getPersonaConfigById({ id }),
        });
      }
    } catch (error) {
      console.error('[PersonaPage]: Error deleting config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete persona configuration',
      });
    }
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    const idToInvalidate = editingConfigId;

    // Reset UI state
    setIsCreateModalOpen(false);
    setEditingConfigId(null);

    // Invalidate queries to refresh the data
    // Always invalidate the project configs list
    queryClient.invalidateQueries({
      queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
    });

    // If we were editing, also invalidate the specific config
    if (idToInvalidate) {
      queryClient.invalidateQueries({
        queryKey: queryKey.persona.getPersonaConfigById({ id: idToInvalidate }),
      });
    }

    toast({
      title: 'Success',
      variant: 'success',
      description: 'Persona configuration saved successfully',
    });
  };

  // Handle dialog close/cancel
  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setEditingConfigId(null);
  };

  // Handle edit button click
  const handleEdit = (configId: string) => {
    setEditingConfigId(configId);
  };

  // Create a skeleton loader for persona config items
  function PersonaConfigSkeleton() {
    return (
      <div className='flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-xl border bg-card'>
        {/* Icon Skeleton */}
        <Skeleton className='w-12 h-12 rounded-full' />

        {/* Content Skeleton */}
        <div className='flex-1 space-y-2'>
          <div className='flex items-start gap-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-5 w-16' />
          </div>
          <Skeleton className='h-4 w-full max-w-md' />
          <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>

        {/* Actions Skeleton */}
        <div className='flex items-center space-x-2 self-end md:self-center'>
          <Skeleton className='h-9 w-20' />
          <Skeleton className='h-9 w-20' />
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Persona Configurations'
          description='Create and manage synthetic customer personas to simulate unique behaviors through marketing funnels.'
        />
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4' /> Add Persona Config
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl max-h-[90vh]'>
            <DialogTitle className='sr-only'>Create New Persona Configuration</DialogTitle>
            <DialogDescription className='sr-only'>
              Define a new set of persona traits to generate synthetic customer personas.
            </DialogDescription>
            <PersonaConfigForm
              projectId={projectId}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingConfigId !== null}
        onOpenChange={(open) => !open && setEditingConfigId(null)}
      >
        <DialogContent className='max-w-3xl max-h-[90vh]'>
          <DialogTitle className='sr-only'>Edit Persona Configuration</DialogTitle>
          <DialogDescription className='sr-only'>
            Edit the existing persona configuration settings.
          </DialogDescription>
          {editingConfigId && (
            <PersonaConfigForm
              projectId={projectId}
              configId={editingConfigId}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className='space-y-4'>
          {/* Show 3 skeleton items while loading */}
          <PersonaConfigSkeleton />
          <PersonaConfigSkeleton />
          <PersonaConfigSkeleton />
        </div>
      ) : configs.length === 0 ? (
        <div className='bg-muted/20 rounded-xl p-8 text-center'>
          <Users className='mx-auto h-12 w-12 text-muted-foreground/60 mb-4' />
          <h3 className='text-xl font-medium mb-2'>No persona configurations yet</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            Create your first persona configuration to generate synthetic customer personas for your
            project.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Create Persona Config
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {configs.map((config) => (
            <PersonaConfigItem
              key={config.id}
              config={config}
              onDelete={() => handleDelete(config.id)}
              onEdit={() => handleEdit(config.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @description Modern item component for displaying a persona configuration
 * @param {Object} props - Component props
 * @param {PersonaConfig} props.config - The persona configuration to display
 * @param {Function} props.onDelete - Function to call when deleting this config
 * @param {Function} props.onEdit - Function to call when editing this config
 * @returns The persona config item component
 */
function PersonaConfigItem({
  config,
  onDelete,
  onEdit,
}: {
  config: PersonaConfig;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className='group flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors'>
      {/* Icon Section - Different icon based on type */}
      <div
        className={`flex items-center justify-center w-12 h-12 ml-2 rounded-full ${
          config.type === 'preset'
            ? 'bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
            : 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
        }`}
      >
        <Users className='h-6 w-6' />
      </div>

      {/* Content Section */}
      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold'>{config.name}</h3>
          <Badge variant={config.type === 'preset' ? 'secondary' : 'outline'} className='text-xs'>
            {config.type === 'preset' ? 'Preset' : 'Custom'}
          </Badge>
        </div>
        <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>{config.description}</p>
        <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground'>
          <div className='flex items-center'>
            <Users className='h-4 w-4 mr-1.5 inline-block' />
            <span>{config.size} personas</span>
          </div>
          <div className='flex items-center'>
            <Calendar className='h-4 w-4 mr-1.5 inline-block' />
            <span>Created {new Date(config.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions Section - Simplified */}
      <div className='flex items-center space-x-2 self-end md:self-center'>
        {/* Edit Button */}
        <Button variant='outline' size='sm' onClick={onEdit}>
          <Edit className='h-4 w-4 mr-1.5' />
          <span>Edit</span>
        </Button>

        {/* Delete Button */}
        <Button
          variant='outline'
          size='sm'
          className='text-destructive hover:bg-destructive hover:text-white'
          onClick={handleDeleteClick}
        >
          <Trash2 className='h-4 w-4 mr-1.5' />
          <span>Delete</span>
        </Button>

        {/* Delete confirmation dialog using AlertDialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Persona Configuration</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{config.name}&rdquo;? This will also delete
                all associated personas. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {isDeleting ? (
                  <>
                    <Spinner size='sm' />
                    <span className='ml-2'>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
