# Habits Tracker

## Architecture
- **Frontend**: React 18 + TypeScript, Zustand for state
- **Backend**: Express + Prisma + PostgreSQL
- Two design variants in `frontend/src/designs/`:
  - `classic/` - Original design
  - `new/` - "Daily Punch" rolodex-style design

## Local Development
- Frontend: `PORT=3011` (http://localhost:3011)
- Backend: `PORT=3012` (http://localhost:3012)
- Local test user: `test-user-123` (has sample habits)

## Critical: Database Safety
**NEVER connect to production database locally.** Use local PostgreSQL only.
- Production DB is on Vercel - DO NOT put prod credentials in local `.env`
- If you need test data, query the local DB

## Date Format Gotchas
- **DB format**: `"DD MMM YYYY"` (e.g., "08 Jan 2026")
- **UI format**: `"YYYY-MM-DD"` (e.g., "2026-01-08")
- Conversion utils in `frontend/src/shared/dateUtils.ts`
- **Timezone bug**: `new Date("YYYY-MM-DD")` parses as UTC midnight!
  - Fix: Use `new Date(dateStr + 'T00:00:00')` to parse as local time

## Environment Variables
- React env vars must use `REACT_APP_*` prefix
- Env vars are cached at build time - restart dev server after changes
- If CORS errors persist, kill all node processes and restart with explicit env:
  ```bash
  REACT_APP_API_URL=http://localhost:3012 npm start
  ```

## CORS
Backend allows: `localhost:3000`, `localhost:3011`, `habits.vivs.wiki`
Config in `backend/api/index.ts`
