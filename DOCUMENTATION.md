# Doing It — Project Documentation (v4.0.1)

## 1. Concept

Doing It is a Windows desktop overlay widget for quick productivity. It stays always-on-top, providing instant access to notes, tasks, reminders, a focus timer, and a calendar — without interrupting your workflow. It's deeply integrated with Windows 11 APIs and features a command palette, markdown rendering, task-driven timers, external calendar sync, and edge docking.

## 2. Architecture

### 2.1 Two-Window System

1. **Main Widget** (`index.html`) — 400×650 panel (or full-height when edge-docked)
2. **Mini Timer** (`mini-timer.html`) — 180×56 PiP countdown

### 2.2 Data Flow

```
User Input → renderer.js → IPC (preload.js) → main.js → JSON store
                                                      ↓
                    renderer.js ← IPC events ← main.js (data-changed, timer-pause, dock-state)
```

### 2.3 IPC Channels (25+)

**Data CRUD:** `get-notes`, `save-notes`, `get-todos`, `save-todos`, `get-reminders`, `save-reminders`, `get-pomodoro`, `save-pomodoro`, `get-settings`, `save-settings`

**System:** `show-notification`, `close-window`, `minimize-window`, `choose-directory`, `get-current-store-path`, `toggle-fab`

**Phase 2:** `quick-add-save`, `quick-add-close`, `pop-out-timer`, `mini-timer-close`, `mini-timer-update`, `open-file-path`

**Phase 3:** `get-active-window`, `save-clipboard-image`, `fetch-ics-calendar`, `open-external-url`, `get-dock-state`, `undock-window`

**Phase 4:** `toggle-focus-assist`

**Events (Main → Renderer):** `data-changed`, `timer-pause`, `timer-resumed`, `timer-sync`, `dock-state-changed`

## 3. Feature Documentation

### 3.1 Task-Driven Focus Timers

When the user clicks the ▶ button on any task:
1. `startFocusOnTask(todoId)` stores `focusedTaskId` and `focusedTaskName`
2. Auto-switches to Focus tab via `switchToTab(3)`
3. Displays task text in the timer label
4. Auto-starts the Pomodoro if not running
5. On completion, `onPomodoroComplete()` logs `task.timeSpent += selectedMinutes`
6. Shows "Did you finish?" prompt reusing the reminder overlay
7. "Yes, done!" auto-completes the task; "Not yet" dismisses

### 3.2 Command Palette (Ctrl+K)

- **Search mode** (default): Fuzzy search across notes + tasks using `fuzzyMatch()` — a lightweight sequential character matcher
- **Action mode** (prefix `>`): 10 built-in commands including Start Timer, Reset Timer, Clear Completed, Switch to Tabs, Open Settings, Undock Window
- Arrow keys navigate results, Enter executes, Escape closes
- Overlay uses `backdrop-filter: blur(6px)` for premium feel

### 3.3 Arrow-Key Navigation

Global `keydown` handler on document:
- Only active when no input/textarea is focused and palette is not open
- Queries active panel for `.note-item, .todo-item, .reminder-item`
- Tracks `highlightedIndex`, applies `.kb-highlight` CSS class
- `Space` → click checkbox, `Enter` → dispatch dblclick, `Delete` → click delete button

### 3.4 Markdown Parser

Lightweight zero-dependency renderer in `renderMarkdown(text, itemType, itemId)`:
1. Escapes HTML first (via `escapeHtml()`)
2. Applies regex transforms: `` `code` `` → `<code>`, `**bold**` → `<strong>`, `*italic*` → `<em>`, `~~strike~~` → `<del>`
3. Highlights `#hashtags` with purple accent + click-to-filter
4. Auto-links URLs matching `https?://...`
5. Renders `- [ ]` / `- [x]` as interactive checkboxes (markdown checklists)
6. Links open in default browser via `openMdLink()` → `shell.openExternal()`
7. Plain text editing is preserved — markdown only renders on display

### 3.5 Context-Aware Capture

Active window detection via PowerShell calling `user32.dll`:
```powershell
Add-Type @" ... WinAPI class with GetForegroundWindow + GetWindowText ... "@
```
- Called via `child_process.exec` with 2-second timeout
- Returns the foreground window title (e.g., "Visual Studio Code - main.js")
- Stored in note/task `context` field, rendered as a purple context pill

### 3.6 Screen Edge Docking

