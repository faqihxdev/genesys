/**
 * @file Persona generation and utility functions
 * @description Utility functions for generating personas and working with persona configurations
 */

import { SpendingHabit, Traits, TraitsConfig } from '@/db/schema';

/**
 * Gets a random item from an array with uniform distribution
 * @param array - The array to pick from
 * @returns A random item from the array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets a random item from an array using weighted probabilities
 * @param array - The array to pick from
 * @param weights - Array of weights corresponding to each item (must be same length as array)
 * @returns A random item selected according to the weights
 */
export function getWeightedRandomItem<T>(array: T[], weights: number[]): T {
  // Validate inputs
  if (array.length === 0) throw new Error('Cannot select from empty array');
  if (array.length !== weights.length)
    throw new Error('Array and weights must have the same length');

  // Handle single item case
  if (array.length === 1) return array[0];

  // Calculate sum of weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // If all weights are 0, use uniform distribution
  if (totalWeight === 0) return getRandomItem(array);

  // Get a random value between 0 and totalWeight
  const random = Math.random() * totalWeight;

  // Find the item that corresponds to the random value
  let weightSum = 0;
  for (let i = 0; i < array.length; i++) {
    weightSum += weights[i];
    if (random < weightSum) {
      return array[i];
    }
  }

  // Fallback (should not reach here unless there's a floating-point precision issue)
  return array[array.length - 1];
}

/**
 * Gets a random number between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns A random number between min and max
 */
export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Gets a random number between min and max (inclusive) with normal distribution bias
 * @param min - Minimum value
 * @param max - Maximum value
 * @param skew - Value between 0-1 where 0.5 is centered distribution, <0.5 biases toward min, >0.5 biases toward max
 * @returns A random number between min and max with specified distribution
 */
export function getDistributedRandomNumber(min: number, max: number, skew = 0.5): number {
  // Apply Box-Muller transform for normal distribution approximation
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();

  // Standard normal distribution with mean 0, std dev 1
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  // Adjust for desired skew (default is centered at 0.5)
  num = num / 10.0 + skew;

  // Clamp value between 0 and 1
  if (num > 1) num = 1;
  if (num < 0) num = 0;

  // Scale to desired range
  num = Math.floor(num * (max - min + 1)) + min;

  // Ensure value is within bounds (to handle any floating-point issues)
  return Math.max(min, Math.min(max, num));
}

/**
 * Adjusts weights based on available options
 * @param originalWeights - The original weight distribution
 * @param availableIndices - Indices of available options
 * @returns Adjusted weights that sum to the same total but only for available options
 */
export function redistributeWeights(
  originalWeights: number[],
  availableIndices: number[]
): number[] {
  if (availableIndices.length === 0) throw new Error('No available options');

  // If all options are available, return original weights
  if (availableIndices.length === originalWeights.length) return originalWeights;

  // Create new weights array with zeros for unavailable options
  const adjustedWeights = Array(originalWeights.length).fill(0);

  // Calculate sum of weights for available options
  const availableWeightsSum = availableIndices.reduce(
    (sum, index) => sum + originalWeights[index],
    0
  );

  // If all available weights are 0, use uniform distribution
  if (availableWeightsSum === 0) {
    availableIndices.forEach((index) => {
      adjustedWeights[index] = 1 / availableIndices.length;
    });
    return adjustedWeights;
  }

  // Redistribute weights proportionally among available options
  availableIndices.forEach((index) => {
    adjustedWeights[index] = originalWeights[index] / availableWeightsSum;
  });

  return adjustedWeights;
}

