'use client';

import { PageTitle } from '@/components/custom/page-title';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonaConfig } from '@/db/schema/persona';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { deletePersonaConfig, getPersonaConfigsByProject } from '@/server/persona';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  Edit,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  User,
  Users,
} from 'lucide-react';
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

  return (
    <div className='container py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Persona Configurations'
          description='Create and manage synthetic customer personas to simulate unique behaviors through marketing funnels.'
        />
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Add Persona Config
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl max-h-[90vh]'>
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
        <div className='flex justify-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Close both dropdown menus when opening delete confirmation
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
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
        className={`flex items-center justify-center w-12 h-12 rounded-full ${
          config.type === 'preset'
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
        }`}
      >
        {config.type === 'preset' ? <Users className='h-6 w-6' /> : <User className='h-6 w-6' />}
      </div>

      {/* Content Section */}
      <div className='flex-1'>
        <div className='flex items-start gap-2'>
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

      {/* Actions Section */}
      <div className='flex items-center space-x-2 self-end md:self-center'>
        <Button variant='outline' size='sm' className='hidden md:flex' onClick={onEdit}>
          <Edit className='h-4 w-4 mr-1.5' />
          <span>Edit</span>
        </Button>

        <Button variant='default' size='sm' className='hidden md:flex'>
          <ArrowRight className='h-4 w-4 mr-1.5' />
          <span>View</span>
        </Button>

        {/* Mobile actions */}
        <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='md:hidden'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Edit className='h-4 w-4 mr-1.5' />
              Edit Configuration
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ArrowRight className='h-4 w-4 mr-1.5' />
              View Personas
            </DropdownMenuItem>
            <DropdownMenuItem className='text-destructive' onClick={handleDeleteClick}>
              <Trash2 className='h-4 w-4 mr-1.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='hidden md:flex'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>More Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className='h-4 w-4 mr-1.5' />
              Configure Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive' onClick={handleDeleteClick}>
              <Trash2 className='h-4 w-4 mr-1.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
                    <div className='animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full' />
                    <span>Deleting...</span>
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
