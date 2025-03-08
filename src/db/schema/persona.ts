import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { ID_LENGTH, timestamps } from './_utils';
import { projects } from './project';

/**
 * Constants for persona traits to ensure consistency across the application
 */
export const PERSONA_CONSTANTS = {
  LEVELS: ['low', 'medium', 'high'] as const,
  GENDERS: ['male', 'female', 'non-binary', 'prefer not to say'] as const,
  INCOME_BRACKETS: ['low', 'lower-middle', 'middle', 'upper-middle', 'high', 'affluent'] as const,
  EDUCATION_LEVELS: ['None', 'High School', 'Bachelor', 'Master', 'PhD', 'Other'] as const,
  LIFESTYLES: [
    'pragmatic',
    'adventurous',
    'family-oriented',
    'luxury',
    'eco-conscious',
    'tech-savvy',
    'trendy',
  ] as const,
  SPENDING_HABITS: ['frugal', 'moderate', 'impulsive', 'luxury'] as const,
  COMMON_OCCUPATIONS: [
    'Student',
    'Professional',
    'Manager',
    'Executive',
    'Business Owner',
    'Retired',
    'Unemployed',
  ] as const,
  COMMON_LOCATIONS: [
    'United States',
    'Canada',
    'United Kingdom',
    'Australia',
    'Germany',
    'France',
    'Japan',
  ] as const,
  COMMON_VALUES: [
    'Family',
    'Career',
    'Health',
    'Education',
    'Sustainability',
    'Adventure',
    'Creativity',
  ] as const,
  COMMON_INTERESTS: [
    'Technology',
    'Travel',
    'Fitness',
    'Food',
    'Fashion',
    'Arts',
    'Sports',
    'Reading',
  ] as const,
};

// Derived types from constants
export type Level = (typeof PERSONA_CONSTANTS.LEVELS)[number];
export type Gender = (typeof PERSONA_CONSTANTS.GENDERS)[number];
export type IncomeBracket = (typeof PERSONA_CONSTANTS.INCOME_BRACKETS)[number];
export type EducationLevel = (typeof PERSONA_CONSTANTS.EDUCATION_LEVELS)[number];
export type Lifestyle = (typeof PERSONA_CONSTANTS.LIFESTYLES)[number];
export type SpendingHabit = (typeof PERSONA_CONSTANTS.SPENDING_HABITS)[number];

/**
 * Traits for an individual persona
 * Contains concrete values selected from the ranges/options defined in TraitsConfig
 */
export type Traits = {
  // Demographics
  demographics: {
    age: number; // Age (0-120)
    gender: Gender;
    location: string; // Geographic location (e.g., country, city)
    income: IncomeBracket; // Income brackets commonly used in research
    education: EducationLevel; // Education levels commonly used in research
    occupation: string; // Occupation of the persona (Any string)
  };

  // Psychographics
  psychographics: {
    values: string[]; // Core beliefs and principles
    interests: string[]; // Hobbies or areas of interest
    lifestyle: Lifestyle;
  };

  // Behavior
  behavior: {
    budget: number; // Spending budget/disposable income (>= 0)
    brandAffinity: Level; // Loyalty/affinity to brands
    responsiveness: Level; // Reaction to marketing stimuli
    spendingHabits: SpendingHabit; // Spending habits commonly used in research
  };

  // Personality Frameworks
  personalityFrameworks: {
    // Big Five personality traits
    bigFive: {
      openness: Level; // Openness to Experience
      conscientiousness: Level; // Conscientiousness
      extraversion: Level; // Extraversion
      agreeableness: Level; // Agreeableness
      neuroticism: Level; // Neuroticism
    };

    // Consumer Decision-Making Models
    consumerDecisionMaking: {
      rational: Level; // Rational decision-making
      heuristic: Level; // Heuristic decision-making
      emotional: Level; // Emotional decision-making
    };

    // Theory of Planned Behavior
    theoryOfPlannedBehavior: {
      attitude: Level; // Overall evaluation of behavior
      subjectiveNorms: Level; // Influence of social pressure
      perceivedBehavioralControl: Level; // Ease of performing the behavior
    };

    // Maslow's Hierarchy of Needs
    maslow: {
      physiological: Level; // Priority of physiological needs
      safety: Level; // Priority of safety needs
      social: Level; // Priority of social needs
      esteem: Level; // Priority of esteem needs
      selfActualization: Level; // Priority of self-actualization
    };

    // Fogg Behavior Model
    fogg: {
      motivation: Level; // Motivation level
      ability: Level; // Ease of action (ability)
      triggers: Level; // Sensitivity to triggers
    };

    // COM-B Model
    comB: {
      capability: Level; // Physical/mental capability
      opportunity: Level; // External opportunity (time, money, support)
      motivation: Level; // Motivation from COM-B perspective
    };

    // Behavioral Economics & Cognitive Biases
    behavioralEconomics: {
      anchoringBias: Level; // Tendency for anchoring bias
      lossAversion: Level; // Degree of loss aversion
      socialProof: Level; // Sensitivity to social proof
    };

    // Customer Journey Mapping
    customerJourney: {
      touchpointsEngagement: Level; // Engagement with touchpoints
      painPointsSensitivity: Level; // Sensitivity to friction or pain points
      conversionTriggersResponsiveness: Level; // Responsiveness to conversion triggers
    };
  };
};

