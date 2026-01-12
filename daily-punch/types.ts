export enum ThemeColor {
  ORANGE = 'ORANGE',
  BLUE = 'BLUE',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
}

export interface DayStatus {
  date: string; // ISO Date string YYYY-MM-DD
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  theme: ThemeColor;
  history: Record<string, boolean>; // map date string to boolean
  streak: number;
  createdAt: number;
}

export const THEME_STYLES: Record<ThemeColor, { bg: string; border: string; accent: string }> = {
  [ThemeColor.ORANGE]: { bg: 'bg-[#ff9f43]', border: 'border-black', accent: 'text-black' },
  [ThemeColor.BLUE]: { bg: 'bg-[#54a0ff]', border: 'border-black', accent: 'text-black' },
  [ThemeColor.GREEN]: { bg: 'bg-[#2ecc71]', border: 'border-black', accent: 'text-black' },
  [ThemeColor.YELLOW]: { bg: 'bg-[#feca57]', border: 'border-black', accent: 'text-black' },
};

export const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];