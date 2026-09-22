/**
 * Reactive State Store for Doing It
 * High performance local-first store with subscriptions, optimistic updates, and undo history.
 */

class ReactiveStore {
  constructor() {
    this.state = {
      activeView: 'tasks',
      theme: '',
      tasks: [],
      notes: [],
      scratchpad: '',
      focus: {
        running: false,
        phase: 'focus',
        duration: 1500,
        remaining: 1500,
        linkedTaskId: null,
        soundscape: 'none',
        volume: 0.5,
        sessions: 0,
        totalMinutes: 0,
        lastDate: null
      },
      calendarEvents: [],
      activeFilter: 'all',
      noteTagFilter: 'all',
      searchQuery: '',
      paletteOpen: false,
      settingsOpen: false
    };

    this.subscribers = new Map();
    this.undoStack = [];
    this.timerInterval = null;
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    return () => this.subscribers.get(key).delete(callback);
  }

  notify(key) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(cb => {
        try { cb(this.state[key], this.state); } catch (e) { console.error(`[Store] Error in subscriber for ${key}:`, e); }
      });
    }
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => {
        try { cb(this.state); } catch (e) { console.error('[Store] Error in global subscriber:', e); }
      });
    }
  }

  get(key) {
    return this.state[key];
  }

  set(key, value, shouldNotify = true) {
    this.state[key] = value;
    if (shouldNotify) this.notify(key);
  }

  async init() {
    if (!window.api) return;

    try {
      const [notes, todos, pomodoro, settings] = await Promise.all([
        window.api.getNotes() || [],
        window.api.getTodos() || [],
        window.api.getPomodoro() || null,
        window.api.getSettings() || {}
      ]);

      this.state.notes = notes;
      this.state.tasks = todos;
      this.state.scratchpad = settings.scratchpad || '';
      this.state.theme = settings.theme || '';

      if (pomodoro) {
        this.state.focus = {
          ...this.state.focus,
          ...pomodoro,
          running: false,
          remaining: pomodoro.duration || 1500
        };
      }

      // Check midnight resets for daily habits
      this._checkDailyHabits();

      // Apply theme
      if (this.state.theme) {
        document.documentElement.setAttribute('data-theme', this.state.theme);
      }

      // Fetch initial calendar events if URL set
      if (settings.icsUrl && window.api.fetchIcsCalendar) {
        window.api.fetchIcsCalendar(settings.icsUrl).then(events => {
          if (events && Array.isArray(events)) {
            this.state.calendarEvents = events;
            this.notify('calendarEvents');
          }
        }).catch(() => {});
      }

      this.notify('tasks');
      this.notify('notes');
      this.notify('scratchpad');
      this.notify('focus');
      this.notify('*');
    } catch (err) {
      console.error('[Store] Initialization failed:', err);
    }
  }

  _checkDailyHabits() {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    this.state.tasks.forEach(t => {
      if (t.isHabit) {
        if (t.completed && t.lastCompletedDate && t.lastCompletedDate < today) {
          t.completed = false; // Reset for new day
          changed = true;
        }
      }
    });

    if (changed) this.persistTasks();
  }

  // ─── TASK ACTIONS ──────────────────────────────────────────
  addTask(taskData) {
    const newTask = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      text: taskData.text.trim(),
      completed: false,
      priority: taskData.priority || 'none',
      dueDate: taskData.dueDate || null,
      isHabit: !!taskData.isHabit,
      streak: taskData.isHabit ? 0 : undefined,
      category: taskData.category || 'personal',
      timestamp: new Date().toISOString()
    };

    this.state.tasks.unshift(newTask);
    this.notify('tasks');
    this.persistTasks();
    return newTask;
  }

  toggleTask(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    const today = new Date().toISOString().split('T')[0];

    if (task.completed) {
      if (window.audioEngine) window.audioEngine.playTaskPop();
      if (task.isHabit) {
        task.streak = (task.streak || 0) + 1;
        task.lastCompletedDate = today;
      }
    } else {
      if (task.isHabit && task.streak > 0) {
        task.streak = Math.max(0, task.streak - 1);
      }
    }

    this.notify('tasks');
    this.persistTasks();
  }

  deleteTask(id) {
    const idx = this.state.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    const [deleted] = this.state.tasks.splice(idx, 1);
    this.undoStack.push({ type: 'task', item: deleted, index: idx });

    this.notify('tasks');
    this.persistTasks();

    if (window.toast) {
      window.toast.show('Task deleted', 'info', {
        label: 'Undo',
        onClick: () => this.undo()
      });
    }
  }

  // ─── NOTE ACTIONS ──────────────────────────────────────────
  addNote(noteData) {
    const newNote = {
      id: Date.now() * 1000 + Math.floor(Math.random() * 1000),
      text: (noteData.text || '').trim(),
      pinned: !!noteData.pinned,
      category: noteData.category || 'personal',
      image: noteData.image || null,
      timestamp: new Date().toISOString()
    };

    this.state.notes.unshift(newNote);
    this.notify('notes');
    this.persistNotes();
    return newNote;
  }

  toggleNotePin(id) {
    const note = this.state.notes.find(n => n.id === id);
    if (!note) return;
    note.pinned = !note.pinned;
    this.notify('notes');
    this.persistNotes();
  }

  deleteNote(id) {
    const idx = this.state.notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    const [deleted] = this.state.notes.splice(idx, 1);
    this.undoStack.push({ type: 'note', item: deleted, index: idx });

    this.notify('notes');
    this.persistNotes();

    if (window.toast) {
      window.toast.show('Note deleted', 'info', {
        label: 'Undo',
        onClick: () => this.undo()
      });
    }
  }

  saveScratchpad(text) {
    this.state.scratchpad = text;
    this._debounceScratchpad();
  }

  _debounceScratchpad() {
    clearTimeout(this._scratchpadTimer);
    this._scratchpadTimer = setTimeout(async () => {
      if (!window.api) return;
      const settings = (await window.api.getSettings()) || {};
      settings.scratchpad = this.state.scratchpad;
      await window.api.saveSettings(settings);
    }, 400);
  }

  // ─── UNDO ENGINE ───────────────────────────────────────────
  undo() {
    if (this.undoStack.length === 0) return;
    const action = this.undoStack.pop();

    if (action.type === 'task') {
      this.state.tasks.splice(action.index, 0, action.item);
      this.notify('tasks');
      this.persistTasks();
      if (window.toast) window.toast.show('Task restored', 'success');
    } else if (action.type === 'note') {
      this.state.notes.splice(action.index, 0, action.item);
      this.notify('notes');
      this.persistNotes();
      if (window.toast) window.toast.show('Note restored', 'success');
    }
  }

  // ─── FOCUS ACTIONS ─────────────────────────────────────────
  startFocus(taskId = null) {
    if (taskId) {
      this.state.focus.linkedTaskId = taskId;
    }
    this.state.focus.running = true;
    this.notify('focus');

    if (window.api && window.api.toggleFocusAssist) {
      window.api.toggleFocusAssist('on');
    }

    if (this.state.focus.soundscape !== 'none' && window.audioEngine) {
      window.audioEngine.startAmbient(this.state.focus.soundscape);
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.state.focus.running) return;

      if (this.state.focus.remaining > 0) {
        this.state.focus.remaining--;
        this.notify('focus');
        this.syncTimerWithWindows();
      } else {
        this.completeFocusSession();
      }
    }, 1000);
  }

  pauseFocus() {
    this.state.focus.running = false;
    clearInterval(this.timerInterval);
    this.notify('focus');
    this.syncTimerWithWindows();

    if (window.audioEngine) {
      window.audioEngine.stopAmbient();
    }
  }

  resetFocus() {
    this.state.focus.running = false;
    this.state.focus.remaining = this.state.focus.duration;
    clearInterval(this.timerInterval);
    this.notify('focus');
    this.syncTimerWithWindows();

    if (window.audioEngine) {
      window.audioEngine.stopAmbient();
    }
  }

  completeFocusSession() {
    this.state.focus.running = false;
    this.state.focus.sessions++;
    this.state.focus.totalMinutes += Math.round(this.state.focus.duration / 60);
    this.state.focus.remaining = this.state.focus.duration;
    clearInterval(this.timerInterval);

    if (window.audioEngine) {
      window.audioEngine.stopAmbient();
      window.audioEngine.playCompletionChime();
    }

    if (window.api && window.api.toggleFocusAssist) {
      window.api.toggleFocusAssist('off');
    }

    if (window.api && window.api.showNotification) {
      window.api.showNotification('Focus Session Complete!', 'Great work! Take a short break to recharge.');
    }

    this.notify('focus');
    this.persistFocus();
    this.syncTimerWithWindows();
  }

  syncTimerWithWindows() {
    if (window.api && window.api.miniTimerUpdate) {
      let taskTitle = null;
      if (this.state.focus.linkedTaskId) {
        const task = this.state.tasks.find(t => t.id === this.state.focus.linkedTaskId);
        if (task) taskTitle = task.text;
      }
      window.api.miniTimerUpdate({
        remaining: this.state.focus.remaining,
        duration: this.state.focus.duration,
        running: this.state.focus.running,
        linkedTaskId: this.state.focus.linkedTaskId,
        taskTitle
      });
    }
  }

  // ─── PERSISTENCE ───────────────────────────────────────────
  persistTasks() {
    if (window.api && window.api.saveTodos) {
      window.api.saveTodos(this.state.tasks);
    }
  }

  persistNotes() {
    if (window.api && window.api.saveNotes) {
      window.api.saveNotes(this.state.notes);
    }
  }

  persistFocus() {
    if (window.api && window.api.savePomodoro) {
      window.api.savePomodoro({
        duration: this.state.focus.duration,
        sessions: this.state.focus.sessions,
        totalMinutes: this.state.focus.totalMinutes,
        lastDate: new Date().toISOString().split('T')[0]
      });
    }
  }
}

window.appStore = new ReactiveStore();
