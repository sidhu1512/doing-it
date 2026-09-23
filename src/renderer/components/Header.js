/**
 * Header Component for Doing It
 * Features drag region, live date badge, view switcher pill, and window controls.
 */

class HeaderComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.themes = [
      { id: '', name: 'Obsidian Silver' },
      { id: 'midnight', name: 'Midnight Blue' },
      { id: 'emerald', name: 'Emerald Forest' },
      { id: 'sunset', name: 'Warm Sunset' },
      { id: 'crimson', name: 'Crimson Rose' },
      { id: 'violet', name: 'Amethyst Violet' },
      { id: 'light', name: 'Daybreak Light' }
    ];
    this.render();
    this.bindEvents();

    this.store.subscribe('activeView', (view) => {
      this.updateActivePill(view);
    });
  }

  formatCurrentDate() {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }

  render() {
    this.container.innerHTML = `
      <header class="header-container">
        <div class="header-bar">
          <div class="header-left">
            <div class="header-logo">
              <img src="assets/icon.png" class="header-logo-img" alt="Doing It" />
              <span>Doing It</span>
            </div>
            <span class="date-pill">${this.formatCurrentDate()}</span>
          </div>

          <div class="header-actions">
            <button class="action-btn" id="btn-palette" title="Command Palette (Ctrl+K)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="action-btn" id="btn-theme-cycle" title="Cycle Color Theme">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10V2z"/></svg>
            </button>
            <button class="action-btn" id="btn-open-settings" title="Settings (Ctrl+,)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button class="action-btn" id="btn-pin-window" title="Toggle Always on Top (Pin)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" id="icon-pin"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v8l-2 2v2z"/></svg>
            </button>
            <button class="action-btn" id="btn-minimize" title="Minimize to AssistiveTouch (Esc)">
              <svg width="10" height="10" viewBox="0 0 12 12"><rect y="5" width="12" height="2" rx="1" fill="currentColor"/></svg>
            </button>
            <button class="action-btn close-btn" id="btn-close" title="Close">
              <svg width="10" height="10" viewBox="0 0 12 12"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>

        <div class="nav-bar">
          <div class="view-switcher" id="view-switcher">
            <button class="switcher-btn active" data-view="tasks" title="Tasks & Habits (1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Tasks
            </button>
            <button class="switcher-btn" data-view="notes" title="Notes & Scratchpad (2)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
              Notes
            </button>
            <button class="switcher-btn" data-view="focus" title="Focus Studio (3)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Focus
            </button>
            <button class="switcher-btn" data-view="planner" title="Day Agenda & Meetings (4)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Planner
            </button>
          </div>
        </div>
      </header>
    `;
  }

  updateActivePill(view) {
    this.container.querySelectorAll('.switcher-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });
  }

  bindEvents() {
    // View Switcher clicks
    this.container.querySelectorAll('.switcher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.store.set('activeView', view);
      });
    });

    // Palette Trigger
    this.container.querySelector('#btn-palette').addEventListener('click', () => {
      this.store.set('paletteOpen', true);
    });

    // Theme Cycle
    this.container.querySelector('#btn-theme-cycle').addEventListener('click', async () => {
      const current = this.store.get('theme') || '';
      const currentIdx = this.themes.findIndex(t => t.id === current);
      const nextTheme = this.themes[(currentIdx + 1) % this.themes.length];

      this.store.set('theme', nextTheme.id);
      if (nextTheme.id) {
        document.documentElement.setAttribute('data-theme', nextTheme.id);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      if (window.toast) {
        window.toast.show(`Theme: ${nextTheme.name}`, 'info');
      }

      if (window.api && window.api.saveSettings) {
        const settings = (await window.api.getSettings()) || {};
        settings.theme = nextTheme.id;
        await window.api.saveSettings(settings);
      }
    });

    // Settings (Open In-App Panel)
    this.container.querySelector('#btn-open-settings').addEventListener('click', () => {
      const isOpen = this.store.get('settingsOpen');
      this.store.set('settingsOpen', !isOpen);
    });

    // Pin Window Always-on-top
    const pinBtn = this.container.querySelector('#btn-pin-window');
    if (pinBtn && window.api && window.api.getAlwaysOnTop) {
      window.api.getAlwaysOnTop().then(pinned => {
        pinBtn.classList.toggle('active', !!pinned);
      }).catch(() => {});

      pinBtn.addEventListener('click', async () => {
        if (window.api.toggleAlwaysOnTop) {
          const isPinned = await window.api.toggleAlwaysOnTop();
          pinBtn.classList.toggle('active', !!isPinned);
          if (window.toast) {
            window.toast.show(isPinned ? 'Window pinned on top' : 'Window unpinned', 'info');
          }
        }
      });
    }

    // Minimize to FAB
    this.container.querySelector('#btn-minimize').addEventListener('click', () => {
      if (window.api && window.api.minimizeWindow) {
        window.api.minimizeWindow();
      }
    });

    // Close
    this.container.querySelector('#btn-close').addEventListener('click', () => {
      if (window.api && window.api.closeWindow) {
        window.api.closeWindow();
      }
    });
  }
}

window.HeaderComponent = HeaderComponent;
