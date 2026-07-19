/**
 * Production Readiness Profile
 * 
 * Defines the strict qualification criteria for production releases.
 */

import type { QualificationProfile } from './types';

export const productionReadinessProfile: QualificationProfile = {
  id: 'production-readiness',
  environment: 'ENTERPRISE_PRODUCTION',
  minimumHealthScore: 90,
  requiredCapabilities: [
    { id: 'search-provider', name: 'Global Search Integration', critical: true },
    { id: 'command-provider', name: 'Command Palette Registry', critical: true },
    { id: 'settings-provider', name: 'Settings Manager', critical: false }
  ],
  requiredEvidenceCategories: [
    'chaos_result',
    'endurance_result',
    'scalability_result'
  ]
};
