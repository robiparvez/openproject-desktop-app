import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';

// Comprehensive validation logic from chrome extension
const validateJsonStructure = data => {
    const errors = [];

    if (!data || typeof data !== 'object') {
        errors.push('Invalid JSON: must be an object');
        return errors;
    }

    if (!data.logs || !Array.isArray(data.logs)) {
        errors.push('JSON must contain a "logs" array');
        return errors;
    }

    if (data.logs.length === 0) {
        errors.push('No log entries found in "logs" array');
        return errors;
    }

    // Validate each log entry
    data.logs.forEach((log, logIdx) => {
        if (!log.date) {
            errors.push(`Log entry ${logIdx + 1}: Missing required "date" field`);
            return;
        }

        // Validate date format (month-day-year)
        const dateRegex = /^[a-z]{3,}-\d{1,2}-\d{4}$/i;
        if (!dateRegex.test(log.date)) {
            errors.push(`Log entry ${logIdx + 1}: Invalid date format "${log.date}". Use format: "nov-23-2025"`);
        }

        if (!Array.isArray(log.entries)) {
            errors.push(`Log entry ${logIdx + 1}: Missing "entries" array`);
            return;
        }

        if (log.entries.length === 0) {
            errors.push(`Log entry ${logIdx + 1} (${log.date}): No entries found`);
            return;
        }

        // Validate each work entry
        log.entries.forEach((entry, entryIdx) => {
            const errors_local = [];

            if (!entry.project) errors_local.push('project');
            if (!entry.subject) errors_local.push('subject');
            if (entry.duration_hours === undefined || entry.duration_hours === null) errors_local.push('duration_hours');
            if (!entry.activity) errors_local.push('activity');
            if (entry.is_scrum === undefined || entry.is_scrum === null) errors_local.push('is_scrum');

            if (errors_local.length > 0) {
                errors.push(`Log entry ${logIdx + 1}, entry ${entryIdx + 1}: Missing fields: ${errors_local.join(', ')}`);
            }

            if (typeof entry.duration_hours === 'number' && entry.duration_hours <= 0) {
                errors.push(`Log entry ${logIdx + 1}, entry ${entryIdx + 1}: duration_hours must be positive`);
            }

            if (entry.break_hours !== null && entry.break_hours !== undefined && typeof entry.break_hours === 'number' && entry.break_hours < 0) {
                errors.push(`Log entry ${logIdx + 1}, entry ${entryIdx + 1}: break_hours cannot be negative`);
            }
        });
    });

    return errors;
};

// Check for same-date duplicates (blocking)
const checkSameDateDuplicates = logs => {
    const errors = [];

    logs.forEach((log, logIdx) => {
        const subjects = new Set();
        const duplicateSubjects = new Set();

        log.entries?.forEach(entry => {
            const subject = entry.subject?.toLowerCase().trim();
            if (subjects.has(subject)) {
                duplicateSubjects.add(entry.subject);
            }
            subjects.add(subject);
        });

        if (duplicateSubjects.size > 0) {
            duplicateSubjects.forEach(subject => {
                errors.push(`Date ${log.date}: Duplicate subject "${subject}" found in same date (not allowed)`);
            });
        }
    });

    return errors;
};

// Aggregate same-subject entries across different dates (informational)
const aggregateCrossDateDuplicates = logs => {
    const subjectMap = new Map();

    logs.forEach(log => {
        log.entries?.forEach(entry => {
            const key = `${entry.project}_${entry.subject}`.toLowerCase();
            if (!subjectMap.has(key)) {
                subjectMap.set(key, {
                    subject: entry.subject,
                    project: entry.project,
                    dates: [],
                    totalHours: 0
                });
            }

            const data = subjectMap.get(key);
            if (!data.dates.includes(log.date)) {
                data.dates.push(log.date);
            }
            data.totalHours += entry.duration_hours;
        });
    });

    return Array.from(subjectMap.values()).filter(item => item.dates.length > 1);
};

