# Habits Tracker

A simple, free, and unrestricted habit tracker Progressive Web App (PWA) that helps you build and maintain consistent habits.

## Features

- **Track daily habits**: Log your habits every day with a simple interface
- **Streak tracking**: See your current and longest streaks for motivation
- **Progressive Web App**: Install on any device for offline access
- **Push Notifications**: Get reminded when you haven't completed habits in 2+ days
- **Cross-platform**: Works on mobile and desktop

## PWA Features

This application is a Progressive Web App (PWA), which means you can install it on your device and use it like a native app. Here's how to take advantage of the PWA features:

### Installing the App

#### On Desktop (Chrome, Edge, etc.):

1. Visit the website
2. Look for the install icon in the address bar
3. Click "Install" when prompted

#### On iOS (Safari):

1. Visit the website
2. Tap the Share button
3. Select "Add to Home Screen"

#### On Android (Chrome):

1. Visit the website
2. Tap the menu button (three dots)
3. Select "Add to Home Screen"

### Notifications

The app can send you notifications when you haven't completed habits in 2 or more days. To enable notifications:

1. Click the "Enable" button in the notification banner
2. Allow notifications when prompted by your browser
3. You'll receive a daily check at midnight UTC for any habits that need attention

Notifications can be disabled at any time through the app or your browser settings.

## Testing Push Notifications

This application includes some helpful endpoints for testing push notifications:

### Find Users for Testing

```
/find-users
```

This endpoint displays a list of users in the system along with their notification status. Use this page to:

- See which users have notifications enabled
- View basic user information
- Send test notifications with one click

### Send a Test Notification

```
/test-notification/{userId}?message=Your custom message
```

This endpoint sends a test notification to a specific user. Parameters:

- `userId`: The ID of the user to send the notification to (required)
- `message`: Custom message to include in the notification (optional)

### Requirements for Testing

To test push notifications:

1. Make sure the user has enabled notifications in the app
2. The browser must support Web Push API
3. The device must be able to receive notifications
4. The service worker must be registered and active

## Development Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL database

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with the following:
# DATABASE_URL=postgresql://username:password@localhost:5432/habits_local?schema=public
# VAPID_PUBLIC_KEY=your_vapid_public_key
# VAPID_PRIVATE_KEY=your_vapid_private_key
# VAPID_EMAIL=your_email@example.com

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with the following:
# REACT_APP_API_URL=http://localhost:3001
# REACT_APP_VAPID_PUBLIC_KEY=your_vapid_public_key

# Start development server
npm start
```

### Generating VAPID Keys

To enable push notifications, you need to generate VAPID keys:

```bash
# In the backend directory
npx web-push generate-vapid-keys
```

Add the generated keys to your `.env` files as described above.

## Deployment

The application is set up for deployment on Vercel:

### Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Deploy to Vercel
vercel
```

The backend uses Vercel Cron Jobs to send daily notifications. The cron job is configured in the `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Frontend Deployment

```bash
# Navigate to frontend directory
cd frontend

# Build the frontend
npm run build

# Deploy to Vercel or your preferred hosting
vercel
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
