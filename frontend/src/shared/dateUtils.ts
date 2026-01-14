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
  // Parse "08 Jan 2026" format safely without timezone issues
  // Add noon time to avoid day boundary issues when converting
  const parsed = new Date(dbDate + ' 12:00:00');
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date: ${dbDate}`);
    return dbDate;
  }
  // Use local date parts to avoid UTC conversion issues
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert ISO date format to DB format
 * "2026-01-08" -> "08 Jan 2026"
 */
export function isoToDbDate(isoDate: string): string {
  // Parse the ISO date string directly to avoid timezone issues
  // "2026-01-08" -> parts[0]=2026, parts[1]=01, parts[2]=08
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    console.warn(`Invalid date format: ${isoDate}`);
    return isoDate;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  // Create date using local timezone to avoid UTC conversion issues
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) {
    console.warn(`Invalid date: ${isoDate}`);
    return isoDate;
  }

  const dayStr = d.getDate().toString().padStart(2, '0');
  const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
  const yearStr = d.getFullYear();
  return `${dayStr} ${monthStr} ${yearStr}`;
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
