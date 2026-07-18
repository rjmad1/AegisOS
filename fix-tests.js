const fs = require('fs');
const file = 'tests/unit/platform/ExecutionHardening.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/id:\s*['"]user-(.*?)['"]/g, 'userId: "user-$1"');
fs.writeFileSync(file, content);
console.log('Done ExecutionHardening.test.ts');

const file2 = 'tests/unit/platform/WorkspaceOperatingEnvironment.test.ts';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/workspaceId:/g, 'workspacePath:');
fs.writeFileSync(file2, content2);
console.log('Done WorkspaceOperatingEnvironment.test.ts');