// Default weight distributions for different traits
export const TRAIT_DISTRIBUTIONS = {
  // 30% low, 40% medium, 30% high
  LEVELS: [0.3, 0.4, 0.3] as number[],

  // Education distribution based on general population statistics
  // None: 10%, High School: 35%, Bachelor: 35%, Master: 15%, PhD: 5%, Other: 0%
  EDUCATION: [0.1, 0.35, 0.35, 0.15, 0.05, 0] as number[],

  // Income brackets distribution
  // low: 15%, lower-middle: 25%, middle: 30%, upper-middle: 20%, high: 7%, affluent: 3%
  INCOME: [0.15, 0.25, 0.3, 0.2, 0.07, 0.03] as number[],

  // Gender distribution (keeping it simple)
  // male: 49%, female: 49%, non-binary: 1.5%, prefer not to say: 0.5%
  GENDER: [0.49, 0.49, 0.015, 0.005] as number[],

  // Age distribution (used for skewing the random number generation)
  // This represents the center point of the distribution (0.5 is uniform)
  AGE_SKEW: 0.4, // Slight bias toward younger ages

  // Lifestyle distribution
  // pragmatic: 20%, adventurous: 15%, family-oriented: 25%, luxury: 10%,
  // eco-conscious: 10%, tech-savvy: 15%, trendy: 5%
  LIFESTYLE: [0.2, 0.15, 0.25, 0.1, 0.1, 0.15, 0.05] as number[],

  // Spending habits distribution
  // frugal: 30%, moderate: 45%, impulsive: 15%, luxury: 10%
  SPENDING_HABITS: [0.3, 0.45, 0.15, 0.1] as number[],
};

/**
 * Gets a trait option using the appropriate distribution
 * @param options - Available options to choose from
 * @param traitType - Type of trait for determining distribution
 * @param defaultDistribution - Default distribution to use if traitType is not recognized
 * @returns A selected trait based on realistic distributions
 */
function getDistributedTrait<T>(
  options: T[],
  traitType: keyof typeof TRAIT_DISTRIBUTIONS | null,
  defaultDistribution: number[] | null = null
): T {
  // If no options, throw error
  if (options.length === 0) {
    throw new Error(`No options available for trait type: ${String(traitType)}`);
  }

  // If single option, return it
  if (options.length === 1) {
    return options[0];
  }

  // Use appropriate distribution based on trait type
  let distribution: number[] = [];

  if (traitType && traitType !== 'AGE_SKEW') {
    // All trait types except AGE_SKEW are arrays
    const standardDist = TRAIT_DISTRIBUTIONS[traitType] as number[];

    // If options.length matches the standard distribution length, use it directly
    if (options.length === standardDist.length) {
      distribution = standardDist;
    } else {
      // Otherwise, adapt the distribution to the options length
      // This is a simple adaptation by creating a uniform distribution
      distribution = Array(options.length).fill(1 / options.length);
    }
  } else if (defaultDistribution && defaultDistribution.length === options.length) {
    // Use provided default distribution if it matches the options length
    distribution = defaultDistribution;
  } else {
    // Fallback to uniform distribution
    distribution = Array(options.length).fill(1 / options.length);
  }

  // Get available indices (all in this case)
  const availableIndices = Array.from(options.keys());

  // Adjust weights based on available options
  const adjustedWeights = redistributeWeights(distribution, availableIndices);

  // Return weighted random selection
  return getWeightedRandomItem(options, adjustedWeights);
}

/**
 * Generates a random persona trait value from a given trait configuration
 * @param config - The traits configuration
 * @returns A new persona traits object with concrete values derived from the config
 */
