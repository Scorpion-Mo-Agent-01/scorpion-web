# TODO — Workflow Node Overhaul

Goal: Replace kanban with workflow-native task graph (nodes as tasks) with telemetry, context propagation, Vercel dark theme.

## Checklist
- [ ] DB/model: add workflow node fields (status idle/working/completed/blocked, assignee, model, token usage, skills used, time spent, context summary, telemetry log), migrations for existing DB.
- [ ] API: extend workflow GET/POST/PUT to read/write new fields; add node status/telemetry update endpoint if needed.
- [ ] Orchestrator suggestions: default node chain (Plan → Backend → UI → Review → QA) with auto-assignees; allow edits during creation.
- [ ] UI (canvas): large nodes with status chip, assignee, model, compact context; click opens inspector with telemetry and status transitions; fix node selection/click.
- [ ] UI (dashboard): replace kanban with workflow-centric view; consistent Vercel dark theme; layout regression fixes.
- [ ] Context propagation: store compact summaries per node and surface in next node(s).
- [ ] Migration: map existing kanban tasks into workflows or archive; disable/retire kanban view.
- [ ] QA: run tests/build, verify workflow creation (e.g., "UI Improvement" workflow), node interactions, telemetry display.
- [ ] Deployment: commit, push, deploy; clean unused Docker images/containers afterward.
