/**
 * App Controller for Doing It
 * Mounts modular components, manages view transitions, keyboard shortcuts, and IPC lifecycle.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.appStore;

  // 1. Initialize Header
  new window.HeaderComponent('header-root', store);

  // 2. Initialize Views
  new window.TasksViewComponent('view-tasks', store);
  new window.NotesViewComponent('view-notes', store);
  new window.FocusViewComponent('view-focus', store);
  new window.PlannerViewComponent('view-planner', store);

  // 3. Initialize Command Palette
  new window.PaletteComponent('palette-root', store);

  // 4. Initialize In-App Settings Modal
  new window.SettingsViewComponent('settings-root', store);

  // 5. View Switching
  store.subscribe('activeView', (activeView) => {
    ['tasks', 'notes', 'focus', 'planner'].forEach(view => {
      const el = document.getElementById(`view-${view}`);
      if (el) {
        el.style.display = view === activeView ? 'flex' : 'none';
      }
    });
  });

  // Set initial view visibility
  ['tasks', 'notes', 'focus', 'planner'].forEach(view => {
    const el = document.getElementById(`view-${view}`);
    if (el) {
      el.style.display = view === 'tasks' ? 'flex' : 'none';
      el.style.flex = '1';
      el.style.overflow = 'hidden';
    }
  });

  // 6. Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // Ctrl+K / Cmd+K: Command Palette
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      store.set('paletteOpen', !store.get('paletteOpen'));
      return;
    }

    // Ctrl+,: Settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      store.set('settingsOpen', !store.get('settingsOpen'));
      return;
    }

    if (e.key === 'Escape') {
      if (store.get('settingsOpen')) {
        store.set('settingsOpen', false);
        return;
      }
      if (store.get('paletteOpen')) {
        store.set('paletteOpen', false);
        return;
      }
      if (!isTyping) {
        if (window.api && window.api.minimizeWindow) {
          window.api.minimizeWindow();
        }
      }
      return;
    }

    // Number keys 1-4 for instant view navigation
    if (!isTyping) {
      if (e.key === '1') { e.preventDefault(); store.set('activeView', 'tasks'); }
      else if (e.key === '2') { e.preventDefault(); store.set('activeView', 'notes'); }
      else if (e.key === '3') { e.preventDefault(); store.set('activeView', 'focus'); }
      else if (e.key === '4') { e.preventDefault(); store.set('activeView', 'planner'); }
    } else if (e.ctrlKey) {
      if (e.key === '1') { e.preventDefault(); store.set('activeView', 'tasks'); }
      else if (e.key === '2') { e.preventDefault(); store.set('activeView', 'notes'); }
      else if (e.key === '3') { e.preventDefault(); store.set('activeView', 'focus'); }
      else if (e.key === '4') { e.preventDefault(); store.set('activeView', 'planner'); }
    }
  });

  // 6. IPC Subscriptions
  if (window.api) {
    // Data sync from Quick Add or Smart Clipboard
    if (window.api.onDataChanged) {
      window.api.onDataChanged(async () => {
        const [notes, todos] = await Promise.all([
          window.api.getNotes() || [],
          window.api.getTodos() || []
        ]);
        store.set('notes', notes);
        store.set('tasks', todos);
      });
    }

    // Theme changes
    if (window.api.onThemeUpdated) {
      window.api.onThemeUpdated((theme) => {
        store.set('theme', theme);
        if (theme) {
          document.documentElement.setAttribute('data-theme', theme);
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      });
    }

    // Timer sync from PiP mini timer
    if (window.api.onTimerSync) {
      window.api.onTimerSync((sync) => {
        if (!sync) return;
        store.state.focus.remaining = sync.remaining;
        store.state.focus.duration = sync.duration;
        store.state.focus.running = sync.running;
        store.notify('focus');
      });
    }

    // Smart lock screen pause
    if (window.api.onTimerPause) {
      window.api.onTimerPause(() => {
        if (store.get('focus').running) {
          store.pauseFocus();
          if (window.toast) window.toast.show('Timer paused (screen locked)', 'info');
        }
      });
    }

    // Dock state
    if (window.api.onDockStateChanged) {
      window.api.onDockStateChanged((docked) => {
        document.body.classList.toggle('docked', docked);
      });
    }

    // In-App Settings Trigger
    if (window.api.onOpenInAppSettings) {
      window.api.onOpenInAppSettings(() => {
        store.set('settingsOpen', true);
      });
    }
  }

  // 7. Initialize Store Data
  await store.init();
});
