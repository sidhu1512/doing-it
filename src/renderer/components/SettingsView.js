/**
 * SettingsView Component — Linear / Raycast Inspired In-App Settings
 * Provides full control over themes, storage sync, floating bubble, startup, calendar, and shortcuts
 * without ever popping up an external window.
 */

class SettingsViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;

    this.themes = [
      { id: '', name: 'Obsidian', color: '#a2a2b0' },
      { id: 'midnight', name: 'Midnight', color: '#38bdf8' },
      { id: 'emerald', name: 'Emerald', color: '#10b981' },
      { id: 'sunset', name: 'Sunset', color: '#f59e0b' },
      { id: 'crimson', name: 'Crimson', color: '#f43f5e' },
      { id: 'violet', name: 'Violet', color: '#a855f7' },
      { id: 'light', name: 'Daybreak', color: '#2563eb' }
    ];

    this.render();
    this.bindEvents();

    this.store.subscribe('settingsOpen', (isOpen) => {
      this.toggle(isOpen);
    });

    this.store.subscribe('theme', (theme) => {
      this.updateActiveThemeChip(theme);
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="settings-modal-wrapper" id="settings-modal-wrapper" style="display:none;">
        <div class="settings-panel">
          <!-- Header -->
          <div class="settings-panel-header">
            <div class="settings-panel-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings & Preferences</span>
            </div>
            <button class="settings-done-btn" id="btn-close-settings-modal">
              Done <span style="font-size:10px; opacity:0.6; margin-left:4px;">(Esc)</span>
            </button>
          </div>

          <!-- Content Body -->
          <div class="settings-panel-content">
            <!-- 1. Color Themes -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Visual Aesthetic</span>
                <span class="settings-card-desc">Choose a rich desktop theme palette</span>
              </div>
              <div class="theme-picker-grid" id="theme-picker-grid">
                ${this.themes.map(t => `
                  <div class="theme-chip" data-theme-id="${t.id}">
                    <span class="theme-chip-dot" style="background:${t.color};"></span>
                    <span>${t.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 2. Storage Location -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Storage Location</span>
                <span class="settings-card-desc">Sync your data seamlessly with OneDrive, Google Drive, or Dropbox</span>
              </div>
              <div class="settings-path-box" id="inapp-settings-path">Loading storage path...</div>
              <div style="display:flex; gap:8px; margin-top:6px;">
                <button class="settings-action-btn primary" id="inapp-btn-change-path">Change Folder</button>
                <button class="settings-action-btn secondary" id="inapp-btn-reset-path">Reset to Default</button>
              </div>
            </div>

            <!-- 3. Floating Bubble (FAB) -->
            <div class="settings-card">
              <div class="settings-toggle-row">
                <div>
                  <div class="settings-card-title">Floating Bubble (AssistiveTouch)</div>
                  <div class="settings-card-desc">Show draggable floating bubble when app is minimized</div>
                </div>
                <input type="checkbox" id="inapp-toggle-fab" style="width:16px; height:16px; accent-color:var(--accent-primary); cursor:pointer;" checked />
              </div>
            </div>

            <!-- 4. Always on Top Pin -->
            <div class="settings-card">
              <div class="settings-toggle-row">
                <div>
                  <div class="settings-card-title">Keep Window Always on Top</div>
                  <div class="settings-card-desc">Pin the widget floating above all other application windows</div>
                </div>
                <input type="checkbox" id="inapp-toggle-pin" style="width:16px; height:16px; accent-color:var(--accent-primary); cursor:pointer;" />
              </div>
            </div>

            <!-- 5. Windows Startup -->
            <div class="settings-card">
              <div class="settings-toggle-row">
                <div>
                  <div class="settings-card-title">Launch on Windows Startup</div>
                  <div class="settings-card-desc">Start quietly in the background when your computer boots</div>
                </div>
                <input type="checkbox" id="inapp-toggle-autostart" style="width:16px; height:16px; accent-color:var(--accent-primary); cursor:pointer;" />
              </div>
            </div>

            <!-- 5. Calendar Feed (.ics) -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Calendar Feed (.ics)</span>
                <span class="settings-card-desc">Paste secret iCal URL from Google Calendar, Outlook, or Apple</span>
              </div>
              <div style="display:flex; gap:8px; margin-top:6px;">
                <input type="text" id="inapp-ics-input" class="settings-text-input" placeholder="https://calendar.google.com/...basic.ics" />
                <button class="settings-action-btn primary" id="inapp-btn-save-ics">Save</button>
              </div>
            </div>

            <!-- 6. Spotify Integration -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Spotify Focus Integration</span>
                <span class="settings-card-desc">Control Spotify playback and auto-sync with your focus sessions</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
                <div class="settings-toggle-row">
                  <div>
                    <div style="font-size:12px; font-weight:500; color:var(--text-primary);">Auto-play on Focus Start</div>
                    <div class="settings-card-desc">Automatically unpause Spotify when starting a focus session</div>
                  </div>
                  <input type="checkbox" id="inapp-toggle-spotify-autoplay" style="width:16px; height:16px; accent-color:var(--accent-primary); cursor:pointer;" />
                </div>
                <div class="settings-toggle-row">
                  <div>
                    <div style="font-size:12px; font-weight:500; color:var(--text-primary);">Auto-pause on Complete</div>
                    <div class="settings-card-desc">Automatically pause Spotify when session completes or pauses</div>
                  </div>
                  <input type="checkbox" id="inapp-toggle-spotify-autopause" style="width:16px; height:16px; accent-color:var(--accent-primary); cursor:pointer;" checked />
                </div>
                <div>
                  <div style="font-size:11.5px; font-weight:500; color:var(--text-secondary); margin-bottom:4px;">Custom Focus Playlist Link:</div>
                  <div style="display:flex; gap:8px;">
                    <input type="text" id="inapp-spotify-custom-url" class="settings-text-input" placeholder="spotify:playlist:... or https://open.spotify.com/playlist/..." />
                    <button class="settings-action-btn primary" id="inapp-btn-save-spotify-url">Save</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 7. Shortcuts -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Keyboard Shortcuts</span>
              </div>
              <div class="settings-shortcuts-grid">
                <div class="settings-shortcut-row"><span>Command Palette</span><span class="shortcut-pill">Ctrl + K</span></div>
                <div class="settings-shortcut-row"><span>Quick Add Dialog</span><span class="shortcut-pill">Ctrl + Shift + N</span></div>
                <div class="settings-shortcut-row"><span>Clip from Clipboard</span><span class="shortcut-pill">Ctrl + Shift + C</span></div>
                <div class="settings-shortcut-row"><span>Switch Views</span><span class="shortcut-pill">1, 2, 3, 4</span></div>
                <div class="settings-shortcut-row"><span>Settings</span><span class="shortcut-pill">Ctrl + ,</span></div>
                <div class="settings-shortcut-row"><span>Minimize / Close</span><span class="shortcut-pill">Esc</span></div>
              </div>
            </div>

            <!-- 7. Data Protection -->
            <div class="settings-card">
              <div class="settings-card-header">
                <span class="settings-card-title">Data Protection & Integrity</span>
                <span class="settings-card-desc">Atomic file writes prevent data loss. Rolling backups are created automatically on each startup.</span>
              </div>
              <div style="display:flex; gap:8px; margin-top:8px;">
                <button class="settings-action-btn secondary" id="inapp-btn-export-data">Export Backup (JSON)</button>
                <button class="settings-action-btn secondary" id="inapp-btn-import-data">Restore Backup</button>
              </div>
            </div>

            <!-- 8. App Management & Uninstall -->
            <div class="settings-card" style="border-color:rgba(248,113,113,0.2);">
              <div class="settings-card-header">
                <span class="settings-card-title" style="color:var(--danger);">Uninstall Doing It</span>
                <span class="settings-card-desc">Completely remove the application, desktop shortcuts, and temporary files from this computer in 1 click.</span>
              </div>
              <div style="margin-top:6px;">
                <button class="settings-action-btn" id="inapp-btn-uninstall" style="color:var(--danger); border:1px solid rgba(248,113,113,0.3); background:rgba(248,113,113,0.08);">
                  Uninstall Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async toggle(open) {
    const modal = this.container.querySelector('#settings-modal-wrapper');
    if (!modal) return;

    if (open) {
      modal.style.display = 'flex';
      await this.refreshSettingsUI();
    } else {
      modal.style.display = 'none';
    }
  }

  async refreshSettingsUI() {
    if (!window.api) return;

    try {
      // 1. Current Storage Path
      const pathBox = this.container.querySelector('#inapp-settings-path');
      if (pathBox && window.api.getCurrentStorePath) {
        const storePath = await window.api.getCurrentStorePath();
        pathBox.textContent = storePath || 'Default user data path';
      }

      // 2. Settings Object
      const settings = (await window.api.getSettings()) || {};

      // Active theme
      const curTheme = this.store.get('theme') || settings.theme || '';
      this.updateActiveThemeChip(curTheme);

      // FAB Toggle
      const fabToggle = this.container.querySelector('#inapp-toggle-fab');
      if (fabToggle) {
        fabToggle.checked = !settings.disableFab;
      }

      // Pin Toggle
      const pinToggle = this.container.querySelector('#inapp-toggle-pin');
      if (pinToggle && window.api && window.api.getAlwaysOnTop) {
        const isPinned = await window.api.getAlwaysOnTop();
        pinToggle.checked = !!isPinned;
      }

      // Autostart Toggle
      const autostartToggle = this.container.querySelector('#inapp-toggle-autostart');
      if (autostartToggle) {
        autostartToggle.checked = !!settings.launchAtStartup;
      }

      // ICS Input
      const icsInput = this.container.querySelector('#inapp-ics-input');
      if (icsInput) {
        icsInput.value = settings.icsUrl || '';
      }

      // Spotify Settings
      const spotifySettings = settings.spotify || {};
      const spotifyAutoplay = this.container.querySelector('#inapp-toggle-spotify-autoplay');
      if (spotifyAutoplay) {
        spotifyAutoplay.checked = !!spotifySettings.autoPlayOnFocus;
      }
      const spotifyAutopause = this.container.querySelector('#inapp-toggle-spotify-autopause');
      if (spotifyAutopause) {
        spotifyAutopause.checked = spotifySettings.autoPauseOnComplete !== false;
      }
      const spotifyUrlInput = this.container.querySelector('#inapp-spotify-custom-url');
      if (spotifyUrlInput) {
        spotifyUrlInput.value = spotifySettings.customPlaylistUrl || '';
      }
    } catch (e) {
      console.error('[SettingsView] Error refreshing settings:', e);
    }
  }

  updateActiveThemeChip(theme) {
    const chips = this.container.querySelectorAll('.theme-chip');
    chips.forEach(chip => {
      const id = chip.getAttribute('data-theme-id');
      chip.classList.toggle('active', id === (theme || ''));
    });
  }

  bindEvents() {
    // Close Done Button
    this.container.querySelector('#btn-close-settings-modal').addEventListener('click', () => {
      this.store.set('settingsOpen', false);
    });

    // Theme Chips Selection
    const grid = this.container.querySelector('#theme-picker-grid');
    grid.addEventListener('click', async (e) => {
      const chip = e.target.closest('.theme-chip');
      if (!chip) return;

      const themeId = chip.getAttribute('data-theme-id');
      const themeObj = this.themes.find(t => t.id === themeId);

      this.store.set('theme', themeId);
      if (themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }

      this.updateActiveThemeChip(themeId);

      if (window.toast && themeObj) {
        window.toast.show(`Theme: ${themeObj.name}`, 'info');
      }

      if (window.api && window.api.saveSettings) {
        const settings = (await window.api.getSettings()) || {};
        settings.theme = themeId;
        await window.api.saveSettings(settings);
      }
    });

    // Change Path
    this.container.querySelector('#inapp-btn-change-path').addEventListener('click', async () => {
      if (!window.api || !window.api.chooseDirectory) return;
      const newPath = await window.api.chooseDirectory();
      if (newPath) {
        const settings = (await window.api.getSettings()) || {};
        settings.savePath = newPath;
        await window.api.saveSettings(settings);

        const updatedPath = await window.api.getCurrentStorePath();
        this.container.querySelector('#inapp-settings-path').textContent = updatedPath;
        if (window.toast) window.toast.show('Storage path updated', 'success');
      }
    });

    // Reset Path
    this.container.querySelector('#inapp-btn-reset-path').addEventListener('click', async () => {
      if (!window.api) return;
      const settings = (await window.api.getSettings()) || {};
      settings.savePath = null;
      await window.api.saveSettings(settings);

      const updatedPath = await window.api.getCurrentStorePath();
      this.container.querySelector('#inapp-settings-path').textContent = updatedPath;
      if (window.toast) window.toast.show('Reset to default storage path', 'info');
    });

    // Toggle FAB
    this.container.querySelector('#inapp-toggle-fab').addEventListener('change', async (e) => {
      if (!window.api) return;
      const disableFab = !e.target.checked;
      const settings = (await window.api.getSettings()) || {};
      settings.disableFab = disableFab;
      await window.api.saveSettings(settings);
      if (window.api.toggleFab) window.api.toggleFab(disableFab);
      if (window.toast) window.toast.show(disableFab ? 'Floating bubble disabled' : 'Floating bubble enabled', 'info');
    });

    // Toggle Pin Always-on-top
    const pinToggle = this.container.querySelector('#inapp-toggle-pin');
    if (pinToggle) {
      pinToggle.addEventListener('change', async () => {
        if (!window.api || !window.api.toggleAlwaysOnTop) return;
        const isPinned = await window.api.toggleAlwaysOnTop();
        pinToggle.checked = isPinned;
        const headerPinBtn = document.getElementById('btn-pin-window');
        if (headerPinBtn) headerPinBtn.classList.toggle('active', isPinned);
        if (window.toast) window.toast.show(isPinned ? 'Window pinned on top' : 'Window unpinned', 'info');
      });
    }

    // Toggle Autostart
    this.container.querySelector('#inapp-toggle-autostart').addEventListener('change', async (e) => {
      if (!window.api) return;
      const launchAtStartup = e.target.checked;
      const settings = (await window.api.getSettings()) || {};
      settings.launchAtStartup = launchAtStartup;
      await window.api.saveSettings(settings);
      if (window.toast) window.toast.show(launchAtStartup ? 'Launch on startup enabled' : 'Launch on startup disabled', 'info');
    });

    // Save ICS
    this.container.querySelector('#inapp-btn-save-ics').addEventListener('click', async () => {
      if (!window.api) return;
      const input = this.container.querySelector('#inapp-ics-input');
      const url = input.value.trim();
      const settings = (await window.api.getSettings()) || {};
      settings.icsUrl = url || null;
      await window.api.saveSettings(settings);

      if (url && window.api.fetchIcsCalendar) {
        try {
          const events = await window.api.fetchIcsCalendar(url);
          if (events && Array.isArray(events)) {
            this.store.set('calendarEvents', events);
          }
        } catch (err) {}
      }

      if (window.toast) window.toast.show('Calendar settings saved', 'success');
    });

    // Spotify Autoplay Toggle
    const spotifyAutoplayToggle = this.container.querySelector('#inapp-toggle-spotify-autoplay');
    if (spotifyAutoplayToggle) {
      spotifyAutoplayToggle.addEventListener('change', async (e) => {
        if (!window.api) return;
        const checked = e.target.checked;
        const settings = (await window.api.getSettings()) || {};
        if (!settings.spotify) settings.spotify = {};
        settings.spotify.autoPlayOnFocus = checked;
        await window.api.saveSettings(settings);
        this.store.state.spotify.autoPlayOnFocus = checked;
        if (window.toast) window.toast.show(checked ? 'Spotify auto-play enabled' : 'Spotify auto-play disabled', 'info');
      });
    }

    // Spotify Autopause Toggle
    const spotifyAutopauseToggle = this.container.querySelector('#inapp-toggle-spotify-autopause');
    if (spotifyAutopauseToggle) {
      spotifyAutopauseToggle.addEventListener('change', async (e) => {
        if (!window.api) return;
        const checked = e.target.checked;
        const settings = (await window.api.getSettings()) || {};
        if (!settings.spotify) settings.spotify = {};
        settings.spotify.autoPauseOnComplete = checked;
        await window.api.saveSettings(settings);
        this.store.state.spotify.autoPauseOnComplete = checked;
        if (window.toast) window.toast.show(checked ? 'Spotify auto-pause enabled' : 'Spotify auto-pause disabled', 'info');
      });
    }

    // Save Custom Spotify Playlist URL
    const spotifySaveUrlBtn = this.container.querySelector('#inapp-btn-save-spotify-url');
    if (spotifySaveUrlBtn) {
      spotifySaveUrlBtn.addEventListener('click', async () => {
        if (!window.api) return;
        const input = this.container.querySelector('#inapp-spotify-custom-url');
        const url = input.value.trim();
        const settings = (await window.api.getSettings()) || {};
        if (!settings.spotify) settings.spotify = {};
        settings.spotify.customPlaylistUrl = url;
        await window.api.saveSettings(settings);
        this.store.state.spotify.customPlaylistUrl = url;
        this.store.notify('spotify');
        if (window.toast) window.toast.show('Spotify playlist saved', 'success');
      });
    }

    // Export Data Backup
    const btnExport = this.container.querySelector('#inapp-btn-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        if (!window.api || !window.api.exportData) return;
        const res = await window.api.exportData();
        if (res && window.toast) {
          window.toast.show('Data backup exported successfully', 'success');
        }
      });
    }

    // Import Data Backup
    const btnImport = this.container.querySelector('#inapp-btn-import-data');
    if (btnImport) {
      btnImport.addEventListener('click', async () => {
        if (!window.api || !window.api.importData) return;
        const res = await window.api.importData();
        if (res) {
          await this.store.init();
          await this.refreshSettingsUI();
          if (window.toast) {
            window.toast.show('Data backup restored successfully', 'success');
          }
        }
      });
    }

    // Uninstall Button (1-Click Direct Uninstall)
    const btnUninstall = this.container.querySelector('#inapp-btn-uninstall');
    if (btnUninstall) {
      btnUninstall.addEventListener('click', () => {
        if (window.api && window.api.uninstallApp) {
          window.api.uninstallApp();
        }
      });
    }
  }
}

window.SettingsViewComponent = SettingsViewComponent;
