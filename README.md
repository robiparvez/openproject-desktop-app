# OpenProject Time Logger — Desktop Application

A modern **Electron + React desktop application** for parsing multi-date JSON work logs, validating entries, and creating or linking OpenProject work packages and time entries — now without the limitations of browser extensions.

## 🚀 Cross-Platform Desktop Application (Electron + React)

We have fully migrated the Chrome extension workflow into a **standalone desktop app** with a modern UI, automated validation, and direct OpenProject integration.

### Desktop App Highlights

* ✨ **No Browser Required** — Fully standalone workflow
* 📤 **Drag-and-Drop JSON Upload** — Automatically validates structure, dates, and required fields
* 🔍 **Advanced Validation Engine**
  * Duplicate detection (same-date/same-subject)
  * Aggregation of same-subject tasks across days
  * API-level duplicate checks
* ⚙️ **Automated Work Package Handling**
  * Create or link existing work packages
  * Create time entries with chained start/end times (with break handling)
* 🎨 **Modern UI/UX**
  * Built with React, TailwindCSS, and shadcn/ui
  * Guided multi-step workflow
* 📈 **Timeline Visualization**
  * Per-day timelines with 12h display format
  * Real-time calculation of start/end times

---

## Quick Start

**Prerequisites:** Node.js 18+ required

```bash
# Navigate to desktop app folder
cd openproject-desktop-app

# Install dependencies
npm install

# Run in dev mode
npm run electron:dev

# Build for production
npm run electron:build
```

---

## Application Workflow

The desktop app provides a guided 3-step workflow:

### 1. Configure OpenProject Access

Set your **OpenProject API Token** and **Server URL** in the Settings panel.

### 2. Upload and Validate Work Logs

Drag-and-drop your JSON file or browse manually.
The validation engine checks:

* JSON structure and required fields
* Date format (`mon-dd-yyyy`, e.g., `nov-23-2025`)
* Same-date duplicate subjects
* Break duration consistency
* Missing or invalid project/activity fields

### 3. Review, Confirm, and Upload

For each date:

* Confirm per-date start times
* Review calculated chained times with break handling
* Review timelines and consolidated summaries

Then submit:

* Work packages are created or linked
* Time entries are created with exact start/end

---

## Minimal JSON Example

```json
{
  "logs": [
    {
      "date": "nov-23-2025",
      "entries": [
        {
          "project": "BD-TICKET",
          "subject": "Requirement analysis",
          "break_hours": null,
          "duration_hours": 2,
          "activity": "Development",
          "is_scrum": false,
          "work_package_id": null
        }
      ]
    }
  ]
}
```

---

## Key Features

### Parsing & Validation

* Multi-date logs
* Structural validation
* Date format validation
* Duplicate subject detection (blocks upload)
* Same-subject aggregation across dates (informational)

### OpenProject Integration

* Server-side duplicate detection before creating work packages
* Auto-linking if matching work package exists
* Time entry creation with start/end calculations
* Auto-comments with generated timelines

### Workflow & UI

* Multi-step UI (Upload → Validate → Review → Upload)
* Timeline visualization per date
* Batch processing with detailed progress
* Custom toast notifications
* Error boundaries and safe failover

---

## Troubleshooting Guide

| Issue                       | Resolution                                          |
| --------------------------- | --------------------------------------------------- |
| Invalid JSON                | Fix structure/required fields                       |
| Wrong date format           | Must be `mon-day-year` (e.g., `nov-23-2025`)        |
| Same-date duplicate         | Combine entries or change subjects                  |
| API authentication failures | Re-check API token and OpenProject access           |
| Work package creation fails | Check server-side validation or project permissions |

---

## Developer Notes

### Code Structure

* Core business logic: `shared/`
  * `parser.js` — JSON parsing & validation
  * `workLogService.js` — time calculation & duplicate detection
  * `apiClient.js` — OpenProject API interface
* Desktop UI: `src/`
  * React components (stepper, upload, timelines, toasts)
  * TailwindCSS design system
* Electron: `electron/`
  * `main.js` — Main process with IPC handlers
  * `preload.js` — Context bridge for secure API access

### Development Standards

* Consistent error boundaries and fallback screens
* Full IPC separation (UI vs. backend logic)
* Reactive state for logs, settings, and validation

---

## Project Structure

```text
openproject-desktop-app/
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── index.html             # Entry HTML
├── electron/
│   ├── main.js            # Electron main process
│   └── preload.js         # Context bridge
├── shared/
│   ├── apiClient.js       # OpenProject API client
│   ├── parser.js          # JSON parsing & validation
│   └── workLogService.js  # Time calculations
└── src/
    ├── main.jsx           # React entry point
    ├── App.jsx            # Main app component
    ├── index.css          # Global styles
    └── components/
        ├── SettingsPanel.jsx
        ├── UploadPanel.jsx
        ├── ReviewPanel.jsx
        └── Toast.jsx
```

---

## Related Resources

* [OpenProject API Documentation](https://www.openproject.org/docs/api/)
* [Electron Desktop Development](https://www.electronjs.org/docs)
* [React + Tailwind](https://tailwindcss.com/docs)
