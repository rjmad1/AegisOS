// src/platform/pik/kernel/evolution/providers/DocDiscoveryProvider.ts
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveryProvider, CanonicalAsset } from './types';

export class DocDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'DocDiscoveryProvider'; }
  private rootDir = path.resolve(process.cwd());

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];
    const docsDir = path.join(this.rootDir, 'docs');
    if (!fs.existsSync(docsDir)) return assets;

    const mdFiles: string[] = [];
    this.collectMdFiles(docsDir, mdFiles);

    for (const file of mdFiles) {
      const relativePath = path.relative(this.rootDir, file).replace(/\\/g, '/');
      // Skip ADR directory (handled by ADR provider)
      if (relativePath.startsWith('docs/adr/') || relativePath.startsWith('adr/')) {
        continue;
      }
      
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf8');

      const title = this.extractTitle(content, path.basename(file));
      const frontmatter = this.parseFrontmatter(content);

      assets.push({
        id: `doc:${relativePath}`,
        label: title,
        type: 'documentation',
        properties: {
          path: relativePath,
          sizeBytes: stats.size,
          frontmatter,
          headings: this.extractHeadings(content)
        },
        lineageId: `doc:${relativePath}`,
        version: frontmatter.version || '1.0.0',
        owner: frontmatter.owner || 'documentation-team',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: [`file:///${file.replace(/\\/g, '/')}`]
      });
    }

    return assets;
  }

  private collectMdFiles(dir: string, files: string[]): void {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'archive') {
          this.collectMdFiles(filePath, files);
        }
      } else if (file.endsWith('.md')) {
        files.push(filePath);
      }
    });
  }

  private extractTitle(content: string, defaultValue: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : defaultValue;
  }

  private parseFrontmatter(content: string): Record<string, any> {
    const result: Record<string, any> = {};
    const fmMatch = content.match(/^---[\r\n]+([\s\S]+?)[\r\n]+---/);
    if (fmMatch) {
      const lines = fmMatch[1].split('\n');
      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
          result[key] = val;
        }
      }
    }
    return result;
  }

  private extractHeadings(content: string): string[] {
    const headings: string[] = [];
    const matches = content.matchAll(/^#{2,4}\s+(.+)$/gm);
    for (const match of matches) {
      headings.push(match[1].trim());
    }
    return headings.slice(0, 15); // limit output
  }
}
