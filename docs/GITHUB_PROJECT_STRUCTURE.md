# AegisOS GitHub Project Structure
**Milestones, Labels, Project Boards & Issue/PR Markdown Templates**

This document establishes the structure and templates for AegisOS repository management on GitHub, ensuring consistent tracking of tasks across the mobile, backend, and platform teams.

---

## 1. Project Board Configurations

We utilize a single repository GitHub Project with a Kanban view structured into the following columns:
1. **Backlog**: All items prioritized for future sprints.
2. **To Do**: Tasks allocated to the current sprint.
3. **In Progress**: Work currently active.
4. **In Review / QA**: Pull requests opened, awaiting reviews or running automated integration pipelines.
5. **Done**: Fully completed and merged features matching the Definition of Done.

---

## 2. Issue Labels Taxonomy

To automate triage, we enforce the following standard labels:

| Label Name | Color | Description |
|---|---|---|
| `epic` | `#3E4B9F` | Large-scale capabilities spanning multiple sprints. |
| `feature` | `#0E8A16` | New capabilities or functional enhancements. |
| `bug` | `#D93F0B` | System defects or runtime crashes. |
| `security` | `#B60205` | Vulnerabilities, credentials, or mTLS tunneling tasks. |
| `performance` | `#FBCA04` | VRAM tuning, socket overhead, and 60fps UI rendering. |
| `refactor` | `#D4C5F9` | Technical debt remediation or code cleaning. |
| `documentation`| `#0075CA` | Handbooks, plans, and architectural adjustments. |
| `blocker` | `#E11D21` | Critical path task blocking parallel streams. |

---

## 3. GitHub Issue Templates

### Epic Template (`.github/ISSUE_TEMPLATE/epic.md`)
```markdown
---
name: "Epic Template"
about: "Large-scale capability spanning multiple features and sprints"
title: "[Epic] - Capability Name"
labels: ["epic"]
assignees: ""
---

## 1. Goal Description
Provide a clear, high-level summary of this capability, the business value, and target user personas.

## 2. Included Features & Issues
- [ ] #IssueNum1 - Feature 1 Name (P0)
- [ ] #IssueNum2 - Feature 2 Name (P1)
- [ ] #IssueNum3 - Feature 3 Name (P2)

## 3. Architecture & Design References
- Links to relevant Architecture Handbooks, API Contracts, or ADRs.

## 4. Key Milestones & Release Target
- Targeted Program Increment / Sprint.
```

### Feature Template (`.github/ISSUE_TEMPLATE/feature.md`)
```markdown
---
name: "Feature Template"
about: "Implement a new user story or functional capability"
title: "[Feature] - Story Title"
labels: ["feature"]
assignees: ""
---

## 1. User Story
As a [user persona], I want [action], so that [outcome].

## 2. Dependencies
List any blocker issues or preceding infrastructure requirements (e.g., depends on #IssueNum).

## 3. Acceptance Criteria
- [ ] Criteria 1: [Scenario / Condition]
- [ ] Criteria 2: [Scenario / Condition]
- [ ] Criteria 3: [Scenario / Condition]

## 4. Verification Plan
- How will the developer and QA verify the functionality? (e.g. Unit tests, golden tests, API mock validation)
```

### Bug Template (`.github/ISSUE_TEMPLATE/bug.md`)
```markdown
---
name: "Bug Report"
about: "Report a defect, crash, or unexpected behavior"
title: "[Bug] - Short description of issue"
labels: ["bug"]
assignees: ""
---

## 1. Defect Description
A clear and concise description of what the bug is.

## 2. Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## 3. Expected Behavior
A clear description of what should have happened.

## 4. Environment Details
* Device/Simulator: (e.g., iPhone 15 Pro, Android AVD)
* OS Version: (e.g., iOS 17.2, Android 14)
* Host Version: (e.g., Ollama v0.1.48)

## 5. Logs & Screenshots
Include console logs, crash stack traces, or screenshots if applicable.
```

---

## 4. Pull Request Template (`.github/PULL_REQUEST_TEMPLATE.md`)
```markdown
## Pull Request Summary
Provide a brief summary of the changes made, the problem solved, and the architectural context.

## Related Issues
Closes #IssueNum

## Quality Checklist
- [ ] Code compiles without static analysis errors or warnings.
- [ ] Strict import rules (Clean Architecture) are respected.
- [ ] Code coverage matches or exceeds target thresholds (80% package-wide, 100% security).
- [ ] All unit, widget, and golden tests pass successfully.
- [ ] Documentation updated to reflect changes.

## Security Considerations
List any impacts on mTLS tunnels, encryption (SQLCipher), Secure Enclaves, or user session lifecycles.
```
