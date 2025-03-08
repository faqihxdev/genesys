'use client';

import { Spinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { createDefaultTraitsConfigTemplate, TraitsConfig } from '@/db/schema/persona';
import useHydration from '@/hooks/use-hydration';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { createPersonaConfig, getPersonaConfigById, updatePersonaConfig } from '@/server/persona';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormData, TraitsConfigurationSection } from './_traits-config';

// Types
interface PersonaConfigFormProps {
  projectId: string;
  configId?: string; // Optional - if provided, we're editing an existing config
  onSuccess: () => void;
  onCancel: () => void;
}

// Form skeleton loader component
function FormSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Basic form fields skeleton */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='md:col-span-2'>
            <Skeleton className='h-5 w-32 mb-1' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div>
            <Skeleton className='h-5 w-24 mb-1' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>

        <div>
          <Skeleton className='h-5 w-28 mb-1' />
          <Skeleton className='h-24 w-full' />
        </div>

        <div>
          <Skeleton className='h-5 w-36 mb-1' />
          <Skeleton className='h-24 w-full' />
        </div>
      </div>

      {/* Traits section skeleton */}
      <div>
        <Skeleton className='h-6 w-40 mb-4' />
        <div className='space-y-2'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </div>

      {/* Footer buttons skeleton */}
      <div className='pt-4 mt-6 border-t flex justify-end gap-2'>
        <Skeleton className='h-10 w-20' />
        <Skeleton className='h-10 w-40' />
      </div>
    </div>
  );
}

/**
 * @description Form component for creating or editing a persona configuration
 * @param {PersonaConfigFormProps} props - Component props
 * @returns The persona config form component
 */