/**
 * TraitsConfig for persona configurations
 * Contains ranges and options from which concrete Traits values are generated
 */
export type TraitsConfig = {
  // Demographics
  demographics: {
    age: { min: number; max: number }; // Age range (0-120)
    gender: Gender[]; // Possible gender options
    location: string[]; // Possible geographic locations
    income: IncomeBracket[]; // Possible income brackets
    education: EducationLevel[]; // Possible education levels
    occupation: string[]; // Possible occupations
  };

  // Psychographics
  psychographics: {
    values: string[]; // Possible core beliefs and principles
    interests: string[]; // Possible hobbies or areas of interest
    lifestyle: Lifestyle[]; // Possible lifestyle options
  };

  // Behavior
  behavior: {
    budget: { min: number; max: number }; // Budget range
    brandAffinity: Level[]; // Possible loyalty/affinity levels
    responsiveness: Level[]; // Possible reaction levels
    spendingHabits: SpendingHabit[]; // Possible spending habits
  };

  // Personality Frameworks
  personalityFrameworks: {
    // Big Five personality traits
    bigFive: {
      openness: Level[]; // Possible openness levels
      conscientiousness: Level[]; // Possible conscientiousness levels
      extraversion: Level[]; // Possible extraversion levels
      agreeableness: Level[]; // Possible agreeableness levels
      neuroticism: Level[]; // Possible neuroticism levels
    };

    // Consumer Decision-Making Models
    consumerDecisionMaking: {
      rational: Level[]; // Possible rational decision-making levels
      heuristic: Level[]; // Possible heuristic decision-making levels
      emotional: Level[]; // Possible emotional decision-making levels
    };

    // Theory of Planned Behavior
    theoryOfPlannedBehavior: {
      attitude: Level[]; // Possible attitude levels
      subjectiveNorms: Level[]; // Possible social pressure influence levels
      perceivedBehavioralControl: Level[]; // Possible behavioral control levels
    };

    // Maslow's Hierarchy of Needs
    maslow: {
      physiological: Level[]; // Possible physiological needs priority levels
      safety: Level[]; // Possible safety needs priority levels
      social: Level[]; // Possible social needs priority levels
      esteem: Level[]; // Possible esteem needs priority levels
      selfActualization: Level[]; // Possible self-actualization priority levels
    };

    // Fogg Behavior Model
    fogg: {
      motivation: Level[]; // Possible motivation levels
      ability: Level[]; // Possible ability levels
      triggers: Level[]; // Possible trigger sensitivity levels
    };

    // COM-B Model
    comB: {
      capability: Level[]; // Possible capability levels
      opportunity: Level[]; // Possible opportunity levels
      motivation: Level[]; // Possible motivation levels
    };

    // Behavioral Economics & Cognitive Biases
    behavioralEconomics: {
      anchoringBias: Level[]; // Possible anchoring bias tendency levels
      lossAversion: Level[]; // Possible loss aversion degree levels
      socialProof: Level[]; // Possible social proof sensitivity levels
    };

    // Customer Journey Mapping
    customerJourney: {
      touchpointsEngagement: Level[]; // Possible touchpoint engagement levels
      painPointsSensitivity: Level[]; // Possible friction sensitivity levels
      conversionTriggersResponsiveness: Level[]; // Possible conversion trigger responsiveness levels
    };
  };
};

