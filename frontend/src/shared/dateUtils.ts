/**
 * Date format conversion utilities for backwards compatibility
 *
 * DB format: "DD MMM YYYY" (e.g., "08 Jan 2026")
 * UI format: "YYYY-MM-DD" (e.g., "2026-01-08")
 */

/**
 * Convert DB date format to ISO format for UI
 * "08 Jan 2026" -> "2026-01-08"
 */
export function dbDateToISO(dbDate: string): string {
  const parsed = new Date(dbDate);
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date: ${dbDate}`);
    return dbDate;
  }
  return parsed.toISOString().split('T')[0];
}

/**
 * Convert ISO date format to DB format
 * "2026-01-08" -> "08 Jan 2026"
 */
export function isoToDbDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) {
    console.warn(`Invalid date: ${isoDate}`);
    return isoDate;
  }
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Convert completed array (DB format) to history map (UI format)
 * ["08 Jan 2026", "09 Jan 2026"] -> { "2026-01-08": true, "2026-01-09": true }
 */
export function completedToHistory(completed: string[]): Record<string, boolean> {
  return Object.fromEntries(
    completed.map(d => [dbDateToISO(d), true])
  );
}

/**
 * Convert history map (UI format) to completed array (DB format)
 * { "2026-01-08": true, "2026-01-09": true } -> ["08 Jan 2026", "09 Jan 2026"]
 */
export function historyToCompleted(history: Record<string, boolean>): string[] {
  return Object.entries(history)
    .filter(([_, completed]) => completed)
    .map(([date]) => isoToDbDate(date));
}

/**
 * Get today's date in ISO format
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get today's date in DB format
 */
export function getTodayDb(): string {
  return isoToDbDate(getTodayISO());
}

/**
 * Calculate streak from history
 */
export function calculateStreak(history: Record<string, boolean>): number {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  // Check if today is completed, if not start from yesterday
  const todayISO = currentDate.toISOString().split('T')[0];
  if (!history[todayISO]) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive days
  while (true) {
    const dateISO = currentDate.toISOString().split('T')[0];
    if (history[dateISO]) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
