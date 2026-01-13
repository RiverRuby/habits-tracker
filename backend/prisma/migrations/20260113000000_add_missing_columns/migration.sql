-- Add missing columns to User table (backwards compatible with defaults)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "callEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "callTime" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'America/Los_Angeles';

-- Add missing columns to Habit table (backwards compatible with defaults)
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'ORANGE';
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "emoji" TEXT;

-- Add missing columns to HabitCompletion table
ALTER TABLE "HabitCompletion" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Create CallLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CallLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "transcript" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "telnyxCallId" TEXT,
    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for CallLog if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CallLog_userId_fkey') THEN
        ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "Habit_userId_idx" ON "Habit"("userId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_day_idx" ON "HabitCompletion"("day");
CREATE INDEX IF NOT EXISTS "CallLog_userId_idx" ON "CallLog"("userId");
CREATE INDEX IF NOT EXISTS "CallLog_startedAt_idx" ON "CallLog"("startedAt");
