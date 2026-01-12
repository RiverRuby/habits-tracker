import React, { useState } from 'react';
import { ThemeColor, THEME_STYLES } from '../types';
import Button from './Button';
import { X, Sparkles } from 'lucide-react';
import { suggestHabitTitle } from '../services/geminiService';

interface NewHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, theme: ThemeColor) => void;
}

const NewHabitModal: React.FC<NewHabitModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>(ThemeColor.BLUE);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title, selectedTheme);
    setTitle('');
    onClose();
  };

  const handleMagic = async () => {
      setIsGenerating(true);
      const newTitle = await suggestHabitTitle("productive and disciplined");
      setTitle(newTitle);
      setIsGenerating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-100 p-1 border border-transparent hover:border-black transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-black uppercase mb-6 tracking-tighter">Create New Habit</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase mb-2 tracking-wider text-gray-500">
              Habit Title
            </label>
            <div className="flex gap-2">
                <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DRINK WATER"
                className="w-full border-2 border-black p-3 font-bold text-lg focus:outline-none focus:bg-yellow-50 placeholder:text-gray-300 uppercase"
                maxLength={20}
                autoFocus
                />
                <button 
                    type="button" 
                    onClick={handleMagic}
                    disabled={isGenerating}
                    className="border-2 border-black p-3 bg-purple-100 hover:bg-purple-200 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                    title="Auto-generate with AI"
                >
                    <Sparkles size={24} className={isGenerating ? "animate-spin" : ""} />
                </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-2 tracking-wider text-gray-500">
              Select Theme
            </label>
            <div className="flex gap-4">
              {Object.values(ThemeColor).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  className={`w-12 h-12 border-2 border-black transition-transform ${
                    THEME_STYLES[theme].bg
                  } ${selectedTheme === theme ? 'scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewHabitModal;