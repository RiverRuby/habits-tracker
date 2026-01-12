// Re-export ThemeColor from state for consistency
export type { ThemeColor } from '../../state/user';

export interface DayStatus {
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
}

// Re-export Habit type from state
export type { NewDesignHabit as Habit } from '../../state/user';

// Theme styles mapping
export const THEME_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
  ORANGE: { bg: 'bg-[#ff9f43]', border: 'border-black', accent: 'text-black' },
  BLUE: { bg: 'bg-[#54a0ff]', border: 'border-black', accent: 'text-black' },
  GREEN: { bg: 'bg-[#2ecc71]', border: 'border-black', accent: 'text-black' },
  YELLOW: { bg: 'bg-[#feca57]', border: 'border-black', accent: 'text-black' },
};

// Theme color enum for backwards compatibility with NewHabitModal
export enum ThemeColorEnum {
  ORANGE = 'ORANGE',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
}

export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];