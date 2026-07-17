import * as path from 'path';

/**
 * Tool Sandbox Enforcer (AIR-003, SGF-2026-001)
 * 
 * Ensures that all tools executed by AI Agents are sandboxed to the 
 * safe artifacts_storage directory, preventing host system compromise.
 */
export class ToolSandbox {
  private static readonly SAFE_DIR = path.resolve(process.cwd(), 'artifacts_storage');

  /**
   * Validates if a target path is safely within the artifacts_storage directory.
   */
  public static validatePath(targetPath: string): string {
    const resolvedPath = path.resolve(this.SAFE_DIR, targetPath);
    
    if (!resolvedPath.startsWith(this.SAFE_DIR)) {
      throw new Error(`Security Exception: Tool execution attempted to access restricted path outside sandbox bounds: ${targetPath}`);
    }
    
    return resolvedPath;
  }
}