/**
 * Zod schema for Level type validation
 */
export const LevelSchema = z.enum(PERSONA_CONSTANTS.LEVELS);

/**
 * Zod schemas for other enums
 */
export const GenderSchema = z.enum(PERSONA_CONSTANTS.GENDERS);
export const IncomeBracketSchema = z.enum(PERSONA_CONSTANTS.INCOME_BRACKETS);
export const EducationLevelSchema = z.enum(PERSONA_CONSTANTS.EDUCATION_LEVELS);
export const LifestyleSchema = z.enum(PERSONA_CONSTANTS.LIFESTYLES);
export const SpendingHabitSchema = z.enum(PERSONA_CONSTANTS.SPENDING_HABITS);

/**
 * Zod schema for Traits validation
 */
export const TraitsSchema = z.object({
  demographics: z.object({
    age: z.number().min(0).max(120),
    gender: GenderSchema,
    location: z.string(),
    income: IncomeBracketSchema,
    education: EducationLevelSchema,
    occupation: z.string(),
  }),
  psychographics: z.object({
    values: z.array(z.string()),
    interests: z.array(z.string()),
    lifestyle: LifestyleSchema,
  }),
  behavior: z.object({
    budget: z.number().min(0),
    brandAffinity: LevelSchema,
    responsiveness: LevelSchema,
    spendingHabits: SpendingHabitSchema,
  }),
  personalityFrameworks: z.object({
    bigFive: z.object({
      openness: LevelSchema,
      conscientiousness: LevelSchema,
      extraversion: LevelSchema,
      agreeableness: LevelSchema,
      neuroticism: LevelSchema,
    }),
    consumerDecisionMaking: z.object({
      rational: LevelSchema,
      heuristic: LevelSchema,
      emotional: LevelSchema,
    }),
    theoryOfPlannedBehavior: z.object({
      attitude: LevelSchema,
      subjectiveNorms: LevelSchema,
      perceivedBehavioralControl: LevelSchema,
    }),
    maslow: z.object({
      physiological: LevelSchema,
      safety: LevelSchema,
      social: LevelSchema,
      esteem: LevelSchema,
      selfActualization: LevelSchema,
    }),
    fogg: z.object({
      motivation: LevelSchema,
      ability: LevelSchema,
      triggers: LevelSchema,
    }),
    comB: z.object({
      capability: LevelSchema,
      opportunity: LevelSchema,
      motivation: LevelSchema,
    }),
    behavioralEconomics: z.object({
      anchoringBias: LevelSchema,
      lossAversion: LevelSchema,
      socialProof: LevelSchema,
    }),
    customerJourney: z.object({
      touchpointsEngagement: LevelSchema,
      painPointsSensitivity: LevelSchema,
      conversionTriggersResponsiveness: LevelSchema,
    }),
  }),
});

/**
 * Persona config type enum
 * Defines whether the persona configuration is a preset or custom
 */
export const personaConfigTypeEnum = pgEnum('persona_config_type', ['preset', 'custom']);

/**
 * Persona config table
 * Represents a configuration for generating multiple personas with specific characteristics
 */
export const personaConfigs = pgTable(
  'persona_configs',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'pcg-' }))
      .primaryKey(),
    projectId: text() // FK: which project is this persona config for?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    name: text().notNull(), // user reference: name of the persona config
    description: text(), // user reference: description of the persona config
    type: personaConfigTypeEnum().notNull().default('custom'), // config is preset or custom
    size: integer().notNull(), // number of personas to generate
    constraints: text().notNull(), // custom constraints to generate the persona
    traitsConfig: jsonb().notNull(), // configuration for traits with ranges/options
    ...timestamps,
  },
  (table) => [
    index('persona_config_project_id_idx').on(table.projectId),
    index('persona_config_name_idx').on(table.name),
    index('persona_config_type_idx').on(table.type),
  ]
);

