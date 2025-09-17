
import type { FormValues } from './formSchema';

export const LOCAL_STORAGE_KEY = 'claim-ease-progress';

export const FORM_STEPS = [
  {
    id: 'personal',
    title: 'Personal Details',
    fields: ['fullName'],
  },
  {
    id: 'health',
    title: 'Health Conditions',
    fields: ['mainCondition', 'otherConditions', 'medications'],
  },
  {
    id: 'daily',
    title: 'Daily Living',
    fields: [
      'preparingFood',
      'eatingAndDrinking',
      'managingTreatments',
      'washingAndBathing',
      'managingToiletNeeds',
      'dressingAndUndressing',
    ],
  },
  {
    id: 'mobility',
    title: 'Mobility',
    fields: ['planningAndFollowingJourneys', 'movingAround', 'additionalInfo'],
  },
  {
    id: 'review',
    title: 'Review & Submit',
    fields: [],
  },
] as const;

export type StepId = (typeof FORM_STEPS)[number]['id'];

export type StepField = keyof FormValues;

// Pricing and User Tiers
export const PRICING = {
  SINGLE_CLAIM: 49,
  ADDITIONAL_CLAIM: 29,
  UNLIMITED_CLAIMS: 79,
} as const;

export enum UserTier {
  SINGLE_CLAIM = 'single_claim',
  UNLIMITED_CLAIMS = 'unlimited_claims',
}

export const CLAIM_LIMITS = {
  [UserTier.SINGLE_CLAIM]: 1,
  [UserTier.UNLIMITED_CLAIMS]: -1, // -1 represents unlimited
} as const;

export type UserTierType = UserTier.SINGLE_CLAIM | UserTier.UNLIMITED_CLAIMS;
