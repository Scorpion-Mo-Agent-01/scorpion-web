# Scorpion Web - Deployment Guide

## Overview

Scorpion Web is the Obsidian Control Dashboard for the Clawdbot multi-agent system. It provides a web interface for task management, agent orchestration, and real-time collaboration.

## Features

- **Kanban Board**: Visual task management with 5 columns (Inbox, Assigned, In Progress, Review, Done)
- **Task Creation**: Create new tasks with title and description
- **Task Movement**: Move tasks between columns with status transitions
- **Data Persistence**: Tasks are stored in a JSON file with Docker volume mounting
- **Dark Mode**: Deep Dark Mode using Shadcn UI (Slate-950/Zinc palette)
- **Authentication**: Login-protected dashboard (currently hardcoded credentials)

## Quick Start

### Running with Docker

1. **Build the image:**
   ```bash
   docker build -t scorpion-web:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name scorpion-web \
     -p 3000:3000 \
     -v scorpion-web-data:/app/data \
     scorpion-web:latest
   ```

3. **Access the application:**
   - Homepage: http://localhost:3000
   - Dashboard: http://localhost:3000/dashboard (login required)

### Login Credentials

**⚠️ SECURITY WARNING:** Hardcoded credentials - for development only!

- **Username:** MOYESH
- **Password:** moyesh123

### Running Tests

Execute the test suite to verify all functionality:

```bash
./test-suite.sh
```

Expected output:
```
======================================
Scorpion Web - Test Suite
======================================

Test 1: Homepage loads
✓ PASSED

Test 2: GET /api/tasks returns JSON array
✓ PASSED - Retrieved X tasks

Test 3: POST /api/tasks creates a new task
✓ PASSED - Created task with ID: X

Test 4: PATCH /api/tasks updates task status
✓ PASSED - Status updated to 'done'

Test 5: Data persistence - verify task in container
✓ PASSED - Task persisted to data/tasks.json

Test 6: Dashboard route exists
✓ PASSED - Dashboard route accessible

======================================
Test Summary
======================================
PASSED: 6
FAILED: 0

✓ All tests passed!
```

## API Endpoints

### GET /api/tasks
Retrieve all tasks.

**Response:**
```json
[
  {
    "id": "1",
    "title": "Task Title",
    "description": "Task description",
    "assignedAgent": "Scorpion",
    "status": "inbox"
  }
]
```

### POST /api/tasks
Create a new task.

**Request:**
```json
{
  "title": "New Task",
  "description": "Task description (optional)"
}
```

**Response:**
```json
{
  "id": "7",
  "title": "New Task",
  "description": "Task description",
  "status": "inbox",
  "createdAt": "2026-02-02T04:19:05.957Z"
}
```

### PATCH /api/tasks
Update task status or assigned agent.

**Request:**
```json
{
  "id": "7",
  "status": "in progress",
  "assignedAgent": "Linus"
}
```

**Response:**
```json
{
  "id": "7",
  "title": "New Task",
  "status": "in progress",
  "assignedAgent": "Linus",
  "updatedAt": "2026-02-02T04:20:10.436Z"
}
```

## Task Status Transitions

Tasks can only move to specific next states:

- **inbox** → assigned
- **assigned** → in progress, inbox
- **in progress** → review, assigned
- **review** → done, in progress
- **done** → review

## Data Storage

Tasks are stored in `/app/data/tasks.json` inside the container. A Docker volume (`scorpion-web-data`) is mounted to this path for persistence.

To inspect the data:
```bash
docker exec scorpion-web cat /app/data/tasks.json
```

To backup the data:
```bash
docker cp scorpion-web:/app/data/tasks.json ./backup-tasks.json
```

To restore data:
```bash
docker cp ./backup-tasks.json scorpion-web:/app/data/tasks.json
```

## Docker Commands

### View logs:
```bash
docker logs scorpion-web
```

### View logs (follow):
```bash
docker logs -f scorpion-web
```

### Stop the container:
```bash
docker stop scorpion-web
```

### Start the container:
```bash
docker start scorpion-web
```

### Remove the container:
```bash
docker rm -f scorpion-web
```

### Remove the image:
```bash
docker rmi scorpion-web:latest
```

### Remove the data volume:
```bash
docker volume rm scorpion-web-data
```

## Development

### Local Development (without Docker):

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Access:**
   - http://localhost:3000

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

## Architecture

- **Frontend:** Next.js 16 (React 19, TypeScript)
- **Styling:** Tailwind CSS 4 with Shadcn UI
- **API:** Next.js API Routes
- **Data:** JSON file storage (future: SQLite with sqlite-vec)
- **Container:** Node.js 20 Alpine

## Security Considerations

**Current Implementation:**
- ⚠️ Hardcoded credentials in `src/components/auth-interface.tsx`
- ⚠️ Client-side only authentication using localStorage
- ⚠️ No HTTPS enforcement
- ⚠️ No CSRF protection

**Production Recommendations:**
1. Implement server-side authentication with JWT or session tokens
2. Use environment variables for credentials
3. Add HTTPS/TLS termination (reverse proxy)
4. Implement rate limiting on API endpoints
5. Add CSRF protection
6. Use secure password hashing (bcrypt/argon2)
7. Implement proper role-based access control (RBAC)

## Troubleshooting

### Container won't start:
```bash
docker logs scorpion-web
```

### Port 3000 already in use:
```bash
# Use a different port
docker run -d --name scorpion-web -p 8080:3000 scorpion-web:latest
```

### Tasks not persisting:
Ensure the volume is properly mounted:
```bash
docker inspect scorpion-web | grep -A 10 Mounts
```

### API errors:
Check the container logs and verify the data directory exists:
```bash
docker exec scorpion-web ls -la /app/data/
```

## Future Enhancements

- [ ] Real authentication system with JWT
- [ ] WebSocket support for real-time updates
- [ ] Live Feed component
- [ ] Skill Lab component
- [ ] SQLite + sqlite-vec integration
- [ ] Multi-agent orchestration
- [ ] Drag-and-drop for Kanban board
- [ ] Task comments and mentions
- [ ] User profiles and avatars
- [ ] Activity log/audit trail

## Support

For issues or questions, contact the development team or check the project documentation at `docs/control_dashboard_plan.md`.
