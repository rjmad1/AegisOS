import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { solutionPackService } from '../../../src/platform/domain/SolutionPackService';
import { ontologyEngine } from '../../../src/platform/domain/OntologyEngine';
import { knowledgePackLoader } from '../../../src/platform/domain/KnowledgePackLoader';
import { domainMissionOrchestrator } from '../../../src/platform/domain/DomainMissionOrchestrator';
import { executiveCockpitAdapter } from '../../../src/platform/domain/ExecutiveCockpitAdapter';
import { domainQualificationSuite } from '../../../src/platform/domain/DomainQualificationSuite';
import { domainGovernanceLineage } from '../../../src/platform/domain/DomainGovernanceLineage';

describe('Domain-Aware AI Platform Transformation (Phase 9)', () => {
  const mockDomain = 'Healthcare';
  
  const mockPack = {
    id: 'pack-healthcare-1',
    name: 'Healthcare Solution Pack',
    version: '1.0.0',
    domain: mockDomain,
    description: 'Provides healthcare ontologies, missions, and knowledge packs.',
    author: 'AegisOS Health',
    signature: 'mock-signature-123',
    ontologies: [
      {
        id: 'ont-health-1',
        concepts: ['Patient', 'Provider', 'Diagnosis'],
        relationships: {
          'Patient': ['hasDiagnosis'],
          'Provider': ['treatsPatient']
        }
      }
    ],
    knowledgeGraphs: [
      {
        id: 'kg-health-1',
        prompts: ['Analyze patient symptoms'],
        nodes: []
      }
    ],
    missions: [
      {
        id: 'mission-triage-1',
        name: 'Patient Triage Optimization',
        description: 'Optimizes ER triage flow.',
        template: {}
      }
    ],
    reports: [
      {
        id: 'report-er-flow',
        title: 'ER Flow Efficiency',
        type: 'dashboard',
        data: {}
      }
    ]
  };

  it('Program 9.1: should successfully install a Solution Pack', async () => {
    const success = await solutionPackService.installPack(mockPack);
    expect(success).toBe(true);

    const installed = solutionPackService.getPack(mockPack.id);
    expect(installed).toBeDefined();
    expect(installed?.domain).toBe(mockDomain);
  });

  it('Program 9.2: should register Domain Ontologies correctly', () => {
    const ontologies = ontologyEngine.getDomainOntologies(mockDomain);
    expect(ontologies.length).toBeGreaterThan(0);
    expect(ontologies[0].concepts).toContain('Patient');
  });

  it('Program 9.3: should load Knowledge Packs correctly', () => {
    const packs = knowledgePackLoader.getKnowledgePacks(mockDomain);
    expect(packs.length).toBeGreaterThan(0);
    expect(packs[0].prompts).toContain('Analyze patient symptoms');
  });

  it('Program 9.4: should register Domain Missions correctly', () => {
    const missions = domainMissionOrchestrator.getDomainMissions(mockDomain);
    expect(missions.length).toBeGreaterThan(0);
    expect(missions[0].id).toBe('mission-triage-1');
  });

  it('Program 9.5: should run Domain Qualification Suite successfully', () => {
    const result = domainQualificationSuite.runQualification(mockDomain, mockPack.id);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('Program 9.6: should maintain Domain Governance Lineage', () => {
    const records = domainGovernanceLineage.getRecords(mockDomain);
    expect(records.length).toBeGreaterThan(0);
    const actions = records.map(r => r.action);
    expect(actions).toContain('SolutionPackInstallation');
    expect(actions).toContain('OntologyRegistered');
    expect(actions).toContain('KnowledgePackLoaded');
    expect(actions).toContain('MissionRegistered');
    expect(actions).toContain('QualificationRun');
  });

  it('Program 9.7: should register Executive Cockpit reports', () => {
    const reports = executiveCockpitAdapter.getDomainReports(mockDomain);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].title).toBe('ER Flow Efficiency');
  });
});
