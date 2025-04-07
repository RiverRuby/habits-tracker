# Habits Tracker Backend

This is the backend for the Habits Tracker application. It's built with Express.js and Prisma, designed to be deployed on Vercel as serverless functions.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Set up the database:

You need a PostgreSQL database. Update the `.env` file with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"
```

3. Run Prisma migrations to set up the database schema:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

## Development

To run the server locally using Vercel's development environment:

```bash
npm run dev
```

This will start the server at http://localhost:3000.

## API Endpoints

### Get all habits

- **GET** `/habits`
- **Header**: `Authorization: <userId>`
- Returns all habits for the user

### Create habit

- **POST** `/habits/create`
- **Header**: `Authorization: <userId>`
- **Body**: `{ "name": "Habit Name" }`
- Returns updated list of habits

### Delete habit

- **POST** `/habits/delete`
- **Header**: `Authorization: <userId>`
- **Body**: `{ "id": "habitId" }`
- Returns updated list of habits

### Rename habit

- **POST** `/habits/rename`
- **Header**: `Authorization: <userId>`
- **Body**: `{ "id": "habitId", "name": "New Name" }`
- Returns updated list of habits

### Log habit completion

- **POST** `/habits/log`
- **Header**: `Authorization: <userId>`
- **Body**: `{ "id": "habitId", "day": "DD MMM YYYY" }`
- Returns success status

### Unlog habit completion

- **POST** `/habits/unlog`
- **Header**: `Authorization: <userId>`
- **Body**: `{ "id": "habitId", "day": "DD MMM YYYY" }`
- Returns success status

## Deployment to Vercel

1. Make sure you have the Vercel CLI installed:

```bash
npm i -g vercel
```

2. Login to Vercel:

```bash
vercel login
```

3. Deploy:

```bash
vercel
```

Make sure to set up the environment variables in the Vercel dashboard, especially the `DATABASE_URL`.
