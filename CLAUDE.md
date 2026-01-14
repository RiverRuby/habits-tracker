# Habits Tracker

## Architecture
- **Frontend**: React 18 + TypeScript, Zustand for state
- **Backend**: Express + Prisma + PostgreSQL
- Two design variants in `frontend/src/designs/`:
  - `classic/` - Original design
  - `new/` - "Daily Punch" rolodex-style design (current default)

## Running Locally

### Start Backend (Port 3012)
```bash
cd backend
npm run dev
```
This runs `tsx api/index.ts` with hot reload.

### Start Frontend (Port 3011)
```bash
cd frontend
PORT=3011 REACT_APP_API_URL=http://localhost:3012 npm start
```

### Kill Running Processes
```bash
lsof -ti:3011 | xargs kill -9 2>/dev/null
lsof -ti:3012 | xargs kill -9 2>/dev/null
```

### Prisma Studio (Database GUI)
```bash
cd backend
npm exec prisma studio -- --browser none
```

## Critical: Database Safety
**NEVER connect to production database locally.** Use local PostgreSQL only.
- Production DB is on Vercel - DO NOT put prod credentials in local `.env`
- If you need test data, query the local DB
- Local test user: `test-user-123` (has sample habits)

## Date Format Gotchas
- **DB format**: `"DD MMM YYYY"` (e.g., "08 Jan 2026")
- **UI format**: `"YYYY-MM-DD"` (e.g., "2026-01-08")
- Conversion utils in `frontend/src/shared/dateUtils.ts`
- **Timezone bug**: `new Date("YYYY-MM-DD")` parses as UTC midnight!
  - Fix: Use `new Date(dateStr + 'T00:00:00')` to parse as local time
  - Or use the `dbDateToISO()` / `isoToDbDate()` utilities

## Environment Variables
- React env vars must use `REACT_APP_*` prefix
- Env vars are cached at build time - restart dev server after changes
- If CORS errors persist, kill all node processes and restart with explicit env

## CORS
Backend allows: `localhost:3000`, `localhost:3011`, `habits.vivs.wiki`
Config in `backend/api/index.ts`

## Key Files
- `frontend/src/designs/new/App.tsx` - Main app component (carousel/grid views)
- `frontend/src/designs/new/components/HabitCard.tsx` - Habit card with month/year views
- `frontend/src/state/user.ts` - Zustand store for habits
- `frontend/src/shared/dateUtils.ts` - Date conversion utilities
- `backend/api/index.ts` - Express API routes

## Features (New Design)
- **Carousel View**: 3D rolodex-style habit card navigation
- **Grid View**: Multi-column grid of all habits (auto-fit columns)
- **Month Navigation**: Chevrons to browse past/future months
- **Notes**: Add notes to completed days (inline in month view)
- **Year View**: GitHub-style contribution graph
