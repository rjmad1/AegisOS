import { chaosPlatform } from "./ChaosPlatform";
import { selfHealingFramework } from "./SelfHealingFramework";

export interface GameDaySession {
  id: string;
  name: string;
  scheduledTime: string;
  status: "pending" | "running" | "completed" | "cancelled";
  faultsInjected: string[];
  recoveryTimesMs: number[];
  resilienceIndex: number;
}

export class GameDayFramework {
  private static instance: GameDayFramework | null = null;
  private activeSession: GameDaySession | null = null;

  private constructor() {}

  public static getInstance(): GameDayFramework {
    if (!GameDayFramework.instance) {
      GameDayFramework.instance = new GameDayFramework();
    }
    return GameDayFramework.instance;
  }

  public getActiveSession(): GameDaySession | null {
    return this.activeSession;
  }

  /**
   * Run a Game Day simulation.
   */
  public async executeGameDay(name: string): Promise<GameDaySession> {
    console.log(`[GameDayFramework] Starting Game Day Session: ${name}`);
    const session: GameDaySession = {
      id: `gday-${Date.now()}`,
      name,
      scheduledTime: new Date().toISOString(),
      status: "running",
      faultsInjected: [],
      recoveryTimesMs: [],
      resilienceIndex: 100
    };
    this.activeSession = session;

    // Pick 2 random faults to inject
    const faults = chaosPlatform.getFaults();
    const targets = faults.slice(0, 2);

    for (const f of targets) {
      session.faultsInjected.push(f.name);
      const start = Date.now();

      // Inject
      await chaosPlatform.injectFault(f.id);

      // Wait 1s
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger self-healing
      await selfHealingFramework.executeHealingCycle();

      // Stop fault
      await chaosPlatform.recoverFault(f.id);

      const duration = Date.now() - start;
      session.recoveryTimesMs.push(duration);
    }

    session.status = "completed";
    session.resilienceIndex = chaosPlatform.getResilienceScore();
    this.activeSession = session;

    return session;
  }
}

export const gameDayFramework = GameDayFramework.getInstance();
export default gameDayFramework;
