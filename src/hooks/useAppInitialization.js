import { useState, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * Main app initialization and orchestration hook
 * Manages workflow state and coordinates between steps
 */
export function useAppInitialization() {
    const [currentStep, setCurrentStep] = useState(1);
    const [workLogs, setWorkLogs] = useState(null);
    const [timelines, setTimelines] = useState([]);

    const { toast, showToast, hideToast } = useToast();

    const handleFileProcessed = useCallback((logs, generatedTimelines) => {
        setWorkLogs(logs);
        setTimelines(generatedTimelines);
        setCurrentStep(3);
    }, []);

    const handleReset = useCallback(() => {
        setWorkLogs(null);
        setTimelines([]);
        setCurrentStep(2);
    }, []);

    return {
        currentStep,
        setCurrentStep,
        workLogs,
        timelines,
        toast,
        showToast,
        hideToast,
        handleFileProcessed,
        handleReset
    };
}
