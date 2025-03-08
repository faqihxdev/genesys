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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonaConfig } from '@/db/schema/persona';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import {
  deletePersonaConfig,
  generatePersonas,
  getPersonaConfigsByProject,
} from '@/server/persona';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Edit, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import PersonaConfigForm from './_config-form';

/**
 * @description Persona configuration page that allows viewing and creating persona configs
 * @returns The persona configuration page component
 */
export default function PersonaPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editConfigId, setEditConfigId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingForConfigId, setGeneratingForConfigId] = useState<string | null>(null);

  // Fetch persona configs
  const { data: personaConfigs, isLoading } = useQuery({
    queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
    queryFn: () => withQuery(getPersonaConfigsByProject)({ projectId }),
  });

  const handleDelete = async (id: string) => {
    try {
      const result = await deletePersonaConfig({ id });
      if ('error' in result && result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message || 'Failed to delete persona configuration',
        });
        return;
      }

      // Invalidate queries to update UI
      queryClient.invalidateQueries({
        queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
      });

      toast({
        title: 'Deleted',
        description: 'Persona configuration deleted successfully.',
      });
    } catch (error) {
      console.error('[PersonaPage]: Error deleting persona configuration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete persona configuration',
      });
    }
  };

  const handleFormSuccess = (configId: string, needsRegeneration: boolean) => {
    // Close any open dialogs
    setCreateDialogOpen(false);
    setEditConfigId(null);

    // If regeneration is needed, start the process
    if (needsRegeneration && configId) {
      // Add a small delay to allow UI to update first
      setTimeout(() => {
        handleGeneratePersonas(configId);
      }, 100);
    }
  };

  const handleGeneratePersonas = async (configId: string) => {
    try {
      setGeneratingForConfigId(configId);

      toast({
        title: 'Generating personas',
        description: 'Your personas are being generated in the background.',
      });

      const result = await generatePersonas({ personaConfigId: configId });

      // Check if the result contains an error
      if (result && 'error' in result && result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message || 'Failed to generate personas',
        });
        return;
      }

      // Invalidate the specific config to update the UI
      queryClient.invalidateQueries({
        queryKey: queryKey.persona.getPersonaConfigById({ id: configId }),
      });

      toast({
        title: 'Success',
        variant: 'success',
        description: 'Personas generated successfully.',
      });
    } catch (error) {
      console.error('[PersonaPage]: Error generating personas:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate personas',
      });
    } finally {
      setGeneratingForConfigId(null);
    }
  };

  const handleCancel = () => {
    setCreateDialogOpen(false);
    setEditConfigId(null);
  };

  const handleEdit = (configId: string) => {
    setEditConfigId(configId);
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
    <div className='container py-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <PageTitle
          title='Persona Configurations'
          description='Create and manage personas for your marketing funnel'
        />
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              New Persona Config
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-hidden'>
            {createDialogOpen && (
              <PersonaConfigForm
                projectId={projectId}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Render edit dialog when a config is selected for editing */}
      {editConfigId && (
        <Dialog
          open={Boolean(editConfigId)}
          onOpenChange={(open) => !open && setEditConfigId(null)}
        >
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-hidden'>
            <PersonaConfigForm
              projectId={projectId}
              configId={editConfigId}
              onSuccess={handleFormSuccess}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Display configs or loading skeletons */}
      <div className='grid gap-4'>
        {isLoading && <PersonaConfigSkeleton />}
        {!isLoading && personaConfigs && personaConfigs.length === 0 && (
          <div className='text-center py-10'>
            <p className='text-muted-foreground'>No persona configurations found</p>
            <p className='text-sm text-muted-foreground mt-1'>
              Create your first persona configuration to get started
            </p>
          </div>
        )}
        {!isLoading &&
          personaConfigs &&
          personaConfigs.map((config) => (
            <PersonaConfigItem
              key={config.id}
              config={config}
              onDelete={() => handleDelete(config.id)}
              onEdit={() => handleEdit(config.id)}
              isGenerating={generatingForConfigId === config.id}
              onRegenerate={() => handleGeneratePersonas(config.id)}
            />
          ))}
      </div>
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
  isGenerating,
  onRegenerate,
}: {
  config: PersonaConfig;
  onDelete: () => void;
  onEdit: () => void;
  isGenerating: boolean;
  onRegenerate: () => void;
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

  const handleRegeneratePersonas = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRegenerate();
  };

  return (
    <div className='group flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors'>
      {/* Icon Section - Different icon based on type */}
      <div
        className={`flex items-center justify-center w-12 h-12 ml-2 rounded-full bg-primary-100 text-primary-600 dark:bg-primary/20 dark:text-primary-600`}
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
          {isGenerating && (
            <Badge variant='outline' className='text-xs bg-amber-100 dark:bg-amber-900/20'>
              <Spinner size='xs' className='mr-1' />
              Generating personas...
            </Badge>
          )}
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

      {/* Action Buttons */}
      <div className='flex md:flex-col gap-2 self-end md:self-center opacity-0 group-hover:opacity-100 transition-opacity'>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={handleRegeneratePersonas}
          disabled={isGenerating}
          title='Regenerate Personas'
        >
          <RefreshCw className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          title='Edit Configuration'
        >
          <Edit className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={handleDeleteClick}
          disabled={isDeleting}
          title='Delete Configuration'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this persona configuration? This will also delete all
              personas generated from this configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
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
  );
}
