import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  'music': '🎵', 'practice': '🎸', 'instrument': '🎹', 'guitar': '🎸',
  'language': '🗣️', 'spanish': '🇪🇸', 'french': '🇫🇷',
  'clothing': '👕', 'clothes': '👕', 'outfit': '👗',
};

function getHabitEmoji(habit: NewDesignHabit): string {
  // Use custom emoji if set
  if (habit.emoji) return habit.emoji;

  const lower = habit.title.toLowerCase();
  for (const [keyword, emoji] of Object.entries(HABIT_EMOJI_KEYWORDS)) {
    if (lower.includes(keyword)) return emoji;
  }
  return '✓';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const YearlyCalendarView: React.FC<YearlyCalendarViewProps> = ({ habits, onToggleDay }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate month data for the selected year
  const monthsData = useMemo(() => {
    return MONTHS.map((monthName, monthIndex) => {
      const firstDay = new Date(selectedYear, monthIndex, 1);
      const lastDay = new Date(selectedYear, monthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();

      const days: { date: Date | null; dateStr: string }[] = [];

      // Padding for start of month
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ date: null, dateStr: '' });
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, monthIndex, day);
        const dateStr = date.toISOString().split('T')[0];
        days.push({ date, dateStr });
      }

      return { name: monthName, days };
    });
  }, [selectedYear]);

  // Get completions for a specific date
  const getCompletionsForDate = (dateStr: string) => {
    return habits.filter(h => h.history[dateStr]).map(h => ({
      habit: h,
      emoji: getHabitEmoji(h),
    }));
  };

  const canGoForward = selectedYear < currentYear;
  const canGoBack = selectedYear > currentYear - 5; // Allow up to 5 years back

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with year navigation */}
      <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => canGoBack && setSelectedYear(y => y - 1)}
            disabled={!canGoBack}
            className={`p-2 border-2 border-black transition-all ${
              canGoBack ? 'hover:bg-black hover:text-white' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
              {selectedYear}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {habits.length} habits tracked
            </p>
          </div>

          <button
            onClick={() => canGoForward && setSelectedYear(y => y + 1)}
            disabled={!canGoForward}
            className={`p-2 border-2 border-black transition-all ${
              canGoForward ? 'hover:bg-black hover:text-white' : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-3 text-gray-500">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {habits.map(habit => (
            <div key={habit.id} className="flex items-center gap-2">
              <span
                className={`w-8 h-8 flex items-center justify-center text-lg border-2 border-black ${THEME_STYLES[habit.theme]?.bg || 'bg-orange-400'}`}
              >
                {getHabitEmoji(habit)}
              </span>
              <span className="text-sm font-bold uppercase">{habit.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid - 4 columns x 3 rows of months */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthsData.map((month, monthIndex) => (
          <div
            key={month.name}
            className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <h4 className="text-sm font-black uppercase tracking-tight mb-2 border-b border-gray-200 pb-1">
              {month.name}
            </h4>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((day, i) => (
                <div key={i} className="text-[0.6rem] font-bold text-center text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-[2px]">
              {month.days.map((day, dayIndex) => {
                if (!day.dateStr) {
                  return <div key={dayIndex} className="w-full aspect-square" />;
                }

                const completions = getCompletionsForDate(day.dateStr);
                const hasCompletions = completions.length > 0;
                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                const isFuture = day.date && day.date > new Date();

                return (
                  <div
                    key={dayIndex}
                    className={`
                      w-full aspect-square flex items-center justify-center
                      transition-all relative group cursor-default
                      ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
                      ${isFuture ? 'opacity-30' : ''}
                      ${hasCompletions
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                    title={day.date ? `${day.date.toLocaleDateString()}: ${
                      hasCompletions
                        ? completions.map(c => c.habit.title).join(', ')
                        : 'No habits'
                    }` : ''}
                  >
                    {hasCompletions ? (
                      <div className="flex flex-wrap items-center justify-center gap-0 leading-none">
                        {completions.length <= 2 ? (
                          // Show emojis for 1-2 completions
                          completions.map((c, i) => (
                            <span key={i} className="text-[0.55rem]">{c.emoji}</span>
                          ))
                        ) : completions.length <= 4 ? (
                          // Show smaller emojis for 3-4 completions in a 2x2 grid
                          <div className="grid grid-cols-2 gap-0">
                            {completions.slice(0, 4).map((c, i) => (
                              <span key={i} className="text-[0.45rem] leading-[0.5rem]">{c.emoji}</span>
                            ))}
                          </div>
                        ) : (
                          // Show count for 5+ completions
                          <span className="text-[0.6rem] font-bold">{completions.length}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[0.55rem] text-gray-400">{day.date?.getDate()}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-6">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-gray-500">
          {selectedYear} Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {habits.map(habit => {
            const yearStart = new Date(selectedYear, 0, 1);
            const yearEnd = new Date(selectedYear, 11, 31);
            const today = new Date();
            const endDate = selectedYear === currentYear ? today : yearEnd;

            let totalDays = 0;
            let completedDays = 0;

            const current = new Date(yearStart);
            while (current <= endDate) {
              const dateStr = current.toISOString().split('T')[0];
              totalDays++;
              if (habit.history[dateStr]) {
                completedDays++;
              }
              current.setDate(current.getDate() + 1);
            }

            const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

            return (
              <div key={habit.id} className="text-center p-3 border-2 border-black">
                <div className="text-3xl font-black">{completedDays}</div>
                <div className="text-[0.65rem] font-bold text-gray-500 uppercase mt-1">
                  {habit.title}
                </div>
                <div className="text-[0.6rem] text-gray-400">
                  {percentage}% of {totalDays} days
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearlyCalendarView;
