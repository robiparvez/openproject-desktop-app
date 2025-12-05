import React, { useState, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Stub parser functions for browser context
const parseWorkLogContent = (jsonText) => {
  try {
    const data = JSON.parse(jsonText);
    if (!data.logs || !Array.isArray(data.logs)) {
      throw new Error('JSON must have a "logs" array');
    }
    return {
      logs: data.logs,
      errors: [],
      isValid: true,
      crossDateDuplicates: [],
    };
  } catch (e) {
    return {
      logs: [],
      errors: [e.message],
      isValid: false,
    };
  }
};

const aggregateCrossDateDuplicates = () => [];
const generateTimelineForDate = (log, startHour) => ({
  date: log.date,
  isoDate: log.date,
  entries: log.entries || [],
  totalHours: (log.entries || []).reduce((s, e) => s + (e.duration_hours || 0), 0),
});

function UploadPanel({ settings, onFileProcessed, showToast }) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [startTimes, setStartTimes] = useState({});

  const handleFile = useCallback(async (file) => {
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
        crossDateDuplicates,
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
  }, [showToast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleStartTimeChange = (date, value) => {
    setStartTimes(prev => ({ ...prev, [date]: parseInt(value, 10) }));
  };

  const handleProceed = () => {
    if (!parseResult?.isValid) return;

    // Generate timelines with confirmed start times
    const timelines = parseResult.logs.map(log =>
      generateTimelineForDate(log, startTimes[log.date] || 11)
    );

    onFileProcessed(parseResult.logs, timelines);
  };

  const totalEntries = parseResult?.logs?.reduce((sum, log) => sum + log.entries.length, 0) || 0;
  const totalHours = parseResult?.logs?.reduce(
    (sum, log) => sum + log.entries.reduce((s, e) => s + e.duration_hours, 0), 0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-900/20'
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
        }`}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className={`w-16 h-16 mx-auto mb-4 ${dragOver ? 'text-blue-400' : 'text-slate-500'}`} />
          <p className="text-lg text-slate-300">
            Drag and drop your JSON file here, or <span className="text-blue-400 underline">browse</span>
          </p>
          <p className="text-sm text-slate-500 mt-2">Supports work log JSON format</p>
        </label>
      </div>

      {processing && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-300">Processing file...</p>
        </div>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="bg-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            {parseResult.isValid ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold text-green-400">Validation Passed</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold text-red-400">Validation Failed</h3>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{parseResult.logs.length}</p>
              <p className="text-sm text-slate-400">Date(s)</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{totalEntries}</p>
              <p className="text-sm text-slate-400">Entries</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{totalHours}h</p>
              <p className="text-sm text-slate-400">Total Hours</p>
            </div>
          </div>

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h4 className="font-medium text-red-400 mb-2">Errors:</h4>
              <ul className="space-y-1 text-sm text-red-300">
                {parseResult.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cross-date duplicates (informational) */}
          {parseResult.crossDateDuplicates?.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <h4 className="font-medium text-yellow-400 mb-2">Same-subject tasks across dates:</h4>
              <ul className="space-y-2 text-sm text-yellow-300">
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
            <div className="space-y-4">
              <h4 className="font-medium text-slate-300 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Set Start Times for Each Date
              </h4>
              <div className="grid gap-3">
                {parseResult.logs.map(log => (
                  <div key={log.date} className="flex items-center gap-4 bg-slate-700/50 rounded-lg p-3">
                    <span className="font-medium text-blue-300 min-w-[120px]">{log.date}</span>
                    <select
                      value={startTimes[log.date] || 11}
                      onChange={(e) => handleStartTimeChange(log.date, e.target.value)}
                      className="bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                        <option key={hour} value={hour}>
                          {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 text-sm">
                      {log.entries.length} entries, {log.entries.reduce((s, e) => s + e.duration_hours, 0)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proceed Button */}
          {parseResult.isValid && (
            <button
              onClick={handleProceed}
              className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-lg transition-colors"
            >
              Proceed to Review →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadPanel;
