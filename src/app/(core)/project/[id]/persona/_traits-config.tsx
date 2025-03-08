'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PERSONA_CONSTANTS, TraitsConfig } from '@/db/schema/persona';
import useHydration from '@/hooks/use-hydration';
import { useEffect, useRef, useState } from 'react';
import { Control, Controller, UseFormSetValue, UseFormWatch } from 'react-hook-form';

/**
 * Defines a structured type for the traitsConfig field
 */
export interface TraitsConfigField {
  auto?: boolean;
  // We're using 'any' here deliberately due to the complexity of possible value types
  // Could be arrays, ranges with min/max, or primitive values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // This index signature is needed for nested fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface FormData {
  name: string;
  description: string;
  size: number;
  constraints: string;
  traitsConfig: Record<string, TraitsConfigField>;
}

export interface FormComponentProps {
  control: Control<FormData>;
  watch: UseFormWatch<FormData>;
  setValue: UseFormSetValue<FormData>;
}

// Trait interfaces
export interface BaseTraitField {
  name: string;
  label: string;
}

export interface RangeTraitField extends BaseTraitField {
  type: 'range';
  min: number;
  max: number;
}

export interface MultiSelectTraitField extends BaseTraitField {
  type: 'multiSelect';
  options: Array<{ value: string; label: string }>;
}

export interface TraitGroupField extends BaseTraitField {
  type: 'group';
  fields: Array<RangeTraitField | MultiSelectTraitField>;
}

export type TraitField = RangeTraitField | MultiSelectTraitField;

/**
 * @description Component for managing trait configuration tabs and content
 */
export interface TraitsConfigurationSectionProps extends FormComponentProps {
  defaultTraitsConfig: TraitsConfig;
}

