import React from 'react';
import { Settings, Upload, CheckCircle, Clock } from 'lucide-react';
import SettingsPanel from './components/SettingsPanel.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import Toast from './components/Toast.jsx';
import { useAppInitialization } from './hooks';
import { useSettings } from './hooks';

const STEPS = [
    { id: 1, name: 'Configure', icon: Settings },
    { id: 2, name: 'Upload', icon: Upload },
    { id: 3, name: 'Review & Process', icon: CheckCircle }
];

function App() {
    const { currentStep, setCurrentStep, workLogs, timelines, toast, showToast, canProceed, handleFileProcessed, handleReset } = useAppInitialization();

    const settingsHook = useSettings(showToast);

    const canProceedToStep = step => {
        if (step === 2) return settingsHook.formData.apiToken && settingsHook.formData.baseUrl;
        if (step === 3) return workLogs !== null;
        return true;
    };

    return (
        <div className='min-h-screen bg-background text-foreground'>
            {/* Header */}
            <header className='border-b border-border bg-background px-6 py-4'>
                <div className='flex items-center gap-3'>
                    <Clock className='w-6 h-6 text-primary' />
                    <h1 className='text-2xl font-bold'>OpenProject Time Logger</h1>
                </div>
            </header>

            {/* Stepper */}
            <nav className='bg-background px-6 py-4 border-b border-border'>
                <div className='flex items-center justify-center gap-2 flex-wrap'>
                    {STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <button onClick={() => canProceedToStep(step.id) && setCurrentStep(step.id)} disabled={!canProceedToStep(step.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${currentStep === step.id ? 'bg-primary text-primary-foreground shadow-sm' : currentStep > step.id ? 'bg-secondary text-secondary-foreground border border-border' : 'bg-background text-muted-foreground border border-border'} ${canProceedToStep(step.id) ? 'hover:bg-primary/90 hover:text-primary-foreground hover:shadow-md' : 'cursor-not-allowed opacity-50'}`}>
                                <step.icon className='w-4 h-4 flex-shrink-0' />
                                <span className='hidden sm:inline'>{step.name}</span>
                            </button>
                            {index < STEPS.length - 1 && <div className={`w-8 h-px hidden sm:block ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className='p-6 max-w-6xl mx-auto'>
                {currentStep === 1 && <SettingsPanel formData={settingsHook.formData} errors={settingsHook.errors} testStatus={settingsHook.testStatus} testing={settingsHook.testing} onFieldChange={settingsHook.handleChange} onTest={settingsHook.testConnection} onSave={settingsHook.saveSettings} onNext={() => setCurrentStep(2)} />}
                {currentStep === 2 && <UploadPanel settings={settingsHook.formData} onFileProcessed={handleFileProcessed} showToast={showToast} />}
                {currentStep === 3 && <ReviewPanel settings={settingsHook.formData} workLogs={workLogs} timelines={timelines} showToast={showToast} onReset={handleReset} />}
            </main>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}

export default App;
