/**
 * FocusView Component — Endel & Flow Inspired Focus Studio
 * High-precision circular countdown ring, linked active task, synthesized ambient audio, and embedded Spotify player.
 */

class FocusViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.CIRCUMFERENCE = 2 * Math.PI * 96; // ~603.18
    this.activeAudioTab = 'ambient';
    this.spotifyController = null;
    this.currentSpotifyUri = 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ';
    this.isSpotifyInitialized = false;

    this.render();
    this.bindEvents();
    this.syncFocusUI(this.store.get('focus'));

    this.store.subscribe('focus', (focus) => this.syncFocusUI(focus));
    this.store.subscribe('spotify', (spotify) => this.syncSpotifyUI(spotify));
    this.syncSpotifyUI(this.store.get('spotify'));
  }

  toSpotifyUri(input) {
    if (!input || typeof input !== 'string') return 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ';
    input = input.trim();
    if (input.startsWith('spotify:')) return input;
    const match = input.match(/open\.spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/);
    if (match) return `spotify:${match[1]}:${match[2]}`;
    return 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ';
  }

  toEmbedUrl(uriOrUrl) {
    const uri = this.toSpotifyUri(uriOrUrl);
    const parts = uri.split(':');
    if (parts.length >= 3) {
      const type = parts[1];
      const id = parts[2];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
    }
    return 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0';
  }

  render() {
    this.container.innerHTML = `
      <div class="view-container">
        <div class="focus-studio">
          <!-- Active Task Linkage Banner -->
          <div class="focus-task-card" id="focus-task-card" style="display:none">
            <div>
              <div class="focus-task-label">Active Focus Task</div>
              <div class="focus-task-name" id="focus-task-name"></div>
            </div>
            <button class="task-action-btn" id="btn-complete-focus-task" style="color:var(--success); border-color:rgba(52,211,153,0.3);">
              Done
            </button>
          </div>

          <!-- Circular Timer Ring -->
          <div class="timer-circle-wrapper">
            <svg viewBox="0 0 210 210" class="timer-svg">
              <circle cx="105" cy="105" r="96" class="timer-track" />
              <circle cx="105" cy="105" r="96" class="timer-progress-arc" id="focus-progress-arc" />
            </svg>
            <div class="timer-center-content">
              <div class="timer-digits" id="focus-digits">25:00</div>
              <div class="timer-phase-label" id="focus-phase-label">Focus Session</div>
            </div>
          </div>

          <!-- Timer Actions Row -->
          <div class="timer-actions-row">
            <button class="btn-secondary-timer" id="btn-focus-reset" title="Reset Session">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>

            <button class="btn-primary-play" id="btn-focus-toggle" title="Start Focus">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" id="icon-focus-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" id="icon-focus-pause" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>

            <button class="btn-secondary-timer" id="btn-focus-pip" title="Pop-out Picture-in-Picture Mini Timer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
          </div>

          <!-- Audio & Music Companion Card -->
          <div class="audio-control-card">
            <div class="audio-tab-header">
              <div class="audio-tab-buttons">
                <button class="audio-tab-btn active" id="tab-btn-ambient">Ambient Sounds</button>
                <button class="audio-tab-btn" id="tab-btn-spotify">Spotify Player</button>
              </div>
              <span id="audio-type-label" class="audio-status-tag">None</span>
            </div>

            <!-- Panel 1: Synthesized Ambient Audio -->
            <div id="panel-ambient-audio">
              <div class="soundscapes-grid" id="soundscapes-row">
                <button class="sound-btn active" data-sound="none">Mute</button>
                <button class="sound-btn" data-sound="brown">Brown Noise</button>
                <button class="sound-btn" data-sound="rain">Rainfall</button>
                <button class="sound-btn" data-sound="forest">Forest</button>
                <button class="sound-btn" data-sound="binaural">Lo-Fi Calm</button>
              </div>
              <div class="volume-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <input type="range" class="volume-slider" id="focus-volume" min="0" max="1" step="0.05" value="0.5" />
              </div>
            </div>

            <!-- Panel 2: Embedded Spotify Mini Player -->
            <div id="panel-spotify-audio" style="display:none; flex-direction:column; gap:8px;">
              <div class="spotify-presets-bar" id="spotify-presets-bar">
                <button class="spotify-preset-btn active" data-uri="spotify:playlist:37i9dQZF1DWZeKCadgRdKQ">Deep Focus</button>
                <button class="spotify-preset-btn" data-uri="spotify:playlist:37i9dQZF1DXdLEN7aqioXM">Lofi Beats</button>
                <button class="spotify-preset-btn" data-uri="spotify:playlist:37i9dQZF1DX4sWSpwq3LiO">Piano</button>
                <button class="spotify-preset-btn" data-uri="spotify:playlist:37i9dQZF1DX2UXRTq7HHvd">Brain Food</button>
                <button class="spotify-preset-btn" data-uri="spotify:playlist:37i9dQZF1DXd9rSDyQguIk">Synthwave</button>
                <button class="spotify-preset-btn custom" id="btn-spotify-custom-preset" style="display:none;" data-uri="">My Playlist</button>
              </div>

              <div class="spotify-embed-wrapper">
                <div id="spotify-embed-container" class="spotify-embed-container"></div>
              </div>
            </div>
          </div>

          <!-- Productivity Stats Card -->
          <div class="focus-task-card" style="justify-content:space-around; text-align:center;">
            <div>
              <div class="focus-task-label">Today's Sessions</div>
              <div style="font-size:15px; font-weight:600;" id="focus-stat-sessions">0</div>
            </div>
            <div style="width:1px; height:24px; background:var(--border-subtle);"></div>
            <div>
              <div class="focus-task-label">Total Focus</div>
              <div style="font-size:15px; font-weight:600;" id="focus-stat-minutes">0m</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initSpotifyEmbed() {
    if (this.isSpotifyInitialized) return;
    this.isSpotifyInitialized = true;

    const container = this.container.querySelector('#spotify-embed-container');
    if (!container) return;

    const initialUri = this.currentSpotifyUri;

    const mountIframe = () => {
      if (container.querySelector('iframe')) return;
      const embedUrl = this.toEmbedUrl(initialUri);
      container.innerHTML = `
        <iframe
          id="spotify-embed-frame"
          src="${embedUrl}"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy">
        </iframe>
      `;
    };

    if (window.SpotifyIFrameAPI) {
      this.createSpotifyController(window.SpotifyIFrameAPI, container, initialUri, mountIframe);
    } else {
      window.onSpotifyApiLoaded = (IFrameAPI) => {
        this.createSpotifyController(IFrameAPI, container, initialUri, mountIframe);
      };
      mountIframe();
    }
  }

  createSpotifyController(IFrameAPI, container, initialUri, fallbackFn) {
    try {
      IFrameAPI.createController(container, {
        width: '100%',
        height: '152',
        uri: initialUri
      }, (EmbedController) => {
        this.spotifyController = EmbedController;
        window.spotifyEmbedController = EmbedController;
        this.spotifyController.on('playback_update', (e) => {
          this.store.state.spotify.isPlaying = !e.data.isPaused;
        });
      });
    } catch (e) {
      console.warn('[FocusView] Spotify IFrame API fallback to standard iframe:', e);
      fallbackFn();
    }
  }

  setSpotifyUri(uriOrUrl) {
    const uri = this.toSpotifyUri(uriOrUrl);
    this.currentSpotifyUri = uri;

    if (this.spotifyController) {
      try {
        this.spotifyController.loadUri(uri);
        return;
      } catch (err) {
        console.warn('[FocusView] Error loading URI into controller:', err);
      }
    }

    const container = this.container.querySelector('#spotify-embed-container');
    if (container) {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        iframe.src = this.toEmbedUrl(uri);
      }
    }
  }

  bindEvents() {
    const btnToggle = this.container.querySelector('#btn-focus-toggle');
    const btnReset = this.container.querySelector('#btn-focus-reset');
    const btnPip = this.container.querySelector('#btn-focus-pip');
    const btnCompleteTask = this.container.querySelector('#btn-complete-focus-task');
    const volumeSlider = this.container.querySelector('#focus-volume');
    const soundRow = this.container.querySelector('#soundscapes-row');

    btnToggle.addEventListener('click', () => {
      const focus = this.store.get('focus');
      if (focus.running) {
        this.store.pauseFocus();
      } else {
        this.store.startFocus();
      }
    });

    btnReset.addEventListener('click', () => {
      this.store.resetFocus();
    });

    btnPip.addEventListener('click', () => {
      if (window.api && window.api.popOutTimer) {
        const focus = this.store.get('focus');
        let taskTitle = null;
        if (focus.linkedTaskId) {
          const task = this.store.get('tasks').find(t => t.id === focus.linkedTaskId);
          if (task) taskTitle = task.text;
        }
        window.api.popOutTimer({
          remaining: focus.remaining,
          duration: focus.duration,
          running: focus.running,
          linkedTaskId: focus.linkedTaskId,
          taskTitle
        });
      }
    });

    if (window.api && window.api.onTimerToggleFromMini) {
      window.api.onTimerToggleFromMini(() => {
        const focus = this.store.get('focus');
        if (focus.running) {
          this.store.pauseFocus();
        } else {
          this.store.startFocus();
        }
      });
    }

    if (window.api && window.api.onTimerCompleteTaskFromMini) {
      window.api.onTimerCompleteTaskFromMini(() => {
        const focus = this.store.get('focus');
        if (focus.linkedTaskId) {
          this.store.toggleTask(focus.linkedTaskId);
          this.store.setFocusTask(null);
          if (window.toast) window.toast.show('Linked task marked complete!', 'success');
        }
      });
    }

    btnCompleteTask.addEventListener('click', () => {
      const focus = this.store.get('focus');
      if (focus.linkedTaskId) {
        this.store.toggleTask(focus.linkedTaskId);
        this.store.setFocusTask(null);
        if (window.toast) window.toast.show('Linked task marked complete!', 'success');
      }
    });

    volumeSlider.addEventListener('input', () => {
      const vol = parseFloat(volumeSlider.value);
      this.store.state.focus.volume = vol;
      if (window.audioEngine) window.audioEngine.setVolume(vol);
    });

    soundRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.sound-btn');
      if (!btn) return;

      const sound = btn.getAttribute('data-sound');
      this.store.state.focus.soundscape = sound;

      soundRow.querySelectorAll('.sound-btn').forEach(b => b.classList.toggle('active', b === btn));
      this.container.querySelector('#audio-type-label').textContent = btn.textContent;

      if (window.audioEngine) {
        if (sound === 'none') {
          window.audioEngine.stopAmbient();
        } else {
          window.audioEngine.startAmbient(sound);
        }
      }
    });

    // Audio Switcher Tabs
    const tabAmbient = this.container.querySelector('#tab-btn-ambient');
    const tabSpotify = this.container.querySelector('#tab-btn-spotify');
    const panelAmbient = this.container.querySelector('#panel-ambient-audio');
    const panelSpotify = this.container.querySelector('#panel-spotify-audio');

    tabAmbient.addEventListener('click', () => {
      this.activeAudioTab = 'ambient';
      tabAmbient.classList.add('active');
      tabSpotify.classList.remove('active');
      panelAmbient.style.display = 'block';
      panelSpotify.style.display = 'none';
      this.container.querySelector('#audio-type-label').textContent = this.store.state.focus.soundscape || 'None';
    });

    tabSpotify.addEventListener('click', () => {
      this.activeAudioTab = 'spotify';
      tabSpotify.classList.add('active');
      tabAmbient.classList.remove('active');
      panelAmbient.style.display = 'none';
      panelSpotify.style.display = 'flex';
      this.container.querySelector('#audio-type-label').textContent = 'Spotify';
      this.initSpotifyEmbed();
    });

    // Preset selector buttons
    const presetsBar = this.container.querySelector('#spotify-presets-bar');
    presetsBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.spotify-preset-btn');
      if (!btn) return;
      const uri = btn.getAttribute('data-uri');
      if (!uri) return;

      presetsBar.querySelectorAll('.spotify-preset-btn').forEach(b => b.classList.toggle('active', b === btn));
      this.setSpotifyUri(uri);
    });
  }

  syncFocusUI(focus) {
    if (!focus) return;

    const mins = String(Math.floor(focus.remaining / 60)).padStart(2, '0');
    const secs = String(focus.remaining % 60).padStart(2, '0');
    this.container.querySelector('#focus-digits').textContent = `${mins}:${secs}`;

    const arc = this.container.querySelector('#focus-progress-arc');
    const fraction = focus.duration > 0 ? focus.remaining / focus.duration : 0;
    arc.style.strokeDashoffset = this.CIRCUMFERENCE * (1 - fraction);

    const iconPlay = this.container.querySelector('#icon-focus-play');
    const iconPause = this.container.querySelector('#icon-focus-pause');
    if (focus.running) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
    }

    const taskCard = this.container.querySelector('#focus-task-card');
    const taskName = this.container.querySelector('#focus-task-name');
    if (focus.linkedTaskId) {
      const task = this.store.get('tasks').find(t => t.id === focus.linkedTaskId);
      if (task) {
        taskName.textContent = task.text;
        taskCard.style.display = 'flex';
      } else {
        taskCard.style.display = 'none';
      }
    } else {
      taskCard.style.display = 'none';
    }

    this.container.querySelector('#focus-stat-sessions').textContent = focus.sessions || 0;
    this.container.querySelector('#focus-stat-minutes').textContent = `${focus.totalMinutes || 0}m`;
  }

  syncSpotifyUI(spotify) {
    if (!spotify) return;

    const customBtn = this.container.querySelector('#btn-spotify-custom-preset');
    if (!customBtn) return;

    if (spotify.customPlaylistUrl) {
      const uri = this.toSpotifyUri(spotify.customPlaylistUrl);
      customBtn.style.display = 'inline-flex';
      customBtn.setAttribute('data-uri', uri);
    } else {
      customBtn.style.display = 'none';
    }
  }
}

window.FocusViewComponent = FocusViewComponent;
