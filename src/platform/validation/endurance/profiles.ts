/**
 * Endurance Profiles
 * 
 * Defines the default declarative endurance profiles (Quick, Daily 24h, etc.).
 */

import type { EnduranceProfile } from './types';

export const enduranceProfiles: EnduranceProfile[] = [
  {
    id: 'quick',
    name: 'Quick Soak Validation',
    description: '30-minute high-cadence endurance run for pull requests and local verification.',
    durationMinutes: 30,
    samplingIntervalSeconds: 10,
    workloadMix: {
      reasoningPercentage: 30,
      workflowPercentage: 30,
      capabilityPercentage: 20,
      knowledgePercentage: 10,
      participantPercentage: 5,
      idlePercentage: 5
    },
    burstEvents: [
      { name: 'workflow_spike', triggerIntervalMinutes: 10, intensityMultiplier: 2.0 }
    ],
    allowedMemoryGrowthPerHourMB: 100,
    allowedCpuPercentMax: 90
  },
  {
    id: 'daily',
    name: 'Daily 24-Hour Soak',
    description: 'Automated 24-hour endurance soak representing enterprise workload distributions.',
    durationMinutes: 1440,
    samplingIntervalSeconds: 60,
    workloadMix: {
      reasoningPercentage: 25,
      workflowPercentage: 20,
      capabilityPercentage: 15,
      knowledgePercentage: 15,
      participantPercentage: 10,
      idlePercentage: 15
    },
    burstEvents: [
      { name: 'knowledge_reindex', triggerIntervalMinutes: 120, intensityMultiplier: 1.5 },
      { name: 'workflow_spike', triggerIntervalMinutes: 240, intensityMultiplier: 3.0 }
    ],
    chaosInjections: ['kill-ollama', 'inject-db-latency'],
    allowedMemoryGrowthPerHourMB: 50,
    allowedCpuPercentMax: 80
  }
];
