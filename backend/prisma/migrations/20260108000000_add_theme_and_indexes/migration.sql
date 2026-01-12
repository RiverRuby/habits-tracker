-- AlterTable: Add theme column with default value (backwards compatible)
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'ORANGE';

-- CreateIndex: Performance indexes
CREATE INDEX IF NOT EXISTS "Habit_userId_idx" ON "Habit"("userId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_day_idx" ON "HabitCompletion"("day");
