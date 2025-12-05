import React, { useState } from 'react';
import { Save, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

// Ensure window.electronAPI exists in dev mode
if (!window.electronAPI) {
  window.electronAPI = {
    getSettings: () => Promise.resolve({ apiToken: '', baseUrl: 'https://openproject.example.com' }),
    saveSettings: (s) => Promise.resolve(s),
    apiRequest: () => Promise.resolve({ success: false, error: 'API not available' }),
  };
}

function SettingsPanel({ settings, onSave, onNext }) {
  const [formData, setFormData] = useState({
    apiToken: settings.apiToken || '',
    baseUrl: settings.baseUrl || 'https://openproject.example.com',
  });
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setTestStatus(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus(null);

    try {
      if (window.electronAPI) {
        // Save first, then test
        await window.electronAPI.saveSettings(formData);

        const result = await window.electronAPI.apiRequest({
          method: 'GET',
          endpoint: '/users/me',
        });

        if (result.success) {
          setTestStatus({ success: true, user: result.data.name });
        } else {
          setTestStatus({ success: false, error: result.error });
        }
      }
    } catch (err) {
      setTestStatus({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const isValid = formData.apiToken.trim() && formData.baseUrl.trim();

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <ExternalLink className="w-6 h-6 text-blue-400" />
        OpenProject Configuration
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Server URL
          </label>
          <input
            type="url"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            placeholder="https://openproject.example.com"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            API Token
          </label>
          <input
            type="password"
            name="apiToken"
            value={formData.apiToken}
            onChange={handleChange}
            placeholder="Enter your OpenProject API token"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-slate-400">
            Get your token from OpenProject → My Account → Access Tokens
          </p>
        </div>

        {/* Test Connection Status */}
        {testStatus && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
              testStatus.success
                ? 'bg-green-900/30 border border-green-700'
                : 'bg-red-900/30 border border-red-700'
            }`}
          >
            {testStatus.success ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">
                  Connected as: <strong>{testStatus.user}</strong>
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">{testStatus.error}</span>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={handleTest}
            disabled={!isValid || testing}
            className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>

          {testStatus?.success && (
            <button
              onClick={onNext}
              className="ml-auto flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            >
              Continue to Upload →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