On `mainWindow.on('moved')`:
- Gets window position `[wx, wy]` and nearest display work area
- If `wx <= workArea.x + 20px` or `wx + 400 >= workArea.x + workArea.width - 20px`:
  - Snaps to full-height: `setBounds({ x, y: workArea.y, width: 400, height: workArea.height })`
  - Sets `isDocked = true`, sends `dock-state-changed` event
  - Renderer applies `body.docked` class (removes border-radius, sets 100vh)
- Dragging away from edge undocks back to 400×650

### 3.7 Image Pasting

`paste` event listener on document:
1. Only triggers when Notes panel is active and no textarea is focused
2. Calls `window.api.saveClipboardImage()` → IPC to main process
3. Main process: `clipboard.readImage()` → `img.toPNG()` → saves to `images/img-{timestamp}.png`
4. Creates a note with `image: filePath` field
5. Rendered as `<img src="file:///...">` thumbnail with hover scale

### 3.8 .ics Calendar Sync

- Settings modal has "External Calendar (.ics)" input field
- URL saved to `settings.icsUrl` in JSON store
- `initCalendarSync()` fetches on startup + every 60 minutes
- Main process fetches via `https.get()`, parses with custom `parseICS()`:
  - Splits on `BEGIN:VEVENT`, extracts `SUMMARY`, `DTSTART`, `DTEND`, `DESCRIPTION`, `LOCATION`
  - Detects Zoom/Teams/Meet links in description/location
- Events rendered as grey `.has-ics` dots on calendar + "Join" button in upcoming list

### 3.9 Drag-and-Drop Scheduling

- Tasks rendered with `draggable="true"` and `ondragstart="dragTask(event, todoId)"`
- Calendar day cells have `ondragover`, `ondragleave`, `ondrop` handlers
- On drop: reads `text/todo-id` from `dataTransfer`, validates with `isNaN()` guard, sets `todo.dueDate = dateStr`
- Visual indicator: `.cal-drop-target` class with green glow on hover

### 3.10 Universal #Hashtags (v4.0)

- Users type `#tagname` inline in any note or task text
- `extractHashtags(items)` scans all items, collects unique tags via regex `/#(\w+)/g`
- `renderTagBar(containerId, items)` builds scrollable pill bar with `All` + tag pills
- `filterByTag(tag)` sets `activeTag` filter; re-renders both notes and tasks
- `renderMarkdown()` highlights tags as clickable `<span class="hashtag">` elements
- Replaces hardcoded Personal/Work/Ideas categories — zero UI configuration

### 3.11 Markdown Checklists (v4.0)

- Pattern: `- [ ] text` (unchecked) and `- [x] text` (checked)
- Rendered as `<label class="md-check"><input type="checkbox"><span>text</span></label>`
- `toggleMdCheck(itemType, itemId, checkIdx)` finds the nth checkbox in raw text, toggles `[ ]` ↔ `[x]`, saves
- Checked items get strikethrough + dimmed styling via `.md-check.checked span`

### 3.12 "My Day" Unified View (v4.0)

- `renderMyDay()` aggregates three sources into `#my-day-section` at top of Tasks panel:
  - Tasks where `dueDate === today` (active only)
  - Reminders where `date === today` and not fired
  - ICS events where `date === today`
- Items sorted chronologically by time; tasks without time appear last
- Compact rows with type-specific color-coded icons (green check, amber bell, grey calendar)

### 3.13 Focus Assist / Auto-DND (v4.0)

- `startPomodoro()` calls `window.api.toggleFocusAssist('on')` → IPC to main process
- `pausePomodoro()`, `resetPomodoro()`, `completePomodoro()` call `toggleFocusAssist('off')`
- Main process toggles registry key:
  ```
  HKCU:\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings
  NOC_GLOBAL_SETTING_TOASTS_ENABLED = 0 (DND on) / 1 (DND off)
  ```
- Runs via PowerShell `New-ItemProperty` with 3-second timeout

### 3.14 Silent Image Garbage Collection (v4.0)

- Runs 30 seconds after app boot via `setTimeout` in main process
- Reads `notes[].image` paths from the JSON store
- Scans `images/` directory, deletes any `.png` not referenced
- Logs count: `Image GC: cleaned N orphaned image(s)`

## 4. Data Schema

