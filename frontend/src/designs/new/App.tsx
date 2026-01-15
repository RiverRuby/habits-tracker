import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CalendarDays, Layers, Phone, History, Key, ChevronDown, LayoutGrid, GalleryHorizontalEnd } from 'lucide-react';
import HabitCard from './components/HabitCard';
import NewHabitModal from './components/NewHabitModal';
import SettingsModal from './components/SettingsModal';
import HabitDetailsModal from './components/HabitDetailsModal';
import ManageHabitsModal from './components/ManageHabitsModal';
import SyncKeyModal from './components/SyncKeyModal';
import Button from './components/Button';
import { ThemeColor } from './types';
import { useUser, useNewDesignHabits, NewDesignHabit, ThemeColor as StoreThemeColor } from '../../state/user';
import { useDesign } from '../../state/design';
import YearlyCalendarView from './components/YearlyCalendarView';

const NewDesignApp: React.FC = () => {
  const { loaded, createHabit, logHabit, unlogHabit, updateUserInfo } = useUser();
  const allHabits = useNewDesignHabits();
  const { view, toggleView, toggleDesign, hiddenHabits } = useDesign();

  // Filter visible habits for the carousel
  const habits = useMemo(() =>
    allHabits.filter(h => !hiddenHabits.includes(h.id)),
    [allHabits, hiddenHabits]
  );

  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSyncKeyOpen, setIsSyncKeyOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<NewDesignHabit | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isHabitSelectorOpen, setIsHabitSelectorOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [isNewUser, setIsNewUser] = useState(false);
  const [displayMode, setDisplayMode] = useState<'carousel' | 'grid'>('carousel');

  const containerRef = useRef<HTMLDivElement>(null);

  // Load habits on mount
  useEffect(() => {
    if (!loaded) {
      updateUserInfo();
    }
  }, [loaded, updateUserInfo]);

  // Check if new user (no sync key) and open modal
  useEffect(() => {
    const syncKey = localStorage.getItem('ID');
    if (!syncKey) {
      setIsNewUser(true);
      setIsSyncKeyOpen(true);
    }
  }, []);

  // Listen for storage changes to update userName
  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(localStorage.getItem('userName') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Responsive Detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Constants for Layout
  const RADIUS = isMobile ? 380 : 450;
  const PER_ITEM_ANGLE = 360 / Math.max(habits.length, 1);

  // --- Interaction Logic ---

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);

    const clientPos = isMobile
        ? ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY)
        : ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);

    setStartDragPos(clientPos);
    setStartRotation(rotation);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const clientPos = isMobile
        ? ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY)
        : ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);

    const delta = clientPos - startDragPos;

    const sensitivity = isMobile ? 0.5 : 0.4;

    if (isMobile) {
        setRotation(startRotation - delta * sensitivity);
    } else {
        setRotation(startRotation + delta * sensitivity);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const snappedRotation = Math.round(rotation / PER_ITEM_ANGLE) * PER_ITEM_ANGLE;
    setRotation(snappedRotation);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, rotation]);

  // Scroll wheel navigation
  const handleWheel = (e: React.WheelEvent) => {
    if (habits.length === 0) return;
    e.preventDefault();

    // Determine scroll direction and navigate
    if (e.deltaY > 0 || e.deltaX > 0) {
      setRotation(r => {
        const newRotation = r - PER_ITEM_ANGLE;
        return Math.round(newRotation / PER_ITEM_ANGLE) * PER_ITEM_ANGLE;
      });
    } else if (e.deltaY < 0 || e.deltaX < 0) {
      setRotation(r => {
        const newRotation = r + PER_ITEM_ANGLE;
        return Math.round(newRotation / PER_ITEM_ANGLE) * PER_ITEM_ANGLE;
      });
    }
  };

  // --- CRUD ---

  const handleCreateHabit = (title: string, theme: ThemeColor) => {
    createHabit(title.toUpperCase(), theme as StoreThemeColor);

    setTimeout(() => {
        const newCount = habits.length + 1;
        const newAngleSpacing = 360 / newCount;
        setRotation(-((newCount - 1) * newAngleSpacing));
    }, 100);
  };

  // Navigate to a specific habit by index
  const goToHabit = (index: number) => {
    const targetRotation = -(index * PER_ITEM_ANGLE);
    setRotation(targetRotation);
    setIsHabitSelectorOpen(false);
  };

  // Get current active habit index based on rotation
  const currentHabitIndex = useMemo(() => {
    if (habits.length === 0) return -1;
    const normalizedRotation = (((-rotation % 360) + 360) % 360);
    return Math.round(normalizedRotation / PER_ITEM_ANGLE) % habits.length;
  }, [rotation, habits.length, PER_ITEM_ANGLE]);

  const toggleHabitDay = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.history[date]) {
      unlogHabit(habitId, date);
    } else {
      logHabit(habitId, date);
    }
  };

  const normalizeAngle = (angle: number) => {
      let a = angle % 360;
      if (a > 180) a -= 360;
      if (a < -180) a += 360;
      return a;
  };

  // --- Rendering Calculations ---

  // Calculate render items without sorting to prevent DOM reordering during animation
  const renderItems = habits.map((habit, index) => {
      const itemAngleBase = index * PER_ITEM_ANGLE;
      const netAngleDeg = itemAngleBase + rotation;
      const netAngleRad = (netAngleDeg * Math.PI) / 180;

      const normalizedAngle = normalizeAngle(netAngleDeg);
      const absAngle = Math.abs(normalizedAngle);

      const isFront = absAngle < (isMobile ? 30 : 40);
      const scale = 1 - (absAngle / 180) * (isMobile ? 0.2 : 0.3);

      const z = Math.cos(netAngleRad) * RADIUS - RADIUS;
      const zIndex = Math.round(z + 2000);

      let transform = '';

      if (isMobile) {
          const y = Math.sin(netAngleRad) * RADIUS;
          const tiltX = -normalizedAngle * 0.5;
          transform = `translate3d(-50%, calc(-50% + ${y}px), ${z}px) rotateX(${tiltX}deg) scale(${scale})`;
      } else {
          const x = Math.sin(netAngleRad) * RADIUS;
          transform = `translate3d(calc(-50% + ${x}px), -50%, ${z}px) scale(${scale})`;
      }

      return {
          habit,
          index,
          style: {
              transform,
              zIndex,
              opacity: 1,
              pointerEvents: isFront ? 'auto' : 'none',
          } as React.CSSProperties,
          isActive: isFront,
      };
  });

  // Note: Removed sorting to prevent DOM reordering during animation
  // z-index in CSS handles the visual stacking correctly

  // Show loading state (but allow sync key modal for new users)
  if (!loaded && !isNewUser) {
    // Read directly from localStorage to ensure we have the latest value during loading
    const displayName = localStorage.getItem('userName') || 'You';
    return (
      <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col items-center justify-center font-space">
        {/* Logo/Branding */}
        <div className="border-4 border-black p-4 md:p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex items-center gap-3">
            <img src="/favicon-option-2.svg" alt="Logo" className="w-10 h-10 md:w-12 md:h-12" />
            <h1 className="text-2xl md:text-4xl font-black leading-none tracking-tight">Habit Tracker</h1>
          </div>
          <div className="text-[0.6rem] font-bold mt-1 tracking-widest border-t-2 border-black pt-1 text-center">
            <span>{displayName}</span>
          </div>
        </div>

        {/* Loading animation */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 bg-black animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-gray-500">
          Loading your habits...
        </p>
      </div>
    );
  }

  // Show welcome modal for new users (no sync key)
  if (isNewUser && isSyncKeyOpen) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col items-center justify-center font-space">
        <SyncKeyModal
          isOpen={isSyncKeyOpen}
          onClose={() => { setIsSyncKeyOpen(false); setIsNewUser(false); }}
          isNewUser={isNewUser}
        />
      </div>
    );
  }

  // Show calendar view if toggled
  if (view === 'calendar') {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col overflow-hidden font-space text-black">
        {/* Header */}
        <header className="flex justify-between items-start p-4 md:p-6 z-[3000] relative pointer-events-auto shrink-0">
          <div className="border-4 border-black p-2 md:p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <img src="/favicon-option-2.svg" alt="Logo" className="w-7 h-7 md:w-8 md:h-8" />
                <h1 className="text-lg md:text-2xl font-black leading-none tracking-tight">Habit Tracker</h1>
              </div>
              <div className="text-[0.6rem] font-bold mt-1 tracking-widest border-t-2 border-black pt-1 text-center">
                  <span>{userName || 'You'}</span>
              </div>
          </div>

          <div className="flex gap-2 md:gap-4">
            <Button onClick={toggleView} variant="icon" title="Habits" className="w-10 h-10 md:w-auto md:h-auto">
              <Layers size={18} />
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} variant="icon" title="Call Settings" className="w-10 h-10 md:w-auto md:h-auto">
              <Phone size={18} />
            </Button>
            <Button onClick={() => setIsSyncKeyOpen(true)} variant="icon" title="Sync Key" className="w-10 h-10 md:w-auto md:h-auto">
              <Key size={18} />
            </Button>
            <Button onClick={toggleDesign} variant="icon" title="Classic Design" className="w-10 h-10 md:w-auto md:h-auto">
              <History size={18} />
            </Button>
          </div>
        </header>

        {/* Calendar View */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <YearlyCalendarView habits={allHabits} onToggleDay={toggleHabitDay} />
        </main>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <SyncKeyModal isOpen={isSyncKeyOpen} onClose={() => { setIsSyncKeyOpen(false); setIsNewUser(false); }} isNewUser={isNewUser} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col overflow-hidden font-space text-black select-none touch-none">

      {/* Header */}
      <header className="flex justify-between items-start p-4 md:p-6 z-[3000] relative pointer-events-auto shrink-0">
        <div className="relative">
          <div className="border-4 border-black p-2 md:p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2">
                <img src="/favicon-option-2.svg" alt="Logo" className="w-7 h-7 md:w-8 md:h-8" />
                <h1 className="text-lg md:text-2xl font-black leading-none tracking-tight">Habit Tracker</h1>
              </div>
              <div className="text-[0.6rem] font-bold mt-1 tracking-widest border-t-2 border-black pt-1 text-center">
                  <span>{userName || 'You'}</span>
              </div>
          </div>

          {/* Habit Selector Dropdown */}
          {habits.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setIsHabitSelectorOpen(!isHabitSelectorOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black text-sm font-bold uppercase hover:bg-black hover:text-white transition-colors w-full justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <span className="truncate">
                  {habits[currentHabitIndex]?.emoji && `${habits[currentHabitIndex].emoji} `}
                  {habits[currentHabitIndex]?.title || 'Select Habit'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isHabitSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {isHabitSelectorOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[2999]"
                    onClick={() => setIsHabitSelectorOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[3001] max-h-60 overflow-y-auto">
                    {habits.map((habit, index) => (
                      <button
                        key={habit.id}
                        onClick={() => goToHabit(index)}
                        className={`
                          w-full px-3 py-2 text-left text-sm font-bold uppercase border-b border-gray-200 last:border-0
                          hover:bg-black hover:text-white transition-colors flex items-center gap-2
                          ${index === currentHabitIndex ? 'bg-black text-white' : ''}
                        `}
                      >
                        {habit.emoji && <span>{habit.emoji}</span>}
                        <span className="truncate">{habit.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 md:gap-4">
            <Button onClick={toggleView} variant="icon" title="Annual" className="w-10 h-10 md:w-auto md:h-auto">
              <CalendarDays size={18} />
            </Button>
            <Button onClick={() => setIsManageOpen(true)} variant="icon" title="Manage Habits" className="w-10 h-10 md:w-auto md:h-auto">
              <Layers size={18} />
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} variant="icon" title="Call Settings" className="w-10 h-10 md:w-auto md:h-auto">
              <Phone size={18} />
            </Button>
            <Button onClick={() => setIsSyncKeyOpen(true)} variant="icon" title="Sync Key" className="w-10 h-10 md:w-auto md:h-auto">
              <Key size={18} />
            </Button>
            <Button onClick={toggleDesign} variant="icon" title="Classic Design" className="w-10 h-10 md:w-auto md:h-auto">
              <History size={18} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm md:text-base px-3 py-2 md:px-6">
              <Plus size={16} strokeWidth={3} /> {isMobile ? 'NEW' : 'NEW HABIT'}
            </Button>
        </div>
      </header>

      {/* Main Content - Carousel or Grid */}
      {displayMode === 'carousel' ? (
        <main
          className="flex-1 flex flex-col justify-center items-center relative perspective-[1200px] overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onWheel={handleWheel}
        >

          {/* Carousel Container */}
          <div
              ref={containerRef}
              className={`relative w-0 h-0 transform-style-3d ${isMobile ? '' : '-translate-y-20'}`}
              style={{
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
          >
              {renderItems.map((item) => (
                  <div
                      key={item.habit.id}
                      className={`
                          absolute top-1/2 left-1/2 aspect-square origin-center will-change-transform
                          ${isMobile ? 'w-[90vw] max-w-[400px]' : 'w-[400px]'}
                      `}
                      style={{
                          ...item.style,
                          transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      }}
                  >
                      <HabitCard
                          habit={item.habit}
                          isActive={item.isActive}
                          onToggleDay={(date) => toggleHabitDay(item.habit.id, date)}
                          onEditDetails={() => setEditingHabit(item.habit)}
                          onUpdate={updateUserInfo}
                      />
                  </div>
              ))}
          </div>

          {habits.length === 0 && (
              <div className="absolute z-50 text-center bg-white/80 p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-2xl font-bold mb-4">NO HABITS</p>
                  <Button onClick={() => setIsModalOpen(true)}>START NOW</Button>
              </div>
          )}

        </main>
      ) : (
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {/* Grid View - auto-fit columns based on available space, max 4 columns */}
          <div
            className="grid gap-4 md:gap-6 max-w-[1800px] mx-auto"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            }}
          >
            {habits.map((habit) => (
              <div key={habit.id} className="flex justify-center">
                <HabitCard
                  habit={habit}
                  isActive={true}
                  onToggleDay={(date) => toggleHabitDay(habit.id, date)}
                  onEditDetails={() => setEditingHabit(habit)}
                  onUpdate={updateUserInfo}
                  compact
                />
              </div>
            ))}
          </div>

          {habits.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <div className="text-center bg-white/80 p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-2xl font-bold mb-4">NO HABITS</p>
                    <Button onClick={() => setIsModalOpen(true)}>START NOW</Button>
                </div>
              </div>
          )}
        </main>
      )}

      {/* Controls Overlay */}
      <div className={`
          absolute z-[3000] pointer-events-none flex gap-4
          ${isMobile ? 'bottom-6 right-6 flex-col' : 'bottom-12 left-0 right-0 justify-center'}
      `}>
            {displayMode === 'carousel' ? (
              <>
                <Button
                    variant="icon"
                    className={`
                        pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                        ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                    `}
                    onClick={() => setRotation(r => r - PER_ITEM_ANGLE)}
                >
                    {isMobile ? <ArrowUp size={24} strokeWidth={3} /> : <ArrowLeft size={24} strokeWidth={3} />}
                </Button>
                <Button
                    variant="icon"
                    className={`
                        pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                        ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                    `}
                    onClick={() => setDisplayMode('grid')}
                    title="Grid View"
                >
                    <LayoutGrid size={24} strokeWidth={3} />
                </Button>
                <Button
                    variant="icon"
                    className={`
                        pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                        ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                    `}
                    onClick={() => setRotation(r => r + PER_ITEM_ANGLE)}
                >
                    {isMobile ? <ArrowDown size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
                </Button>
              </>
            ) : (
              <Button
                  variant="icon"
                  className={`
                      pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                      ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                  `}
                  onClick={() => setDisplayMode('carousel')}
                  title="Carousel View"
              >
                  <GalleryHorizontalEnd size={24} strokeWidth={3} />
              </Button>
            )}
      </div>

      <NewHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateHabit}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <HabitDetailsModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habit={editingHabit}
        onUpdate={updateUserInfo}
      />

      <ManageHabitsModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        habits={allHabits}
      />

      <SyncKeyModal
        isOpen={isSyncKeyOpen}
        onClose={() => { setIsSyncKeyOpen(false); setIsNewUser(false); }}
        isNewUser={isNewUser}
      />

    </div>
  );
};

export default NewDesignApp;
