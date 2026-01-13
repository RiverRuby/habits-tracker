import React, { useState, useEffect } from 'react';
import { X, Pencil, Save, MessageSquare, Palette } from 'lucide-react';
import Button from './Button';
import { api } from '../../../utils/api';
import { NewDesignHabit, ThemeColor } from '../../../state/user';
import { THEME_STYLES } from '../types';

interface HabitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: NewDesignHabit | null;
  onUpdate?: () => void;
}

// Available theme colors
const THEME_OPTIONS: { value: ThemeColor; label: string }[] = [
  { value: 'ORANGE', label: 'Orange' },
  { value: 'BLUE', label: 'Blue' },
  { value: 'GREEN', label: 'Green' },
  { value: 'YELLOW', label: 'Yellow' },
];

// Common emoji options for quick selection
const EMOJI_OPTIONS = [
  '🏃', '💪', '🧘', '📚', '✍️', '💧', '😴', '🥗',
  '💊', '🧹', '🎵', '💻', '🌱', '🏋️', '🚴', '🧠',
];

const HabitDetailsModal: React.FC<HabitDetailsModalProps> = ({
  isOpen,
  onClose,
  habit,
  onUpdate
}) => {
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [theme, setTheme] = useState<ThemeColor>('ORANGE');
  const [saving, setSaving] = useState(false);
  const [todayNotes, setTodayNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Get today's date in ISO format
  const getTodayISO = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen && habit) {
      setDescription(habit.description || '');
      setEmoji(habit.emoji || '');
      setTheme(habit.theme || 'ORANGE');
      // Load today's notes if available
      const todayStr = getTodayISO();
      const completion = habit.completionDetails?.find(c => {
        // Convert DB format to ISO for comparison
        const parsed = new Date(c.day);
        return parsed.toISOString().split('T')[0] === todayStr;
      });
      setTodayNotes(completion?.notes || '');
    }
  }, [isOpen, habit]);

  const saveDetails = async () => {
    if (!habit) return;

    try {
      setSaving(true);

      // Save details (emoji, description)
      await api.post('/habits/update-details', {
        id: habit.id,
        description: description || null,
        emoji: emoji || null,
      });

      // Save theme if changed
      if (theme !== habit.theme) {
        await api.post('/habits/update-theme', {
          id: habit.id,
          theme: theme,
        });
      }

      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error saving habit details:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!habit) return;

    try {
      setSavingNotes(true);
      // Convert today to DB format: "DD MMM YYYY"
      const today = new Date();
      const dbFormat = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      await api.post('/habits/add-notes', {
        habitId: habit.id,
        day: dbFormat,
        notes: todayNotes || null,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen || !habit) return null;

  const todayStr = getTodayISO();
  const isCompletedToday = habit.history[todayStr];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[5000] p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-4 border-black">
          <h2 className="text-xl font-black uppercase">{habit.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Color Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-sm uppercase">
              <Palette size={14} />
              COLOR
            </label>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((option) => {
                const styles = THEME_STYLES[option.value];
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
                      flex-1 h-12 border-2 transition-all flex items-center justify-center font-bold text-xs uppercase
                      ${styles.bg}
                      ${theme === option.value
                        ? 'border-black ring-2 ring-black ring-offset-2 scale-105'
                        : 'border-black/30 hover:border-black'}
                    `}
                    title={option.label}
                  >
                    {theme === option.value && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emoji Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-sm uppercase">
              EMOJI
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`
                    w-10 h-10 text-xl flex items-center justify-center border-2 transition-all
                    ${emoji === e
                      ? 'border-black bg-black/10 scale-110'
                      : 'border-gray-300 hover:border-black'}
                  `}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="Or type custom emoji..."
              maxLength={4}
              className="w-full p-2 border-2 border-black font-medium text-center text-2xl focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold text-sm uppercase">
              <Pencil size={14} />
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this habit..."
              rows={3}
              className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {/* Today's Notes (only if completed today) */}
          {isCompletedToday && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold text-sm uppercase">
                <MessageSquare size={14} />
                TODAY'S NOTES
              </label>
              <textarea
                value={todayNotes}
                onChange={(e) => setTodayNotes(e.target.value)}
                placeholder="How did it go today?"
                rows={3}
                className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black resize-none"
              />
              <Button
                onClick={saveNotes}
                variant="secondary"
                className="w-full"
                disabled={savingNotes}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          )}

          {!isCompletedToday && (
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
              Complete this habit today to add notes
            </div>
          )}

          {/* Stats */}
          <div className="bg-gray-100 border-2 border-black p-4">
            <p className="font-bold text-sm uppercase mb-2">STATS</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="opacity-60">Current Streak:</span>
                <span className="font-bold ml-2">{habit.streak} days</span>
              </div>
              <div>
                <span className="opacity-60">Total Days:</span>
                <span className="font-bold ml-2">{Object.keys(habit.history).filter(k => habit.history[k]).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t-4 border-black">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={saveDetails}
            variant="primary"
            className="flex-1"
            disabled={saving}
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailsModal;
