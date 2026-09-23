/**
 * Palette Component — Raycast-Style Command Palette (Ctrl+K)
 * Fuzzy search across tasks, notes, calendar meetings, and system actions.
 */

class PaletteComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.selectedIndex = 0;
    this.currentResults = [];

    this.render();
    this.bindEvents();

    this.store.subscribe('paletteOpen', (isOpen) => {
      this.toggle(isOpen);
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="palette-backdrop" id="palette-backdrop" style="display:none">
        <div class="palette-box">
          <div class="palette-input-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="palette-query" class="palette-search-input" placeholder="Type a command or search notes & tasks..." autocomplete="off" />
            <span style="font-size:10px; color:var(--text-muted); background:var(--bg-surface); padding:2px 5px; border-radius:4px; border:1px solid var(--border-subtle);">ESC</span>
          </div>
          <div class="palette-results-list" id="palette-results"></div>
        </div>
      </div>
    `;
  }

  toggle(show) {
    const backdrop = this.container.querySelector('#palette-backdrop');
    const input = this.container.querySelector('#palette-query');

    if (show) {
      backdrop.style.display = 'flex';
      input.value = '';
      input.focus();
      this.search('');
    } else {
      backdrop.style.display = 'none';
    }
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#palette-backdrop');
    const input = this.container.querySelector('#palette-query');
    const resultsList = this.container.querySelector('#palette-results');

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.store.set('paletteOpen', false);
      }
    });

    input.addEventListener('input', () => {
      this.search(input.value.trim());
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.store.set('paletteOpen', false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.currentResults.length - 1, this.selectedIndex + 1);
        this.updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      }
    });

    resultsList.addEventListener('click', (e) => {
      const item = e.target.closest('.palette-item');
      if (item) {
        const idx = Number(item.getAttribute('data-index'));
        this.selectedIndex = idx;
        this.executeSelected();
      }
    });
  }

  search(query) {
    const q = query.toLowerCase();
    const results = [];

    // 1. App Navigation Commands
    const commands = [
      { type: 'cmd', label: 'View: Tasks & Habits', action: () => this.store.set('activeView', 'tasks') },
      { type: 'cmd', label: 'View: Notes & Scratchpad', action: () => this.store.set('activeView', 'notes') },
      { type: 'cmd', label: 'View: Focus Studio', action: () => this.store.set('activeView', 'focus') },
      { type: 'cmd', label: 'View: Day Planner Agenda', action: () => this.store.set('activeView', 'planner') },
      { type: 'cmd', label: 'View: Day One Diary & Journal', action: () => this.store.set('activeView', 'diary') },
      { type: 'cmd', label: 'View: Productivity & Analytics', action: () => this.store.set('activeView', 'analytics') },
      { type: 'cmd', label: 'Diary: New Reflection or Voice Note', action: () => { this.store.set('activeView', 'diary'); const t = document.getElementById('compose-content'); if (t) t.focus(); } },
      { type: 'cmd', label: 'Diary: Export Journal Markdown', action: () => this.store.exportDiary() },
      { type: 'cmd', label: 'Tasks: Clear Completed Tasks', action: () => this.store.clearCompletedTasks() },
      { type: 'cmd', label: 'Timer: Start Deep Focus', action: () => { this.store.set('activeView', 'focus'); this.store.startFocus(); } },
      { type: 'cmd', label: 'Timer: Reset Timer', action: () => this.store.resetFocus() },
      { type: 'cmd', label: 'Timer: Pop-out Picture-in-Picture Mini Timer', action: () => {
        const btnPip = document.getElementById('btn-focus-pip');
        if (btnPip) btnPip.click();
      } },
      { type: 'cmd', label: 'Spotify: Toggle Play / Pause', action: () => {
        if (window.spotifyEmbedController) {
          try { window.spotifyEmbedController.togglePlay(); } catch (e) {}
        } else {
          this.store.sendSpotifyMedia('playpause');
        }
      } },
      { type: 'cmd', label: 'Spotify: Next Track', action: () => this.store.sendSpotifyMedia('next') },
      { type: 'cmd', label: 'Spotify: Previous Track', action: () => this.store.sendSpotifyMedia('prev') },
      { type: 'cmd', label: 'Spotify: Open Player in Focus View', action: () => {
        this.store.set('activeView', 'focus');
        const tab = document.getElementById('tab-btn-spotify');
        if (tab) tab.click();
      } },
      { type: 'cmd', label: 'Calendar: Refresh Events', action: () => this.store.refreshCalendarEvents() },
      { type: 'cmd', label: 'Window: Undock / Restore Size', action: () => {
        if (window.api && window.api.undockWindow) window.api.undockWindow();
      } },
      { type: 'cmd', label: 'Window: Toggle Always On Top (Pin Widget)', action: async () => {
        if (window.api && window.api.toggleAlwaysOnTop) {
          const isPinned = await window.api.toggleAlwaysOnTop();
          const pinBtn = document.getElementById('btn-pin-window');
          if (pinBtn) pinBtn.classList.toggle('active', !!isPinned);
          if (window.toast) window.toast.show(isPinned ? 'Window pinned on top' : 'Window unpinned', 'info');
        }
      } },
      { type: 'cmd', label: 'Data: Export Backup JSON', action: async () => {
        if (window.api && window.api.exportData) {
          const res = await window.api.exportData();
          if (res && window.toast) {
            window.toast.show('Data backup exported successfully', 'success');
          }
        }
      } },
      { type: 'cmd', label: 'Data: Restore Backup from JSON', action: async () => {
        if (window.api && window.api.importData) {
          const res = await window.api.importData();
          if (res) {
            await this.store.init();
            if (window.toast) window.toast.show('Data restored successfully', 'success');
          }
        }
      } },
      { type: 'cmd', label: 'Settings: Open Preferences', action: () => this.store.set('settingsOpen', true) }
    ];

    commands.forEach(cmd => {
      if (!q || cmd.label.toLowerCase().includes(q)) {
        results.push(cmd);
      }
    });

    // 2. Tasks
    const tasks = this.store.get('tasks');
    tasks.forEach(task => {
      if (!q || task.text.toLowerCase().includes(q)) {
        results.push({
          type: 'task',
          label: task.text,
          badge: task.completed ? 'Done' : (task.dueDate || 'Task'),
          action: () => {
            this.store.set('activeView', 'tasks');
          }
        });
      }
    });

    // 3. Notes
    const notes = this.store.get('notes');
    notes.forEach(note => {
      if (!q || note.text.toLowerCase().includes(q)) {
        const snippet = note.text.length > 50 ? note.text.substring(0, 50) + '...' : note.text;
        results.push({
          type: 'note',
          label: snippet,
          badge: 'Note',
          action: () => {
            this.store.set('activeView', 'notes');
          }
        });
      }
    });

    this.currentResults = results.slice(0, 15);
    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    const list = this.container.querySelector('#palette-results');
    if (this.currentResults.length === 0) {
      list.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">
          No matching commands or items
        </div>
      `;
      return;
    }

    list.innerHTML = this.currentResults.map((item, idx) => `
      <div class="palette-item ${idx === this.selectedIndex ? 'active' : ''}" data-index="${idx}">
        <span>${this.escapeHtml(item.label)}</span>
        <span style="font-size:10px; opacity:0.6; text-transform:uppercase;">${item.badge || item.type}</span>
      </div>
    `).join('');
  }

  updateSelection() {
    const items = this.container.querySelectorAll('.palette-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === this.selectedIndex);
      if (idx === this.selectedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  executeSelected() {
    const selected = this.currentResults[this.selectedIndex];
    if (selected && selected.action) {
      this.store.set('paletteOpen', false);
      selected.action();
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

window.PaletteComponent = PaletteComponent;
