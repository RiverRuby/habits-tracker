import React from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import Button from './Button';
import { NewDesignHabit } from '../../../state/user';
import { useDesign } from '../../../state/design';
import { THEME_STYLES } from '../types';

interface ManageHabitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: NewDesignHabit[];
}

const ManageHabitsModal: React.FC<ManageHabitsModalProps> = ({ isOpen, onClose, habits }) => {
  const { hiddenHabits, toggleHabitHidden } = useDesign();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="text-xl font-black uppercase tracking-tight">Manage Habits</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            Toggle visibility of habits in the carousel. Hidden habits will still track data.
          </p>

          <div className="space-y-2">
            {habits.map(habit => {
              const isHidden = hiddenHabits.includes(habit.id);
              const styles = THEME_STYLES[habit.theme];

              return (
                <div
                  key={habit.id}
                  className={`
                    flex items-center justify-between p-3 border-2 border-black
                    ${isHidden ? 'bg-gray-100 opacity-60' : styles.bg}
                    transition-all
                  `}
                >
                  <div className="flex items-center gap-3">
                    {habit.emoji && <span className="text-xl">{habit.emoji}</span>}
                    <span className={`font-bold uppercase ${isHidden ? 'line-through' : ''}`}>
                      {habit.title}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleHabitHidden(habit.id)}
                    className={`
                      p-2 border-2 border-black transition-all
                      ${isHidden
                        ? 'bg-gray-300 hover:bg-gray-400'
                        : 'bg-white hover:bg-gray-100'}
                    `}
                    title={isHidden ? 'Show habit' : 'Hide habit'}
                  >
                    {isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              );
            })}
          </div>

          {habits.length === 0 && (
            <p className="text-center text-gray-500 py-8">No habits to manage</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageHabitsModal;