export function TraitsConfigurationSection({
  control,
  watch,
  setValue,
  defaultTraitsConfig,
}: TraitsConfigurationSectionProps) {
  const [activeTab, setActiveTab] = useState('demographics');
  const isHydrated = useHydration();

  // If not hydrated, show a minimal placeholder to prevent hydration mismatches
  if (!isHydrated) {
    return <div className='min-h-[200px]'></div>;
  }

  return (
    <Tabs defaultValue='demographics' value={activeTab} onValueChange={setActiveTab}>
      <TabsList className='mb-4'>
        <TabsTrigger value='demographics'>Demographics</TabsTrigger>
        <TabsTrigger value='psychographics'>Psychographics</TabsTrigger>
        <TabsTrigger value='behavior'>Behavior</TabsTrigger>
        <TabsTrigger value='personality'>Personality</TabsTrigger>
      </TabsList>

      <TabsContent value='demographics' forceMount hidden={activeTab !== 'demographics'}>
        <TraitCategory
          title='Demographics'
          description='Configure demographic traits such as age, gender, location, income, etc.'
          path='demographics'
          control={control}
          watch={watch}
          setValue={setValue}
          defaultConfig={defaultTraitsConfig.demographics}
          fields={[
            {
              name: 'age',
              label: 'Age Range',
              type: 'range',
              min: 0,
              max: 120,
            },
            {
              name: 'gender',
              label: 'Gender',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.GENDERS.map((g) => ({ value: g, label: g })),
            },
            {
              name: 'location',
              label: 'Locations',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.COMMON_LOCATIONS.map((l) => ({ value: l, label: l })),
            },
            {
              name: 'income',
              label: 'Income Brackets',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.INCOME_BRACKETS.map((i) => ({ value: i, label: i })),
            },
            {
              name: 'education',
              label: 'Education Levels',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.EDUCATION_LEVELS.map((e) => ({ value: e, label: e })),
            },
            {
              name: 'occupation',
              label: 'Occupations',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.COMMON_OCCUPATIONS.map((o) => ({ value: o, label: o })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value='psychographics' forceMount hidden={activeTab !== 'psychographics'}>
        <TraitCategory
          title='Psychographics'
          description='Configure psychographic traits such as values, interests, lifestyle, etc.'
          path='psychographics'
          control={control}
          watch={watch}
          setValue={setValue}
          defaultConfig={defaultTraitsConfig.psychographics}
          fields={[
            {
              name: 'values',
              label: 'Values',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.COMMON_VALUES.map((v) => ({ value: v, label: v })),
            },
            {
              name: 'interests',
              label: 'Interests',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.COMMON_INTERESTS.map((i) => ({ value: i, label: i })),
            },
            {
              name: 'lifestyle',
              label: 'Lifestyle',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.LIFESTYLES.map((l) => ({ value: l, label: l })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value='behavior' forceMount hidden={activeTab !== 'behavior'}>
        <TraitCategory
          title='Behavior'
          description='Configure behavioral traits such as budget, brand affinity, responsiveness, etc.'
          path='behavior'
          control={control}
          watch={watch}
          setValue={setValue}
          defaultConfig={defaultTraitsConfig.behavior}
          fields={[
            {
              name: 'budget',
              label: 'Budget Range',
              type: 'range',
              min: 0,
              max: 50000,
            },
            {
              name: 'brandAffinity',
              label: 'Brand Affinity Levels',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
            },
            {
              name: 'responsiveness',
              label: 'Responsiveness Levels',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
            },
            {
              name: 'spendingHabits',
              label: 'Spending Habits',
              type: 'multiSelect',
              options: PERSONA_CONSTANTS.SPENDING_HABITS.map((s) => ({ value: s, label: s })),
            },
          ]}
        />
      </TabsContent>

      <TabsContent value='personality' forceMount hidden={activeTab !== 'personality'}>
        <TraitCategory
          title='Personality Frameworks'
          description='Configure framework traits such as Big Five, consumer decision making, etc.'
          path='personalityFrameworks'
          control={control}
          watch={watch}
          setValue={setValue}
          defaultConfig={defaultTraitsConfig.personalityFrameworks}
          fields={[
            {
              name: 'bigFive',
              label: 'Big Five Personality Traits',
              type: 'group',
              fields: [
                {
                  name: 'openness',
                  label: 'Openness',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'conscientiousness',
                  label: 'Conscientiousness',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'extraversion',
                  label: 'Extraversion',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'agreeableness',
                  label: 'Agreeableness',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'neuroticism',
                  label: 'Neuroticism',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Consumer Decision-Making Models
            {
              name: 'consumerDecisionMaking',
              label: 'Consumer Decision-Making Models',
              type: 'group',
              fields: [
                {
                  name: 'rational',
                  label: 'Rational Decision-making',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'heuristic',
                  label: 'Heuristic Decision-making',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'emotional',
                  label: 'Emotional Decision-making',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Theory of Planned Behavior
            {
              name: 'theoryOfPlannedBehavior',
              label: 'Theory of Planned Behavior',
              type: 'group',
              fields: [
                {
                  name: 'attitude',
                  label: 'Attitude',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'subjectiveNorms',
                  label: 'Subjective Norms',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'perceivedBehavioralControl',
                  label: 'Perceived Behavioral Control',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Maslow's Hierarchy of Needs
            {
              name: 'maslow',
              label: "Maslow's Hierarchy of Needs",
              type: 'group',
              fields: [
                {
                  name: 'physiological',
                  label: 'Physiological Needs',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'safety',
                  label: 'Safety Needs',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'social',
                  label: 'Social Needs',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'esteem',
                  label: 'Esteem Needs',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'selfActualization',
                  label: 'Self-Actualization',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Fogg Behavior Model
            {
              name: 'fogg',
              label: 'Fogg Behavior Model',
              type: 'group',
              fields: [
                {
                  name: 'motivation',
                  label: 'Motivation',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'ability',
                  label: 'Ability',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'triggers',
                  label: 'Triggers',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add COM-B Model
            {
              name: 'comB',
              label: 'COM-B Model',
              type: 'group',
              fields: [
                {
                  name: 'capability',
                  label: 'Capability',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'opportunity',
                  label: 'Opportunity',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'motivation',
                  label: 'Motivation',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Behavioral Economics & Cognitive Biases
            {
              name: 'behavioralEconomics',
              label: 'Behavioral Economics & Cognitive Biases',
              type: 'group',
              fields: [
                {
                  name: 'anchoringBias',
                  label: 'Anchoring Bias',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'lossAversion',
                  label: 'Loss Aversion',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'socialProof',
                  label: 'Social Proof',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
            // Add Customer Journey Mapping
            {
              name: 'customerJourney',
              label: 'Customer Journey Mapping',
              type: 'group',
              fields: [
                {
                  name: 'touchpointsEngagement',
                  label: 'Touchpoints Engagement',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'painPointsSensitivity',
                  label: 'Pain Points Sensitivity',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
                {
                  name: 'conversionTriggersResponsiveness',
                  label: 'Conversion Triggers Responsiveness',
                  type: 'multiSelect',
                  options: PERSONA_CONSTANTS.LEVELS.map((l) => ({ value: l, label: l })),
                },
              ],
            },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}

/**
 * @description Component for a trait category (top-level section like demographics)
 */
interface TraitCategoryProps extends FormComponentProps {
  title: string;
  description: string;
  path: string;
  defaultConfig: Record<string, unknown>;
  fields: Array<TraitField | TraitGroupField>;
}

function TraitCategory({
  title,
  description,
  path,
  control,
  watch,
  setValue,
  defaultConfig,
  fields,
}: TraitCategoryProps) {
  // Local state to track auto toggle to ensure immediate UI updates
  const [isAuto, setIsAuto] = useState(true);
  // Ref to track if initialization has happened to prevent overriding
  const hasInitialized = useRef(false);
  const isHydrated = useHydration();

  // Watch the form value to stay in sync with external changes
  const autoValue = watch(`traitsConfig.${path}.auto`);

  // Also watch all child fields to detect if any are non-auto
  const watchedFieldValues = fields.map((field) => {
    // Use type assertion to make TypeScript happy
    const fieldPath = `traitsConfig.${path}.${field.name}.auto` as const;
    const fieldAuto = watch(fieldPath);
    return { name: field.name, auto: fieldAuto };
  });

  // Initialize auto value and sync with form state
  useEffect(() => {
    // Only initialize if we haven't already and there's no explicit value
    if (autoValue === undefined && !hasInitialized.current) {
      setValue(`traitsConfig.${path}.auto`, true);
      hasInitialized.current = true;
    }
    // If we already have a value, sync our local state with it
    else if (autoValue !== undefined) {
      setIsAuto(!!autoValue);
      hasInitialized.current = true;
    }
  }, [autoValue, path, setValue]);

  // Effect to synchronize with any changes to child fields
  useEffect(() => {
    // If any fields change their values, recheck if we should update the parent auto state
    const anyChildIsNotAuto = watchedFieldValues.some((field) => field.auto === false);

    if (anyChildIsNotAuto && (autoValue === true || autoValue === undefined)) {
      setIsAuto(false);
      setValue(`traitsConfig.${path}.auto`, false);
    }
  }, [watchedFieldValues, autoValue, path, setValue]);

  // Handler for toggling auto mode
  const handleAutoToggle = (checked: boolean) => {
    // Update local state immediately
    setIsAuto(checked);

    // Update form state
    setValue(`traitsConfig.${path}.auto`, checked);

    // If turning auto on, clear any custom values
    if (checked) {
      fields.forEach((field) => {
        setValue(`traitsConfig.${path}.${field.name}.auto`, true);
        setValue(`traitsConfig.${path}.${field.name}.value`, undefined);
      });
    }
  };

  // Prevent rendering until hydrated to avoid mismatches
  if (!isHydrated) {
    return null;
  }

  return (
    <div className='space-y-4'>
      {/* Category header with auto toggle */}
      <div className='flex items-center justify-between bg-muted/50 p-3 rounded-md'>
        <div>
          <h3 className='text-lg font-medium'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Label htmlFor={`auto-${path}`} className='text-sm'>
            Auto
          </Label>
          {/* Using 'as any' for dynamic path construction in react-hook-form */}
          <Controller
            name={`traitsConfig.${path}.auto` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            control={control}
            defaultValue={true}
            render={({ field: { onChange, value: _value, ...field } }) => (
              <Switch
                id={`auto-${path}`}
                checked={isAuto}
                onCheckedChange={(checked) => {
                  handleAutoToggle(checked);
                  onChange(checked);
                }}
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Show sub-items only when auto is off - using local state for immediate feedback */}
      {!isAuto && (
        <div className='space-y-3 pl-6 border-l-2 border-muted'>
          {fields.map((field) => {
            if (field.type === 'group') {
              return (
                <TraitGroup
                  key={field.name}
                  groupField={field}
                  path={`${path}.${field.name}`}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  defaultConfig={defaultConfig[field.name] as Record<string, unknown>}
                />
              );
            }

            return (
              <TraitField
                key={field.name}
                field={field}
                path={`${path}.${field.name}`}
                control={control}
                watch={watch}
                setValue={setValue}
                defaultValue={defaultConfig[field.name]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * @description Component for a group of traits (e.g., bigFive personality traits)
 */
interface TraitGroupProps extends FormComponentProps {
  groupField: TraitGroupField;
  path: string;
  defaultConfig: Record<string, unknown>;
}

function TraitGroup({
  groupField,
  path,
  control,
  watch,
  setValue,
  defaultConfig,
}: TraitGroupProps) {
  // Local state to track auto toggle to ensure immediate UI updates
  const [isAuto, setIsAuto] = useState(true);
  // Ref to track if initialization has happened to prevent overriding
  const hasInitialized = useRef(false);
  const isHydrated = useHydration();

  // Watch the form value to stay in sync with external changes
  const autoValue = watch(`traitsConfig.${path}.auto`);

  // Initialize auto value and sync with form state
  useEffect(() => {
    // Only initialize if we haven't already and there's no explicit value
    if (autoValue === undefined && !hasInitialized.current) {
      setValue(`traitsConfig.${path}.auto`, true);
      hasInitialized.current = true;
    }
    // If we already have a value, sync our local state with it
    else if (autoValue !== undefined) {
      setIsAuto(!!autoValue);
      hasInitialized.current = true;
    }
  }, [autoValue, path, setValue]);

  // Handler for toggling auto mode
  const handleAutoToggle = (checked: boolean) => {
    // Update local state immediately
    setIsAuto(checked);

    // Update form state
    setValue(`traitsConfig.${path}.auto`, checked);

    // If turning auto on, propagate to all children
    if (checked) {
      groupField.fields.forEach((field) => {
        setValue(`traitsConfig.${path}.${field.name}.auto`, true);
        setValue(`traitsConfig.${path}.${field.name}.value`, undefined);
      });
    }
  };

  // Prevent rendering until hydrated to avoid mismatches
  if (!isHydrated) {
    return null;
  }

  return (
    <div className='mb-4 p-2 rounded-md bg-muted/20'>
      <div className='flex items-center justify-between'>
        <h4 className='font-medium'>{groupField.label}</h4>
        <div className='flex items-center space-x-2'>
          <Label htmlFor={`auto-${path}`} className='text-sm'>
            Auto
          </Label>
          {/* Using 'as any' for dynamic path construction in react-hook-form */}
          <Controller
            name={`traitsConfig.${path}.auto` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            control={control}
            defaultValue={true}
            render={({ field: { onChange, value: _value, ...field } }) => (
              <Switch
                id={`auto-${path}`}
                checked={isAuto}
                onCheckedChange={(checked) => {
                  handleAutoToggle(checked);
                  onChange(checked);
                }}
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Show sub-fields only when auto is off - using local state for immediate feedback */}
      {!isAuto && (
        <div className='space-y-2 pl-6 border-l-2 border-muted/60 mt-2'>
          {groupField.fields.map((field) => (
            <TraitField
              key={field.name}
              field={field}
              path={`${path}.${field.name}`}
              control={control}
              watch={watch}
              setValue={setValue}
              defaultValue={defaultConfig?.[field.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @description Component for an individual trait field
 */
interface TraitFieldProps extends FormComponentProps {
  field: TraitField;
  path: string;
  defaultValue: unknown;
}

function TraitField({ field, path, control, watch, setValue, defaultValue }: TraitFieldProps) {
  // Local state to track auto toggle to ensure immediate UI updates
  const [isAuto, setIsAuto] = useState(true);
  // Ref to track if initialization has happened to prevent overriding
  const hasInitialized = useRef(false);
  const isHydrated = useHydration();

  // Watch the form value to stay in sync with external changes
  const autoValue = watch(`traitsConfig.${path}.auto`);

  // Helper type for defaultValue
  type RangeValue = { min: number; max: number };

  // Initialize auto value and sync with form state
  useEffect(() => {
    // Only initialize if we haven't already and there's no explicit value
    if (autoValue === undefined && !hasInitialized.current) {
      setValue(`traitsConfig.${path}.auto`, true);
      hasInitialized.current = true;
    }
    // If we already have a value, sync our local state with it
    else if (autoValue !== undefined) {
      setIsAuto(!!autoValue);
      hasInitialized.current = true;
    }
  }, [autoValue, path, setValue]);

  // Handler for toggling auto mode
  const handleAutoToggle = (checked: boolean) => {
    // Update local state immediately
    setIsAuto(checked);

    // Update form state
    setValue(`traitsConfig.${path}.auto`, checked);

    // If turning auto on, clear any custom values
    if (checked) {
      setValue(`traitsConfig.${path}.value`, undefined);
    }
  };

  // Prevent rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  // Render the appropriate input based on field type
  const renderFieldInput = () => {
    if (field.type === 'range') {
      // Use type assertion to avoid complex type issues
      const rangeDefault = defaultValue as RangeValue | undefined;

      return (
        <div className='grid grid-cols-2 gap-4 mt-2'>
          <div>
            <Label htmlFor={`${path}-min`}>Minimum</Label>
            {/* Using 'as any' for dynamic path construction in react-hook-form */}
            <Controller
              name={`traitsConfig.${path}.value.min` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
              control={control}
              defaultValue={rangeDefault?.min ?? field.min}
              render={({ field: { value, ...inputField } }) => (
                <Input
                  id={`${path}-min`}
                  type='number'
                  min={field.min}
                  max={field.max}
                  value={value || ''}
                  className='mt-1'
                  {...inputField}
                />
              )}
            />
          </div>
          <div>
            <Label htmlFor={`${path}-max`}>Maximum</Label>
            {/* Using 'as any' for dynamic path construction in react-hook-form */}
            <Controller
              name={`traitsConfig.${path}.value.max` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
              control={control}
              defaultValue={rangeDefault?.max ?? field.max}
              render={({ field: { value, ...inputField } }) => (
                <Input
                  id={`${path}-max`}
                  type='number'
                  min={field.min}
                  max={field.max}
                  value={value || ''}
                  className='mt-1'
                  {...inputField}
                />
              )}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'multiSelect') {
      return (
        <div className='mt-2'>
          <p className='text-sm mb-2'>Select Options:</p>
          {/* Change from grid to flex layout with wrapping for better use of space */}
          <div className='flex flex-wrap gap-2'>
            {field.options.map((option) => (
              <div key={option.value} className='flex items-center'>
                {/* Using 'as any' for dynamic path construction in react-hook-form */}
                <Controller
                  name={`traitsConfig.${path}.value` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                  control={control}
                  defaultValue={[]}
                  render={({ field: { value = [], onChange, ...checkboxField } }) => {
                    // Ensure value is an array for multiSelect fields
                    const currentValue = Array.isArray(value) ? value : [];

                    return (
                      <div className='flex items-center mr-2 bg-muted/20 px-2 py-1 rounded-md'>
                        <input
                          type='checkbox'
                          id={`${path}-${option.value}`}
                          checked={currentValue.includes(option.value)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...currentValue, option.value]
                              : currentValue.filter((v: string) => v !== option.value);
                            onChange(newValue);
                          }}
                          className='h-4 w-4 mr-1.5'
                          {...checkboxField}
                        />
                        <Label
                          htmlFor={`${path}-${option.value}`}
                          className='cursor-pointer text-sm whitespace-nowrap'
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className='py-2 px-2 mb-2 hover:bg-muted/10 rounded-md transition-colors'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>{field.label}</h4>
        <div className='flex items-center space-x-2'>
          <Label htmlFor={`auto-${path}`} className='text-sm'>
            Auto
          </Label>
          {/* Using 'as any' for dynamic path construction in react-hook-form */}
          <Controller
            name={`traitsConfig.${path}.auto` as any} // eslint-disable-line @typescript-eslint/no-explicit-any
            control={control}
            defaultValue={true}
            render={({ field: { onChange, value: _value, ...field } }) => (
              <Switch
                id={`auto-${path}`}
                checked={isAuto}
                onCheckedChange={(checked) => {
                  handleAutoToggle(checked);
                  onChange(checked);
                }}
                {...field}
              />
            )}
          />
        </div>
      </div>

      {/* Show input controls only when auto is off - using local state for immediate feedback */}
      {!isAuto && <div className='pl-6 border-l-2 border-muted/40'>{renderFieldInput()}</div>}
    </div>
  );
}
