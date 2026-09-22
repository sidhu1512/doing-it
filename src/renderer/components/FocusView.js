/**
 * FocusView Component — Endel & Flow Inspired Focus Studio
 * High-precision circular countdown ring, linked active task, synthesized ambient audio, and volume control.
 */

class FocusViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.CIRCUMFERENCE = 2 * Math.PI * 96; // ~603.18

    this.render();
    this.bindEvents();
    this.syncFocusUI(this.store.get('focus'));

    this.store.subscribe('focus', (focus) => this.syncFocusUI(focus));
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

          <!-- Ambient Audio Soundscapes & Volume Card -->
          <div class="audio-control-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="section-title" style="margin:0;">Ambient Focus Audio</span>
              <span id="audio-type-label" style="font-size:10.5px; color:var(--text-muted);">None</span>
            </div>
            <div class="soundscapes-row" id="soundscapes-row">
              <button class="sound-btn active" data-sound="none">Mute</button>
              <button class="sound-btn" data-sound="brown">Brown Noise</button>
              <button class="sound-btn" data-sound="rain">Rainfall</button>
              <button class="sound-btn" data-sound="forest">Forest Breeze</button>
              <button class="sound-btn" data-sound="binaural">Lo-Fi Calm</button>
            </div>
            <div class="volume-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <input type="range" class="volume-slider" id="focus-volume" min="0" max="1" step="0.05" value="0.5" />
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

    // Listen for controls dispatched from the Mini-Timer PiP window
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
  }

  syncFocusUI(focus) {
    if (!focus) return;

    // Time display
    const mins = String(Math.floor(focus.remaining / 60)).padStart(2, '0');
    const secs = String(focus.remaining % 60).padStart(2, '0');
    this.container.querySelector('#focus-digits').textContent = `${mins}:${secs}`;

    // SVG arc
    const arc = this.container.querySelector('#focus-progress-arc');
    const fraction = focus.duration > 0 ? focus.remaining / focus.duration : 0;
    arc.style.strokeDashoffset = this.CIRCUMFERENCE * (1 - fraction);

    // Play/Pause icon
    const iconPlay = this.container.querySelector('#icon-focus-play');
    const iconPause = this.container.querySelector('#icon-focus-pause');
    if (focus.running) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
    }

    // Linked Task
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

    // Stats
    this.container.querySelector('#focus-stat-sessions').textContent = focus.sessions || 0;
    this.container.querySelector('#focus-stat-minutes').textContent = `${focus.totalMinutes || 0}m`;
  }
}

window.FocusViewComponent = FocusViewComponent;
