const fs = require('fs');
const path = require('path');

function getMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', '.next', 'dist', 'coverage', '.git', 'node_modules_backup', 'node_modules_empty', 'conversa_repo', 'artifacts_storage', '.aegisos', '.vscode'].includes(file)) {
      continue;
    }
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function isPlaceholderLink(target) {
  const lower = target.toLowerCase();
  return (
    lower.includes('path/to/') ||
    lower.includes('github-link') ||
    lower.includes('...') ||
    lower.includes('adr-###') ||
    lower.includes('pr-####') ||
    lower === 'filename' ||
    lower === 'link' ||
    lower === 'url'
  );
}

function validateDocs() {
  console.log('[ValidateDocs] Starting workspace documentation cross-reference and link validation...');
  const rootDir = path.resolve(__dirname, '..');
  const markdownFiles = getMarkdownFiles(rootDir);
  console.log(`[ValidateDocs] Found ${markdownFiles.length} markdown documentation files.`);

  let totalLinksChecked = 0;
  let brokenLinksCount = 0;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const mdFile of markdownFiles) {
    const content = fs.readFileSync(mdFile, 'utf-8');
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      let linkTarget = match[2].trim();

      // Skip HTTP/HTTPS external links, mailto, fragment-only anchors, or obvious placeholders
      if (linkTarget.startsWith('http://') || linkTarget.startsWith('https://') || linkTarget.startsWith('mailto:') || linkTarget.startsWith('#') || isPlaceholderLink(linkTarget)) {
        continue;
      }

      totalLinksChecked++;

      // Strip query/hash parameters and file:/// prefix
      linkTarget = linkTarget.split('#')[0].split('?')[0];
      if (linkTarget.startsWith('file:///')) {
        linkTarget = linkTarget.replace('file:///', '');
      }

      try {
        linkTarget = decodeURIComponent(linkTarget);
      } catch (e) {}

      if (!linkTarget) continue;

      let resolvedPath;
      if (path.isAbsolute(linkTarget)) {
        resolvedPath = linkTarget;
      } else {
        resolvedPath = path.resolve(path.dirname(mdFile), linkTarget);
      }

      if (!fs.existsSync(resolvedPath)) {
        const relDocPath = path.relative(rootDir, mdFile);
        console.error(`[ValidateDocs] Broken Link in "${relDocPath}": [${linkText}] -> "${linkTarget}" (Resolved: ${resolvedPath})`);
        brokenLinksCount++;
      }
    }
  }

  console.log(`[ValidateDocs] Checked ${totalLinksChecked} internal relative documentation links.`);

  if (brokenLinksCount > 0) {
    console.error(`[ValidateDocs] Validation failed with ${brokenLinksCount} broken documentation link(s).`);
    process.exit(1);
  }

  console.log('[ValidateDocs] Documentation validation PASSED. All internal cross-references are valid.');
}

validateDocs();
