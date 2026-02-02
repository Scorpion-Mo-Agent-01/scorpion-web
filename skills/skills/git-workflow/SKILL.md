---
name: git-workflow
description: |
  Git branching and merge workflow for Hamro project. Use when: (1) Starting work on a feature or story,
  (2) Creating branches, (3) Merging code, (4) Understanding branch strategy.
  Branching: develop → feature/FEAT-XXX → story/STORY-XXX. Merge: story → feature → develop.
---

# Git Workflow

## Branch Strategy

```
develop (protected, always deployable)
    │
    └── feature/FEAT-XXX (feature branch)
            │
            ├── story/STORY-001
            ├── story/STORY-002
            └── story/STORY-003
```

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/FEAT-XXX-short-desc` | `feature/FEAT-001-clerk-backend` |
| Story | `story/STORY-XXX-short-desc` | `story/STORY-001-install-clerk-sdk` |
| Hotfix | `hotfix/brief-desc` | `hotfix/fix-login-crash` |

## Workflow Steps

### Starting a Feature

```bash
# 1. Ensure develop is current
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/FEAT-XXX-description
git push -u origin feature/FEAT-XXX-description
```

### Starting a Story

```bash
# 1. Ensure feature branch is current
git checkout feature/FEAT-XXX-description
git pull origin feature/FEAT-XXX-description

# 2. Create story branch
git checkout -b story/STORY-XXX-description
```

### Completing a Story

```bash
# 1. Commit changes
git add -A
git commit -m "STORY-XXX: Description of changes"

# 2. Push story branch
git push -u origin story/STORY-XXX-description

# 3. Merge to feature (after QA approval)
git checkout feature/FEAT-XXX-description
git pull origin feature/FEAT-XXX-description
git merge story/STORY-XXX-description
git push origin feature/FEAT-XXX-description

# 4. Delete story branch
git branch -d story/STORY-XXX-description
git push origin --delete story/STORY-XXX-description
```

### Completing a Feature

```bash
# 1. Ensure all stories merged to feature
git checkout feature/FEAT-XXX-description
git pull origin feature/FEAT-XXX-description

# 2. Merge to develop
git checkout develop
git pull origin develop
git merge feature/FEAT-XXX-description
git push origin develop

# 3. Delete feature branch
git branch -d feature/FEAT-XXX-description
git push origin --delete feature/FEAT-XXX-description
```

## Merge Strategy

```
story/STORY-XXX → feature/FEAT-XXX → develop
     (PR)              (PR)           (protected)
```

- **Story → Feature**: Merge after QA passes DoD
- **Feature → Develop**: Merge after all stories complete

## Commit Message Format

```
STORY-XXX: Brief description

- Detail 1
- Detail 2

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pre-Work Checklist

```bash
# Always before starting implementation
git fetch origin
git checkout develop
git pull origin develop
# Then create/checkout appropriate branch
```

## Hooks

Session start hook auto-fetches develop. See `.claude/hooks/git-sync.sh`.
