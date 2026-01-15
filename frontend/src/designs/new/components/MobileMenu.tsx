import React, { useState } from 'react';
import { Menu, X, Plus, Layers, Phone, Key, History, ChevronDown, User } from 'lucide-react';
import Button from './Button';
import { NewDesignHabit } from '../../../state/user';

interface MobileMenuProps {
  userName: string;
  habits: NewDesignHabit[];
  currentHabitIndex: number;
  isOpen: boolean;
  onToggleMenu: (open: boolean) => void;
  onGoToHabit: (index: number) => void;
  onOpenNewHabit: () => void;
  onOpenManageHabits: () => void;
  onOpenSettings: () => void;
  onOpenSyncKey: () => void;
  onToggleDesign: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  userName,
  habits,
  currentHabitIndex,
  isOpen,
  onToggleMenu,
  onGoToHabit,
  onOpenNewHabit,
  onOpenManageHabits,
  onOpenSettings,
  onOpenSyncKey,
  onToggleDesign,
}) => {
  const [isHabitSelectorOpen, setIsHabitSelectorOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    onToggleMenu(false);
  };

  const handleGoToHabit = (index: number) => {
    onGoToHabit(index);
    setIsHabitSelectorOpen(false);
    onToggleMenu(false);
  };

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="icon"
        onClick={() => onToggleMenu(true)}
        className="w-9 h-9"
        title="Menu"
      >
        <Menu size={18} strokeWidth={2.5} />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[4000]"
          onClick={() => onToggleMenu(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`
          fixed top-0 right-0 h-full w-[280px] bg-white z-[4001]
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          shadow-[-4px_0px_24px_rgba(0,0,0,0.15)]
        `}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <User size={18} />
            <span className="font-bold uppercase text-sm">{userName || 'You'}</span>
          </div>
          <button
            onClick={() => onToggleMenu(false)}
            className="p-2 hover:bg-gray-100 transition-colors rounded"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Menu Content */}
        <div className="p-4 flex flex-col gap-3 bg-[#F5F5F5]" style={{ minHeight: 'calc(100% - 65px)' }}>
          {/* New Habit Button */}
          <button
            onClick={() => handleAction(onOpenNewHabit)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-yellow-400 border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Plus size={18} strokeWidth={3} />
            <span>New Habit</span>
          </button>

          {/* Habit Selector */}
          {habits.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsHabitSelectorOpen(!isHabitSelectorOpen)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors justify-between"
              >
                <span className="truncate">
                  {habits[currentHabitIndex]?.emoji && `${habits[currentHabitIndex].emoji} `}
                  {habits[currentHabitIndex]?.title || 'Select Habit'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${isHabitSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              {isHabitSelectorOpen && (
                <div className="mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-48 overflow-y-auto">
                  {habits.map((habit, index) => (
                    <button
                      key={habit.id}
                      onClick={() => handleGoToHabit(index)}
                      className={`
                        w-full px-4 py-2 text-left text-sm font-bold uppercase border-b border-gray-200 last:border-0
                        hover:bg-black hover:text-white transition-colors flex items-center gap-2
                        ${index === currentHabitIndex ? 'bg-black text-white' : ''}
                      `}
                    >
                      {habit.emoji && <span>{habit.emoji}</span>}
                      <span className="truncate">{habit.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t-2 border-black/20 my-2" />

          {/* Menu Items */}
          <button
            onClick={() => handleAction(onOpenManageHabits)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
          >
            <Layers size={18} />
            <span>Manage Habits</span>
          </button>

          <button
            onClick={() => handleAction(onOpenSettings)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
          >
            <Phone size={18} />
            <span>Call Settings</span>
          </button>

          <button
            onClick={() => handleAction(onOpenSyncKey)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
          >
            <Key size={18} />
            <span>Sync Key</span>
          </button>

          <div className="border-t-2 border-black/20 my-2" />

          <button
            onClick={() => handleAction(onToggleDesign)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-black font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
          >
            <History size={18} />
            <span>Classic Design</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
