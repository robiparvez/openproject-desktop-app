// Work Log Service for Desktop App

function formatTime12h(hours24, minutes = 0) {
    const h = Math.floor(hours24);
    const m = minutes || Math.round((hours24 - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function calculateTimeChain(entries, startHour = 11) {
    let currentTime = startHour; // Start time in hours (e.g., 11 = 11:00 AM)

    return entries.map((entry, index) => {
        // Add break before this task (except first)
        if (index > 0 && entry.break_hours) {
            currentTime += entry.break_hours;
        }

        const startTime = currentTime;
        const endTime = currentTime + entry.duration_hours;

        currentTime = endTime;

        return {
            ...entry,
            startTime,
            endTime,
            startTimeFormatted: formatTime12h(startTime),
            endTimeFormatted: formatTime12h(endTime)
        };
    });
}

function generateTimelineForDate(log, startHour) {
    // Separate SCRUM entries (fixed timing) from regular entries
    const scrumEntries = log.entries.filter(e => e.is_scrum);
    const regularEntries = log.entries.filter(e => !e.is_scrum);

    // Calculate time chain for regular entries
    const chainedEntries = calculateTimeChain(regularEntries, startHour);

    // SCRUM entries get fixed 10:00 AM timing
    const scrumWithTime = scrumEntries.map(entry => ({
        ...entry,
        startTime: 10,
        endTime: 10 + entry.duration_hours,
        startTimeFormatted: formatTime12h(10),
        endTimeFormatted: formatTime12h(10 + entry.duration_hours)
    }));

    const allEntries = [...scrumWithTime, ...chainedEntries];
    const totalHours = allEntries.reduce((sum, e) => sum + e.duration_hours, 0);

    return {
        date: log.date,
        isoDate: log.isoDate,
        entries: allEntries,
        totalHours
    };
}

function generateComment(entry) {
    return `[${entry.startTimeFormatted} - ${entry.endTimeFormatted}] ${entry.subject}`;
}

async function processWorkLog(apiClient, timeline, onProgress) {
    const results = {
        success: [],
        failed: []
    };

    const total = timeline.entries.length;
    let processed = 0;

    for (const entry of timeline.entries) {
        try {
            onProgress?.({
                current: processed + 1,
                total,
                entry,
                status: 'processing'
            });

            let workPackageId = entry.work_package_id;
            let workPackageCreated = false;

            // If no work_package_id, check for existing or create new
            if (!workPackageId) {
                const existing = await apiClient.checkExistingWorkPackageBySubject(entry.projectId, entry.subject);

                if (existing) {
                    workPackageId = existing.id;
                } else {
                    const newWp = await apiClient.createWorkPackage(entry.projectId, entry.subject);
                    workPackageId = newWp.id;
                    workPackageCreated = true;
                }
            }

            // Check for existing time entry
            const existingTimeEntries = await apiClient.checkExistingTimeEntries(workPackageId, timeline.isoDate);

            if (existingTimeEntries.length > 0) {
                results.success.push({
                    entry,
                    workPackageId,
                    timeEntryId: existingTimeEntries[0].id,
                    action: 'skipped',
                    message: 'Time entry already exists'
                });
            } else {
                // Create time entry
                const comment = generateComment(entry);
                const timeEntry = await apiClient.createTimeEntry(workPackageId, entry.projectId, entry.duration_hours, entry.activityId, comment, timeline.isoDate);

                results.success.push({
                    entry,
                    workPackageId,
                    workPackageCreated,
                    timeEntryId: timeEntry.id,
                    action: 'created'
                });
            }

            processed++;
            onProgress?.({
                current: processed,
                total,
                entry,
                status: 'completed'
            });
        } catch (error) {
            results.failed.push({
                entry,
                error: error.message
            });

            processed++;
            onProgress?.({
                current: processed,
                total,
                entry,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

export { formatTime12h, calculateTimeChain, generateTimelineForDate, generateComment, processWorkLog };
