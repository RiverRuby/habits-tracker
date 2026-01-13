import React, { useState, useEffect } from 'react';
import { X, Copy, Check, RefreshCw, User } from 'lucide-react';
import Button from './Button';

interface SyncKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNewUser?: boolean;
}

const SyncKeyModal: React.FC<SyncKeyModalProps> = ({ isOpen, onClose, isNewUser = false }) => {
  const [syncKey, setSyncKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('ID') || '';
      const storedName = localStorage.getItem('userName') || '';
      setSyncKey(storedKey);
      setInputKey(storedKey);
      setName(storedName);
      setIsEditing(!storedKey || isNewUser);
    }
  }, [isOpen, isNewUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (inputKey.trim()) {
      localStorage.setItem('ID', inputKey.trim());
      if (name.trim()) {
        localStorage.setItem('userName', name.trim());
      }
      setSyncKey(inputKey.trim());
      setIsEditing(false);
      // Reload to fetch data with new key
      window.location.reload();
    }
  };

  const handleSaveName = () => {
    if (name.trim()) {
      localStorage.setItem('userName', name.trim());
      // Trigger a re-render by dispatching a storage event
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleGenerateNew = () => {
    const newKey = crypto.randomUUID();
    setInputKey(newKey);
  };

  if (!isOpen) return null;

  const isNewUserSetup = !syncKey || isNewUser;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isNewUserSetup ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-black">
          <h2 className="text-xl font-black uppercase tracking-tight">
            {isNewUserSetup ? 'Welcome!' : 'Settings'}
          </h2>
          {!isNewUserSetup && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={24} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isNewUserSetup && (
            <p className="text-sm text-gray-600">
              Set up your habit tracker. Enter your name and create or enter a sync key to get started.
            </p>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold uppercase">
              <User size={14} />
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              placeholder="Enter your name"
              className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Sync Key Section */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase">Sync Key</label>
            <p className="text-xs text-gray-500">
              Your sync key connects your habits across devices. Keep it safe!
            </p>

            {!isEditing && syncKey ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={syncKey}
                    readOnly
                    className="flex-1 p-3 border-2 border-black font-mono text-sm bg-gray-50"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-3 border-2 border-black hover:bg-gray-100 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Change Sync Key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter or generate a sync key"
                    className="flex-1 p-3 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={handleGenerateNew}
                    className="p-3 border-2 border-black hover:bg-gray-100 transition-colors"
                    title="Generate new key"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="flex-1"
                    disabled={!inputKey.trim()}
                  >
                    {isNewUserSetup ? 'Get Started' : 'Save & Sync'}
                  </Button>
                  {syncKey && !isNewUserSetup && (
                    <Button
                      onClick={() => {
                        setInputKey(syncKey);
                        setIsEditing(false);
                      }}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isNewUserSetup && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                To sync on another device, enter the same key there. Your habits will automatically sync across all devices using this key.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncKeyModal;
