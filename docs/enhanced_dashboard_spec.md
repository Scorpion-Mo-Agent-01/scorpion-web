# Enhanced Obsidian Control Dashboard - Design Specification

**Date:** 2026-02-02  
**Status:** Design Approved - Implementation In Progress

## Overview

Comprehensive redesign of the Scorpion Web dashboard with multi-agent orchestration, real-time monitoring, and security features.

## Layout Components

### A. Global Header ("The Cockpit")

**Stats Dashboard** (Centered)
- **Agents Active:** Count of agents with status=WORKING
- **Tasks in Queue:** Count of tasks in Inbox + Assigned + In Progress
- **Completion Rate:** Percentage of tasks in Done vs Total
- **Typography:** Bold, serif-adjacent font for numbers (e.g., `font-serif`)

**System Clock** (Top Right)
- Real-time clock showing UTC and Local time
- Format: `UTC 04:32 | Local 23:32 EST`
- Updates every second

**Shield Status** (Near Clock)
- Pill-shaped indicator
- States:
  - **Online** (Green): Normal operation
  - **Threat Detected** (Pulsing Red): Security alert from Scorpion logs
- Based on security event monitoring

### B. Left Sidebar: Agent Roster

**Identity Cards** (Vertical List)
Each of 6 agents (Scorpion, Steve J., Walter, Linus, John, Sly):

**Card Structure:**
```
┌─────────────────────┐
│ 🦂 Scorpion         │
│ LEAD • WORKING      │
│ Task: Reviewing PR  │
└─────────────────────┘
```

**Status Badges:**
- `WORKING` - Mint green (#10B981)
- `IDLE` - Gray (#6B7280)
- `BLOCKED` - Amber (#F59E0B)

**Agent Levels:**
- Lead (Scorpion)
- Specialist (Steve J., Walter, Linus, John, Sly)
- Internal (for sub-agents)

**Hover Behavior:**
- Shows tooltip with current `WORKING.md` summary
- Fetched from `agents/{agent-name}/WORKING.md`

### C. Main Kanban Board: "Mission Queue"

**Columns:** (4 total, reduced from 5)
1. **Inbox** - New tasks, unassigned
2. **Assigned** - Tasks with assignee, not started
3. **In Progress** - Active work
4. **Review/Done** - Completed or pending approval

**Enhanced Task Cards:**

```
┌────────────────────────────────┐
│ Implement OAuth Integration    │  ← Header (white, bold)
│                                 │
│ Add NextAuth.js provider for   │  ← Body (2-line truncated)
│ GitHub and Google login...     │
│                                 │
│ [seo] [logic] [auth]           │  ← Tags (lowercase, gray)
│                                 │
│ 👤 LI  │  Assigned to Linus    │  ← Assignee (avatar + name)
└────────────────────────────────┘
```

**Card Elements:**
- **Header:** Task title, white text, 18px
- **Body:** 2-line description with ellipsis overflow
- **Tags:** Metadata (seo, logic, ui, research, auth, etc.)
- **Assignee:** Avatar circle with initials + full name on hover

**Interactions:**
- Click to expand full details
- Drag to move between columns (Framer Motion animation)
- Security lock overlay if flagged

### D. Right Sidebar: Live Feed & Skill Lab

**Tabbed Interface:**
1. **Live Feed** (Default)
2. **Skill Lab**

#### Live Feed

**Filterable Stream:**
- Real-time activity from all agents
- Card-based feed items

**Filter Toggles:**
- All
- Tasks (task created/moved)
- Comments (task comments/mentions)
- Docs (file updates)
- Status (agent status changes)

**Agent Filters:**
- Grid of agent buttons (6 total)
- Click to show only that agent's activity
- Multi-select supported

**Feed Item Structure:**
```
┌────────────────────────────────┐
│ 🦂 Scorpion  •  2m ago         │
│ @mentioned you in "Setup Auth" │
│ "Can you review the OAuth      │
│  implementation?"              │
└────────────────────────────────┘
```

#### Skill Lab

**Directory View:**
- Scrollable list of skills from `./agents/skills/*.md`
- Each skill shows:
  - Name
  - Description (from SKILL.md frontmatter)
  - Currently assigned agents

**Drag-and-Drop:**
- Drag skill card to agent avatar
- Assigns skill to that agent
- Updates agent's skill list
- Persistent via API

**Skill Card:**
```
┌────────────────────────────────┐
│ 📦 GitHub Integration          │
│ Use gh CLI for PRs and issues  │
│                                 │
│ Assigned: [WA] [LI]            │
│           Walter, Linus        │
└────────────────────────────────┘
```

## UX Directives

### Motion (Framer Motion)

**Task Movement:**
```typescript
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2, ease: "easeInOut" }}
>
```

**Transitions:**
- Column changes: 200ms ease-in-out slide
- Card expansion: 150ms scale + opacity
- Status badge changes: 100ms color fade

### Editorial Spacing

- **Generous padding:** 24px minimum between sections
- **Card spacing:** 16px vertical gap
- **Typography scale:** 14px (body), 16px (labels), 18px (headers), 24px (stats)
- **Max width:** 1920px (centered on ultra-wide)

### Interaction Patterns

**Hover States:**
- Agent cards → Show WORKING.md tooltip
- Task cards → Highlight + subtle lift (translateY: -2px)
- Skill cards → Glow border

**Click Behaviors:**
- Task card → Expand modal with full details
- Agent avatar → Focus feed on that agent
- Status badge → Show recent activity log

**Security Feedback:**
- Flagged task → Red border + lock icon overlay
- "Security Intervention" badge
- Requires manual review/unlock

## Security Implementation

### Authentication: NextAuth.js

**Provider:** Single-user JWT session

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Validate against env vars
        if (
          credentials?.username === process.env.DASHBOARD_USER &&
          credentials?.password === process.env.DASHBOARD_PASS
        ) {
          return { id: 1, name: "Mo", email: "moyeshkhanal@gmail.com" }
        }
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  }
})
```

**Protected Routes:**
```typescript
// middleware.ts
export { default } from "next-auth/middleware"
export const config = { matcher: ["/dashboard/:path*"] }
```

### Input Sanitization

**XSS Prevention:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: []
  })
}
```

