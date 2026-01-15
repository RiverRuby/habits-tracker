import React, { useState, useMemo, useRef, useEffect } from 'react';
import { THEME_STYLES, WEEK_DAYS } from '../types';
import { NewDesignHabit } from '../../../state/user';
import { MoreHorizontal, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../../utils/api';
import { dbDateToISO, isoToDbDate } from '../../../shared/dateUtils';

interface HabitCardProps {
  habit: NewDesignHabit;
  isActive: boolean;
  onToggleDay: (date: string) => void;
  onEditDetails?: () => void;
  onUpdate?: () => void;
  compact?: boolean;
}

type ViewMode = 'MONTH' | 'YEAR';

const HabitCard: React.FC<HabitCardProps> = ({ habit, isActive, onToggleDay, onEditDetails, onUpdate, compact }) => {
  const styles = THEME_STYLES[habit.theme];
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month, -1 = previous, etc.
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Helper to get YYYY-MM-DD in local timezone (not UTC)
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Focus note input when selected date changes
  useEffect(() => {
    if (selectedDate && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [selectedDate]);

  // Load existing note when selecting a date
  useEffect(() => {
    if (selectedDate && habit.completionDetails) {
      const completion = habit.completionDetails.find(c => {
        return dbDateToISO(c.day) === selectedDate;
      });
      setNoteInput(completion?.notes || '');
    } else {
      setNoteInput('');
    }
  }, [selectedDate, habit.completionDetails]);

  // Handle month day click - new UX
  const handleMonthDayClick = (dateStr: string) => {
    if (!isActive) return;

    const isCompleted = !!habit.history[dateStr];

    if (!isCompleted) {
      // Mark as complete and open note input
      onToggleDay(dateStr);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#ffffff', '#F4D03F', '#E67E22', '#54a0ff'],
        disableForReducedMotion: true
      });
    }

    // Always open note input (for both new and existing completions)
    setSelectedDate(dateStr);
  };

  // Save note for selected date
  const handleSaveNote = async () => {
    if (!selectedDate || savingNote) return;

    try {
      setSavingNote(true);
      // Convert to DB format: "DD MMM YYYY" using utility to avoid timezone issues
      const dbFormat = isoToDbDate(selectedDate);

      await api.post('/habits/add-notes', {
        habitId: habit.id,
        day: dbFormat,
        notes: noteInput || null,
      });

      onUpdate?.();
      setSelectedDate(null);
      setNoteInput('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSavingNote(false);
    }
  };

  // Unmark a completion (trash button)
  const handleUnmark = () => {
    if (!selectedDate || !isActive) return;

    // Toggle off the completion
    onToggleDay(selectedDate);
    setSelectedDate(null);
    setNoteInput('');
  };

  // --- View Data Generators ---

  // Get the viewed month/year based on offset
  const viewedMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  // Calculate monthly count for the viewed month
  const monthCount = useMemo(() => {
    const year = viewedMonth.getFullYear();
    const month = viewedMonth.getMonth();
    let count = 0;
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
      const dateStr = formatDate(new Date(year, month, day));
      if (habit.history[dateStr]) count++;
    }
    return count;
  }, [habit.history, viewedMonth]);

  // Calculate count based on view mode (for active card)
  const viewCount = useMemo(() => {
    if (viewMode === 'MONTH') {
      return monthCount;
    } else {
      // Count completed days in last 52 weeks (YEAR view)
      return Object.values(habit.history).filter(Boolean).length;
    }
  }, [viewMode, habit.history, monthCount]);

  // Label for the count
  const viewLabel = useMemo(() => {
    if (viewMode === 'MONTH') {
      if (monthOffset === 0) return 'This Month';
      return viewedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'This Year';
  }, [viewMode, monthOffset, viewedMonth]);

  // Month View: Days in viewed month + padding
  const monthData = useMemo(() => {
      const year = viewedMonth.getFullYear();
      const month = viewedMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const dates = [];
      // Padding for start of week (Sunday start)
      for(let i=0; i<firstDay.getDay(); i++) {
          dates.push(null);
      }
      // Days
      for(let i=1; i<=lastDay.getDate(); i++) {
          dates.push(new Date(year, month, i));
      }
      return dates;
  }, [viewedMonth]);

  // Year View: Last 52 weeks (approx 364 days)
  const yearData = useMemo(() => {
      const dates = [];
      const today = new Date();
      // Start 52 weeks ago (approx)
      const start = new Date(today);
      start.setDate(today.getDate() - (52 * 7) + 1); 
      
      // We want columns of weeks. GitHub style: Col 1 is first week, Col 52 is last week.
      // Rows are days (Sun-Sat).
      // We need a linear array of ~365 days to map into the grid.
      // Let's generate exactly 52 weeks * 7 days
      for(let i=0; i < 52 * 7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          dates.push(d);
      }
      return dates;
  }, []);


  // --- Renderers ---

  const renderMonth = () => (
      <div className="h-full flex flex-col">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEK_DAYS.map(d => (
                  <div key={d} className="text-[0.5rem] font-bold text-center opacity-50">{d.slice(0,1)}</div>
              ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 content-start">
              {monthData.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const dateStr = formatDate(date);
                  const isCompleted = !!habit.history[dateStr];
                  const isToday = formatDate(new Date()) === dateStr;
                  const isSelected = selectedDate === dateStr;
                  return (
                      <button
                        key={i}
                        onClick={() => handleMonthDayClick(dateStr)}
                        className={`
                            aspect-square flex items-center justify-center border-2 text-[0.7rem] font-bold transition-all
                            ${isCompleted ? 'bg-black text-white border-black' : 'bg-transparent border-gray-300 hover:border-black text-black'}
                            ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
                            ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                        `}
                      >
                          {date.getDate()}
                      </button>
                  )
              })}
          </div>

          {/* Note Input (appears when a day is selected) */}
          {selectedDate && (
            <div className="mt-3 flex gap-2 items-center animate-in slide-in-from-bottom duration-200">
              <input
                ref={noteInputRef}
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                placeholder={`Note for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}...`}
                className="flex-1 px-3 py-2 text-sm border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="p-2 bg-black text-white border-2 border-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                title="Save note"
              >
                <Send size={16} />
              </button>
              <button
                onClick={handleUnmark}
                className="p-2 border-2 border-black hover:bg-red-100 text-red-600 transition-colors"
                title="Remove completion"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
      </div>
  );

  const renderYear = () => {
      // GitHub-style contributions graph: 52 columns, 7 rows
      // Cleaner, denser, with intensity shading
      const completedCount = Object.values(habit.history).filter(Boolean).length;
      const percentage = Math.round((completedCount / yearData.length) * 100);

      return (
          <div className="h-full flex flex-col justify-center">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[0.6rem] font-bold opacity-50 uppercase">Last 52 weeks</span>
                <span className="text-[0.6rem] font-bold opacity-50">{completedCount} days ({percentage}%)</span>
              </div>
              <div className="grid grid-rows-7 grid-flow-col gap-[1px] w-full" style={{ height: '100px' }}>
                  {yearData.map((date, i) => {
                      const dateStr = formatDate(date);
                      const isCompleted = !!habit.history[dateStr];
                      const isToday = formatDate(new Date()) === dateStr;

                      return (
                          <div
                            key={i}
                            title={`${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${isCompleted ? 'Done' : 'Missed'}`}
                            className={`
                                w-full h-full rounded-[2px] transition-colors cursor-default
                                ${isCompleted
                                  ? 'bg-black'
                                  : 'bg-black/5 hover:bg-black/10'}
                                ${isToday ? 'ring-1 ring-black ring-offset-1' : ''}
                            `}
                          />
                      )
                  })}
              </div>
              {/* Mini legend */}
              <div className="flex items-center justify-end gap-1 mt-2 opacity-50">
                <span className="text-[0.5rem]">Less</span>
                <div className="w-2 h-2 rounded-[1px] bg-black/5" />
                <div className="w-2 h-2 rounded-[1px] bg-black/30" />
                <div className="w-2 h-2 rounded-[1px] bg-black/60" />
                <div className="w-2 h-2 rounded-[1px] bg-black" />
                <span className="text-[0.5rem]">More</span>
              </div>
          </div>
      )
  };

  return (
    <div
      className={`
        relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${compact ? 'w-full max-w-[400px]' : 'w-[340px] md:w-[400px]'} aspect-square flex flex-col justify-between
        border-2
        ${isActive
            ? `bg-opacity-100 ${styles.bg} border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] scale-100`
            : 'bg-white border-gray-200 shadow-none scale-95'}
      `}
    >
      {/* Header */}
      <div className={`
          p-6 border-b-2 flex justify-between items-start relative overflow-hidden transition-colors
          ${isActive ? 'border-black' : 'border-gray-200'}
      `}>
        <div className="z-10 relative max-w-[60%]">
          <div className="flex items-center gap-2">
            {habit.emoji && (
              <span className={`text-3xl ${isActive ? '' : 'opacity-30'}`}>{habit.emoji}</span>
            )}
            <h2 className={`
                text-3xl font-black leading-none uppercase tracking-tighter break-words hyphens-auto transition-colors
                ${isActive ? 'text-black' : 'text-gray-300'}
            `}>
              {habit.title}
            </h2>
          </div>
          <div className={`mt-2 flex items-center gap-1 ${isActive ? '' : 'opacity-30'}`}>
            {isActive && viewMode === 'MONTH' && (
              <button
                onClick={() => setMonthOffset(o => o - 1)}
                className="p-0.5 hover:bg-black/10 rounded transition-colors"
                title="Previous month"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'opacity-60' : 'text-gray-300'}`}>
              {isActive ? viewLabel : 'This Month'}
            </span>
            {isActive && viewMode === 'MONTH' && (
              <button
                onClick={() => setMonthOffset(o => o + 1)}
                className="p-0.5 hover:bg-black/10 rounded transition-colors"
                title="Next month"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={`flex flex-col items-end z-10 ${isActive ? 'text-black' : 'text-gray-300'}`}>
            <div className="flex items-center gap-2">
              {isActive && onEditDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDetails();
                  }}
                  className="p-1 hover:bg-black/10 rounded transition-colors"
                  title="Edit Details"
                >
                  <MoreHorizontal size={20} />
                </button>
              )}
              <span className="text-5xl font-black leading-none">{isActive ? viewCount : monthCount}</span>
            </div>
        </div>

      </div>

      {/* Body / Content */}
      <div className="flex-1 p-6 flex flex-col relative">
        
        {/* View Toggles (Only when active) */}
        {isActive && (
            <div className="flex gap-2 mb-4">
                {(['MONTH', 'YEAR'] as ViewMode[]).map(mode => (
                    <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode);
                          setSelectedDate(null); // Clear selection when switching views
                        }}
                        className={`
                            px-2 py-1 text-[0.6rem] font-bold border-2 border-black uppercase transition-all
                            ${viewMode === mode ? 'bg-black text-white' : 'bg-transparent hover:bg-black/10'}
                        `}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${!isActive ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
             {/* If not active, we just show the month view as a preview, but faded */}
             {!isActive ? renderMonth() : (
                 <>
                    {viewMode === 'MONTH' && renderMonth()}
                    {viewMode === 'YEAR' && renderYear()}
                 </>
             )}
        </div>
      </div>
    </div>
  );
};

export default HabitCard;