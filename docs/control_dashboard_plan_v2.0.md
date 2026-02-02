# Obsidian Control Dashboard v2.0 Integration Plan for `scorpion-web`

**Based on:** `docs/OBSIDIAN_2_0_SPEC.md`
**Goal:** Transition from PoC UI (v1.0) to a production-ready, secure, and cost-efficient multi-agent orchestration platform.

---

## 1. Current Status (Post v1.0 Implementation)

*   **Frontend (`scorpion-web`):**
    *   [x] New route `/dashboard` for the control dashboard.
    *   [x] UI components for Kanban board, Live Feed (mocked), and Skill Lab (mocked) using `@shadcn/ui`.
    *   [x] Basic client-side authentication (hardcoded credentials).
    *   [x] Basic interaction with local `sqlite-vec` via Next.js API routes for tasks and agents.
    *   [x] Deep Dark Mode aesthetic.

*   **Backend (`scorpion-web`):**
    *   [x] Next.js API routes (`/api/tasks`, `/api/agents`) interacting with `memory/memory.db`.
    *   [x] `memory/memory.db` initialized with `tasks` and `agents` tables.

*   **Agent Infrastructure:**
    *   [x] Dedicated agent folders (`agents/scorpion/`, `agents/steve-j/`, etc.).
    *   [x] Core configuration files (`AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `MEMORY.md`, `WORKING.md`) for primary agents.
    *   [x] `HEARTBEAT.md` updated to include basic mission control orchestration logic (placeholder for actual agent triggering).

---

## 2. Work Breakdown for v2.0 (Phased Implementation)

### Phase 1: Security Hardening (The "Iron Dome") - Priority: High

1.  **Authentication Provider Integration (NextAuth.js with Credentials)**
    *   [x] Replace `auth-interface.tsx` with NextAuth.js Credentials (single-user) setup.
    *   [x] Configure username/password via env (`ADMIN_USER` / `ADMIN_PASS`); no OAuth.
    *   [x] Implement sign-in, sign-out, and session management (Implemented in `auth-interface.tsx` and `global-header.tsx`).

2.  **API Route Protection**
    *   [x] Implement `middleware.ts` to protect `/api/*` and `/dashboard/*` routes.
    *   [x] Verify JWT/Session tokens on incoming requests.
    *   [x] Handle unauthorized (401) and forbidden (403) access responses.

3.  **WebSocket Authentication**
    *   [x] Design and implement authentication for WebSocket handshake (Dependent on Phase 2, Task 1: Dedicated Daemon Service).
    *   [x] Pass auth tokens securely during WebSocket connection upgrade (NextAuth accessToken query param + JWT verify in gateway).
    *   [x] Ensure invalid connections are dropped immediately (gateway rejects missing/invalid tokens with 401).

### Phase 2: The "Heartbeat" Daemon (True Real-Time) - Priority: High

1.  **Dedicated Daemon Service (`control-gateway`)**
    *   [x] Develop a standalone Node.js (or Python) WebSocket server (`server.js` in `projects/control-gateway`).
*   [x] Integrate `ws` or `socket.io` for real-time communication.
*   [x] Configure as a separate container in `docker-compose` or custom server within `scorpion-web` if applicable (Implemented as a separate Docker container, `control-gateway`).

2.  **Event Bus Implementation**
    *   [x] Implement a Pub/Sub system (e.g., in-process `EventEmitter` for MVP, Redis for scale).
    *   [x] Define core topics: `agent:log`, `task:update`, `system:status`.

3.  **Frontend Real-time Integration**
    *   [x] Replace mocked Live Feed and Kanban polling with a real `useSocket` hook.
    *   [x] Bind Kanban state updates to server-pushed `task:update` events.
    *   [x] Display `agent:log` and `system:status` events in the Live Feed in real-time.
    *   [x] Bind Agent Roster to `agent:update` events for live status/skills updates.

### Phase 3: Sandboxed Execution Layout (The "Linus" Interface) - Priority: Medium

1.  **Docker Orchestrator Integration**
    *   [x] Install `dockerode` (Node.js) or equivalent Docker SDK (control-gateway).
    *   [x] Create a `SandboxService` with methods: `spawnSession(imageId)`, `execCommand(containerId, cmd)`, `terminateSession(containerId)`.

2.  **Secure Volume Mounting Strategy**
    *   [ ] Define and implement read-only/scoped read-write volume mounts for agent `workspace` directories.

3.  **Resource Limiting**
    *   [ ] Enforce `cpus`, `memory`, and `network` limits on spawned containers (basic CPU/memory/net limits stubbed in SandboxService; needs tightening).

### Phase 4: Token & Content Optimization (Efficiency Layer) - Priority: Medium

1.  **Tiered Context Management**
    *   [ ] Develop a `ContextBuilderService` that combines:
        *   Last 10 raw messages (short-term).
        *   "Active Task" summary from `WORKING.md` (mid-term).
        *   Vector search `sqlite-vec` for relevant snippets (long-term).
    *   [ ] Output a concatenated, strictly formatted system prompt.

2.  **Token Counter Integration**
    *   [ ] Integrate `tiktoken` (or equivalent) to pre-check prompt length.
    *   [ ] Implement fail-fast mechanism if prompt exceeds model limits.

3.  **Static Prompt Caching**
    *   [ ] Refactor system prompts (`AGENTS.md`, `SOUL.md`) for byte-for-byte consistency.
    *   [ ] Investigate and enable provider-specific prompt caching (e.g., `cache_control` header for Anthropic).

### Phase 5: The "Reflector" Loop (Knowledge Distillation) - Priority: Low

1.  **Reflector Cron Job**
    *   [ ] Create a `cron` job (`0 0 * * *`) to trigger the reflector loop daily.

2.  **Reflector Agent Logic**
    *   [ ] Implement logic to read `logs/YYYY-MM-DD.md`.
    *   [ ] Use an LLM call to extract key decisions, preferences, and blockers.
    *   [ ] Update `MEMORY.md` with distilled knowledge.
    *   [ ] Update `WORKING.md` for carried-over tasks.
    *   [ ] Archive processed daily logs.

---

## 3. High-Level Dependencies & Notes

*   **Next.js Version**: Ensure compatibility with `16.1.6` (Turbopack) and any new server features.
*   **Docker Deployment**: All new services and orchestrators must be deployable within the existing Docker ecosystem.
*   **Security First**: Prioritize security hardening across all phases.
*   **Testing**: Comprehensive unit, integration, and end-to-end testing required for each phase.

---

**End of Plan**