export function generatePersonaTraitsFromConfig(config: TraitsConfig): Traits {
  try {
    // Generate demografics first since other traits may depend on them
    const demographics = {
      // Age with slight bias toward younger adults based on distribution
      age: getDistributedRandomNumber(
        config.demographics.age.min,
        config.demographics.age.max,
        TRAIT_DISTRIBUTIONS.AGE_SKEW
      ),

      // Gender with realistic distribution
      gender: getDistributedTrait(config.demographics.gender, 'GENDER'),

      // Location (uniform distribution as it's highly variable)
      location: getRandomItem(config.demographics.location),

      // Income with economic distribution
      income: getDistributedTrait(config.demographics.income, 'INCOME'),

      // Education with realistic distribution
      education: getDistributedTrait(config.demographics.education, 'EDUCATION'),

      // Occupation (dependent on education level)
      occupation: getRandomItem(config.demographics.occupation),
    };

    // Generate psychographics with appropriate distributions
    const psychographics = {
      // Values (randomly select one for now)
      values:
        config.psychographics.values.length > 0
          ? [getRandomItem(config.psychographics.values)]
          : ['undefined'],

      // Interests (randomly select one for now)
      interests:
        config.psychographics.interests.length > 0
          ? [getRandomItem(config.psychographics.interests)]
          : ['undefined'],

      // Lifestyle with realistic distribution
      lifestyle: getDistributedTrait(config.psychographics.lifestyle, 'LIFESTYLE'),
    };

    // Helper function to get spending habits based on income
    const getIncomeAdjustedSpendingHabits = (): SpendingHabit => {
      // If no options available, throw an error
      if (config.behavior.spendingHabits.length === 0) {
        throw new Error('No spending habits options available');
      }

      // If only one option, return it
      if (config.behavior.spendingHabits.length === 1) {
        return config.behavior.spendingHabits[0];
      }

      // Get income index and normalize it between 0 and 1
      const incomeIndex = config.demographics.income.indexOf(demographics.income);
      const incomesCount = config.demographics.income.length;

      if (incomeIndex === -1) {
        console.warn(
          '[getIncomeAdjustedSpendingHabits]: Income not found in config options, using standard distribution'
        );
        return getDistributedTrait(config.behavior.spendingHabits, 'SPENDING_HABITS');
      }

      // Normalize income level to a 0-1 scale
      const normalizedIncome = incomesCount > 1 ? incomeIndex / (incomesCount - 1) : 0.5;

      // Create adjusted spending habits weights based on income
      const baseWeights = [...TRAIT_DISTRIBUTIONS.SPENDING_HABITS];
      const options = config.behavior.spendingHabits;

      // Map the standard spending habits to the available options
      let adjustedWeights = [...baseWeights].slice(0, options.length);

      // If we have standard spending habits available
      if (
        options.includes('frugal') &&
        options.includes('moderate') &&
        options.includes('impulsive') &&
        options.includes('luxury')
      ) {
        // Apply income-based adjustments
        const frugalIndex = options.indexOf('frugal');
        const moderateIndex = options.indexOf('moderate');
        const impulsiveIndex = options.indexOf('impulsive');
        const luxuryIndex = options.indexOf('luxury');

        // Create a new set of weights based on income level
        adjustedWeights = Array(options.length).fill(0);

        if (normalizedIncome < 0.33) {
          // Lower income: more likely to be frugal, less likely to be luxury
          adjustedWeights[frugalIndex] = 0.5 - normalizedIncome * 0.3; // 0.5 to 0.4
          adjustedWeights[moderateIndex] = 0.4;
          adjustedWeights[impulsiveIndex] = 0.1 + normalizedIncome * 0.2; // 0.1 to 0.17
          adjustedWeights[luxuryIndex] = normalizedIncome * 0.1; // 0 to 0.03
        } else if (normalizedIncome < 0.66) {
          // Middle income: most likely to be moderate
          adjustedWeights[frugalIndex] = 0.4 - normalizedIncome * 0.3; // 0.3 to 0.2
          adjustedWeights[moderateIndex] = 0.5;
          adjustedWeights[impulsiveIndex] = 0.1 + normalizedIncome * 0.1; // 0.13 to 0.17
          adjustedWeights[luxuryIndex] = normalizedIncome * 0.2; // 0.07 to 0.13
        } else {
          // Higher income: more likely luxury, less likely frugal
          adjustedWeights[frugalIndex] = 0.2 - normalizedIncome * 0.15; // 0.15 to 0.05
          adjustedWeights[moderateIndex] = 0.4 - normalizedIncome * 0.1; // 0.35 to 0.3
          adjustedWeights[impulsiveIndex] = 0.2;
          adjustedWeights[luxuryIndex] = 0.25 + normalizedIncome * 0.3; // 0.3 to 0.45
        }
      }

      // Normalize weights to sum to 1 and account for available options
      const weightSum = adjustedWeights.reduce((sum, w) => sum + w, 0);
      adjustedWeights = adjustedWeights.map((w) => w / weightSum);

      // Use the adjusted weights for selection
      return getWeightedRandomItem(options, adjustedWeights);
    };

    // Generate behavior traits with appropriate distributions
    const behavior = {
      // Budget based on income level (wealthier people have higher budgets)
      budget: (() => {
        const incomeIndex = config.demographics.income.indexOf(demographics.income);
        const totalIncomes = config.demographics.income.length;

        // Calculate a skew factor based on income level (higher income = higher budget)
        const skewFactor = totalIncomes > 1 ? 0.3 + 0.4 * (incomeIndex / (totalIncomes - 1)) : 0.5;

        return getDistributedRandomNumber(
          config.behavior.budget.min,
          config.behavior.budget.max,
          skewFactor
        );
      })(),

      // Brand affinity
      brandAffinity: getDistributedTrait(config.behavior.brandAffinity, 'LEVELS'),

      // Responsiveness
      responsiveness: getDistributedTrait(config.behavior.responsiveness, 'LEVELS'),

      // Spending habits with income-correlated distribution
      spendingHabits: getIncomeAdjustedSpendingHabits(),
    };

    // Generate consistent personality framework traits
    // These should be internally consistent rather than random

    // Create a personality seed to ensure consistency across framework traits
    // This helps ensure the personality is coherent rather than random
    const baseOpenness = getDistributedTrait<'low' | 'medium' | 'high'>(
      config.personalityFrameworks.bigFive.openness,
      'LEVELS'
    );

    const baseExtraversion = getDistributedTrait<'low' | 'medium' | 'high'>(
      config.personalityFrameworks.bigFive.extraversion,
      'LEVELS'
    );

    const baseConscientiousness = getDistributedTrait<'low' | 'medium' | 'high'>(
      config.personalityFrameworks.bigFive.conscientiousness,
      'LEVELS'
    );

    // Generate personality frameworks with internal consistency
    const personalityFrameworks = {
      bigFive: {
        // Base traits chosen independently
        openness: baseOpenness,
        conscientiousness: baseConscientiousness,
        extraversion: baseExtraversion,

        // Related traits with some correlation to base traits
        agreeableness: (() => {
          // Agreeable people tend to be more conscientious and less neurotic
          const options = config.personalityFrameworks.bigFive.agreeableness;
          const conscientiousnessBoost =
            baseConscientiousness === 'high' ? 0.1 : baseConscientiousness === 'medium' ? 0.05 : 0;

          const weights = [...TRAIT_DISTRIBUTIONS.LEVELS];
          weights[2] += conscientiousnessBoost; // Boost for high agreeableness

          return getWeightedRandomItem(
            options,
            redistributeWeights(weights, Array.from(options.keys()))
          );
        })(),

        neuroticism: (() => {
          // Neuroticism tends to be inversely related to extraversion
          const options = config.personalityFrameworks.bigFive.neuroticism;
          const extraversionEffect =
            baseExtraversion === 'high' ? -0.1 : baseExtraversion === 'medium' ? -0.05 : 0.1;

          const weights = [...TRAIT_DISTRIBUTIONS.LEVELS];

          // Adjust weights based on extraversion
          weights[0] += extraversionEffect; // Low neuroticism more likely with high extraversion
          weights[2] -= extraversionEffect; // High neuroticism less likely with high extraversion

          return getWeightedRandomItem(
            options,
            redistributeWeights(weights, Array.from(options.keys()))
          );
        })(),
      },

      consumerDecisionMaking: {
        // People high in openness tend to be more rational
        rational: (() => {
          const options = config.personalityFrameworks.consumerDecisionMaking.rational;
          const opennessFactor =
            baseOpenness === 'high' ? 0.1 : baseOpenness === 'medium' ? 0.05 : -0.05;

          const weights = [...TRAIT_DISTRIBUTIONS.LEVELS];
          weights[2] += opennessFactor; // High rational more likely with high openness

          return getWeightedRandomItem(
            options,
            redistributeWeights(weights, Array.from(options.keys()))
          );
        })(),

        // People high in extraversion tend to be more heuristic
        heuristic: (() => {
          const options = config.personalityFrameworks.consumerDecisionMaking.heuristic;
          const extraversionFactor =
            baseExtraversion === 'high' ? 0.1 : baseExtraversion === 'medium' ? 0.05 : -0.05;

          const weights = [...TRAIT_DISTRIBUTIONS.LEVELS];
          weights[2] += extraversionFactor; // High heuristic more likely with high extraversion

          return getWeightedRandomItem(
            options,
            redistributeWeights(weights, Array.from(options.keys()))
          );
        })(),

        // Connect emotional decision making to spending habits
        emotional: (() => {
          const options = config.personalityFrameworks.consumerDecisionMaking.emotional;
          const baseWeight = [...TRAIT_DISTRIBUTIONS.LEVELS];

          // Impulsive spenders tend to be more emotional in decision making
          if (behavior.spendingHabits === 'impulsive') {
            baseWeight[2] += 0.15; // Boost high emotional for impulsive spenders
          } else if (behavior.spendingHabits === 'frugal') {
            baseWeight[0] += 0.15; // Boost low emotional for frugal spenders
          }

          return getWeightedRandomItem(
            options,
            redistributeWeights(baseWeight, Array.from(options.keys()))
          );
        })(),
      },

      // The remaining frameworks use similar correlations for internal consistency
      theoryOfPlannedBehavior: {
        attitude: getDistributedTrait(
          config.personalityFrameworks.theoryOfPlannedBehavior.attitude,
          'LEVELS'
        ),
        subjectiveNorms: getDistributedTrait(
          config.personalityFrameworks.theoryOfPlannedBehavior.subjectiveNorms,
          'LEVELS'
        ),
        perceivedBehavioralControl: getDistributedTrait(
          config.personalityFrameworks.theoryOfPlannedBehavior.perceivedBehavioralControl,
          'LEVELS'
        ),
      },

      maslow: {
        physiological: getDistributedTrait(
          config.personalityFrameworks.maslow.physiological,
          'LEVELS'
        ),
        safety: getDistributedTrait(config.personalityFrameworks.maslow.safety, 'LEVELS'),
        social: getDistributedTrait(config.personalityFrameworks.maslow.social, 'LEVELS'),
        esteem: getDistributedTrait(config.personalityFrameworks.maslow.esteem, 'LEVELS'),
        selfActualization: getDistributedTrait(
          config.personalityFrameworks.maslow.selfActualization,
          'LEVELS'
        ),
      },

      fogg: {
        motivation: getDistributedTrait(config.personalityFrameworks.fogg.motivation, 'LEVELS'),
        ability: getDistributedTrait(config.personalityFrameworks.fogg.ability, 'LEVELS'),
        triggers: getDistributedTrait(config.personalityFrameworks.fogg.triggers, 'LEVELS'),
      },

      comB: {
        capability: getDistributedTrait(config.personalityFrameworks.comB.capability, 'LEVELS'),
        opportunity: getDistributedTrait(config.personalityFrameworks.comB.opportunity, 'LEVELS'),
        motivation: getDistributedTrait(config.personalityFrameworks.comB.motivation, 'LEVELS'),
      },

      behavioralEconomics: {
        anchoringBias: getDistributedTrait(
          config.personalityFrameworks.behavioralEconomics.anchoringBias,
          'LEVELS'
        ),
        lossAversion: getDistributedTrait(
          config.personalityFrameworks.behavioralEconomics.lossAversion,
          'LEVELS'
        ),
        socialProof: getDistributedTrait(
          config.personalityFrameworks.behavioralEconomics.socialProof,
          'LEVELS'
        ),
      },

      customerJourney: {
        touchpointsEngagement: getDistributedTrait(
          config.personalityFrameworks.customerJourney.touchpointsEngagement,
          'LEVELS'
        ),
        painPointsSensitivity: getDistributedTrait(
          config.personalityFrameworks.customerJourney.painPointsSensitivity,
          'LEVELS'
        ),
        conversionTriggersResponsiveness: getDistributedTrait(
          config.personalityFrameworks.customerJourney.conversionTriggersResponsiveness,
          'LEVELS'
        ),
      },
    };

    return {
      demographics,
      psychographics,
      behavior,
      personalityFrameworks,
    };
  } catch (error) {
    console.error('[generatePersonaTraitsFromConfig]:', error);
    throw new Error('Failed to generate persona traits from config');
  }
}
