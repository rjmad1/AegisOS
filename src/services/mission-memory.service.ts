// src/services/mission-memory.service.ts

import { MissionRepository, SQLiteMissionRepository, PostgresMissionRepository, MemoryMissionRepository } from "../repositories/mission.repository";
import { Mission, MissionEvaluation, MissionMetrics } from "../types/mission";

export class MissionMemory {
  private static instance: MissionMemory | null = null;
  private repository: MissionRepository;

  private constructor() {
    const provider = process.env.DATABASE_PROVIDER || "sqlite";
    if (process.env.NODE_ENV === "test") {
      this.repository = new MemoryMissionRepository();
    } else if (provider === "postgres" || provider === "postgresql") {
      this.repository = new PostgresMissionRepository();
    } else {
      this.repository = new SQLiteMissionRepository();
    }
  }

  public static getInstance(): MissionMemory {
    if (!MissionMemory.instance) {
      MissionMemory.instance = new MissionMemory();
    }
    return MissionMemory.instance;
  }

  public setRepository(repo: MissionRepository) {
    this.repository = repo;
  }

  public async getMission(missionId: string): Promise<Mission | null> {
    return this.repository.get(missionId);
  }

  public async recordDecision(missionId: string, decision: string): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    const now = new Date().toISOString();
    mission.decisions.push(`[${now}] ${decision}`);
    mission.history.push(`[${now}] Decision recorded: ${decision}`);
    mission.updatedAt = now;
    await this.repository.save(mission);
  }

  public async recordLesson(missionId: string, lesson: string): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    const now = new Date().toISOString();
    mission.lessons.push(lesson);
    mission.history.push(`[${now}] Lesson learned: ${lesson}`);
    mission.updatedAt = now;
    await this.repository.save(mission);
  }

  public async recordEvaluation(missionId: string, evaluation: MissionEvaluation): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    const now = new Date().toISOString();
    mission.evaluations.push(evaluation);
    mission.history.push(`[${now}] Evaluation completed. Completeness: ${evaluation.completeness}%, Score: ${evaluation.score}%, Decision: ${evaluation.decision}`);
    
    // Cache evaluations metrics onto mission
    mission.metrics.score = evaluation.score;
    mission.metrics.completeness = evaluation.completeness;
    mission.metrics.quality = evaluation.quality;
    mission.metrics.coverage = evaluation.coverage;
    mission.metrics.risk = evaluation.risk;
    mission.metrics.confidence = evaluation.confidence;
    
    mission.updatedAt = now;
    await this.repository.save(mission);
  }

  public async updateMetrics(missionId: string, update: Partial<MissionMetrics>): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    
    const prevTokens = mission.metrics.tokensSpent || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const newTokens = update.tokensSpent || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    mission.metrics = {
      ...mission.metrics,
      ...update,
      tokensSpent: {
        promptTokens: prevTokens.promptTokens + newTokens.promptTokens,
        completionTokens: prevTokens.completionTokens + newTokens.completionTokens,
        totalTokens: prevTokens.totalTokens + newTokens.totalTokens,
      }
    };
    mission.updatedAt = new Date().toISOString();
    await this.repository.save(mission);
  }

  public async addArtifact(missionId: string, artifactPath: string): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    const now = new Date().toISOString();
    if (!mission.artifacts.includes(artifactPath)) {
      mission.artifacts.push(artifactPath);
      mission.history.push(`[${now}] Registered artifact: ${artifactPath}`);
    }
    mission.updatedAt = now;
    await this.repository.save(mission);
  }

  public async addHistoryEvent(missionId: string, event: string): Promise<void> {
    const mission = await this.repository.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);
    const now = new Date().toISOString();
    mission.history.push(`[${now}] ${event}`);
    mission.updatedAt = now;
    await this.repository.save(mission);
  }
}

export const missionMemory = MissionMemory.getInstance();
export default missionMemory;