export default function PersonaConfigForm({
  projectId,
  configId,
  onSuccess,
  onCancel,
}: PersonaConfigFormProps) {
  const { control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      size: 30,
      constraints: '',
      traitsConfig: {},
    },
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isHydrated = useHydration();

  const [defaultTraitsConfig, setDefaultTraitsConfig] = useState<TraitsConfig | null>(null);
  const [formProcessed, setFormProcessed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(configId);

  // Fetch existing config if in edit mode using Tanstack Query
  const { data: existingConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: configId ? queryKey.persona.getPersonaConfigById({ id: configId }) : [],
    queryFn: () => (configId ? withQuery(getPersonaConfigById)({ id: configId }) : null),
    enabled: Boolean(configId) && isHydrated, // Only run the query if configId is provided and component is hydrated
  });

  // Fetch default traits config template
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsTemplateLoading(true);
        // The schema version is synchronous (not a server action)
        const template = createDefaultTraitsConfigTemplate();
        setDefaultTraitsConfig(template);
      } catch (error) {
        console.error('[PersonaConfigForm]: Error fetching template:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load traits configuration template',
        });
      } finally {
        setIsTemplateLoading(false);
      }
    };

    fetchTemplate();
  }, [toast]);

  // Populate form when existing config is loaded
  useEffect(() => {
    if (existingConfig && isEditMode) {
      reset({
        name: existingConfig.name,
        description: existingConfig.description || '',
        size: existingConfig.size,
        constraints: existingConfig.constraints || '',
        traitsConfig: {}, // Will be populated in the next effect
      });
    }
  }, [existingConfig, isEditMode, reset]);

  // Initialize form values for trait categories
  useEffect(() => {
    if (defaultTraitsConfig) {
      // Initialize with auto true for all sections by default (for new configs)
      if (!isEditMode) {
        setValue('traitsConfig.demographics.auto', true);
        setValue('traitsConfig.psychographics.auto', true);
        setValue('traitsConfig.behavior.auto', true);
        setValue('traitsConfig.personalityFrameworks.auto', true);
        setFormProcessed(true);
      }
      // For existing configs, map the traitsConfig back to form structure with auto flags
      else if (existingConfig && existingConfig.traitsConfig) {
        const originalConfig = existingConfig.traitsConfig as TraitsConfig;
        convertTraitsConfigToFormValues(originalConfig, defaultTraitsConfig);
        setFormProcessed(true);
      }
    }
  }, [defaultTraitsConfig, existingConfig, isEditMode, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * @description Converts a traits config object to form values with auto flags
   * @param originalConfig - The original traits configuration from the database
   * @param defaultConfig - The default traits configuration for comparison
   */
  const convertTraitsConfigToFormValues = (
    originalConfig: TraitsConfig,
    defaultConfig: TraitsConfig
  ) => {
    // Process top-level sections
    const sections = [
      'demographics',
      'psychographics',
      'behavior',
      'personalityFrameworks',
    ] as const;

    sections.forEach((section) => {
      // First, process all fields in the section to set their individual auto flags
      const sectionResults = processSectionAndGetResults(
        section,
        originalConfig[section] as Record<string, unknown>,
        defaultConfig[section] as Record<string, unknown>
      );

      // A section is auto only if ALL its fields are auto
      const isSectionAuto = sectionResults.customFieldCount === 0;

      // Set the section auto flag based on its fields
      setValue(`traitsConfig.${section}.auto`, isSectionAuto);
    });
  };

  /**
   * @description Process a section and return results about customized fields
   * @returns Object containing info about processed fields
   */
  const processSectionAndGetResults = (
    sectionPath: string,
    originalSection: Record<string, unknown>,
    defaultSection: Record<string, unknown>
  ) => {
    let customFieldCount = 0;

    // Process each field and count custom ones
    Object.keys(originalSection).forEach((key) => {
      const originalValue = originalSection[key];
      const defaultValue = defaultSection[key];

      // Check if it's a range object (like age)
      const isRangeObject =
        originalValue &&
        typeof originalValue === 'object' &&
        'min' in (originalValue as Record<string, unknown>) &&
        'max' in (originalValue as Record<string, unknown>);

      // Check if this specific field matches its default value
      const isUsingDefault = compareObjects(originalValue, defaultValue);

      if (!isUsingDefault) {
        customFieldCount++;
      }

      // Set auto flag for this specific field
      const autoPath = `traitsConfig.${sectionPath}.${key}.auto` as const;
      setValue(autoPath, isUsingDefault);

      // Set the value if it's custom (non-default)
      if (!isUsingDefault) {
        const valuePath = `traitsConfig.${sectionPath}.${key}.value` as const;
        setValue(valuePath, originalValue);
      }

      // Recursively process nested objects (except range objects)
      if (
        originalValue &&
        typeof originalValue === 'object' &&
        !Array.isArray(originalValue) &&
        defaultValue &&
        typeof defaultValue === 'object' &&
        !isRangeObject
      ) {
        // Process the nested object recursively
        const nestedResults = processSectionAndGetResults(
          `${sectionPath}.${key}`,
          originalValue as Record<string, unknown>,
          defaultValue as Record<string, unknown>
        );

        // Add nested custom fields to our count
        customFieldCount += nestedResults.customFieldCount;
      }
    });

    return { customFieldCount };
  };

  /**
   * @description Compare two objects to see if they're equal
   * @param obj1 - First object to compare
   * @param obj2 - Second object to compare
   * @returns Whether the objects are deeply equal
   */
  const compareObjects = (obj1: unknown, obj2: unknown): boolean => {
    // For arrays, check if they contain the same elements
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      // Sort arrays to ensure consistent comparison
      const sortedArr1 = [...obj1].sort();
      const sortedArr2 = [...obj2].sort();
      return JSON.stringify(sortedArr1) === JSON.stringify(sortedArr2);
    }

    // For range objects, check if they have the same ranges
    if (
      obj1 &&
      typeof obj1 === 'object' &&
      'min' in (obj1 as Record<string, unknown>) &&
      'max' in (obj1 as Record<string, unknown>) &&
      obj2 &&
      typeof obj2 === 'object' &&
      'min' in (obj2 as Record<string, unknown>) &&
      'max' in (obj2 as Record<string, unknown>)
    ) {
      const range1 = obj1 as { min: number; max: number };
      const range2 = obj2 as { min: number; max: number };

      return range1.min === range2.min && range1.max === range2.max;
    }

    // For nested objects, use recursive deep comparison
    if (
      obj1 &&
      typeof obj1 === 'object' &&
      !Array.isArray(obj1) &&
      obj2 &&
      typeof obj2 === 'object' &&
      !Array.isArray(obj2)
    ) {
      const keys1 = Object.keys(obj1 as Record<string, unknown>);
      const keys2 = Object.keys(obj2 as Record<string, unknown>);

      // If they have different keys, they're not equal
      if (keys1.length !== keys2.length) {
        return false;
      }

      // Check if all keys in obj1 match with obj2
      return keys1.every((key) => {
        const val1 = (obj1 as Record<string, unknown>)[key];
        const val2 = (obj2 as Record<string, unknown>)[key];
        return compareObjects(val1, val2);
      });
    }

    // For simple values, use direct comparison
    return obj1 === obj2;
  };

  const onSubmit = (data: FormData) => {
    if (!defaultTraitsConfig) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Traits configuration template not loaded',
      });
      return;
    }

    // Generate final traits config based on auto/custom settings
    const finalTraitsConfig = generateFinalTraitsConfig(data.traitsConfig, defaultTraitsConfig);

    // Prepare the data for submission, ensuring size is a number
    const configData = {
      name: data.name,
      description: data.description,
      size: Number(data.size), // Convert to number
      constraints: data.constraints,
      traitsConfig: finalTraitsConfig,
    };

    // Submit to the server using the appropriate server action
    const saveConfig = async () => {
      setIsSubmitting(true);
      try {
        let result;
        let isCreate = false;

        if (isEditMode && configId) {
          // Update existing config
          result = await updatePersonaConfig({
            id: configId,
            ...configData,
          });
        } else {
          // Create new config
          isCreate = true;
          result = await createPersonaConfig({
            projectId,
            type: 'custom' as const,
            ...configData,
          });
        }

        if ('error' in result && result.error) {
          console.error('[PersonaConfigForm]: Error saving persona configuration:', result.error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error.message || 'Failed to save persona configuration',
          });
          return;
        }

        // Invalidate queries to ensure UI is up-to-date
        if (isEditMode && configId) {
          // For edit, invalidate the specific config and the project list
          queryClient.invalidateQueries({
            queryKey: queryKey.persona.getPersonaConfigById({ id: configId }),
          });
        }

        // Always invalidate the project list for both create and edit
        queryClient.invalidateQueries({
          queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
        });

        // If we created a new config, we may need its ID for further operations
        if (isCreate && 'id' in result) {
          // New config created successfully, but we don't need the ID right now
        }

        onSuccess();
      } catch (error) {
        console.error('[PersonaConfigForm]: Failed to save persona configuration:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save persona configuration',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    saveConfig();
  };

  /**
   * @description Generates the final traits configuration based on auto/custom settings
   * @param formTraitsConfig - The form traits configuration with auto flags
   * @param defaultConfig - The default traits configuration
   * @returns The final traits configuration
   */
  const generateFinalTraitsConfig = (
    formTraitsConfig: Record<string, unknown>,
    defaultConfig: TraitsConfig
  ): TraitsConfig => {
    // Create a deep copy of the default config to avoid mutations
    const finalConfig = JSON.parse(JSON.stringify(defaultConfig)) as TraitsConfig;

    // Helper function to process each section of the configuration
    const processSection = (
      formSection: Record<string, unknown>,
      defaultSection: Record<string, unknown>,
      resultSection: Record<string, unknown>
    ) => {
      // Iterate through each key in the form section
      Object.keys(formSection).forEach((key) => {
        // Skip the "auto" flags as they're just for UI control
        if (key === 'auto') return;

        const formValue = formSection[key];

        // Type guard for formValue with auto and value properties
        interface AutoFormValue {
          auto: boolean;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value: any; // Using any here since value can be various types
        }

        // If this is a nested object with its own auto flag
        if (formValue && typeof formValue === 'object' && 'auto' in formValue) {
          // Cast to our interface with proper shape
          const typedFormValue = formValue as AutoFormValue;

          // If auto is false, use the custom values
          if (typedFormValue.auto === false && typedFormValue.value !== undefined) {
            // Handle different value types
            if (key === 'age' && typeof typedFormValue.value === 'object') {
              // Handle age range specifically
              const ageValue = typedFormValue.value as { min?: number; max?: number };
              if (ageValue.min !== undefined) {
                (resultSection[key] as { min: number }).min = Number(ageValue.min);
              }
              if (ageValue.max !== undefined) {
                (resultSection[key] as { max: number }).max = Number(ageValue.max);
              }
            } else if (key === 'budget' && typeof typedFormValue.value === 'object') {
              // Handle budget range
              const budgetValue = typedFormValue.value as { min?: number; max?: number };
              if (budgetValue.min !== undefined) {
                (resultSection[key] as { min: number }).min = Number(budgetValue.min);
              }
              if (budgetValue.max !== undefined) {
                (resultSection[key] as { max: number }).max = Number(budgetValue.max);
              }
            } else {
              // Handle arrays and other types
              resultSection[key] = Array.isArray(typedFormValue.value)
                ? typedFormValue.value
                : typedFormValue.value;
            }
          }

          // If this has nested properties, process them recursively
          if (
            formValue &&
            typeof formValue === 'object' &&
            Object.keys(formValue).some((k) => k !== 'auto' && k !== 'value')
          ) {
            processSection(
              formValue as Record<string, unknown>,
              defaultSection[key] as Record<string, unknown>,
              resultSection[key] as Record<string, unknown>
            );
          }
        }
      });
    };

    // Process each top-level section
    Object.keys(formTraitsConfig).forEach((section) => {
      if (
        section in finalConfig &&
        typeof formTraitsConfig[section] === 'object' &&
        formTraitsConfig[section] !== null
      ) {
        const formSection = formTraitsConfig[section] as Record<string, unknown>;

        // If section has auto=false, process its fields
        if (formSection.auto === false) {
          processSection(
            formSection,
            defaultConfig[section as keyof TraitsConfig] as Record<string, unknown>,
            finalConfig[section as keyof TraitsConfig] as Record<string, unknown>
          );
        }
      }
    });

    return finalConfig;
  };

  // Combined loading state
  const isLoading = isTemplateLoading || (isEditMode && isConfigLoading);
  const showContent = isHydrated && !isLoading && formProcessed && defaultTraitsConfig;

  // Show a loading indicator or nothing during server rendering
  if (!showContent) {
    return (
      <div className='flex flex-col h-full'>
        <FormSkeleton />
      </div>
    );
  }

  if (!defaultTraitsConfig) {
    return (
      <div className='p-6 text-center'>
        <p className='text-destructive'>Failed to load traits configuration template.</p>
        <Button className='mt-4' onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col max-h-[85vh]'>
      <DialogHeader className='pb-4'>
        <DialogTitle>
          {isEditMode ? 'Edit Persona Configuration' : 'Create New Persona Configuration'}
        </DialogTitle>
        <DialogDescription>
          {isEditMode
            ? 'Edit the existing persona configuration settings.'
            : 'Define a new set of persona traits to generate synthetic customer personas.'}
        </DialogDescription>
      </DialogHeader>

      {/* Use custom scrollbar styling for a more elegant appearance */}
      <div className='b-2 px-1 -mx-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width]:none'>
        <div className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            {/* Put configuration name and number of personas in the same row */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='md:col-span-2'>
                <Label htmlFor='name'>Configuration Name</Label>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id='name'
                        placeholder='e.g., Tech-savvy Millennials'
                        className='mt-1'
                        {...field}
                      />
                      {fieldState.error && (
                        <p className='text-sm text-red-500 mt-1'>{fieldState.error.message}</p>
                      )}
                    </>
                  )}
                />
              </div>

              <div>
                <Label htmlFor='size'>Number of Personas</Label>
                <Controller
                  name='size'
                  control={control}
                  rules={{
                    required: 'Size is required',
                    min: { value: 1, message: 'Must generate at least 1 persona' },
                    max: { value: 100, message: 'Cannot generate more than 100 personas' },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        id='size'
                        type='number'
                        min={1}
                        max={100}
                        className='mt-1'
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value}
                      />
                      {fieldState.error && (
                        <p className='text-sm text-red-500 mt-1'>{fieldState.error.message}</p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor='description'>Description</Label>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <Textarea
                    id='description'
                    placeholder='Describe this persona configuration'
                    className='mt-1'
                    {...field}
                  />
                )}
              />
            </div>

            {/* Custom Constraints - moved above traits configuration */}
            <div>
              <Label htmlFor='constraints'>Custom Constraints</Label>
              <Controller
                name='constraints'
                control={control}
                render={({ field }) => (
                  <Textarea
                    id='constraints'
                    placeholder='Add any specific constraints for persona generation'
                    className='mt-1 h-24'
                    {...field}
                  />
                )}
              />
              <p className='text-xs text-muted-foreground mt-1'>
                Specify any custom requirements or constraints for persona generation
              </p>
            </div>
          </div>

          {/* Traits Configuration - moved to a separate component */}
          <div>
            <h3 className='text-lg font-medium mb-4'>Traits Configuration</h3>
            <TraitsConfigurationSection
              control={control}
              watch={watch}
              setValue={setValue}
              defaultTraitsConfig={defaultTraitsConfig}
            />
          </div>
        </div>
      </div>

      <DialogFooter className='mt-6 pt-4 border-t'>
        <Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size='sm' />
              <span className='ml-2'>{isEditMode ? 'Saving...' : 'Creating...'}</span>
            </>
          ) : isEditMode ? (
            'Save Changes'
          ) : (
            'Create Persona Config'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