```json
{
  "notes": [{ "id": 123, "text": "Call client #work", "category": "work", "pinned": false, "image": null, "context": null, "timestamp": "..." }],
  "todos": [{ "id": 456, "text": "Review PR #dev - [ ] Tests - [x] Linting", "completed": false, "priority": "high", "dueDate": "2026-03-25", "timeSpent": 25, "isHabit": false, "streak": 0, "files": [...], "context": null, "timestamp": "..." }],
  "reminders": [{ "id": 789, "text": "...", "date": "2026-03-25", "time": "09:00", "repeat": "none", "fired": false }],
  "pomodoroState": { "sessions": 3, "totalMinutes": 75, "lastDate": "2026-03-23", "weeklyHistory": [...] },
  "settings": { "savePath": null, "icsUrl": null },
  "windowPosition": { "x": 1400, "y": 200 },
  "fabPosition": { "x": 1860, "y": 500 }
}
```

## 5. File Manifest

| File | Lines | Purpose |
|------|-------|---------|
| `main.js` | ~1020 | Main process: windows, IPC, data, PowerShell, .ics parser, edge docking, Focus Assist, Image GC |
| `preload.js` | ~82 | Context bridge with 28+ exposed API methods |
| `renderer.js` | ~2060 | All UI: 5 tabs, command palette, markdown, hashtags, checklists, My Day, arrow nav, drag-drop |
| `index.html` | ~355 | Main widget — 5-tab layout + command palette + settings |
| `mini-timer.html` | ~95 | PiP mini timer — countdown pill |
| `styles.css` | ~870 | Complete design system: 25+ style sections |
| `quickadd.html` | ~85 | Quick Add bar UI |
| `start.js` | ~10 | Electron launcher |
| `afterPack.js` | ~55 | Build hook: patches brain icon via rcedit with 3s delay + 5 retries |

## 6. Security

- `contextIsolation: true` + `nodeIntegration: false`
- All Node.js access via `contextBridge.exposeInMainWorld()`
- HTML escaped before markdown parsing (XSS prevention)
- File paths validated before `shell.openPath()` / `shell.openExternal()`
- PowerShell exec has 2-second timeout to prevent hangs

## 7. Known Limitations

- Markdown parser is lightweight: no headers, no block quotes, no tables
- .ics parser handles basic VEVENT blocks only (no RRULE recurrence)
- Active window detection requires PowerShell — ~200ms latency per capture
- Edge docking uses fixed 400px width
- Focus Assist DND toggle uses registry — may require restart of Notification Center on some Windows builds

## 8. Audit Fixes (v3.0.1)

The following issues were found and fixed during a comprehensive code audit:

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Delete note/task undo captured dead reference after `filter()` | `renderer.js` | Clone object before filtering; fallback for filtered-out items |
| 2 | `clearPastReminders` filter kept fired repeating reminders | `renderer.js` | Fixed filter logic + added count feedback toast |
| 3 | `weeklyHistory.slice(-7)` trimmed by array size, not calendar days | `renderer.js` | Date-based filtering with 7-day cutoff |
| 4 | `dropTaskOnDate` falsy check failed for `id === 0` | `renderer.js` | `isNaN()` guard instead of falsy check |
| 5 | ICS fetch timeout didn't abort the HTTP request | `main.js` | `req.destroy()` on timeout event |
| 6 | Backup cleanup crash on corrupt file | `main.js` | Per-file try-catch in cleanup loop |
| 7 | Missing `.settings-path-row` CSS class | `styles.css` | Added flex layout rule |

## 9. Protected Elements — DO NOT CHANGE

The following are **strictly protected** and must never be modified:

### Icons
- `build/icon.ico` — build icon for NSIS installer and exe patching
- `assets/icon.ico` — runtime app icon for BrowserWindow
- `assets/icon.png` — runtime icon PNG variant
- `afterPack.js` patches the exe icon using `rcedit` npm package — always uses `build/icon.ico`

### Window Transparency & Corners
- `main.js` → `frame: false` — frameless window required for custom drag bar
- `main.js` → `transparent: true` — enables CSS-driven transparency
- `main.js` → `backgroundColor: '#00000000'` — fully transparent window background
- `styles.css` → `body { background: transparent }` — CSS transparent background
- `styles.css` → `body { clip-path: inset(0 round 8px) }` — creates rounded window corners
- `styles.css` → `.app-container { border-radius: 0 }` — intentional; clip-path handles corners

### Why
Changing any of these will cause: default Electron icon, sharp rectangle window, opaque background, or broken drag behavior.
