# Scorpion Web - Obsidian Control Dashboard

The multi-agent control dashboard for the Clawdbot autonomous agent platform.

## Features

✅ **Kanban Task Board** - Visual workflow management with 5 columns  
✅ **Task Creation & Management** - Create, update, and move tasks  
✅ **Data Persistence** - Docker volume-backed JSON storage  
✅ **Dark Mode UI** - Shadcn UI with Deep Dark Mode (Slate-950/Zinc)  
✅ **Login Protection** - Authentication-gated dashboard access  
✅ **Dockerized** - Production-ready container on port 3000  

## Quick Start

### Run with Docker

```bash
# Build
docker build -t scorpion-web:latest .

# Run
docker run -d --name scorpion-web -p 3000:3000 -v scorpion-web-data:/app/data scorpion-web:latest

# Access
open http://localhost:3000
```

### Login

- **Username:** MOYESH
- **Password:** moyesh123

⚠️ **Development credentials only - replace in production!**

### Run Tests

```bash
./test-suite.sh
```

## API

### GET /api/tasks
```bash
curl http://localhost:3000/api/tasks
```

### POST /api/tasks
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","description":"Task details"}'
```

### PATCH /api/tasks
```bash
curl -X PATCH http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"id":"1","status":"done"}'
```

## Tech Stack

- **Framework:** Next.js 16 (React 19, TypeScript)
- **Styling:** Tailwind CSS 4 + Shadcn UI
- **Container:** Node.js 20 Alpine
- **Storage:** JSON file (future: SQLite + sqlite-vec)

## Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide, API reference, troubleshooting
- **[docs/control_dashboard_plan.md](docs/control_dashboard_plan.md)** - Implementation plan and architecture

## Project Structure

```
scorpion-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── message/route.ts    # Telegram bridge
│   │   │   └── tasks/route.ts      # Task CRUD API
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Auth-protected layout
│   │   │   └── page.tsx            # Kanban board
│   │   ├── globals.css             # Shadcn dark mode theme
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Homepage
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── kanban-column.tsx   # Kanban column component
│   │   │   ├── new-task-form.tsx   # Task creation form
│   │   │   └── task-card.tsx       # Task card with movement
│   │   ├── auth-interface.tsx      # Login form
│   │   └── sections/               # Homepage sections
│   └── lib/                        # Utilities
├── data/
│   └── tasks.json                  # Task storage (Docker volume)
├── public/                         # Static assets
├── Dockerfile                      # Production container
├── test-suite.sh                   # Automated tests
└── DEPLOYMENT.md                   # Deployment guide
```

## Development

```bash
npm install
npm run dev
```

Access at http://localhost:3000

## Testing

The test suite validates:
1. Homepage loads
2. GET /api/tasks returns task array
3. POST /api/tasks creates tasks
4. PATCH /api/tasks updates status
5. Data persists to file
6. Dashboard route is accessible

All 6 tests passing ✅

## Security

⚠️ **Current implementation is for development only**

Production requirements:
- Replace hardcoded credentials
- Implement server-side auth (JWT/sessions)
- Add HTTPS/TLS
- Enable CSRF protection
- Rate limit API endpoints

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## Roadmap

- [ ] WebSocket for real-time updates
- [ ] Live Feed component
- [ ] Skill Lab component
- [ ] SQLite + sqlite-vec integration
- [ ] Multi-agent orchestration
- [ ] Drag-and-drop Kanban
- [ ] Comments and mentions

## License

Part of the Clawdbot autonomous agent platform.

## Links

- **Homepage:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **API Docs:** [DEPLOYMENT.md](DEPLOYMENT.md#api-endpoints)
