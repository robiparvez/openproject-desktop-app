import React, { useState } from 'react';
import { Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

const processWorkLog = async () => ({ success: [], failed: [] });

function ReviewPanel({ settings, workLogs, timelines, showToast, onReset }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);

  const handleProcess = async () => {
    setProcessing(true);
    setProgress({ current: 0, total: 0, status: 'starting' });
    setResults(null);

    try {
      // Stub: would integrate with main process to process logs
      setResults({ success: [], failed: [] });
      showToast('Processing not yet implemented in dev mode', 'info');
    } catch (err) {
      showToast(`Processing error: ${err.message}`, 'error');
    } finally {
      setProcessing(false);
      setProgress(null);
    }
  };  const totalEntries = timelines.reduce((sum, t) => sum + t.entries.length, 0);
  const totalHours = timelines.reduce((sum, t) => sum + t.totalHours, 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Review Work Logs</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{timelines.length}</p>
            <p className="text-sm text-slate-400">Dates</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{totalEntries}</p>
            <p className="text-sm text-slate-400">Entries</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalHours}h</p>
            <p className="text-sm text-slate-400">Total Hours</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {new Set(timelines.flatMap(t => t.entries.map(e => e.project))).size}
            </p>
            <p className="text-sm text-slate-400">Projects</p>
          </div>
        </div>
      </div>

      {/* Timelines */}
      <div className="space-y-4">
        {timelines.map(timeline => (
          <div key={timeline.date} className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-700 px-6 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{timeline.date}</h3>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                {timeline.totalHours}h
              </span>
            </div>
            <div className="p-4 space-y-3">
              {timeline.entries.map((entry, idx) => (
                <div key={idx} className="bg-slate-700/50 rounded-lg p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">{entry.startTimeFormatted}</span>
                    <div className="w-px h-4 bg-slate-600" />
                    <span className="text-xs text-slate-400">{entry.endTimeFormatted}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                        {entry.project}
                      </span>
                      <span className="bg-slate-600 text-slate-300 px-2 py-0.5 rounded text-xs">
                        {entry.activity}
                      </span>
                      {entry.is_scrum && (
                        <span className="bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded text-xs">
                          SCRUM
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 truncate">{entry.subject}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-lg font-semibold text-green-400">{entry.duration_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {processing && progress && (
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-slate-300">
              Processing entry {progress.current} of {progress.total}...
            </span>
          </div>
          <div className="bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-semibold">Processing Results</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{results.success.length}</p>
                <p className="text-sm text-green-300">Successful</p>
              </div>
            </div>
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{results.failed.length}</p>
                <p className="text-sm text-red-300">Failed</p>
              </div>
            </div>
          </div>

          {results.failed.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h4 className="font-medium text-red-400 mb-2">Failed Entries:</h4>
              <ul className="space-y-1 text-sm text-red-300">
                {results.failed.map((fail, i) => (
                  <li key={i}>• {fail.entry.subject}: {fail.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Upload Another File
        </button>

        {!results && (
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors"
          >
            <Play className="w-5 h-5" />
            {processing ? 'Processing...' : 'Process All Entries'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ReviewPanel;
