// src/platform/pik/kernel/evolution/providers/TestDiscoveryProvider.ts
import * as fs from 'fs';
import * as path from 'path';
import { DiscoveryProvider, CanonicalAsset } from './types';

export class TestDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'TestDiscoveryProvider'; }
  private rootDir = path.resolve(process.cwd());

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];
    const testDirs = [
      path.join(this.rootDir, 'tests'),
      path.join(this.rootDir, 'src')
    ];

    const testFiles: string[] = [];
    for (const dir of testDirs) {
      if (fs.existsSync(dir)) {
        this.collectTestFiles(dir, testFiles);
      }
    }

    for (const file of testFiles) {
      const relativePath = path.relative(this.rootDir, file).replace(/\\/g, '/');
      const stats = fs.statSync(file);
      const content = fs.readFileSync(file, 'utf8');

      // Extract test descriptions/names
      const cases = this.parseTestCases(content);
      // Determine what code file this test validates
      const targetCodeFile = this.inferTargetCodeFile(relativePath, content);

      assets.push({
        id: `test:${relativePath}`,
        label: path.basename(file),
        type: 'test',
        properties: {
          path: relativePath,
          sizeBytes: stats.size,
          testCases: cases,
          validatesCodeFile: targetCodeFile
        },
        lineageId: `test:${relativePath}`,
        version: '1.0.0',
        owner: 'qa-engineering',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: [`file:///${file.replace(/\\/g, '/')}`]
      });
    }

    return assets;
  }

  private collectTestFiles(dir: string, files: string[]): void {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next') {
          this.collectTestFiles(filePath, files);
        }
      } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts') || file.endsWith('.test.tsx')) {
        files.push(filePath);
      }
    });
  }

  private parseTestCases(content: string): string[] {
    const cases: string[] = [];
    // Match describe("...", ...) or test("...", ...) or it("...", ...)
    const testRegex = /(?:describe|test|it)\s*\(\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      cases.push(match[1]);
    }
    return cases;
  }

  private inferTargetCodeFile(testRelativePath: string, content: string): string | null {
    // 1. Check if there's a comment like @covers <filepath>
    const coversMatch = content.match(/@covers\s+([^\s\n\r]+)/);
    if (coversMatch) {
      return coversMatch[1];
    }

    // 2. Infer based on naming: e.g. src/platform/kernel/PlatformKernel.test.ts -> src/platform/kernel/PlatformKernel.ts
    if (testRelativePath.includes('.test.')) {
      const candidate = testRelativePath.replace('.test.', '.');
      if (fs.existsSync(path.join(this.rootDir, candidate))) {
        return candidate;
      }
    }
    if (testRelativePath.includes('.spec.')) {
      const candidate = testRelativePath.replace('.spec.', '.');
      if (fs.existsSync(path.join(this.rootDir, candidate))) {
        return candidate;
      }
    }

    // 3. Fallback: Parse imports to see if there's a major local import of the same name
    const baseName = path.basename(testRelativePath, path.extname(testRelativePath)).replace('.test', '').replace('.spec', '');
    const importRegex = new RegExp(`import\\s+.*${baseName}.*\\s+from\\s+['"]([^'"]+)['"]`, 'g');
    const match = importRegex.exec(content);
    if (match) {
      const importPath = match[1];
      // Resolve path
      const dirOfTest = path.dirname(path.join(this.rootDir, testRelativePath));
      let resolved = '';
      if (importPath.startsWith('.')) {
        resolved = path.resolve(dirOfTest, importPath);
      } else if (importPath.startsWith('@/')) {
        resolved = path.resolve(this.rootDir, 'src', importPath.substring(2));
      }
      // Check extensions
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const fullCandidate = resolved + ext;
        if (fs.existsSync(fullCandidate)) {
          return path.relative(this.rootDir, fullCandidate).replace(/\\/g, '/');
        }
      }
    }

    return null;
  }
}
