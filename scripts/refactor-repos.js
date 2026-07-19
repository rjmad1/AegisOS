
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "../src/app/api");

const repoMap = {
  "userRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.users" },
  "auditRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.audit" },
  "secretRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.secrets" },
  "licenseRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.licenses" },
  "configRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.config" },
  "roleRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.roles" },
  "jobRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.jobs" },
  "featureFlagRepository": { serviceImport: "import { adminService } from \"@/services/admin.service\";", replacement: "adminService.featureFlags" },
  "workflowRepository": { serviceImport: "import { workflowRepository } from \"@/services/workflow.service\";", replacement: "workflowRepository" } // Wait, workflowService doesn`t expose the repo directly. I will expose it for this refactor.
};

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (f.endsWith(".ts") || f.endsWith(".tsx")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let changed = false;
      const lines = content.split("\n");
      const newLines = [];
      let importedAdminService = false;

      for (let line of lines) {
        if (line.includes("from ") && line.includes("repositories/")) {
          let replaced = false;
          for (const [repo, mapping] of Object.entries(repoMap)) {
            if (line.includes(repo)) {
              if (repo === "workflowRepository") {
                 newLines.push("import { workflowService } from \"@/services/workflow.service\";");
              } else {
                 if (!importedAdminService) {
                   newLines.push(mapping.serviceImport);
                   importedAdminService = true;
                 }
              }
              replaced = true;
              changed = true;
              // we don`t break in case there are multiple on the same line, though unlikely
            }
          }
          if (replaced) continue;
        }
        
        let modifiedLine = line;
        for (const [repo, mapping] of Object.entries(repoMap)) {
          if (repo === "workflowRepository") {
             modifiedLine = modifiedLine.replace(new RegExp(repo, "g"), "workflowService");
          } else {
             modifiedLine = modifiedLine.replace(new RegExp(repo, "g"), mapping.replacement);
          }
        }
        if (modifiedLine !== line) changed = true;
        
        newLines.push(modifiedLine);
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, newLines.join("\n"));
        console.log("Updated: " + fullPath);
      }
    }
  }
}

traverse(apiDir);

