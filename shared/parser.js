// Work Log Parser for Desktop App

import { PROJECT_MAPPINGS, ACTIVITY_MAPPINGS } from './apiClient.js';

const MONTH_MAP = {
  'jan': 0, 'january': 0,
  'feb': 1, 'february': 1,
  'mar': 2, 'march': 2,
  'apr': 3, 'april': 3,
  'may': 4,
  'jun': 5, 'june': 5,
  'jul': 6, 'july': 6,
  'aug': 7, 'august': 7,
  'sep': 8, 'sept': 8, 'september': 8,
  'oct': 9, 'october': 9,
  'nov': 10, 'november': 10,
  'dec': 11, 'december': 11,
};

function parseDateString(dateStr) {
  // Format: mon-dd-yyyy (e.g., nov-23-2025)
  const parts = dateStr.toLowerCase().split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}. Expected mon-dd-yyyy`);
  }

  const [monthStr, day, year] = parts;
  const month = MONTH_MAP[monthStr];

  if (month === undefined) {
    throw new Error(`Invalid month: ${monthStr}`);
  }

  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(yearNum)) {
    throw new Error(`Invalid date: ${dateStr}`);
  }

  const date = new Date(yearNum, month, dayNum);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function validateEntry(entry, index) {
  const errors = [];

  if (!entry.project) {
    errors.push(`Entry ${index + 1}: Missing project`);
  } else if (!PROJECT_MAPPINGS[entry.project.toUpperCase()]) {
    errors.push(`Entry ${index + 1}: Unknown project "${entry.project}"`);
  }

  if (!entry.subject || entry.subject.trim() === '') {
    errors.push(`Entry ${index + 1}: Missing subject`);
  }

  if (typeof entry.duration_hours !== 'number' || entry.duration_hours <= 0) {
    errors.push(`Entry ${index + 1}: Invalid duration_hours`);
  }

  if (!entry.activity) {
    errors.push(`Entry ${index + 1}: Missing activity`);
  } else if (!ACTIVITY_MAPPINGS[entry.activity]) {
    errors.push(`Entry ${index + 1}: Unknown activity "${entry.activity}"`);
  }

  if (typeof entry.is_scrum !== 'boolean') {
    errors.push(`Entry ${index + 1}: is_scrum must be boolean`);
  }

  return errors;
}

function detectSameDateDuplicates(entries) {
  const seen = new Map();
  const duplicates = [];

  entries.forEach((entry, index) => {
    const key = `${entry.project}|${entry.subject}`.toLowerCase();
    if (seen.has(key)) {
      duplicates.push({
        index1: seen.get(key),
        index2: index,
        project: entry.project,
        subject: entry.subject,
      });
    } else {
      seen.set(key, index);
    }
  });

  return duplicates;
}

function parseWorkLogContent(jsonContent) {
  let data;
  try {
    data = JSON.parse(jsonContent);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }

  if (!data.logs || !Array.isArray(data.logs)) {
    throw new Error('JSON must have a "logs" array');
  }

  const allErrors = [];
  const parsedLogs = [];

  for (const log of data.logs) {
    if (!log.date) {
      allErrors.push('Log missing date field');
      continue;
    }

    let isoDate;
    try {
      isoDate = parseDateString(log.date);
    } catch (e) {
      allErrors.push(e.message);
      continue;
    }

    if (!log.entries || !Array.isArray(log.entries)) {
      allErrors.push(`Log for ${log.date}: missing entries array`);
      continue;
    }

    // Validate each entry
    log.entries.forEach((entry, index) => {
      const entryErrors = validateEntry(entry, index);
      allErrors.push(...entryErrors.map(e => `${log.date}: ${e}`));
    });

    // Check for same-date duplicates
    const duplicates = detectSameDateDuplicates(log.entries);
    if (duplicates.length > 0) {
      duplicates.forEach(dup => {
        allErrors.push(
          `${log.date}: Duplicate subject "${dup.subject}" (entries ${dup.index1 + 1} and ${dup.index2 + 1})`
        );
      });
    }

    parsedLogs.push({
      date: log.date,
      isoDate,
      entries: log.entries.map(entry => ({
        ...entry,
        projectId: PROJECT_MAPPINGS[entry.project.toUpperCase()],
        activityId: ACTIVITY_MAPPINGS[entry.activity],
      })),
    });
  }

  return {
    logs: parsedLogs,
    errors: allErrors,
    isValid: allErrors.length === 0,
  };
}

function aggregateCrossDateDuplicates(logs) {
  const subjectMap = new Map();

  logs.forEach(log => {
    log.entries.forEach(entry => {
      const key = `${entry.projectId}|${entry.subject}`.toLowerCase();
      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          project: entry.project,
          subject: entry.subject,
          dates: [],
          totalHours: 0,
        });
      }
      const item = subjectMap.get(key);
      item.dates.push({ date: log.date, hours: entry.duration_hours });
      item.totalHours += entry.duration_hours;
    });
  });

  // Return only those appearing on multiple dates
  return Array.from(subjectMap.values()).filter(item => item.dates.length > 1);
}

export { parseWorkLogContent, parseDateString, aggregateCrossDateDuplicates };
