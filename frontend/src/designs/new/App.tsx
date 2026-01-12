import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, Calendar, Layers, Settings } from 'lucide-react';
import HabitCard from './components/HabitCard';
import NewHabitModal from './components/NewHabitModal';
import SettingsModal from './components/SettingsModal';
import HabitDetailsModal from './components/HabitDetailsModal';
import Button from './components/Button';
import { ThemeColor } from './types';
import { useUser, useNewDesignHabits, NewDesignHabit, ThemeColor as StoreThemeColor } from '../../state/user';
import { useDesign } from '../../state/design';
import YearlyCalendarView from './components/YearlyCalendarView';

const NewDesignApp: React.FC = () => {
  const { loaded, createHabit, logHabit, unlogHabit, updateUserInfo } = useUser();
  const habits = useNewDesignHabits();
  const { view, toggleView, toggleDesign } = useDesign();

  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState(0);
  const [startRotation, setStartRotation] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<NewDesignHabit | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load habits on mount
  useEffect(() => {
    if (!loaded) {
      updateUserInfo();
    }
  }, [loaded, updateUserInfo]);

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

  renderItems.sort((a, b) => (a.style.zIndex as number) - (b.style.zIndex as number));

  // Show loading state
  if (!loaded) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex items-center justify-center font-space">
        <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-xl font-bold">LOADING...</p>
        </div>
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
              <h1 className="text-lg md:text-2xl font-black leading-none tracking-tight">DAILY<br/>PUNCH.</h1>
              <div className="text-[0.6rem] font-bold mt-1 tracking-widest flex justify-between items-center border-t-2 border-black pt-1">
                  <span>CALENDAR</span>
                  <span className="bg-black text-white px-1 text-[0.5rem]">V.3.1</span>
              </div>
          </div>

          <div className="flex gap-2 md:gap-4">
            <Button onClick={toggleView} variant="icon" title="Habits View" className="w-10 h-10 md:w-auto md:h-auto">
              <Layers size={18} />
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} variant="icon" title="Settings" className="w-10 h-10 md:w-auto md:h-auto">
              <Settings size={18} />
            </Button>
            <Button onClick={toggleDesign} variant="icon" title="Classic Design" className="w-10 h-10 md:w-auto md:h-auto text-[0.6rem] font-bold">
              OLD
            </Button>
          </div>
        </header>

        {/* Calendar View */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <YearlyCalendarView habits={habits} onToggleDay={toggleHabitDay} />
        </main>

        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col overflow-hidden font-space text-black select-none touch-none">

      {/* Header */}
      <header className="flex justify-between items-start p-4 md:p-6 z-[3000] relative pointer-events-auto shrink-0">
        <div className="border-4 border-black p-2 md:p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-lg md:text-2xl font-black leading-none tracking-tight">DAILY<br/>PUNCH.</h1>
            <div className="text-[0.6rem] font-bold mt-1 tracking-widest flex justify-between items-center border-t-2 border-black pt-1">
                <span>{isMobile ? 'ROLODEX' : 'CAROUSEL'}</span>
                <span className="bg-black text-white px-1 text-[0.5rem]">V.3.1</span>
            </div>
        </div>

        <div className="flex gap-2 md:gap-4">
            <Button onClick={toggleView} variant="icon" title="Calendar View" className="w-10 h-10 md:w-auto md:h-auto">
              <Calendar size={18} />
            </Button>
            <Button onClick={() => setIsSettingsOpen(true)} variant="icon" title="Settings" className="w-10 h-10 md:w-auto md:h-auto">
              <Settings size={18} />
            </Button>
            <Button onClick={toggleDesign} variant="icon" title="Classic Design" className="w-10 h-10 md:w-auto md:h-auto text-[0.6rem] font-bold">
              OLD
            </Button>
             <Button onClick={() => setRotation(0)} variant="icon" title="Reset View" className="w-10 h-10 md:w-auto md:h-auto">
                <RotateCcw size={18} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm md:text-base px-3 py-2 md:px-6">
                <Plus size={16} strokeWidth={3} /> {isMobile ? 'NEW' : 'NEW HABIT'}
            </Button>
        </div>
      </header>

      {/* Main 3D Scene */}
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

      {/* Controls Overlay */}
      <div className={`
          absolute z-[3000] pointer-events-none flex gap-4
          ${isMobile ? 'bottom-6 right-6 flex-col' : 'bottom-12 left-0 right-0 justify-center'}
      `}>
            <Button
                variant="icon"
                className={`
                    pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                    ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                `}
                onClick={() => setRotation(r => r + PER_ITEM_ANGLE)}
            >
                {isMobile ? <ArrowUp size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
            </Button>
            <Button
                variant="icon"
                className={`
                    pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                    ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                `}
                onClick={() => setRotation(r => r - PER_ITEM_ANGLE)}
            >
                {isMobile ? <ArrowDown size={24} strokeWidth={3} /> : <ArrowLeft size={24} strokeWidth={3} />}
            </Button>
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

    </div>
  );
};

export default NewDesignApp;
