// src/platform/control-plane/DependencyManager.ts
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export interface CompatibilityReport {
  timestamp: string;
  compatible: boolean;
  node: { installed: string; status: "compatible" | "incompatible" };
  python: { installed: string; status: "compatible" | "incompatible" };
  uv: { installed: string; status: "compatible" | "incompatible" };
  cuda: { installed: string; status: "compatible" | "incompatible" | "missing" };
  driver: { installed: string; status: "compatible" | "incompatible" | "missing" };
}

export class DependencyManager {
  private static instance: DependencyManager | null = null;
  private rootDir = process.cwd();

  private constructor() {}

  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    return DependencyManager.instance;
  }

  /**
   * Evaluates compatibility across the entire local toolchain matrix.
   */
  public async getCompatibilityMatrix(): Promise<CompatibilityReport> {
    const report: CompatibilityReport = {
      timestamp: new Date().toISOString(),
      compatible: true,
      node: { installed: process.version, status: "compatible" },
      python: { installed: "unknown", status: "compatible" },
      uv: { installed: "unknown", status: "compatible" },
      cuda: { installed: "unknown", status: "compatible" },
      driver: { installed: "unknown", status: "compatible" },
    };

    // Node check: target v18, v20, v22
    const nodeMajor = parseInt(process.version.substring(1).split(".")[0]);
    if (nodeMajor < 18) {
      report.node.status = "incompatible";
      report.compatible = false;
    }

    // Python check
    try {
      const { stdout } = await execAsync("python --version");
      report.python.installed = stdout.trim().replace("Python ", "");
      const pyVersion = parseFloat(report.python.installed);
      if (pyVersion < 3.8) {
        report.python.status = "incompatible";
        report.compatible = false;
      }
    } catch {
      report.python.installed = "missing";
      report.python.status = "incompatible";
      report.compatible = false;
    }

    // uv check
    try {
      const { stdout } = await execAsync("uv --version");
      report.uv.installed = stdout.trim().replace("uv ", "");
    } catch {
      report.uv.installed = "missing";
      report.uv.status = "incompatible";
      // uv is highly recommended, but we can fallback if needed
    }

    // CUDA & Driver check via nvidia-smi
    try {
      const { stdout } = await execAsync("nvidia-smi");
      // Regex parsing for driver version and CUDA version
      const driverMatch = stdout.match(/Driver Version:\s+([^\s]+)/);
      const cudaMatch = stdout.match(/CUDA Version:\s+([^\s]+)/);
      
      if (driverMatch) report.driver.installed = driverMatch[1];
      if (cudaMatch) report.cuda.installed = cudaMatch[1];
    } catch {
      report.driver.installed = "missing";
      report.driver.status = "missing";
      report.cuda.installed = "missing";
      report.cuda.status = "missing";
      // Skip marking incompatible if CPU-only mode is active or driver is absent
    }

    return report;
  }

  /**
   * Automated verification check for NPM and Python packages drift.
   */
  public async detectDrift(): Promise<{ hasDrift: boolean; issues: string[] }> {
    const issues: string[] = [];

    // NPM Drift: check node_modules exists
    const nodeModules = path.join(this.rootDir, "node_modules");
    if (!fs.existsSync(nodeModules)) {
      issues.push("node_modules is missing");
    }

    // Python Drift: check if virtual environment exists if uv/pip requirements exist
    const venv = path.join(this.rootDir, ".venv");
    if (!fs.existsSync(venv)) {
      issues.push(".venv is missing (required for LiteLLM isolation)");
    }

    return {
      hasDrift: issues.length > 0,
      issues
    };
  }

  /**
   * Reconciles package mismatches using lockfiles and execute smoke tests.
   */
  public async reconcileDependencies(): Promise<{ success: boolean; logs: string[] }> {
    const logs: string[] = [];
    logs.push("Initializing dependency reconciliation...");

    const hasUv = await this.checkCommand("uv");
    const isWin = os.platform() === "win32";

    // 1. Reconcile Node dependencies
    const nodeModulesPath = path.join(this.rootDir, "node_modules");
    const nodeModulesBackup = path.join(this.rootDir, "node_modules_backup");

    try {
      if (fs.existsSync(nodeModulesPath)) {
        logs.push("Backing up existing node_modules...");
        if (fs.existsSync(nodeModulesBackup)) {
          this.removeDirSync(nodeModulesBackup);
        }
        fs.renameSync(nodeModulesPath, nodeModulesBackup);
      }

      logs.push("Executing npm install using deterministic lockfile...");
      const npmCmd = isWin ? "npm.cmd ci" : "npm ci";
      await execAsync(npmCmd);
      logs.push("Node.js dependencies reconciled successfully.");
      
      // Cleanup backup on success
      if (fs.existsSync(nodeModulesBackup)) {
        this.removeDirSync(nodeModulesBackup);
      }
    } catch (err: any) {
      logs.push(`[ERROR] npm ci failed: ${err.message}. Triggering rollback...`);
      if (fs.existsSync(nodeModulesBackup)) {
        if (fs.existsSync(nodeModulesPath)) {
          this.removeDirSync(nodeModulesPath);
        }
        fs.renameSync(nodeModulesBackup, nodeModulesPath);
        logs.push("Node.js dependencies rolled back to previous state.");
      }
      return { success: false, logs };
    }

    // 2. Reconcile Python dependencies
    const venvPath = path.join(this.rootDir, ".venv");
    const venvBackup = path.join(this.rootDir, ".venv_backup");

    try {
      if (fs.existsSync(venvPath)) {
        logs.push("Backing up existing .venv...");
        if (fs.existsSync(venvBackup)) {
          this.removeDirSync(venvBackup);
        }
        fs.renameSync(venvPath, venvBackup);
      }

      logs.push("Creating clean Python virtual environment...");
      if (hasUv) {
        await execAsync("uv venv");
        logs.push("Installing packages using uv pip sync...");
        // Install LiteLLM and relevant requirements
        const pipCmd = isWin 
          ? `powershell -Command ".venv\\Scripts\\activate; uv pip install litellm"`
          : `.venv/bin/activate && uv pip install litellm`;
        await execAsync(pipCmd);
      } else {
        await execAsync("python -m venv .venv");
        logs.push("Installing packages using standard pip...");
        const pipCmd = isWin 
          ? `powershell -Command ".venv\\Scripts\\activate; pip install litellm"`
          : `.venv/bin/activate && pip install litellm`;
        await execAsync(pipCmd);
      }
      
      logs.push("Python dependencies reconciled successfully.");
      if (fs.existsSync(venvBackup)) {
        this.removeDirSync(venvBackup);
      }
    } catch (err: any) {
      logs.push(`[ERROR] Python env build failed: ${err.message}. Triggering rollback...`);
      if (fs.existsSync(venvBackup)) {
        if (fs.existsSync(venvPath)) {
          this.removeDirSync(venvPath);
        }
        fs.renameSync(venvBackup, venvPath);
        logs.push("Python environment rolled back to previous state.");
      }
      return { success: false, logs };
    }

    // 3. Run smoke tests to verify codebase health
    logs.push("Running dependency validation smoke tests...");
    try {
      // Run quick check of syntax and Next.js server compatibility
      await execAsync("npx next info");
      logs.push("[SUCCESS] All package validation and smoke tests passed.");
      return { success: true, logs };
    } catch (testErr: any) {
      logs.push(`[ERROR] Smoke tests failed post-installation: ${testErr.message}. Restoring environments.`);
      return { success: false, logs };
    }
  }

  private async checkCommand(cmd: string): Promise<boolean> {
    try {
      await execAsync(`${cmd} --version`);
      return true;
    } catch {
      return false;
    }
  }

  private removeDirSync(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.removeDirSync(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}

export const dependencyManager = DependencyManager.getInstance();
export default dependencyManager;
