# Obsidian Control v2.0: Upgrade Specification & Handover

**Version:** 2.0.0-DRAFT
**Status:** Pending Implementation
**Target Audience:** Engineering Agent (Linus/Sly)
**Prerequisites:** Existing `control_dashboard_plan.md` implementation (v1.0)

---

## 1. Executive Summary
This document outlines the necessary upgrades to transition the Obsidian Control system from a "Proof of Concept" UI to a production-ready, secure, and cost-efficient orchestration platform. The focus is on implementing real security, establishing true real-time bi-directional communication, securing code execution, and optimizing LLM token usage.

---

## 2. Capability Upgrades (Missing Features)

### A. Security Hardening (The "Iron Dome")
**Current State:** Client-side hardcoded credentials (Critical Vulnerability).
**Target State:** Robust, server-side authentication and role-based access control (RBAC).

**Implementation Tasks:**
1.  **Authentication Provider:** Integrate **Clerk** or **NextAuth.js**.
    *   *Constraint:* Must support GitHub/Google OAuth for developer login.
    *   *Action:* Replace `auth-interface.tsx` with proper provider hooks.
2.  **API Route Protection:**
    *   Implement Middleware (`middleware.ts`) to intercept all `/api/*` and `/dashboard/*` requests.
    *   Verify JWT/Session tokens on every request.
    *   Reject 401/403 for unauthorized access.
3.  **WebSocket Auth:**
    *   Authenticate the WebSocket handshake. Pass the auth token during the connection upgrade.
    *   Drop connections that fail validation immediately.

### B. The "Heartbeat" Daemon (True Real-Time)
**Current State:** Simulated polling / frontend mocking.
**Target State:** Persistent Node.js/Python daemon with full WebSocket support.

**Implementation Tasks:**
1.  **Daemon Service (`control-gateway`):**
    *   Create a standalone server (e.g., `server.ts` using `ws` or `socket.io`) separate from the Next.js lambda functions if deploying to Vercel is not the target (Plan implies AWS/Docker, so a custom server is viable).
    *   *Alternative:* Use Next.js Custom Server or a separate container in the `docker-compose`.
2.  **Event Bus:**
    *   Implement a Pub/Sub system (e.g., internal `EventEmitter` or Redis).
    *   Topics: `agent:log`, `task:update`, `system:status`.
3.  **Frontend Integration:**
    *   Replace `control_dashboard` mocked hooks with a real `useSocket` hook.
    *   Bind Kanban state updates to `task:update` events (Server pushes changes, UI reflects instantly).

### C. Sandboxed Execution Layout (The "Linus" Interface)
**Current State:** Theoretical "Docker Sandboxing".
**Target State:** Working API to spawn/kill ephemeral containers.

**Implementation Tasks:**
1.  **Docker Orchestrator:**
    *   Install `dockerode` (Node.js) or `docker` SDK (Python).
    *   Create a `SandboxService` class.
    *   Methods: `spawnSession(imageId)`, `execCommand(containerId, cmd)`, `terminateSession(containerId)`.
2.  **Volume Mounting:**
    *   Define a secure strategy for mounting the `workspace` agent directories into containers (Read-Only where possible, or strictly scoped RW).
3.  **Security Limits:**
    *   Enforce `cpus`, `memory`, and `network` limits on spawned containers to prevent host resource exhaustion.

---

## 3. Token & Content Optimization (Efficiency Layer)

### A. Tiered Context Management
**Problem:** Sending full history burns tokens and increases latency.
**Solution:** Implement a "Rolling Window" context builder.

**Implementation Tasks:**
1.  **Context Builder Service:**
    *   Input: `SessionID`, `CurrentQuery`.
    *   Logic:
        *   Fetch last 10 raw messages (Short-term).
        *   Fetch "Active Task" summary from `WORKING.md` (Mid-term).
        *   (Optional) Vector search `sqlite-vec` for 3 relevant snippets (Long-term).
    *   Output: Concatenated, strictly formatted system prompt.
2.  **Token Counter:**
    *   Integrate `tiktoken` to fail-fast if a prompt exceeds the model's efficient window (preventing context truncation errors).

### B. Static Prompt Caching
**Problem:** `AGENTS.md` and `SOUL.md` are large and static.
**Solution:** Leverage Provider Caching (e.g., Anthropic Prompt Caching).

**Implementation Tasks:**
1.  **Prompt Structuring:**
    *   Move all static instructions (`AGENTS.md`, `SOUL.md`) to the *top* of the system message.
    *   Ensure strict byte-for-byte consistency in headers to trigger cache hits.
2.  **API Client Update:**
    *   Update the LLM call parameters to enable `cache_control: {"type": "ephemeral"}` on the static blocks (if supported by the chosen provider).

### C. The "Reflector" Loop (Knowledge Distillation)
**Problem:** Daily logs grow indefinitely; old knowledge is lost.
**Solution:** Automated summarization cron.

**Implementation Tasks:**
1.  **Cron Job:** `0 0 * * *` (Midnight).
2.  **Reflector Agent:**
    *   Reads `logs/YYYY-MM-DD.md`.
    *   Prompt: "Extract key technical decisions, user preferences, and unresolved blockers."
    *   Action:
        *   Update `MEMORY.md` with new lasting knowledge.
        *   Update `WORKING.md` with carried-over tasks.
        *   Archive the raw log.

---

## 4. Work Breakdown Structure (Recommended Sprints)

### Sprint 1: Foundation & Security
*   [ ] (Security) Install and configure Clerk/NextAuth.
*   [ ] (Security) Middleware for route protection.
*   [ ] (Architecture) Create `server/gateway.ts` (The real daemon).

### Sprint 2: Real-time & Data
*   [ ] (Real-time) Implement WebSocket logic in Gateway.
*   [ ] (Real-time) Connect React Frontend to WebSocket.
*   [ ] (Optimization) Implement "Tiered Context" builder in the Agent Loop.

### Sprint 3: Execution & Intelligence
*   [ ] (Sandbox) Implement `SandboxService` with Dockerode.
*   [ ] (Optimization) Add `Reflector` cron job logic.
*   [ ] (Optimization) Enable Prompt Caching headers.

---

**End of Specification**
