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
import { PersonaConfigWithCount, TraitsConfig } from '@/db/schema/persona';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import {
  deletePersonaConfig,
  generatePersonas,
  getPersonaConfigsByProject,
} from '@/server/persona';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Check, Edit, Plus, RefreshCw, Sparkles, Trash2, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
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

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
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
      <div className='border rounded-xl bg-card overflow-hidden'>
        <div className='p-5 flex items-start'>
          <div className='flex-shrink-0 mr-5'>
            <Skeleton className='h-12 w-12 rounded-full' />
          </div>

          <div className='flex-1 space-y-3'>
            <div className='flex justify-between'>
              <div>
                <Skeleton className='h-6 w-72 mb-2' />
                <Skeleton className='h-4 w-96' />
              </div>
              <div className='flex space-x-2'>
                <Skeleton className='h-8 w-8 rounded-md' />
                <Skeleton className='h-8 w-8 rounded-md' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            </div>

            <div className='flex space-x-6 pt-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6'>
      <div className='flex justify-between items-center'>
        <PageTitle
          title='Persona Configurations'
          description='Create and manage personas for your marketing funnel'
        />
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className='flex items-center space-x-2'>
              <Plus className='h-4 w-4' />
              <span>New Persona Config</span>
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] p-6 flex flex-col gap-2'>
            <DialogTitle>Create New Persona Configuration</DialogTitle>
            <DialogDescription>
              Define a new set of persona traits to generate synthetic customer personas.
            </DialogDescription>
            <div className='flex-1 min-h-0'>
              {createDialogOpen && (
                <PersonaConfigForm
                  projectId={projectId}
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Render edit dialog when a config is selected for editing */}
      {editConfigId && (
        <Dialog
          open={Boolean(editConfigId)}
          onOpenChange={(open) => !open && setEditConfigId(null)}
        >
          <DialogContent className='max-w-2xl max-h-[90vh] p-6 flex flex-col gap-2'>
            <DialogTitle>Edit Persona Configuration</DialogTitle>
            <DialogDescription>
              Modify the settings for this persona configuration.
            </DialogDescription>
            <div className='flex-1 min-h-0'>
              <PersonaConfigForm
                projectId={projectId}
                configId={editConfigId}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Display configs or loading skeletons */}
      {isLoading ? (
        <div className='space-y-4'>
          <PersonaConfigSkeleton />
          <PersonaConfigSkeleton />
          <PersonaConfigSkeleton />
        </div>
      ) : personaConfigs && personaConfigs.length === 0 ? (
        <div className='border rounded-xl bg-card p-12 text-center'>
          <div className='mx-auto w-20 h-20 bg-muted/20 flex items-center justify-center rounded-full mb-6'>
            <Users className='h-10 w-10 text-muted-foreground/50' />
          </div>
          <h3 className='text-xl font-medium mb-2'>No persona configurations yet</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            Create your first persona configuration to generate synthetic customer personas for your
            project.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className='mr-2 h-4 w-4' /> Create Persona Config
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {personaConfigs?.map((config) => (
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
  isGenerating,
  onRegenerate,
}: {
  config: PersonaConfigWithCount;
  onDelete: () => void;
  onEdit: () => void;
  isGenerating: boolean;
  onRegenerate: () => void;
}): React.ReactNode {
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

  // Get creation date in a nice format
  const createdDate = new Date(config.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Determine the status badge color
  const getStatusBadge = () => {
    if (isGenerating) {
      return (
        <Badge
          variant='outline'
          className='bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 border-primary-300'
        >
          <Spinner size='xs' className='mr-1' />
          Generating
        </Badge>
      );
    }

    if (config.type === 'preset') {
      return (
        <Badge variant='secondary' className='text-xs'>
          Preset
        </Badge>
      );
    }

    return (
      <Badge variant='outline' className='text-xs'>
        Custom
      </Badge>
    );
  };

  // Generation progress section rendered separately
  const getGenerationProgress = () => {
    if (!isGenerating) return null;

    return (
      <div className='px-6 py-4 bg-primary-50/50 dark:bg-primary-950/10 border-t border-primary-200/50 dark:border-primary-800/20 space-y-3'>
        <div className='flex items-center'>
          <div className='flex-shrink-0 mr-3'>
            <div className='h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center'>
              <Sparkles className='h-4 w-4 text-primary-600 dark:text-primary-400' />
            </div>
          </div>
          <div className='flex-1'>
            <h4 className='text-sm font-medium text-primary-800 dark:text-primary-300'>
              Creating synthetic {config.size} personas
            </h4>
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='flex justify-between text-xs text-primary-700/70 dark:text-primary-400/70'>
            <span>Generation in progress</span>
            <span>This may take a minute...</span>
          </div>
          <div className='relative w-full h-1.5 bg-primary-200/50 dark:bg-primary-900/30 rounded-full overflow-hidden'>
            <div className='absolute top-0 bottom-0 left-0 w-24 bg-primary-500 dark:bg-primary-500/80 rounded-full animate-rolling'></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md hover:bg-muted/10 dark:hover:shadow-primary/5'>
      {/* Status Banner - only shown when generating */}
      {isGenerating && <div className='absolute inset-x-0 top-0 bg-primary-500/20 h-1'></div>}

      <div className='p-5 flex'>
        {/* Left icon section */}
        <div className='mr-5 flex-shrink-0'>
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full 
            ${
              isGenerating
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 animate-pulse'
                : 'bg-primary-600/10 text-primary-600'
            }`}
          >
            <Users className='h-6 w-6' />
          </div>
        </div>

        {/* Main content section */}
        <div className='flex-1'>
          <div className='flex items-start justify-between'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='text-lg font-semibold text-foreground'>{config.name}</h3>
                {getStatusBadge()}
              </div>

              <p className='text-sm text-muted-foreground line-clamp-2 max-w-[40rem]'>
                {config.description || 'No description provided'}
              </p>
            </div>

            {/* Action Buttons - visible on hover */}
            <div className='flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4'>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 border-muted'
                onClick={handleRegeneratePersonas}
                disabled={isGenerating}
                title='Regenerate Personas'
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 border-muted'
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
                className='h-8 w-8 border-muted hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive'
                onClick={handleDeleteClick}
                disabled={isDeleting}
                title='Delete Configuration'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Info section */}
          <div className='mt-3 flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted-foreground'>
            <div className='flex items-center'>
              <Users className='h-4 w-4 mr-1.5 opacity-70' />
              <span className='font-medium'>{config.size}</span>
              <span className='ml-1'>personas</span>
            </div>

            <div className='flex items-center'>
              <Calendar className='h-4 w-4 mr-1.5 opacity-70' />
              <span>Created {createdDate}</span>
            </div>

            {config.constraints && (
              <div className='flex items-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-4 w-4 mr-1.5 opacity-70'
                >
                  <path d='M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z' />
                  <path d='M7 7h.01' />
                </svg>
                <span>Has constraints</span>
              </div>
            )}
          </div>

          {/* Trait preview */}
          <div className='mt-3 flex flex-wrap gap-2'>
            {/* Status badge */}
            {!isGenerating &&
              (config.personaCount > 0 ? (
                <span className='inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-950/50 px-2 py-1 text-xs text-primary-700 dark:text-primary-400 ring-1 ring-inset ring-primary-700/10 dark:ring-primary-900/30'>
                  <Check className='h-3 w-3 mr-1' />
                  <span>Generated</span>
                </span>
              ) : (
                <span className='inline-flex items-center rounded-full bg-muted/30 dark:bg-muted/20 px-2 py-1 text-xs text-muted-foreground ring-1 ring-inset ring-muted-foreground/20 dark:ring-muted-foreground/10'>
                  <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1.5'></div>
                  <span>Not generated</span>
                </span>
              ))}

            {/* Vertical separator */}
            {!isGenerating && (
              <div className='self-stretch flex items-center justify-center'>
                <div className='w-1 h-1 rounded-full bg-muted-foreground/10 dark:bg-muted-foreground/10'></div>
              </div>
            )}

            {/* Demographic preview */}
            <span className='inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/50 px-2 py-1 text-xs text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-900/30'>
              {(() => {
                const genders = (config.traitsConfig as TraitsConfig)?.demographics?.gender;
                return Array.isArray(genders) ? `${genders.length} genders` : 'No genders';
              })()}
            </span>

            {/* Income preview */}
            <span className='inline-flex items-center rounded-full bg-green-50 dark:bg-green-950/50 px-2 py-1 text-xs text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-700/10 dark:ring-green-900/30'>
              {(() => {
                const incomes = (config.traitsConfig as TraitsConfig)?.demographics?.income;
                return Array.isArray(incomes)
                  ? `${incomes.length} income levels`
                  : 'No income levels';
              })()}
            </span>

            {/* Education preview */}
            <span className='inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/50 px-2 py-1 text-xs text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/10 dark:ring-purple-900/30'>
              {(() => {
                const education = (config.traitsConfig as TraitsConfig)?.demographics?.education;
                return Array.isArray(education)
                  ? `${education.length} education levels`
                  : 'No education levels';
              })()}
            </span>

            {/* Location preview */}
            <span className='inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-950/50 px-2 py-1 text-xs text-orange-700 dark:text-orange-300 ring-1 ring-inset ring-orange-700/10 dark:ring-orange-900/30'>
              {(() => {
                const locations = (config.traitsConfig as TraitsConfig)?.demographics?.location;
                return Array.isArray(locations) ? `${locations.length} locations` : 'No locations';
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Separate generation progress section */}
      {getGenerationProgress()}

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
