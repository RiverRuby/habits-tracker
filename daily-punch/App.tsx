import React, { useState, useEffect, useRef } from 'react';
import { Plus, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import HabitCard from './components/HabitCard';
import NewHabitModal from './components/NewHabitModal';
import Button from './components/Button';
import { Habit, ThemeColor } from './types';

// Initial Demo Data
const INITIAL_HABITS: Habit[] = [
  {
    id: '1',
    title: 'MORNING RUN',
    theme: ThemeColor.ORANGE,
    streak: 2,
    history: {
        [new Date().toISOString().split('T')[0]]: false 
    },
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'DRINK WATER',
    theme: ThemeColor.BLUE,
    streak: 6,
    history: {
        [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: true,
    },
    createdAt: Date.now(),
  },
  {
    id: '3',
    title: 'READ 30 MINS',
    theme: ThemeColor.YELLOW,
    streak: 5,
    history: {},
    createdAt: Date.now(),
  },
  {
    id: '4',
    title: 'MEDITATE',
    theme: ThemeColor.GREEN,
    streak: 12,
    history: {},
    createdAt: Date.now(),
  },
  {
    id: '5',
    title: 'NO SUGAR',
    theme: ThemeColor.ORANGE,
    streak: 1,
    history: {},
    createdAt: Date.now(),
  }
];

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(() => {
      const saved = localStorage.getItem('daily-punch-habits');
      return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState(0); // X for desktop, Y for mobile
  const [startRotation, setStartRotation] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Persist habits
  useEffect(() => {
    localStorage.setItem('daily-punch-habits', JSON.stringify(habits));
  }, [habits]);

  // Constants for Layout
  // Mobile needs a tighter radius for the rolodex feel
  const RADIUS = isMobile ? 380 : 450; 
  const PER_ITEM_ANGLE = 360 / Math.max(habits.length, 1);

  // --- Interaction Logic ---

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    
    // Track X for Desktop, Y for Mobile
    const clientPos = isMobile 
        ? ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY)
        : ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);
        
    setStartDragPos(clientPos);
    setStartRotation(rotation);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    // Prevent default scrolling on mobile when interacting with the 3D scene
    // e.preventDefault(); 
    
    const clientPos = isMobile 
        ? ('touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY)
        : ('touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX);
        
    const delta = clientPos - startDragPos;
    
    const sensitivity = isMobile ? 0.5 : 0.4;
    
    if (isMobile) {
        // Mobile: Drag Down (positive) -> Rotate backwards (previous items appear)
        setRotation(startRotation - delta * sensitivity);
    } else {
        // Desktop: Drag Right (positive) -> Rotate backwards (previous items appear)
        setRotation(startRotation + delta * sensitivity);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to nearest item
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


  // --- CRUD ---

  const createHabit = (title: string, theme: ThemeColor) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: title.toUpperCase(),
      theme,
      streak: 0,
      history: {},
      createdAt: Date.now(),
    };
    setHabits(prev => [...prev, newHabit]);
    
    // Rotate to the new item (end of list)
    setTimeout(() => {
        const newCount = habits.length + 1;
        const newAngleSpacing = 360 / newCount;
        setRotation(-((newCount - 1) * newAngleSpacing));
    }, 100);
  };

  const toggleHabitDay = (habitId: string, date: string) => {
    setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const isCompletedNow = !h.history[date];
        const newHistory = { ...h.history, [date]: isCompletedNow };
        
        let newStreak = h.streak;
        if (date === new Date().toISOString().split('T')[0]) {
            if (isCompletedNow) newStreak += 1;
            else newStreak = Math.max(0, newStreak - 1);
        }
        return { ...h, history: newHistory, streak: newStreak };
    }));
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
      
      // Determine if it's the "Front" card
      // Looser tolerance for mobile to make it easier to hit
      const isFront = absAngle < (isMobile ? 30 : 40);
      
      // Scale down background items
      const scale = 1 - (absAngle / 180) * (isMobile ? 0.2 : 0.3); 

      // Common Z calculation
      const z = Math.cos(netAngleRad) * RADIUS - RADIUS; 
      // Z-Index (Painter's Algo)
      const zIndex = Math.round(z + 2000); 

      let transform = '';

      if (isMobile) {
          // --- Mobile: Vertical Rolodex ---
          // Rotate around X axis. Y varies.
          const y = Math.sin(netAngleRad) * RADIUS;
          // Tilt items slightly as they rotate up/down
          const tiltX = -normalizedAngle * 0.5;
          
          transform = `translate3d(-50%, calc(-50% + ${y}px), ${z}px) rotateX(${tiltX}deg) scale(${scale})`;
      } else {
          // --- Desktop: Horizontal Carousel ---
          // Rotate around Y axis. X varies.
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

  return (
    <div className="fixed inset-0 w-full h-full bg-[#E5E5E5] flex flex-col overflow-hidden font-['Space_Grotesk'] text-black select-none touch-none">
      
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
                onClick={() => setRotation(r => r - PER_ITEM_ANGLE)}
            >
                {isMobile ? <ArrowUp size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
            </Button>
            <Button 
                variant="icon" 
                className={`
                    pointer-events-auto rounded-full shadow-lg bg-white border-2 border-black
                    ${isMobile ? 'w-14 h-14' : 'w-16 h-16'}
                `}
                onClick={() => setRotation(r => r + PER_ITEM_ANGLE)}
            >
                {isMobile ? <ArrowDown size={24} strokeWidth={3} /> : <ArrowLeft size={24} strokeWidth={3} />}
            </Button>
      </div>

      <NewHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={createHabit} 
      />

    </div>
  );
};

export default App;