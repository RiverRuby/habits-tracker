import React, { useMemo } from 'react';
import { NewDesignHabit } from '../../../state/user';
import { THEME_STYLES } from '../types';

interface YearlyCalendarViewProps {
  habits: NewDesignHabit[];
  onToggleDay: (habitId: string, date: string) => void;
}

// Emoji auto-match based on habit name keywords
const HABIT_EMOJI_KEYWORDS: Record<string, string> = {
  // Exercise
  'run': '🏃', 'running': '🏃', 'jog': '🏃',
  'bike': '🚴', 'cycle': '🚴', 'cycling': '🚴',
  'gym': '💪', 'workout': '💪', 'exercise': '💪', 'lift': '🏋️',
  'swim': '🏊', 'swimming': '🏊',
  'walk': '🚶', 'walking': '🚶', 'hike': '🥾',
  'yoga': '🧘', 'stretch': '🤸',

  // Health
  'water': '💧', 'hydrate': '💧', 'drink': '💧',
  'sleep': '😴', 'rest': '😴',
  'meditate': '🧘', 'meditation': '🧘', 'mindful': '🧘',
  'no sugar': '🍬', 'sugar': '🍬', 'diet': '🥗',
  'vitamin': '💊', 'supplement': '💊',

  // Learning
  'read': '📚', 'reading': '📚', 'book': '📖',
  'study': '📝', 'learn': '📝', 'course': '🎓',
  'write': '✍️', 'journal': '📓', 'diary': '📓',
  'code': '💻', 'programming': '💻', 'coding': '💻',

  // Lifestyle
  'clean': '🧹', 'tidy': '🧹', 'organize': '📦',
  'cook': '🍳', 'cooking': '🍳', 'meal prep': '🍱',
  'music': '🎵', 'practice': '🎸', 'instrument': '🎹',
  'language': '🗣️', 'spanish': '🇪🇸', 'french': '🇫🇷',
};

function getHabitEmoji(habitName: string): string {
  const lower = habitName.toLowerCase();
  for (const [keyword, emoji] of Object.entries(HABIT_EMOJI_KEYWORDS)) {
    if (lower.includes(keyword)) return emoji;
  }
  return '✓';
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const YearlyCalendarView: React.FC<YearlyCalendarViewProps> = ({ habits, onToggleDay }) => {
  // Generate the year data - all days from Jan 1 to Dec 31
  const yearData = useMemo(() => {
    const year = new Date().getFullYear();
    const data: { date: Date; dateStr: string }[] = [];

    // Start from Jan 1
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    let current = new Date(startDate);
    while (current <= endDate) {
      data.push({
        date: new Date(current),
        dateStr: current.toISOString().split('T')[0],
      });
      current.setDate(current.getDate() + 1);
    }

    return data;
  }, []);

  // Group days by week for grid layout
  const weeksData = useMemo(() => {
    const weeks: { date: Date; dateStr: string }[][] = [];
    let currentWeek: { date: Date; dateStr: string }[] = [];

    // Add padding for the first week
    const firstDayOfWeek = yearData[0].date.getDay();
    const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday-start
    for (let i = 0; i < mondayOffset; i++) {
      currentWeek.push({ date: new Date(0), dateStr: '' }); // Empty placeholder
    }

    for (const day of yearData) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days of the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), dateStr: '' });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [yearData]);

  // Get completions for a specific date across all habits
  const getCompletionsForDate = (dateStr: string) => {
    return habits.filter(h => h.history[dateStr]).map(h => ({
      habit: h,
      emoji: getHabitEmoji(h.title),
    }));
  };

  // Get month label positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let currentMonth = -1;

    weeksData.forEach((week, weekIndex) => {
      for (const day of week) {
        if (day.dateStr) {
          const month = day.date.getMonth();
          if (month !== currentMonth) {
            currentMonth = month;
            labels.push({ month: MONTHS[month], weekIndex });
            break;
          }
        }
      }
    });

    return labels;
  }, [weeksData]);

  return (
    <div className="bg-white border-2 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {new Date().getFullYear()} OVERVIEW
        </h2>
        <div className="text-sm font-bold text-gray-500">
          {habits.length} HABITS TRACKED
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-3 bg-gray-50 border border-gray-200">
        {habits.map(habit => (
          <div key={habit.id} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 flex items-center justify-center text-sm border border-black ${THEME_STYLES[habit.theme]?.bg || 'bg-orange-400'}`}
            >
              {getHabitEmoji(habit.title)}
            </span>
            <span className="text-xs font-bold uppercase">{habit.title}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-10" /> {/* Spacer for month labels */}
            <div className="flex gap-[2px]">
              {DAYS.map((day, i) => (
                <div key={i} className="w-4 h-4 text-[0.5rem] font-bold text-center text-gray-400">
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Weeks grid */}
          <div className="flex">
            {/* Month labels column */}
            <div className="w-10 relative">
              {monthLabels.map(({ month, weekIndex }) => (
                <div
                  key={month}
                  className="absolute text-[0.6rem] font-bold text-gray-500"
                  style={{ top: weekIndex * 18 }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="flex flex-col gap-[2px]">
              {weeksData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex gap-[2px]">
                  {week.map((day, dayIndex) => {
                    if (!day.dateStr) {
                      return <div key={dayIndex} className="w-4 h-4" />;
                    }

                    const completions = getCompletionsForDate(day.dateStr);
                    const hasCompletions = completions.length > 0;
                    const isToday = day.dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-4 h-4 flex items-center justify-center text-[0.5rem] cursor-default
                          border transition-all
                          ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
                          ${hasCompletions
                            ? 'bg-black border-black text-white'
                            : 'bg-gray-100 border-gray-200 hover:border-gray-400'}
                        `}
                        title={`${day.date.toLocaleDateString()}: ${
                          hasCompletions
                            ? completions.map(c => c.habit.title).join(', ')
                            : 'No habits completed'
                        }`}
                      >
                        {hasCompletions && completions.length === 1 && (
                          <span className="leading-none">{completions[0].emoji}</span>
                        )}
                        {hasCompletions && completions.length > 1 && (
                          <span className="leading-none font-bold">{completions.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t-2 border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        {habits.map(habit => {
          const completedDays = Object.values(habit.history).filter(Boolean).length;
          const totalDays = yearData.length;
          const percentage = Math.round((completedDays / totalDays) * 100);

          return (
            <div key={habit.id} className="text-center">
              <div className="text-2xl font-black">{completedDays}</div>
              <div className="text-[0.6rem] font-bold text-gray-500 uppercase">
                {habit.title} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearlyCalendarView;
