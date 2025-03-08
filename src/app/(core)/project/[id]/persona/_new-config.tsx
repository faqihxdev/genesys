'use client';

import { Button } from '@/components/ui/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TraitsConfig } from '@/db/schema/persona';
import { createDefaultTraitsConfigTemplate } from '@/server/persona';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormData, TraitsConfigurationSection } from './_traits-config';

// Types
interface PersonaConfigFormProps {
  projectId: string;
  onSuccess: () => void;
}

/**
 * @description Form component for creating a new persona configuration
 * @param {PersonaConfigFormProps} props - Component props
 * @returns The persona config form component
 */
export default function PersonaConfigForm({ projectId, onSuccess }: PersonaConfigFormProps) {
  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      size: 30,
      constraints: '',
      traitsConfig: {},
    },
  });

  const defaultTraitsConfig = createDefaultTraitsConfigTemplate();

  // Initialize default "auto: true" values for all trait categories
  useEffect(() => {
    setValue('traitsConfig.demographics.auto', true);
    setValue('traitsConfig.psychographics.auto', true);
    setValue('traitsConfig.behavior.auto', true);
    setValue('traitsConfig.personalityFrameworks.auto', true);
  }, [setValue]);

  const onSubmit = (data: FormData) => {
    // Store projectId with the data
    const configWithProjectId = {
      ...data,
      projectId,
    };

    // In a real implementation, this would save to the database
    console.log('Form submitted with:', configWithProjectId);

    // Generate final traits config based on auto/custom settings
    const finalTraitsConfig = generateFinalTraitsConfig(data.traitsConfig, defaultTraitsConfig);
    console.log('Final traits config:', finalTraitsConfig);

    onSuccess();
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
      formSection: Record<string, any>,
      defaultSection: Record<string, any>,
      resultSection: Record<string, any>
    ) => {
      // Iterate through each key in the form section
      Object.keys(formSection).forEach((key) => {
        // Skip the "auto" flags as they're just for UI control
        if (key === 'auto') return;

        const formValue = formSection[key];

        // If this is a nested object with its own auto flag
        if (formValue && typeof formValue === 'object' && 'auto' in formValue) {
          // If auto is false, use the custom values
          if (formValue.auto === false && formValue.value !== undefined) {
            // Handle different value types
            if (key === 'age' && typeof formValue.value === 'object') {
              // Handle age range specifically
              const ageValue = formValue.value;
              if (ageValue.min !== undefined) {
                resultSection[key].min = Number(ageValue.min);
              }
              if (ageValue.max !== undefined) {
                resultSection[key].max = Number(ageValue.max);
              }
            } else if (key === 'budget' && typeof formValue.value === 'object') {
              // Handle budget range
              const budgetValue = formValue.value;
              if (budgetValue.min !== undefined) {
                resultSection[key].min = Number(budgetValue.min);
              }
              if (budgetValue.max !== undefined) {
                resultSection[key].max = Number(budgetValue.max);
              }
            } else {
              // Handle arrays and other types
              resultSection[key] = Array.isArray(formValue.value)
                ? formValue.value
                : formValue.value;
            }
          }

          // If this has nested properties, process them recursively
          if (
            formValue &&
            typeof formValue === 'object' &&
            Object.keys(formValue).some((k) => k !== 'auto' && k !== 'value')
          ) {
            processSection(formValue, defaultSection[key], resultSection[key]);
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
        const formSection = formTraitsConfig[section] as Record<string, any>;

        // If section has auto=false, process its fields
        if (formSection.auto === false) {
          processSection(
            formSection,
            defaultConfig[section as keyof TraitsConfig],
            finalConfig[section as keyof TraitsConfig]
          );
        }
      }
    });

    console.log('Form traits config:', formTraitsConfig);
    console.log('Generated final config:', finalConfig);

    return finalConfig;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col max-h-[85vh]'>
      <DialogHeader className='pb-4'>
        <DialogTitle>Create New Persona Configuration</DialogTitle>
        <DialogDescription>
          Define a new set of persona traits to generate synthetic customer personas.
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
                        {...field}
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
            <h3 className='text-2xl font-medium mb-4'>Traits Configuration</h3>
            <TraitsConfigurationSection
              control={control}
              watch={watch}
              setValue={setValue}
              defaultTraitsConfig={defaultTraitsConfig}
            />
          </div>
        </div>
      </div>

      <DialogFooter className='pt-4'>
        <Button type='button' variant='outline' onClick={onSuccess}>
          Cancel
        </Button>
        <Button type='submit'>Create Persona Config</Button>
      </DialogFooter>
    </form>
  );
}
