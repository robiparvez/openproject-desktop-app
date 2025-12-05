import { useState, useCallback } from 'react';

// Stub parser functions for browser context
const parseWorkLogContent = jsonText => {
    try {
        const data = JSON.parse(jsonText);
        if (!data.logs || !Array.isArray(data.logs)) {
            throw new Error('JSON must have a "logs" array');
        }
        return {
            logs: data.logs,
            errors: [],
            isValid: true,
            crossDateDuplicates: []
        };
    } catch (e) {
        return {
            logs: [],
            errors: [e.message],
            isValid: false
        };
    }
};

const aggregateCrossDateDuplicates = () => [];

const generateTimelineForDate = (log, startHour) => ({
    date: log.date,
    isoDate: log.date,
    entries: log.entries || [],
    totalHours: (log.entries || []).reduce((s, e) => s + (e.duration_hours || 0), 0)
});

/**
 * Hook to manage file upload, parsing, and validation
 * Extracts logic from UploadPanel component
 */
export function useFileUpload(onFileProcessed, showToast) {
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const [startTimes, setStartTimes] = useState({});

    const handleFile = useCallback(
        async file => {
            if (!file.name.endsWith('.json')) {
                showToast('Please upload a JSON file', 'error');
                return;
            }

            setProcessing(true);
            setParseResult(null);

            try {
                const text = await file.text();
                const result = parseWorkLogContent(text);

                // Initialize start times for each date (default 11:00 AM)
                const defaultStartTimes = {};
                result.logs.forEach(log => {
                    defaultStartTimes[log.date] = 11;
                });
                setStartTimes(defaultStartTimes);

                // Check for cross-date duplicates (informational)
                const crossDateDuplicates = aggregateCrossDateDuplicates(result.logs);

                setParseResult({
                    ...result,
                    crossDateDuplicates
                });

                if (result.isValid) {
                    showToast(`Successfully parsed ${result.logs.length} date(s)`, 'success');
                } else {
                    showToast(`Found ${result.errors.length} validation error(s)`, 'error');
                }
            } catch (err) {
                showToast(`Parse error: ${err.message}`, 'error');
                setParseResult({ isValid: false, errors: [err.message], logs: [] });
            } finally {
                setProcessing(false);
            }
        },
        [showToast]
    );

    const handleDrop = useCallback(
        e => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleFileInput = e => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const handleStartTimeChange = (date, value) => {
        setStartTimes(prev => ({ ...prev, [date]: parseInt(value, 10) }));
    };

    const handleProceed = () => {
        if (!parseResult?.isValid) return;

        // Generate timelines with confirmed start times
        const timelines = parseResult.logs.map(log => generateTimelineForDate(log, startTimes[log.date] || 11));

        onFileProcessed(parseResult.logs, timelines);
    };

    const totalEntries = parseResult?.logs?.reduce((sum, log) => sum + log.entries.length, 0) || 0;
    const totalHours = parseResult?.logs?.reduce((sum, log) => sum + log.entries.reduce((s, e) => s + e.duration_hours, 0), 0) || 0;

    return {
        dragOver,
        setDragOver,
        processing,
        parseResult,
        startTimes,
        totalEntries,
        totalHours,
        handleDrop,
        handleFileInput,
        handleStartTimeChange,
        handleProceed
    };
}
