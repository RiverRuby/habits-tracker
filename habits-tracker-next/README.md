# Habits Tracker (Next.js Version)

A modern habit tracker application built with Next.js, Prisma, and PostgreSQL.

## Features

- Track daily habits with visual completion grid
- Cross-device synchronization via QR code or code entry
- No signup required - anonymous usage with device sync
- Clean, responsive UI with Tailwind CSS
- Streak tracking and statistics

## Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/habits-tracker-next.git
cd habits-tracker-next
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/habits_tracker"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database:

```bash
npx prisma migrate dev --name init
```

5. Start the development server:

```bash
npm run dev
```

## Architecture

The application follows a modern architecture with Next.js App Router, Prisma ORM, and PostgreSQL. See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed explanation of the system design.

## Usage

The application is designed to be intuitive:

1. Visit the app in your browser
2. Create habits to track
3. Click on days to mark habits as complete/incomplete
4. Use the sync feature to synchronize data across devices

## Development

### Commands

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

### Database Management

- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma migrate dev` - Run migrations in development
- `npx prisma db push` - Push schema changes without migrations

## License

MIT
