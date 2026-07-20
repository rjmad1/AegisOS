// src/platform/pik/kernel/evolution/providers/AdrDiscoveryProvider.ts
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveryProvider, CanonicalAsset } from './types';

export class AdrDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'AdrDiscoveryProvider'; }
  private rootDir = path.resolve(process.cwd());

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];
    const adrDir = path.join(this.rootDir, 'adr');
    if (!fs.existsSync(adrDir)) return assets;

    const files = fs.readdirSync(adrDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const fullPath = path.join(adrDir, file);
      const relativePath = path.relative(this.rootDir, fullPath).replace(/\\/g, '/');
      const stats = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');

      const title = this.extractTitle(content, file);
      const status = this.extractStatus(content);
      const context = this.extractSection(content, 'Context');
      const decision = this.extractSection(content, 'Decision');
      const consequences = this.extractSection(content, 'Consequences');

      // Check if it supersedes another ADR
      const supersedes = this.extractSupersededAdrs(content);

      assets.push({
        id: `adr:${file.replace('.md', '')}`,
        label: title,
        type: 'adr',
        properties: {
          path: relativePath,
          sizeBytes: stats.size,
          status,
          context,
          decision,
          consequences,
          supersedes
        },
        lineageId: `adr:${file.replace('.md', '')}`,
        version: '1.0.0',
        owner: 'architecture-board',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: [`file:///${fullPath.replace(/\\/g, '/')}`]
      });
    }

    return assets;
  }

  private extractTitle(content: string, defaultValue: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : defaultValue;
  }

  private extractStatus(content: string): string {
    // Look for Status: Accepted or Status: Superseded or status under a Status heading
    const statusMatch = content.match(/Status:\s*([^\n\r]+)/i);
    if (statusMatch) return statusMatch[1].trim();

    const statusSection = this.extractSection(content, 'Status');
    if (statusSection) {
      if (statusSection.toLowerCase().includes('superseded')) return 'Superseded';
      if (statusSection.toLowerCase().includes('accepted')) return 'Accepted';
      if (statusSection.toLowerCase().includes('proposed')) return 'Proposed';
      return statusSection.split('\n')[0].trim();
    }

    return 'Accepted'; // Default
  }

  private extractSection(content: string, sectionName: string): string {
    // Matches heading like ## Context or ## Decision or ## Consequences and grabs all text until next ## or end
    const regex = new RegExp(`##\\s+${sectionName}[\\r\\n]+([\\s\\S]*?)(?:##|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractSupersededAdrs(content: string): string[] {
    const supersededList: string[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('supersedes')) {
        // Look for something like ADR-009 or ADR-001
        const adrMatch = line.match(/(ADR-\d+)/i);
        if (adrMatch) {
          supersededList.push(adrMatch[1].toUpperCase());
        }
      }
    }
    return supersededList;
  }
}
