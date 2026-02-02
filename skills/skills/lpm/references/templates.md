# LPM Templates

## Epic Template (`/hamro/epics/EPIC-XXX.md`)

```markdown
---
id: EPIC-XXX
title: [Epic Title]
status: draft | approved | in-progress | complete
created: YYYY-MM-DD
owner: LPM
---

## Vision
[One paragraph describing the desired outcome]

## Success Metrics
- [ ] Metric 1
- [ ] Metric 2

## Features
- FEAT-XXX: [Feature Name]

## Dependencies
[External dependencies]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
```

## Feature Template (`/hamro/features/FEAT-XXX.md`)

```markdown
---
id: FEAT-XXX
epic: EPIC-XXX
title: [Feature Title]
classification: [FRONTEND | BACKEND | INFRA | CROSS-FUNC]
status: draft | ready | in-progress | complete
---

## Description
[Detailed feature description]

## Acceptance Criteria
- [ ] AC1
- [ ] AC2

## Stories
- STORY-XXX: [Story Title]

## Technical Notes
[Architecture decisions, constraints]
```

## Story Template (`/hamro/stories/STORY-XXX.md`)

```markdown
---
id: STORY-XXX
feature: FEAT-XXX
title: [Story Title]
classification: [FRONTEND | BACKEND | INFRA]
status: draft | ready | in-progress | review | complete
points: [1 | 2 | 3 | 5]
blocked_by: []
blocks: []
---

## User Story
As a [user type], I want [action] so that [benefit].

## Acceptance Criteria
- [ ] AC1
- [ ] AC2

## Technical Specification
[Implementation details, max 100 lines of change]

## Definition of Done
- [ ] Code implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code reviewed
- [ ] Documentation updated
```
