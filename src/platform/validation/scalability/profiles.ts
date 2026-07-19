/**
 * Scalability Profiles
 * 
 * Defines the default declarative scalability profiles for V1 (Workstation, Small Team).
 */

import type { ScalabilityProfile } from './types';

export const scalabilityProfiles: ScalabilityProfile[] = [
  {
    id: 'developer-workstation',
    name: 'Developer Workstation Profile',
    description: 'Local development target with light concurrency requirements.',
    maxTargetConcurrency: 10,
    expectedThroughputP95: 5,
    expectedLatencyLimitMs: 250,
    hardwareCpuCores: 4,
    hardwareMemoryMB: 8192
  },
  {
    id: 'small-team',
    name: 'Small Team Server Profile',
    description: 'Shared local engine serving 5-15 active collaborative participants.',
    maxTargetConcurrency: 50,
    expectedThroughputP95: 25,
    expectedLatencyLimitMs: 500,
    hardwareCpuCores: 8,
    hardwareMemoryMB: 16384
  }
];