/**
 * Persona table
 * Represents an individual persona generated from a persona config
 */
export const personas = pgTable(
  'personas',
  {
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'prs-' }))
      .primaryKey(),
    personaConfigId: text() // FK: which persona config is this persona for?
      .references(() => personaConfigs.id, { onDelete: 'cascade' })
      .notNull(),
    name: text().notNull(), // user reference: name of the persona
    description: text(), // user reference: description of the persona
    traits: jsonb().notNull(), // traits of the persona (specific values from config)
    ...timestamps,
  },
  (table) => [
    index('persona_persona_config_id_idx').on(table.personaConfigId),
    index('persona_name_idx').on(table.name),
  ]
);

/**
 * One persona config to one project and many personas
 */
export const personaConfigsRelations = relations(personaConfigs, ({ one, many }) => ({
  project: one(projects, {
    fields: [personaConfigs.projectId],
    references: [projects.id],
  }),
  personas: many(personas),
}));

/**
 * One persona to one persona config
 */
export const personasRelations = relations(personas, ({ one }) => ({
  config: one(personaConfigs, {
    fields: [personas.personaConfigId],
    references: [personaConfigs.id],
  }),
}));

// Inferred types
export type PersonaConfig = typeof personaConfigs.$inferSelect;
export type NewPersonaConfig = typeof personaConfigs.$inferInsert;
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type PersonaConfigType = (typeof personaConfigTypeEnum.enumValues)[number];

// Extended types
export interface PersonaConfigWithPersonas extends PersonaConfig {
  personas: Persona[];
}

/**
 * Zod schema for TraitsConfig validation
 */
export const TraitsConfigSchema = z.object({
  demographics: z.object({
    age: z.object({
      min: z.number().min(0),
      max: z.number().max(120),
    }),
    gender: z.array(GenderSchema),
    location: z.array(z.string()),
    income: z.array(IncomeBracketSchema),
    education: z.array(EducationLevelSchema),
    occupation: z.array(z.string()),
  }),
  psychographics: z.object({
    values: z.array(z.string()),
    interests: z.array(z.string()),
    lifestyle: z.array(LifestyleSchema),
  }),
  behavior: z.object({
    budget: z.object({
      min: z.number().min(0),
      max: z.number(),
    }),
    brandAffinity: z.array(LevelSchema),
    responsiveness: z.array(LevelSchema),
    spendingHabits: z.array(SpendingHabitSchema),
  }),
  personalityFrameworks: z.object({
    bigFive: z.object({
      openness: z.array(LevelSchema),
      conscientiousness: z.array(LevelSchema),
      extraversion: z.array(LevelSchema),
      agreeableness: z.array(LevelSchema),
      neuroticism: z.array(LevelSchema),
    }),
    consumerDecisionMaking: z.object({
      rational: z.array(LevelSchema),
      heuristic: z.array(LevelSchema),
      emotional: z.array(LevelSchema),
    }),
    theoryOfPlannedBehavior: z.object({
      attitude: z.array(LevelSchema),
      subjectiveNorms: z.array(LevelSchema),
      perceivedBehavioralControl: z.array(LevelSchema),
    }),
    maslow: z.object({
      physiological: z.array(LevelSchema),
      safety: z.array(LevelSchema),
      social: z.array(LevelSchema),
      esteem: z.array(LevelSchema),
      selfActualization: z.array(LevelSchema),
    }),
    fogg: z.object({
      motivation: z.array(LevelSchema),
      ability: z.array(LevelSchema),
      triggers: z.array(LevelSchema),
    }),
    comB: z.object({
      capability: z.array(LevelSchema),
      opportunity: z.array(LevelSchema),
      motivation: z.array(LevelSchema),
    }),
    behavioralEconomics: z.object({
      anchoringBias: z.array(LevelSchema),
      lossAversion: z.array(LevelSchema),
      socialProof: z.array(LevelSchema),
    }),
    customerJourney: z.object({
      touchpointsEngagement: z.array(LevelSchema),
      painPointsSensitivity: z.array(LevelSchema),
      conversionTriggersResponsiveness: z.array(LevelSchema),
    }),
  }),
});

