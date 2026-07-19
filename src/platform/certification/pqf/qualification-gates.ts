/**
 * Qualification Gates
 * 
 * Declares the mapping of validation gates to qualification profiles
 * and their required evidence categories.
 */

import type { QualificationGate } from './types';

export const qualificationGates: QualificationGate[] = [
  {
    id: 'pr-gate',
    name: 'Pull Request Verification Gate',
    profileId: 'production-readiness',
    requiredEvidenceCategories: ['chaos_result'] // Light, fast check for PRs
  },
  {
    id: 'nightly',
    name: 'Nightly Scheduled Validation Gate',
    profileId: 'production-readiness',
    requiredEvidenceCategories: ['chaos_result', 'scalability_result'] // Includes capacity sweep
  },
  {
    id: 'monthly',
    name: 'Monthly Release Qualification Gate',
    profileId: 'production-readiness',
    requiredEvidenceCategories: ['chaos_result', 'scalability_result', 'endurance_result'] // Full qualification soak
  }
];
