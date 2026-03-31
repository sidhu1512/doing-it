# Doing It

[![Download for Windows](https://img.shields.io/badge/Download-Windows_Setup-blue?style=for-the-badge&logo=windows)](https://github.com/sidhu1512/doing-it/releases/latest/download/Doing.It.Setup.exe)

A **state-of-the-art** Windows desktop productivity widget — floating always-on-top panel with notes, tasks, reminders, focus timer, and calendar. Deeply integrated with Windows 11 via native Mica material, command palette, markdown rendering, task-driven focus timers, and 20+ premium features. v4.0.1 adds invisible polish: universal #hashtags, markdown checklists, unified My Day view, auto-DND, and cleaner UX with no toast interruptions.

---

## Overview

Doing It is a lightweight Electron-based desktop application that lives as an always-on-top overlay. It provides instant access to essential productivity tools without switching windows. Think of it as **Raycast + Obsidian + Things 3** merged into a single, zero-friction Windows widget.

---

## Features

### Notes
- Quick note capture with search, pin, and inline editing
- **Rich Markdown rendering** — `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, checklists, tables, blockquotes
- **Rich Link Previews** — URLs in notes automatically unfurl into beautiful clickable cards with OpenGraph thumbnails and descriptions
- **Image pasting** — `Ctrl+V` saves clipboard images as thumbnails
- **Context-aware capture** — shows which app you were in when clipping
- Undo delete with keyboard (`Ctrl+Z` not supported — use delete carefully)
- **Universal `#hashtags`** — type `#tag` to organize; dynamic filter pills auto-appear

### Tasks
- Full task management with priority cycling and due dates
- **Smart NLP Capture** — type natural language dates like "Meeting tomorrow at 3pm" and the widget automatically schedules it and creates a background reminder
- **▶ Focus button** — click to auto-start a task-driven Pomodoro session
- **Time tracking** — logged `Xm focused` on each task after timer sessions
- **Draggable scheduling** — drag tasks onto calendar dates to set due dates
- **File shortcuts** — drag files from Explorer to attach clickable file links
- **Markdown rendering** — `#hashtags`, `**bold**`, `` `code` `` rendered in task text
- **Markdown checklists** — type `- [ ] Subtask` for interactive checkboxes
- **"My Day" view** — unified Today section showing tasks + reminders + calendar events
- Filters: All, Active, Completed, Overdue
- Auto-sort by priority, bulk clear completed

### Reminders
- Date + time with repeat options (Daily, Weekly, Monthly)
- System notification + audio beep + in-app popup with Snooze/Dismiss
- Recurring auto-creation, auto-cleanup after 24 hours

### Focus Timer (Pomodoro) & Ambient Audio
- SVG ring progress with gradient, presets (25/15/45/5 min)
- **Ambient Focus Audio** — built-in seamless loops for Deep Focus (Brown Noise) and Heavy Rain to boost concentration, natively fading in and out with the timer
- **Task-driven mode** — ▶ on a task auto-switches to Focus, displays task name
- **"Did you finish?"** prompt on completion → auto-completes and logs time
- **Pop-out Mini Timer** — detachable PiP countdown pill
- **Smart Timer** — auto-pauses on `Win+L` screen lock
- **Auto-DND** — automatically enables Windows Focus Assist when timer starts
- Daily stats + 7-day weekly history bar chart

### Advanced Insights Dashboard
- **Weekly Velocity Chart** — sophisticated CSS grid visualization of your task completion rates over the last 7 rolling days
- **Productivity Correlations** — tracks and displays Total Deep Focus hours, Active vs Completed items, and your most Frequent Mood
- Instant real-time rendering on every tab switch

### Calendar
- Monthly grid with clickable days and event dots
- **External .ics sync** — paste Google Calendar/Outlook .ics URL in Settings
- **Grey dots** for external events, **"Join Meeting"** button for Zoom/Teams/Meet
- **Drag-and-drop scheduling** — drop tasks onto dates to set due dates
- Upcoming events list with task/reminder/external event types

### Command Palette (Ctrl+K)
- **Fuzzy search** across all notes + tasks simultaneously
- **Action commands** — type `>` for: Start Timer, Clear Completed, Switch Tabs, Open Settings, Undock Window
- Arrow-key selection + Enter to execute
- Dimmed backdrop with floating search bar

### Arrow-Key Navigation
- `↑/↓` to highlight items in any list (no mouse needed)
- `Space` checks off tasks, `Enter` opens edit, `Delete` removes

### System Integration
- **Native Mica/Acrylic material** — hardware-accelerated frosted glass
- **Multi-monitor awareness** — all windows open on the active display
- **Screen edge docking** — drag to edge → full-height sidebar (Windows Copilot-style)
- **Context-aware capture** — PowerShell WinAPI detects foreground window title
- **Global Clipboard Injection** — `Ctrl+Shift+C` clips text from any app as a note
- **Smart lock-screen detection** — auto-pauses timers on `Win+L`
- **BYOC Storage** — point save directory to OneDrive/Dropbox for cloud sync
- **Rolling backups** — automatic 5-day backup history on every launch
- **Silent Image GC** — orphaned images auto-cleaned 30s after boot
- Auto-start, system tray, single instance lock, taskbar pinning

### Settings
- Gear icon in header → modal overlay
- Custom storage location (BYOC cloud sync)
- External calendar .ics URL
- Keyboard shortcut reference
- Data protection info

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+N` | Toggle widget visibility (global) |
| `Ctrl+Shift+C` | Clip text from clipboard as a note (global) |
| `Ctrl+K` | Command palette — search & actions |
| `Ctrl+1` to `Ctrl+5` | Switch tabs |
| `↑/↓` | Navigate lists with keyboard |
| `Space` | Toggle task completion (when highlighted) |
| `Enter` | Edit highlighted item / add new item |
| `Delete` | Delete highlighted item |
| `Esc` | Close popups / Hide app |
| `Drag file → Task` | Attach file shortcut to task |
| `Drag task → Calendar` | Schedule task on a date |

---

## Design

- **Native Windows 11 Mica material** — hardware-accelerated blur
- **Minimalist dark charcoal** theme — professional greys
- **Inter** font from Google Fonts
- **SVG icons** throughout — no emojis for core UI
- **Acrylic effect** on Quick Add, FAB, and Mini Timer
- Smooth micro-animations on all interactions
- Markdown-rendered notes with styled code blocks and links

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Electron 28 |
| Language | JavaScript (ES6+) |
| Styling | Vanilla CSS with custom properties |
| Font | Inter (Google Fonts) |
| Data Store | JSON file (Node.js fs) |
| Audio | Web Audio API |
| Notifications | Electron Notification API |
| Background Material | Windows 11 Mica / Acrylic |
| Active Window | PowerShell + WinAPI (user32.dll) |
| Calendar Sync | Node.js https + custom .ics parser |
| Markdown | Custom lightweight parser (zero deps) |
| Search | Custom fuzzy match algorithm |
| Packaging | electron-builder (NSIS installer) |

---

## Project Structure

```
Doing It/
├── main.js            # Main process — windows, IPC, tray, data, active window, .ics, docking
├── preload.js         # Context bridge — 25+ secure IPC methods
├── renderer.js        # UI logic — all features, command palette, markdown, arrow nav
├── index.html         # Main widget — 5-tab layout + command palette + settings
├── fab.html           # Floating action button (AssistiveTouch)
├── quickadd.html      # Quick Add bar — instant capture
├── mini-timer.html    # PiP mini timer — countdown pill
├── styles.css         # Complete design system — 870+ lines
├── start.js           # Launcher script
├── afterPack.js       # Build hook — patches brain icon into exe via rcedit (3s delay + 5 retries)
├── package.json       # Dependencies + electron-builder config
├── README.md          # This file
├── DOCUMENTATION.md   # Deep technical documentation
├── CHANGELOG.md       # Version history
├── build/
│   ├── icon.ico       # Build icon (Windows ICO, multi-size)
│   ├── icon.png       # Build icon (PNG source)
│   └── installer.nsh  # NSIS custom uninstall script
└── assets/
    ├── icon.ico       # Application icon (Windows)
    └── icon.png       # Application icon (PNG)
```

---

## Architecture

### Four-Window System

1. **Main Widget** (`index.html`) — 400×650 panel (or full-height when edge-docked)
2. **Floating Icon** (`fab.html`) — 48×48 draggable button
3. **Quick Add Bar** (`quickadd.html`) — 520×68 instant capture
4. **Mini Timer** (`mini-timer.html`) — 180×56 PiP countdown

### IPC Channels (25+)

| Channel | Purpose |
|---------|---------|
| `get-notes` / `save-notes` | Notes CRUD |
| `get-todos` / `save-todos` | Tasks CRUD |
| `get-reminders` / `save-reminders` | Reminders CRUD |
| `get-pomodoro` / `save-pomodoro` | Pomodoro state + weekly history |
| `get-settings` / `save-settings` | BYOC storage + .ics URL |
| `choose-directory` | OS folder picker |
| `show-notification` | System notifications |
| `get-active-window` | Foreground app detection (PowerShell) |
| `save-clipboard-image` | Clipboard image → PNG file |
| `fetch-ics-calendar` | .ics fetch + parse |
| `open-file-path` | Native file open |
| `open-external-url` | Open URL in default browser |
| `get-dock-state` / `undock-window` | Edge docking |
| `dock-state-changed` | Dock state notifications |
| `quick-add-save` / `quick-add-close` | Instant capture |
| `pop-out-timer` / `mini-timer-close` | PiP timer |
| `timer-pause` / `timer-resumed` | Lock screen detection |
| `data-changed` | Sync after Quick Add / clipboard |
| `toggle-focus-assist` | Windows DND toggle (Pomodoro) |

### Security

- `contextIsolation: true` — no direct Node.js access in renderer
- `nodeIntegration: false` — no `require()` in renderer
- `preload.js` — only specific API methods via `contextBridge`

---

## How to Run

```bash
cd "Doing It"
npm install
npm start
```

### Build Installer
```bash
npx electron-builder --win --x64
```

---

## Data Storage

All data: `%APPDATA%/doing-it/doing-it-data.json`

**BYOC:** Change save location via Settings → point to OneDrive/Google Drive/Dropbox.

**Backups:** Rolling 5-day history in `backups/` subfolder. Crash-resilient cleanup — individual backup errors are caught and logged without affecting other backups.

**Images:** Pasted images saved to `images/` folder alongside the JSON data. Orphaned images (from deleted notes) are automatically garbage collected 30 seconds after app boot.

---

## Developer Notes — DO NOT CHANGE

The following elements are **strictly protected**. Do not modify them under any circumstances:

| Protected Element | Files | Why |
|---|---|---|
| **App Icons** | `build/icon.ico`, `assets/icon.ico`, `assets/icon.png` | Custom brain icon — never replace, regenerate, or overwrite |
| **Window Transparency** | `main.js` → `transparent: true`, `backgroundColor: '#00000000'` | Required for frameless rounded-corner window |
| **Frameless Window** | `main.js` → `frame: false` | Enables custom title bar and drag behavior |
| **Rounded Corners** | `styles.css` → `clip-path: inset(0 round 8px)` | Creates the signature rounded window shape |
| **Icon Patching** | `afterPack.js` → uses `build/icon.ico` | Patches icon into exe during build; uses `rcedit` npm package |

---

## License

Private project. All rights reserved.
