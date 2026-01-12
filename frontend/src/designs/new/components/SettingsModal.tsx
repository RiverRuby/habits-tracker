import React, { useState, useEffect } from 'react';
import { X, Phone, Clock, Globe } from 'lucide-react';
import Button from './Button';
import { api } from '../../../utils/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  phone: string | null;
  callEnabled: boolean;
  callTime: string | null;
  timezone: string | null;
}

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>({
    phone: null,
    callEnabled: false,
    callTime: null,
    timezone: 'America/Los_Angeles',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingCall, setTestingCall] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/user/settings');
      if (data) {
        setSettings({
          phone: data.phone || '',
          callEnabled: data.callEnabled || false,
          callTime: data.callTime || '09:00',
          timezone: data.timezone || 'America/Los_Angeles',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.post('/user/settings', settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const testCall = async () => {
    try {
      setTestingCall(true);
      const result = await api.post('/calls/initiate', {});
      if (result?.success) {
        alert('Call initiated! You should receive a call shortly.');
      } else {
        alert(`Failed to initiate call: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error initiating test call:', error);
      alert('Failed to initiate call. Make sure Telnyx is configured.');
    } finally {
      setTestingCall(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[5000] p-4">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-4 border-black">
          <h2 className="text-xl font-black">SETTINGS</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              {/* Daily Call Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b-2 border-black pb-2">
                  DAILY CHECK-IN CALLS
                </h3>

                {/* Enable Calls */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.callEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, callEnabled: e.target.checked })
                    }
                    className="w-5 h-5 border-2 border-black accent-black"
                  />
                  <span className="font-medium">Enable daily habit check-in calls</span>
                </label>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Phone size={16} />
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    placeholder="+1234567890"
                    className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={!settings.callEnabled}
                  />
                  <p className="text-xs text-gray-500">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                {/* Call Time */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Clock size={16} />
                    DAILY CALL TIME
                  </label>
                  <input
                    type="time"
                    value={settings.callTime || '09:00'}
                    onChange={(e) =>
                      setSettings({ ...settings, callTime: e.target.value })
                    }
                    className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={!settings.callEnabled}
                  />
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-medium text-sm">
                    <Globe size={16} />
                    TIMEZONE
                  </label>
                  <select
                    value={settings.timezone || 'America/Los_Angeles'}
                    onChange={(e) =>
                      setSettings({ ...settings, timezone: e.target.value })
                    }
                    className="w-full p-3 border-2 border-black font-medium focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    disabled={!settings.callEnabled}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Call Button */}
                {settings.callEnabled && settings.phone && (
                  <Button
                    onClick={testCall}
                    variant="secondary"
                    className="w-full"
                    disabled={testingCall}
                  >
                    {testingCall ? 'Calling...' : 'Test Call Now'}
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="bg-gray-100 border-2 border-black p-4 text-sm">
                <p className="font-bold mb-2">HOW IT WORKS</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>You'll receive a daily call at your scheduled time</li>
                  <li>The call will ask about your habit progress</li>
                  <li>You can mark habits complete via voice</li>
                  <li>Powered by Eleven Labs voice AI</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t-4 border-black">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            variant="primary"
            className="flex-1"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