**SQL Injection Prevention:**
- Use parameterized queries (sqlite3 prepared statements)
- Validate all input types
- Escape special characters

**Prompt Injection Detection:**
```typescript
const detectPromptInjection = (text: string): boolean => {
  const patterns = [
    /ignore (previous|all) (instructions|prompts)/i,
    /you are now/i,
    /system:\s*you\s+are/i,
    /\[INST\]/i,
    /<\|im_start\|>/i
  ]
  return patterns.some(pattern => pattern.test(text))
}
```

**Sanitization Flow:**
1. Task creation → `sanitizeInput(title)`, `sanitizeInput(description)`
2. Comment creation → `sanitizeInput(comment)`
3. Prompt injection check → Flag and lock if detected
4. Store sanitized version in database

## Data Model Updates

### Agent Status Tracking

**New API Endpoint:** `GET /api/agents`

```json
[
  {
    "id": "scorpion",
    "name": "Scorpion",
    "emoji": "🦂",
    "level": "Lead",
    "status": "WORKING",
    "currentTask": "Reviewing PR #42",
    "workingFile": "/agents/scorpion/WORKING.md",
    "skills": ["skill-creator", "github", "memory_search"]
  }
]
```

### Activity Feed

**New API Endpoint:** `GET /api/activity`

```json
[
  {
    "id": "1",
    "timestamp": "2026-02-02T04:32:00Z",
    "agentId": "scorpion",
    "type": "mention",
    "taskId": "42",
    "content": "@linus can you review the OAuth implementation?",
    "metadata": {}
  }
]
```

### Security Events

**New API Endpoint:** `GET /api/security/status`

```json
{
  "status": "online",
  "threats": 0,
  "lastIncident": null,
  "events": []
}
```

## Implementation Phases

### Phase 6: Enhanced UI (1-2 days)
- [ ] Install Framer Motion + NextAuth.js
- [ ] Build Global Header with stats
- [ ] Build Left Sidebar agent roster
- [ ] Enhance Kanban cards with new design
- [ ] Build Right Sidebar (Live Feed + Skill Lab)

### Phase 7: Real-time Features (1 day)
- [ ] WebSocket or polling for live updates
- [ ] Activity feed backend
- [ ] Agent status monitoring
- [ ] System clock component

### Phase 8: Security Hardening (1 day)
- [ ] Implement NextAuth.js
- [ ] Add input sanitization
- [ ] Prompt injection detection
- [ ] Security event logging

### Phase 9: Polish & Testing (1 day)
- [ ] Framer Motion animations
- [ ] Hover states and tooltips
- [ ] Responsive design
- [ ] E2E testing

## Technical Stack Updates

**New Dependencies:**
```json
{
  "framer-motion": "^11.0.0",
  "next-auth": "^4.24.0",
  "isomorphic-dompurify": "^2.9.0",
  "date-fns": "^3.0.0",
  "ws": "^8.16.0"
}
```

## Color Palette

```css
/* Status Colors */
--status-working: #10B981;  /* Mint */
--status-idle: #6B7280;     /* Gray */
--status-blocked: #F59E0B;  /* Amber */

/* Security */
--shield-online: #10B981;   /* Green */
--shield-threat: #EF4444;   /* Red */

/* Existing Shadcn Dark Mode */
--background: #020617;      /* Slate-950 */
--foreground: #fafafa;      /* Zinc-50 */
--border: #1e293b;          /* Slate-800 */
```

## Next Steps

1. Create component structure
2. Install new dependencies
3. Build Global Header
4. Build Agent Roster
5. Enhance Kanban cards
6. Build Live Feed
7. Build Skill Lab
8. Implement security features
9. Add animations
10. Test and deploy
