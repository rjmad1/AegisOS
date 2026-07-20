// src/platform/pik/kernel/evolution/providers/CodeDiscoveryProvider.ts
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveryProvider, CanonicalAsset } from './types';

export class CodeDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'CodeDiscoveryProvider'; }
  private rootDir = path.resolve(process.cwd());

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];
    const srcDir = path.join(this.rootDir, 'src');
    if (!fs.existsSync(srcDir)) return assets;

    const files = this.walk(srcDir);
    for (const file of files) {
      const relativePath = path.relative(this.rootDir, file).replace(/\\/g, '/');
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf8');

      // Parse imports
      const imports = this.parseImports(content);

      assets.push({
        id: `code:${relativePath}`,
        label: path.basename(file),
        type: 'code',
        properties: {
          path: relativePath,
          sizeBytes: stats.size,
          imports,
          category: this.deduceCategory(relativePath)
        },
        lineageId: `code:${relativePath}`,
        version: '1.0.0',
        owner: 'engineering',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: [`file:///${file.replace(/\\/g, '/')}`]
      });
    }

    return assets;
  }

  private walk(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // Exclude specific directories if nested
        if (file !== 'node_modules' && file !== '.next') {
          results = results.concat(this.walk(filePath));
        }
      } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        results.push(filePath);
      }
    });
    return results;
  }

  private parseImports(content: string): string[] {
    const imports: string[] = [];
    // Matches: import ... from '...'; or import '...';
    const importRegex = /import\s+?(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      // Normalize relative imports or alias imports
      if (importPath.startsWith('.') || importPath.startsWith('@/')) {
        imports.push(importPath);
      }
    }
    return Array.from(new Set(imports));
  }

  private deduceCategory(relativePath: string): string {
    if (relativePath.includes('/platform/kernel/')) return 'kernel';
    if (relativePath.includes('/platform/control-plane/')) return 'control-plane';
    if (relativePath.includes('/platform/pik/')) return 'intelligence';
    if (relativePath.includes('/platform/knowledge/')) return 'knowledge';
    if (relativePath.includes('/platform/qualification/')) return 'qualification';
    if (relativePath.includes('/app/')) return 'ui-page';
    if (relativePath.includes('/components/')) return 'ui-component';
    if (relativePath.includes('/infrastructure/')) return 'infrastructure';
    return 'general';
  }
}
