# Engineer Long-Term Memory

## Key Decisions
- Integrated Next.js with SQLite for the Obsidian Control backend.
- Used Tailwind + Shadcn for rapid UI scaffolding.

## Lessons Learned
- Isolating the DB from the frontend (via API routes) is mandatory for squad security.
- Pre-installing `sqlite3` and `sqlite` npm packages saved significant implementation time.
