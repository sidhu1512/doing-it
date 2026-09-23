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
  new window.DiaryViewComponent('view-diary', store);
  new window.AnalyticsViewComponent('view-analytics', store);

  // 3. Initialize Command Palette
  new window.PaletteComponent('palette-root', store);

  // 4. Initialize In-App Settings Modal
  new window.SettingsViewComponent('settings-root', store);

  // 5. View Switching
  const ALL_VIEWS = ['tasks', 'notes', 'focus', 'planner', 'diary', 'analytics'];
  store.subscribe('activeView', (activeView) => {
    document.querySelectorAll('.kb-highlight').forEach(el => el.classList.remove('kb-highlight'));
    ALL_VIEWS.forEach(view => {
      const el = document.getElementById(`view-${view}`);
      if (el) {
        el.style.display = view === activeView ? 'flex' : 'none';
      }
    });
  });

  // Set initial view visibility
  ALL_VIEWS.forEach(view => {
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
      const highlighted = document.querySelector('.kb-highlight');
      if (highlighted) {
        highlighted.classList.remove('kb-highlight');
        return;
      }
      if (!isTyping) {
        if (window.api && window.api.minimizeWindow) {
          window.api.minimizeWindow();
        }
      }
      return;
    }

    // Number keys 1-6 for instant view navigation
    if (!isTyping) {
      if (e.key === '1') { e.preventDefault(); store.set('activeView', 'tasks'); }
      else if (e.key === '2') { e.preventDefault(); store.set('activeView', 'notes'); }
      else if (e.key === '3') { e.preventDefault(); store.set('activeView', 'focus'); }
      else if (e.key === '4') { e.preventDefault(); store.set('activeView', 'planner'); }
      else if (e.key === '5') { e.preventDefault(); store.set('activeView', 'diary'); }
      else if (e.key === '6') { e.preventDefault(); store.set('activeView', 'analytics'); }
    } else if (e.ctrlKey) {
      if (e.key === '1') { e.preventDefault(); store.set('activeView', 'tasks'); }
      else if (e.key === '2') { e.preventDefault(); store.set('activeView', 'notes'); }
      else if (e.key === '3') { e.preventDefault(); store.set('activeView', 'focus'); }
      else if (e.key === '4') { e.preventDefault(); store.set('activeView', 'planner'); }
      else if (e.key === '5') { e.preventDefault(); store.set('activeView', 'diary'); }
      else if (e.key === '6') { e.preventDefault(); store.set('activeView', 'analytics'); }
    }

    // List item keyboard navigation (Arrows, Space, Enter, Delete)
    if (!isTyping && !store.get('paletteOpen') && !store.get('settingsOpen')) {
      const currentView = store.get('activeView') || 'tasks';
      let selector = '';
      if (currentView === 'tasks') selector = '#view-tasks .task-card';
      else if (currentView === 'notes') selector = '#view-notes .note-card';
      else if (currentView === 'planner') selector = '#view-planner .agenda-item';

      if (selector && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const items = Array.from(document.querySelectorAll(selector)).filter(el => el.offsetParent !== null);
        if (items.length > 0) {
          e.preventDefault();
          const currentIndex = items.findIndex(el => el.classList.contains('kb-highlight'));
          let nextIndex = 0;
          if (e.key === 'ArrowDown') {
            nextIndex = currentIndex === -1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
          } else {
            nextIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
          }
          if (currentIndex !== -1 && items[currentIndex]) {
            items[currentIndex].classList.remove('kb-highlight');
          }
          items[nextIndex].classList.add('kb-highlight');
          items[nextIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }
      }

      const highlighted = document.querySelector('.kb-highlight');
      if (highlighted) {
        if (e.key === ' ') {
          e.preventDefault();
          const cb = highlighted.querySelector('.custom-checkbox');
          if (cb) cb.click();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const titleEl = highlighted.querySelector('.task-title');
          if (titleEl) {
            titleEl.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
            return;
          }
          const joinBtn = highlighted.querySelector('.btn-join-meeting');
          if (joinBtn) {
            joinBtn.click();
            return;
          }
        }
        if (e.key === 'Delete') {
          e.preventDefault();
          const delBtn = highlighted.querySelector('.btn-task-delete, .btn-note-delete');
          if (delBtn) {
            delBtn.click();
            return;
          }
        }
      }
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
