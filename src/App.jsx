import React, { useState, useEffect } from 'react';
import { Settings, Upload, CheckCircle, Clock } from 'lucide-react';
import SettingsPanel from './components/SettingsPanel.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import Toast from './components/Toast.jsx';

const STEPS = [
  { id: 1, name: 'Configure', icon: Settings },
  { id: 2, name: 'Upload', icon: Upload },
  { id: 3, name: 'Review & Process', icon: CheckCircle },
];

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState({ apiToken: '', baseUrl: '' });
  const [workLogs, setWorkLogs] = useState(null);
  const [timelines, setTimelines] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Load settings from Electron
    if (window.electronAPI) {
      window.electronAPI.getSettings().then(setSettings);
    }
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSettingsSave = async (newSettings) => {
    if (window.electronAPI) {
      const saved = await window.electronAPI.saveSettings(newSettings);
      setSettings(saved);
      showToast('Settings saved successfully', 'success');
    }
  };

  const handleFileProcessed = (logs, generatedTimelines) => {
    setWorkLogs(logs);
    setTimelines(generatedTimelines);
    setCurrentStep(3);
  };

  const handleReset = () => {
    setWorkLogs(null);
    setTimelines([]);
    setCurrentStep(2);
  };

  const canProceed = (step) => {
    if (step === 2) return settings.apiToken && settings.baseUrl;
    if (step === 3) return workLogs !== null;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-semibold">OpenProject Time Logger</h1>
        </div>
      </header>

      {/* Stepper */}
      <nav className="bg-slate-800/50 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-center gap-4">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => canProceed(step.id) && setCurrentStep(step.id)}
                disabled={!canProceed(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : currentStep > step.id
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                } ${canProceed(step.id) ? 'hover:bg-blue-500' : 'cursor-not-allowed opacity-50'}`}
              >
                <step.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{step.name}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-600'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-5xl mx-auto">
        {currentStep === 1 && (
          <SettingsPanel
            settings={settings}
            onSave={handleSettingsSave}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <UploadPanel
            settings={settings}
            onFileProcessed={handleFileProcessed}
            showToast={showToast}
          />
        )}
        {currentStep === 3 && (
          <ReviewPanel
            settings={settings}
            workLogs={workLogs}
            timelines={timelines}
            showToast={showToast}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
