import React, { useState, useMemo } from 'react';
import { Habit, THEME_STYLES, WEEK_DAYS } from '../types';
import { Check, Flame, Bot, Calendar, BarChart3, Grip } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getHabitMotivation } from '../services/geminiService';

interface HabitCardProps {
  habit: Habit;
  isActive: boolean;
  onToggleDay: (date: string) => void;
}

type ViewMode = 'WEEK' | 'MONTH' | 'YEAR';

const HabitCard: React.FC<HabitCardProps> = ({ habit, isActive, onToggleDay }) => {
  const styles = THEME_STYLES[habit.theme];
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');

  // Helper to get YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handleToggle = (dateStr: string) => {
    if (!isActive) return;
    
    const isCompleting = !habit.history[dateStr];
    onToggleDay(dateStr);

    if (isCompleting) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#ffffff', '#F4D03F', '#E67E22', '#54a0ff'],
        disableForReducedMotion: true
      });
    }
  };

  const fetchAiTip = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (loadingAi) return;
      setLoadingAi(true);
      const msg = await getHabitMotivation(habit.title, habit.streak);
      setAiMessage(msg);
      setLoadingAi(false);
      setTimeout(() => setAiMessage(null), 5000);
  };

  // --- View Data Generators ---

  // Week View: Current week relative to today
  const weekDates = useMemo(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - day); // Start on Sunday
    const dates = [];
    for(let i=0; i<7; i++){
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
    }
    return dates;
  }, []);

  // Month View: Days in current month + padding
  const monthData = useMemo(() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
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
  }, []);

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

  const renderWeek = () => (
      <div className="flex justify-between items-end h-full">
        {weekDates.map((date, idx) => {
            const dateStr = formatDate(date);
            const isCompleted = !!habit.history[dateStr];
            const isToday = formatDate(new Date()) === dateStr;

            return (
                <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                    <button
                        onClick={() => handleToggle(dateStr)}
                        className={`
                            w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black flex items-center justify-center transition-all duration-200
                            ${isCompleted ? 'bg-black text-white' : 'bg-transparent hover:bg-black/10'}
                            ${isToday && !isCompleted ? 'animate-pulse' : ''}
                            ${!isActive ? 'cursor-default' : 'cursor-pointer active:scale-90'}
                        `}
                    >
                        {isCompleted && <Check size={20} strokeWidth={4} />}
                    </button>
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest">{WEEK_DAYS[date.getDay()]}</span>
                </div>
            );
        })}
    </div>
  );

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
                  return (
                      <button
                        key={i}
                        onClick={() => handleToggle(dateStr)}
                        className={`
                            aspect-square flex items-center justify-center border-2 text-[0.7rem] font-bold transition-all
                            ${isCompleted ? 'bg-black text-white border-black' : 'bg-transparent border-gray-300 hover:border-black text-black'}
                            ${isToday ? 'ring-2 ring-black ring-offset-1' : ''}
                        `}
                      >
                          {date.getDate()}
                      </button>
                  )
              })}
          </div>
      </div>
  );

  const renderYear = () => {
      // 52 columns, 7 rows.
      // We need to render grid-flow-col (columns first).
      return (
          <div className="h-full flex flex-col justify-center">
              <div className="text-[0.6rem] font-bold mb-2 opacity-50">LAST 12 MONTHS</div>
              <div className="grid grid-rows-7 grid-flow-col gap-[2px] w-full h-[140px]">
                  {yearData.map((date, i) => {
                      const dateStr = formatDate(date);
                      const isCompleted = !!habit.history[dateStr];
                      return (
                          <div 
                            key={i}
                            title={`${dateStr}: ${isCompleted ? 'Done' : 'Missed'}`}
                            className={`
                                w-full h-full border-[1px]
                                ${isCompleted ? 'bg-black border-black' : 'bg-transparent border-gray-300'}
                            `}
                          />
                      )
                  })}
              </div>
          </div>
      )
  };

  return (
    <div 
      className={`
        relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        w-[340px] md:w-[400px] aspect-square flex flex-col justify-between
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
        <div className="z-10 relative max-w-[70%]">
          <h2 className={`
              text-3xl font-black leading-none uppercase tracking-tighter break-words hyphens-auto transition-colors
              ${isActive ? 'text-black' : 'text-gray-300'}
          `}>
            {habit.title}
          </h2>
          <div className={`mt-2 text-xs font-bold uppercase tracking-widest transition-opacity ${isActive ? 'opacity-60' : 'opacity-30 text-gray-300'}`}>
            Streak
          </div>
        </div>
        
        <div className={`flex flex-col items-end z-10 ${isActive ? 'text-black' : 'text-gray-300'}`}>
            <span className="text-5xl font-black leading-none">{habit.streak}</span>
        </div>

        {/* AI Tip Overlay (Only on Active) */}
        {isActive && aiMessage && (
            <div className="absolute inset-0 bg-black text-white p-4 flex items-center justify-center text-center font-bold text-lg uppercase animate-in slide-in-from-top duration-300 z-20">
                {aiMessage}
            </div>
        )}
      </div>

      {/* Body / Content */}
      <div className="flex-1 p-6 flex flex-col relative">
        
        {/* View Toggles (Only when active) */}
        {isActive && (
            <div className="flex gap-2 mb-4">
                {(['WEEK', 'MONTH', 'YEAR'] as ViewMode[]).map(mode => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`
                            px-2 py-1 text-[0.6rem] font-bold border-2 border-black uppercase transition-all
                            ${viewMode === mode ? 'bg-black text-white' : 'bg-transparent hover:bg-black/10'}
                        `}
                    >
                        {mode}
                    </button>
                ))}
                
                <div className="flex-1" />

                <button 
                    onClick={fetchAiTip}
                    className="p-1 bg-black/10 hover:bg-black/20 rounded-full transition-colors group"
                    title="Get AI Motivation"
                >
                    <Bot size={16} className={loadingAi ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
                </button>
            </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${!isActive ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
             {/* If not active, we just show the month view as a preview, but faded */}
             {!isActive ? renderMonth() : (
                 <>
                    {viewMode === 'WEEK' && renderWeek()}
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