function UploadPanel({ settings, onFileProcessed, showToast }) {
    const [dragOver, setDragOver] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [parseResult, setParseResult] = useState(null);
    const [startTimes, setStartTimes] = useState({});

    const parseWorkLogContent = jsonText => {
        try {
            const data = JSON.parse(jsonText);

            // Comprehensive validation from chrome extension
            const structureErrors = validateJsonStructure(data);
            if (structureErrors.length > 0) {
                return {
                    logs: [],
                    errors: structureErrors,
                    isValid: false,
                    crossDateDuplicates: []
                };
            }

            // Check for same-date duplicates (blocking)
            const sameDateErrors = checkSameDateDuplicates(data.logs);
            if (sameDateErrors.length > 0) {
                return {
                    logs: [],
                    errors: sameDateErrors,
                    isValid: false,
                    crossDateDuplicates: []
                };
            }

            // Check for cross-date duplicates (informational)
            const crossDateDuplicates = aggregateCrossDateDuplicates(data.logs);

            return {
                logs: data.logs,
                errors: [],
                isValid: true,
                crossDateDuplicates
            };
        } catch (e) {
            return {
                logs: [],
                errors: [e.message],
                isValid: false,
                crossDateDuplicates: []
            };
        }
    };

    const generateTimelineForDate = (log, startHour) => ({
        date: log.date,
        isoDate: log.date,
        entries: log.entries || [],
        totalHours: (log.entries || []).reduce((s, e) => s + (e.duration_hours || 0), 0)
    });

    const downloadSampleJSON = useCallback(() => {
        // Create a sample work log JSON
        const sampleData = {
            logs: [
                {
                    date: 'nov-23-2025',
                    entries: [
                        {
                            project: 'BD-TICKET',
                            subject: 'Requirement analysis for Campaign Management',
                            break_hours: null,
                            duration_hours: 2,
                            activity: 'Development',
                            is_scrum: false,
                            work_package_id: null
                        },
                        {
                            project: 'BD-TICKET',
                            subject: 'API integration for notifications',
                            break_hours: 0.5,
                            duration_hours: 3,
                            activity: 'Development',
                            is_scrum: false,
                            work_package_id: null
                        }
                    ]
                },
                {
                    date: 'nov-24-2025',
                    entries: [
                        {
                            project: 'IDCOL',
                            subject: 'Leave module bug fixes',
                            break_hours: null,
                            duration_hours: 4,
                            activity: 'Support',
                            is_scrum: false,
                            work_package_id: null
                        },
                        {
                            project: 'IDCOL',
                            subject: 'KPI dashboard improvements',
                            break_hours: 0.25,
                            duration_hours: 2.5,
                            activity: 'Development',
                            is_scrum: false,
                            work_package_id: null
                        }
                    ]
                }
            ]
        };

        // Create blob and download
        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample.json';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Sample JSON downloaded successfully', 'success');
    }, [showToast]);

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

    return (
        <div className='space-y-6'>
            {/* Drop Zone */}
            <div
                onDragOver={e => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${dragOver ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50 hover:bg-secondary/50'}`}>
                <input type='file' accept='.json' onChange={handleFileInput} className='hidden' id='file-input' />
                <label htmlFor='file-input' className='cursor-pointer'>
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className='text-lg text-foreground'>
                        Drag and drop your file here, or <span className='text-primary underline'>browse</span>
                    </p>
                    <p className='text-sm text-muted-foreground mt-2'>Supports JSON Only</p>
                </label>
            </div>

            {/* Sample JSON Button */}
            <div className='flex justify-center'>
                <button onClick={downloadSampleJSON} className='flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all font-medium text-sm shadow-sm border border-primary hover:shadow-md'>
                    <Download className='w-4 h-4' />
                    Sample
                </button>
            </div>

            {processing && (
                <div className='bg-card border border-border rounded-lg p-6 text-center'>
                    <div className='animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4' />
                    <p className='text-foreground'>Processing file...</p>
                </div>
            )}

            {/* Parse Results */}
            {parseResult && (
                <div className='bg-card border border-border rounded-lg p-6 space-y-6'>
                    <div className='flex items-center gap-3'>
                        {parseResult.isValid ? (
                            <>
                                <CheckCircle className='w-6 h-6 text-green-600' />
                                <h3 className='text-xl font-semibold text-foreground'>Validation Passed</h3>
                            </>
                        ) : (
                            <>
                                <AlertCircle className='w-6 h-6 text-destructive' />
                                <h3 className='text-xl font-semibold text-destructive'>Validation Failed</h3>
                            </>
                        )}
                    </div>

                    {/* Summary */}
                    <div className='grid grid-cols-3 gap-4'>
                        <div className='bg-secondary rounded-lg p-4 text-center border border-border'>
                            <p className='text-2xl font-bold text-primary'>{parseResult.logs.length}</p>
                            <p className='text-sm text-muted-foreground'>Date(s)</p>
                        </div>
                        <div className='bg-secondary rounded-lg p-4 text-center border border-border'>
                            <p className='text-2xl font-bold text-green-600'>{totalEntries}</p>
                            <p className='text-sm text-muted-foreground'>Entries</p>
                        </div>
                        <div className='bg-secondary rounded-lg p-4 text-center border border-border'>
                            <p className='text-2xl font-bold text-purple-600'>{totalHours}h</p>
                            <p className='text-sm text-muted-foreground'>Total Hours</p>
                        </div>
                    </div>

                    {/* Errors */}
                    {parseResult.errors.length > 0 && (
                        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                            <h4 className='font-medium text-red-800 mb-2'>Errors:</h4>
                            <ul className='space-y-1 text-sm text-red-700'>
                                {parseResult.errors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Cross-date duplicates (informational) */}
                    {parseResult.crossDateDuplicates?.length > 0 && (
                        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
                            <h4 className='font-medium text-orange-800 mb-2'>Same-subject tasks across dates:</h4>
                            <ul className='space-y-2 text-sm text-orange-700'>
                                {parseResult.crossDateDuplicates.map((dup, i) => (
                                    <li key={i}>
                                        <strong>{dup.subject}</strong> ({dup.project}): {dup.totalHours}h total across {dup.dates.length} dates
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Start Time Pickers */}
                    {parseResult.isValid && (
                        <div className='space-y-4'>
                            <h4 className='font-medium text-foreground flex items-center gap-2'>
                                <Clock className='w-5 h-5 text-primary' />
                                Set Start Times for Each Date
                            </h4>
                            <div className='grid gap-3'>
                                {parseResult.logs.map(log => (
                                    <div key={log.date} className='flex items-center gap-4 bg-secondary rounded-lg p-3 border border-border'>
                                        <span className='font-medium text-primary min-w-[120px]'>{log.date}</span>
                                        <select value={startTimes[log.date] || 11} onChange={e => handleStartTimeChange(log.date, e.target.value)} className='bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'>
                                            {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                                                <option key={hour} value={hour}>
                                                    {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                                                </option>
                                            ))}
                                        </select>
                                        <span className='text-muted-foreground text-sm'>
                                            {log.entries.length} entries, {log.entries.reduce((s, e) => s + e.duration_hours, 0)}h
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Proceed Button */}
                    {parseResult.isValid && (
                        <button onClick={handleProceed} className='w-full py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-lg transition-all shadow-sm'>
                            Proceed to Review →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default UploadPanel;
