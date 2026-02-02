# 🛠️ TECHNICAL ARCHITECTURE: OBSIDIAN CONTROL (SQUAD VERSION)
**System Role:** Multi-Agent Orchestration & Local Knowledge Retrieval
**Base Framework:** OpenClaw (Persistent Daemon)
**Target Host:** AWS EC2 Instance running inside Docker container on Scorpion web

---

## 1. CORE SYSTEM COMPONENTS
* **The Gateway (Scorpion's Hub):** A 24/7 core process running as a background daemon. It manages all active sessions, routes messages between channels, and provides a WebSocket API for control.
* **Persistent Sessions:** Individual, independent conversations with distinct histories stored as JSONL files. Each specialist (Scorpion, Steve J., etc.) operates within its own session key (e.g., `agent:linus:main`).
* **The Shared Brain (Local):** A centralized `sqlite-vec` database replacing cloud-based solutions for real-time task tracking, activity feeds, and vectorized knowledge retrieval.
* **Heartbeat Crons:** Staggered 15-minute wake-up cycles per agent. Agents check for @mentions, assigned tasks, and the activity feed before performing work or reporting `HEARTBEAT_OK`.
* **The Workspace:** A directory on disk where configuration files, memory files, and scripts live. This allows information to survive session restarts.

---

## 2. THE SQUAD ROSTER (SESSION KEYS)
- Each specialist will have their own AGENTS.md file outlining their speciality
* `agent:scorpion:main` — **The Sentinel:** You the Orchestrator, security filter, and Kanban task mover update your AGENTS.md and other .md files to reflect this new responsibility.
* `agent:steve-j:main` — **The PM:** Product requirements (PRDs), user stories, and feature prioritization.
* `agent:walter:main` — **The Architect:** Structural design, schema validation, and pattern enforcement.
* `agent:linus:main` — **The Engineer:** Implementation and code execution (Docker-sandboxed).
* `agent:john:main` — **The QA:** Edge-case testing, logic verification, and bug hunting.
* `agent:sly:main` — **The UI:** Frontend development, aesthetic precision, and Shadcn/UI alignment.

---

## 3. MEMORY & KNOWLEDGE STACK
* **Session Memory:** Built-in OpenClaw JSONL history for context retrieval within a specific session.
* **Working Memory (`WORKING.md`):** Files tracking current task state, status, and next steps. This is the first file read upon heartbeat wake-up.
* **Long-Term Knowledge (`sqlite-vec`):** Local vector database indexing `./agents/skills/*.md` and `/memory/*.md` for fast similarity search across the squad.
* **Daily Logs (`YYYY-MM-DD.md`):** Raw logs of agent activity used for the Daily Standup summary.

---

## 4. MISSION CONTROL (THE UI)
* **Design Aesthetic:** Deep Dark Mode using `@shadcn/ui` (Slate-950/Zinc) with high-contrast editorial styling.
* **The Kanban Board:** Columns for **Inbox**, **Assigned**, **In Progress**, **Review**, and **Done**.
* **Live Feed:** Real-time stream of @mentions, comments, and project activities.
* **Skill Lab:** Interface to manually persist and assign skills from `.agents/skills/*` to specific leads.

---

## 5. OPERATIONAL FLOWS

### A. The "Mission Ingestion" Flow (Inbox to Assigned)
1. **Scorpion (Sentinel)**: Receives external input and sanitizes it for prompt injection.
2. **Scorpion**: Creates a task card in the **Inbox** column of the Kanban.
3. **Steve J. (PM)**: Wakes via cron, detects the new task, and drafts the `MISSION_SPEC.md` in the shared workspace.
4. **Scorpion**: Moves the task to **Assigned** once the spec is ready.

### B. The "Architectural Lock" Flow (Assigned to In Progress)
1. **Walter (Architect)**: Evaluates the spec and writes an `ARCH.md` defining schema and patterns.
2. **Scorpion**: Validates the architecture against security protocols.
3. **Transition**: Scorpion moves the task to **In Progress** only after the architecture is "locked."

### C. The "Implementation & QA" Flow (In Progress to Review)
1. **Linus (Engineer)**: Spins up a transient Docker container and implements the code according to `ARCH.md`.
2. **Linus**: Queries `sqlite-vec` to reuse existing components or skills found in `./agents/skills/`.
3. **John (QA)**: Wakes, sees the implementation, and runs validation scripts.
4. **Scorpion**: If John approves, Scorpion moves the task to **Review**.

### D. The "Daily Standup" Flow
1. **Daily Cron**: Fires at 11:30 PM.
2. **Aggregation**: Scorpion gathers activities from all sessions and summarizes Completed, In Progress, Blocked, and Key Decisions.
3. **Delivery**: Scorpion sends the final summary to the primary Telegram/Discord channel.

---

## 6. SECURITY GUARDRAILS
* **Scorpion Sentinel**: Acts as a firewall, filtering "ignore" or "system" commands before they reach specialists.
* **Isolation**: Specialist sessions are independent; history from one does not bleed into another unless explicitly shared via the `sqlite-vec` brain.
* **Docker Sandboxing**: All engineering execution is confined to ephemeral containers to protect the EC2 host.