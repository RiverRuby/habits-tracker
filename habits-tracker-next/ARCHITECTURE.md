# Habits Tracker Next.js Architecture

This document outlines the architecture of the Habits Tracker application built with Next.js, Prisma, and PostgreSQL.

## Overall Architecture

The Habits Tracker application follows a modern architecture with:

- **Next.js** for the frontend and API routes
- **Prisma** as the ORM for database operations
- **PostgreSQL** as the database
- **SWR** for data fetching and caching
- **Tailwind CSS** for styling

The application is structured to support server-side rendering, API routes for data operations, and client-side state management with optimistic updates.

## Directory Structure

```
habits-tracker-next/
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema definition
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API routes
│   │   │   └── habits/      # Habits-related endpoints
│   │   ├── page.tsx         # Home page
│   │   └── sync/page.tsx    # Sync page
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   │   └── useHabits.ts     # Hook for habit data management
│   └── lib/                 # Utility libraries
│       ├── prisma.ts        # Prisma client singleton
│       └── utils.ts         # Helper functions
├── .env                     # Environment variables
└── ARCHITECTURE.md          # This documentation file
```

## Key Components

### Database Schema

The database schema consists of three main models:

1. **User**: Represents a user with habits

   - Identified by a unique ID (generated or provided during sync)
   - Contains creation timestamp
   - Has a one-to-many relationship with Habits

2. **Habit**: Represents a habit to track

   - Has a name, ID, and creation timestamp
   - Belongs to a User
   - Has many Completions

3. **Completion**: Represents a completed day for a habit
   - Contains the date as a string
   - Belongs to a Habit
   - Has a unique constraint on habitId and date

### Authentication

The application uses a simple ID-based authentication system:

- Each user gets a randomly generated ID when first visiting the app
- This ID is stored in localStorage
- The ID is sent with every API request in the Authorization header
- Users can sync devices by sharing this ID via QR code or manual entry

This approach allows for a simple, passwordless experience while still enabling cross-device synchronization.

### State Management

State management uses the SWR library with custom hooks:

- `useHabits` hook centralizes all habit-related operations
- Implements optimistic updates for a responsive UI
- Handles API fetching, error states, and loading states
- Provides methods for all CRUD operations on habits

### API Routes

API routes are implemented using Next.js API route handlers:

- `/api/habits` (GET): Fetches all habits for a user
- `/api/habits/create` (POST): Creates a new habit
- `/api/habits/delete` (POST): Deletes a habit
- `/api/habits/rename` (POST): Renames a habit
- `/api/habits/log` (POST): Logs a completion for a habit
- `/api/habits/unlog` (POST): Removes a completion for a habit

### Frontend Components

The frontend is built with React components:

- `Habit`: Displays a single habit with its completion grid
- `HabitCube`: Represents a single day in the habit grid
- `CreateModal`: Modal for creating new habits
- and others to be implemented in Phase 2

## Authentication Flow

1. When a user first visits the app, a random ID is generated
2. This ID is stored in localStorage
3. All API requests include this ID in the Authorization header
4. To sync devices, the user shares this ID
5. The receiving device stores the ID in its localStorage
6. Both devices now use the same ID for API requests

## Data Flow

1. Data is fetched from API routes using the SWR hook
2. When a user performs an action, optimistic updates are applied immediately
3. The action is then sent to the server via API routes
4. On success, the SWR cache is updated with the server response
5. On failure, the optimistic update is rolled back

## Future Extension Points

The architecture is designed to be extensible:

- **Authentication**: Can be replaced with email or OAuth providers
- **Offline Support**: Can be enhanced with service workers and IndexedDB
- **Analytics**: Can be added through middleware or API extensions
- **Advanced Features**: More complex habit tracking features can be added through schema extensions
