/**
 * Filesystem Delivery Provider
 * 
 * Idempotently saves generated artifacts to the local filesystem.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IArtifactDeliveryProvider, GeneratedArtifact } from './types';

export class FilesystemDelivery implements IArtifactDeliveryProvider {
  public readonly deliveryId = 'filesystem-delivery';

  public async deliver(
    artifacts: GeneratedArtifact[],
    destinationDir: string
  ): Promise<Record<string, string>> {
    const absoluteDest = path.resolve(process.cwd(), destinationDir);
    
    if (!fs.existsSync(absoluteDest)) {
      fs.mkdirSync(absoluteDest, { recursive: true });
    }

    const deliveredPaths: Record<string, string> = {};

    for (const art of artifacts) {
      const targetPath = path.join(absoluteDest, art.fileName);
      
      let writeContent: string | Buffer;
      if (typeof art.content === 'string') {
        writeContent = art.content;
      } else {
        writeContent = art.content;
      }

      fs.writeFileSync(targetPath, writeContent);
      deliveredPaths[art.fileName] = targetPath;
      
      console.log(`[FilesystemDelivery] Wrote artifact "${art.fileName}" to ${targetPath}`);
    }

    return deliveredPaths;
  }
}
