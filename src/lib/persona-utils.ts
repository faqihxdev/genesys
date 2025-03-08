/**
 * @file Persona generation and utility functions
 * @description Utility functions for generating personas and working with persona configurations
 */

import { Traits, TraitsConfig } from '@/db/schema';

/**
 * Gets a random item from an array
 * @param array - The array to pick from
 * @returns A random item from the array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
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
 * Generates a random persona trait value from a given trait configuration
 * @param config - The traits configuration
 * @returns A new persona traits object with concrete values derived from the config
 */
export function generatePersonaTraitsFromConfig(config: TraitsConfig): Traits {
  try {
    return {
      demographics: {
        age: getRandomNumber(config.demographics.age.min, config.demographics.age.max),
        gender: getRandomItem(config.demographics.gender),
        location: getRandomItem(config.demographics.location),
        income: getRandomItem(config.demographics.income),
        education: getRandomItem(config.demographics.education),
        occupation: getRandomItem(config.demographics.occupation),
      },
      psychographics: {
        values:
          config.psychographics.values.length > 0
            ? [getRandomItem(config.psychographics.values)]
            : ['undefined'],
        interests:
          config.psychographics.interests.length > 0
            ? [getRandomItem(config.psychographics.interests)]
            : ['undefined'],
        lifestyle: getRandomItem(config.psychographics.lifestyle),
      },
      behavior: {
        budget: getRandomNumber(config.behavior.budget.min, config.behavior.budget.max),
        brandAffinity: getRandomItem(config.behavior.brandAffinity),
        responsiveness: getRandomItem(config.behavior.responsiveness),
        spendingHabits: getRandomItem(config.behavior.spendingHabits),
      },
      personalityFrameworks: {
        bigFive: {
          openness: getRandomItem(config.personalityFrameworks.bigFive.openness),
          conscientiousness: getRandomItem(config.personalityFrameworks.bigFive.conscientiousness),
          extraversion: getRandomItem(config.personalityFrameworks.bigFive.extraversion),
          agreeableness: getRandomItem(config.personalityFrameworks.bigFive.agreeableness),
          neuroticism: getRandomItem(config.personalityFrameworks.bigFive.neuroticism),
        },
        consumerDecisionMaking: {
          rational: getRandomItem(config.personalityFrameworks.consumerDecisionMaking.rational),
          heuristic: getRandomItem(config.personalityFrameworks.consumerDecisionMaking.heuristic),
          emotional: getRandomItem(config.personalityFrameworks.consumerDecisionMaking.emotional),
        },
        theoryOfPlannedBehavior: {
          attitude: getRandomItem(config.personalityFrameworks.theoryOfPlannedBehavior.attitude),
          subjectiveNorms: getRandomItem(
            config.personalityFrameworks.theoryOfPlannedBehavior.subjectiveNorms
          ),
          perceivedBehavioralControl: getRandomItem(
            config.personalityFrameworks.theoryOfPlannedBehavior.perceivedBehavioralControl
          ),
        },
        maslow: {
          physiological: getRandomItem(config.personalityFrameworks.maslow.physiological),
          safety: getRandomItem(config.personalityFrameworks.maslow.safety),
          social: getRandomItem(config.personalityFrameworks.maslow.social),
          esteem: getRandomItem(config.personalityFrameworks.maslow.esteem),
          selfActualization: getRandomItem(config.personalityFrameworks.maslow.selfActualization),
        },
        fogg: {
          motivation: getRandomItem(config.personalityFrameworks.fogg.motivation),
          ability: getRandomItem(config.personalityFrameworks.fogg.ability),
          triggers: getRandomItem(config.personalityFrameworks.fogg.triggers),
        },
        comB: {
          capability: getRandomItem(config.personalityFrameworks.comB.capability),
          opportunity: getRandomItem(config.personalityFrameworks.comB.opportunity),
          motivation: getRandomItem(config.personalityFrameworks.comB.motivation),
        },
        behavioralEconomics: {
          anchoringBias: getRandomItem(
            config.personalityFrameworks.behavioralEconomics.anchoringBias
          ),
          lossAversion: getRandomItem(
            config.personalityFrameworks.behavioralEconomics.lossAversion
          ),
          socialProof: getRandomItem(config.personalityFrameworks.behavioralEconomics.socialProof),
        },
        customerJourney: {
          touchpointsEngagement: getRandomItem(
            config.personalityFrameworks.customerJourney.touchpointsEngagement
          ),
          painPointsSensitivity: getRandomItem(
            config.personalityFrameworks.customerJourney.painPointsSensitivity
          ),
          conversionTriggersResponsiveness: getRandomItem(
            config.personalityFrameworks.customerJourney.conversionTriggersResponsiveness
          ),
        },
      },
    };
  } catch (error) {
    console.error('[generatePersonaTraitsFromConfig]:', error);
    throw new Error('Failed to generate persona traits from config');
  }
}