/**
 * Creates a default template for persona trait configuration
 * This template can be used as a starting point for creating new persona configurations
 * @returns A default TraitsConfig object with reasonable defaults
 */
export function createDefaultTraitsConfigTemplate(): TraitsConfig {
  return {
    demographics: {
      age: { min: 18, max: 65 },
      gender: [...PERSONA_CONSTANTS.GENDERS],
      location: [...PERSONA_CONSTANTS.COMMON_LOCATIONS],
      income: [...PERSONA_CONSTANTS.INCOME_BRACKETS],
      education: ['High School', 'Bachelor', 'Master', 'PhD'],
      occupation: [...PERSONA_CONSTANTS.COMMON_OCCUPATIONS],
    },
    psychographics: {
      values: [...PERSONA_CONSTANTS.COMMON_VALUES],
      interests: [...PERSONA_CONSTANTS.COMMON_INTERESTS],
      lifestyle: [...PERSONA_CONSTANTS.LIFESTYLES],
    },
    behavior: {
      budget: { min: 100, max: 10000 },
      brandAffinity: [...PERSONA_CONSTANTS.LEVELS],
      responsiveness: [...PERSONA_CONSTANTS.LEVELS],
      spendingHabits: [...PERSONA_CONSTANTS.SPENDING_HABITS],
    },
    personalityFrameworks: {
      bigFive: {
        openness: [...PERSONA_CONSTANTS.LEVELS],
        conscientiousness: [...PERSONA_CONSTANTS.LEVELS],
        extraversion: [...PERSONA_CONSTANTS.LEVELS],
        agreeableness: [...PERSONA_CONSTANTS.LEVELS],
        neuroticism: [...PERSONA_CONSTANTS.LEVELS],
      },
      consumerDecisionMaking: {
        rational: [...PERSONA_CONSTANTS.LEVELS],
        heuristic: [...PERSONA_CONSTANTS.LEVELS],
        emotional: [...PERSONA_CONSTANTS.LEVELS],
      },
      theoryOfPlannedBehavior: {
        attitude: [...PERSONA_CONSTANTS.LEVELS],
        subjectiveNorms: [...PERSONA_CONSTANTS.LEVELS],
        perceivedBehavioralControl: [...PERSONA_CONSTANTS.LEVELS],
      },
      maslow: {
        physiological: [...PERSONA_CONSTANTS.LEVELS],
        safety: [...PERSONA_CONSTANTS.LEVELS],
        social: [...PERSONA_CONSTANTS.LEVELS],
        esteem: [...PERSONA_CONSTANTS.LEVELS],
        selfActualization: [...PERSONA_CONSTANTS.LEVELS],
      },
      fogg: {
        motivation: [...PERSONA_CONSTANTS.LEVELS],
        ability: [...PERSONA_CONSTANTS.LEVELS],
        triggers: [...PERSONA_CONSTANTS.LEVELS],
      },
      comB: {
        capability: [...PERSONA_CONSTANTS.LEVELS],
        opportunity: [...PERSONA_CONSTANTS.LEVELS],
        motivation: [...PERSONA_CONSTANTS.LEVELS],
      },
      behavioralEconomics: {
        anchoringBias: [...PERSONA_CONSTANTS.LEVELS],
        lossAversion: [...PERSONA_CONSTANTS.LEVELS],
        socialProof: [...PERSONA_CONSTANTS.LEVELS],
      },
      customerJourney: {
        touchpointsEngagement: [...PERSONA_CONSTANTS.LEVELS],
        painPointsSensitivity: [...PERSONA_CONSTANTS.LEVELS],
        conversionTriggersResponsiveness: [...PERSONA_CONSTANTS.LEVELS],
      },
    },
  };
}
