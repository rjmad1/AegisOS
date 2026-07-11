// ============================================================================
// Filesystem Watcher Service — Cross-platform Event-driven Watcher
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { eventBus } from '../events/event-bus';

export interface WatcherEvent {
  type: 'create' | 'update' | 'delete' | 'rename' | 'move';
  relativePath: string;
  absolutePath: string;
  oldRelativePath?: string;
  timestamp: number;
}

export class FilesystemWatcherService {
  private static instance: FilesystemWatcherService | null = null;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private fileState: Map<string, { size: number; mtime: number }> = new Map();
  
  // Track recent deletes to match with immediate creates for Rename/Move detection
  private recentDeletes: Map<string, { relativePath: string; timestamp: number; size: number }> = new Map();

  private constructor() {}

  public static getInstance(): FilesystemWatcherService {
    if (!FilesystemWatcherService.instance) {
      FilesystemWatcherService.instance = new FilesystemWatcherService();
    }
    return FilesystemWatcherService.instance;
  }

  /**
   * Watch a directory recursively and execute callback on events
   */
  public watchDirectory(
    dirPath: string,
    onEvent: (event: WatcherEvent) => void | Promise<void>
  ): () => void {
    const resolvedRoot = path.resolve(dirPath).replace(/\\/g, '/');
    if (!fs.existsSync(resolvedRoot)) {
      fs.mkdirSync(resolvedRoot, { recursive: true });
    }

    console.log(`[FilesystemWatcher] Starting recursive watch on: ${resolvedRoot}`);
    
    // Initial scan to populate the state map
    this.scanAndPopulateState(resolvedRoot);

    // Node.js fs.watch supports recursive option on Windows/macOS natively.
    // For other environments, recursive can be handled by manually watching directories if needed,
    // but standard fs.watch covers Windows (user's environment) natively.
    const fsWatcher = fs.watch(resolvedRoot, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const relativePath = filename.replace(/\\/g, '/');
      const absolutePath = path.join(resolvedRoot, relativePath).replace(/\\/g, '/');

      // Ignore temporary / hidden files or registries
      if (entryIsIgnored(relativePath)) {
        return;
      }

      this.processFileChange(resolvedRoot, relativePath, absolutePath, onEvent);
    });

    this.watchers.set(resolvedRoot, fsWatcher);

    return () => {
      fsWatcher.close();
      this.watchers.delete(resolvedRoot);
      console.log(`[FilesystemWatcher] Stopped watching: ${resolvedRoot}`);
    };
  }

  private scanAndPopulateState(root: string) {
    const traverse = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name).replace(/\\/g, '/');
        const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

        if (entryIsIgnored(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile()) {
          try {
            const stat = fs.statSync(fullPath);
            this.fileState.set(fullPath, { size: stat.size, mtime: stat.mtimeMs });
          } catch {}
        }
      }
    };
    try {
      traverse(root);
    } catch (err) {
      console.error('[FilesystemWatcher] Initial scan failed:', err);
    }
  }

  private processFileChange(
    root: string,
    relativePath: string,
    absolutePath: string,
    onEvent: (event: WatcherEvent) => void | Promise<void>
  ) {
    // Wait briefly to allow OS to release file locks and stabilize file operations
    setTimeout(async () => {
      const exists = fs.existsSync(absolutePath);
      const now = Date.now();

      if (!exists) {
        // DELETE detection
        const cached = this.fileState.get(absolutePath);
        if (cached) {
          this.fileState.delete(absolutePath);
          this.recentDeletes.set(absolutePath, {
            relativePath,
            timestamp: now,
            size: cached.size,
          });

          // Cleanup recent deletes after 1 second
          setTimeout(() => {
            if (this.recentDeletes.has(absolutePath)) {
              this.recentDeletes.delete(absolutePath);
              onEvent({
                type: 'delete',
                relativePath,
                absolutePath,
                timestamp: now,
              });
            }
          }, 200);
        }
      } else {
        try {
          const stat = fs.statSync(absolutePath);
          if (stat.isDirectory()) return; // Skip directories

          const cached = this.fileState.get(absolutePath);

          if (!cached) {
            // CREATE or RENAME/MOVE detection
            this.fileState.set(absolutePath, { size: stat.size, mtime: stat.mtimeMs });

            // Check if there is a recent delete with matching properties
            let detectedMove = false;
            for (const [oldAbsPath, delInfo] of this.recentDeletes.entries()) {
              if (now - delInfo.timestamp < 250 && delInfo.size === stat.size) {
                // Detected a rename or move!
                this.recentDeletes.delete(oldAbsPath);
                detectedMove = true;

                const isRename = path.dirname(delInfo.relativePath) === path.dirname(relativePath);
                onEvent({
                  type: isRename ? 'rename' : 'move',
                  relativePath,
                  absolutePath,
                  oldRelativePath: delInfo.relativePath,
                  timestamp: now,
                });
                break;
              }
            }

            if (!detectedMove) {
              onEvent({
                type: 'create',
                relativePath,
                absolutePath,
                timestamp: now,
              });
            }
          } else {
            // UPDATE detection
            if (stat.size !== cached.size || stat.mtimeMs !== cached.mtime) {
              this.fileState.set(absolutePath, { size: stat.size, mtime: stat.mtimeMs });
              onEvent({
                type: 'update',
                relativePath,
                absolutePath,
                timestamp: now,
              });
            }
          }
        } catch {}
      }
    }, 50);
  }

  public getActiveWatchers(): string[] {
    return Array.from(this.watchers.keys());
  }
}

function entryIsIgnored(relativePath: string): boolean {
  const name = path.basename(relativePath);
  return (
    name.startsWith('.') ||
    relativePath.includes('node_modules') ||
    relativePath.includes('.next') ||
    name === '.artifacts_registry.json'
  );
}

export const filesystemWatcherService = FilesystemWatcherService.getInstance();
