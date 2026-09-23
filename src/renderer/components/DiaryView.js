/**
 * DiaryView Component — Day One Inspired Personal Journal & Reflection Suite
 * Multiple journals, On This Day flashback, daily prompt templates, audio voice recording,
 * micro-mood & energy tracking, calendar day strip with entry indicators, and markdown export.
 *
 * NOTE: Strict compliance with Zero-Emoji architectural standard (SVG iconography only).
 */

class DiaryViewComponent {
  constructor(containerId, store) {
    this.container = document.getElementById(containerId);
    this.store = store;
    this.activeJournal = 'all';
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.filterStarred = false;
    this.searchQuery = '';
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordStartTime = null;
    this.recordTimerInterval = null;
    this.currentRecordedAudio = null; // { arrayBuffer, durationSeconds }
    this.promptsOpen = false;

    this.render();
    this.bindEvents();

    this.store.subscribe('diary', () => {
      this.renderDayStrip();
      this.renderFlashback();
      this.renderEntriesFeed();
    });
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    this.container.innerHTML = `
      <div class="view-container diary-container">
        <!-- Top Toolbar: Journal Tabs & Actions -->
        <div class="diary-toolbar">
          <div class="diary-journal-pills" id="diary-journal-pills">
            <button class="journal-pill active" data-journal="all">All</button>
            <button class="journal-pill" data-journal="personal">Personal</button>
            <button class="journal-pill" data-journal="work">Work</button>
            <button class="journal-pill" data-journal="gratitude">Gratitude</button>
            <button class="journal-pill" data-journal="ideas">Ideas</button>
          </div>
          <div class="diary-actions-group">
            <button class="task-action-btn ${this.filterStarred ? 'active-star' : ''}" id="btn-toggle-starred-filter" title="Filter Starred Entries">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="${this.filterStarred ? 'var(--accent-primary)' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
            <button class="task-action-btn" id="btn-export-journal" title="Export Journal as Markdown">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
        </div>

        <!-- 7-Day Mini Calendar Strip with Entry Dots -->
        <div class="diary-day-strip" id="diary-day-strip"></div>

        <!-- "On This Day" (Flashback / Memories) Banner -->
        <div id="diary-flashback-area"></div>

        <!-- Quick Compose Card -->
        <div class="diary-compose-card">
          <div class="compose-header-row">
            <div class="compose-meta-row">
              <span class="compose-journal-tag" id="compose-active-tag">Personal</span>
              <button class="btn-prompt-picker" id="btn-open-prompts" title="Pick a Reflection Prompt">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <span>Prompts</span>
              </button>
            </div>
            <!-- Mood Selector (Clean SVG faces) -->
            <div class="mood-selector" id="compose-mood-selector">
              <button type="button" class="mood-btn" data-mood="great" title="Great">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <button type="button" class="mood-btn active" data-mood="good" title="Good">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15h8"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <button type="button" class="mood-btn" data-mood="neutral" title="Neutral">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <button type="button" class="mood-btn" data-mood="low" title="Low">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </button>
              <button type="button" class="mood-btn" data-mood="bad" title="Tired / Stressed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><path d="M15 16s-1-1.5-3-1.5-3 1.5-3 1.5"/></svg>
              </button>
            </div>
          </div>

          <!-- Title Input -->
          <input type="text" id="compose-title" class="diary-title-input" placeholder="Title or headline (optional)..." />

          <!-- Prompt Suggestions Drawer -->
          <div class="prompt-drawer" id="prompt-drawer" style="display:none;">
            <div class="prompt-item" data-prompt="3 Daily Wins:&#10;1. &#10;2. &#10;3. ">3 Daily Wins</div>
            <div class="prompt-item" data-prompt="Morning Intention:&#10;What is the single most critical outcome today?&#10;">Morning Intention</div>
            <div class="prompt-item" data-prompt="Evening Reflection:&#10;What gave me energy today? What drained it?&#10;">Evening Reflection</div>
            <div class="prompt-item" data-prompt="Gratitude:&#10;3 things I am deeply grateful for right now:&#10;1. &#10;2. &#10;3. ">Gratitude Note</div>
          </div>

          <!-- Textarea Content -->
          <textarea id="compose-content" class="diary-textarea" placeholder="Reflect on your day, jot ideas, or capture memories... (Markdown supported)"></textarea>

          <!-- Audio Voice Recording Bar (embedded) -->
          <div class="voice-record-container" id="voice-record-panel" style="display:none;">
            <div class="voice-record-status">
              <span class="recording-pulse-dot" id="recording-pulse"></span>
              <span class="recording-timer" id="recording-timer">00:00</span>
              <span style="font-size:11px; color:var(--text-muted);">Voice Note</span>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
              <button type="button" class="task-action-btn" id="btn-cancel-recording" title="Cancel Recording" style="color:var(--danger);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button type="button" class="task-action-btn" id="btn-stop-recording" title="Finish Recording" style="color:var(--success);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Pending Recorded Audio Preview -->
          <div class="pending-audio-preview" id="pending-audio-preview" style="display:none;">
            <div style="display:flex; align-items:center; gap:8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <span id="pending-audio-duration" style="font-size:11.5px; font-weight:500;">00:00 Voice Note</span>
            </div>
            <button type="button" class="task-action-btn" id="btn-discard-audio" title="Remove Audio" style="color:var(--text-muted);">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Bottom Footer Toolbar -->
          <div class="compose-footer-row">
            <div style="display:flex; align-items:center; gap:6px;">
              <!-- Record Voice Note Button -->
              <button type="button" class="task-action-btn" id="btn-start-audio-record" title="Record Voice Note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span>Voice</span>
              </button>

              <!-- Energy Level (1-5) -->
              <div class="energy-picker" id="compose-energy-picker" title="Energy Level (1-5)">
                <span style="font-size:10px; color:var(--text-muted); margin-right:2px;">Energy:</span>
                <span class="energy-dot active" data-level="1"></span>
                <span class="energy-dot active" data-level="2"></span>
                <span class="energy-dot active" data-level="3"></span>
                <span class="energy-dot" data-level="4"></span>
                <span class="energy-dot" data-level="5"></span>
              </div>
            </div>

            <button type="button" class="task-action-btn btn-save-diary" id="btn-save-diary-entry">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Save Entry</span>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="diary-search-row">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="diary-search-input" class="diary-search-input" placeholder="Search entries, tags, or memories..." />
        </div>

        <!-- Entries Feed -->
        <div class="diary-feed" id="diary-feed"></div>
      </div>
    `;

    this.renderDayStrip();
    this.renderFlashback();
    this.renderEntriesFeed();
  }

  bindEvents() {
    // Journal pills filter
    const pills = this.container.querySelector('#diary-journal-pills');
    pills.addEventListener('click', (e) => {
      const btn = e.target.closest('.journal-pill');
      if (!btn) return;
      pills.querySelectorAll('.journal-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeJournal = btn.getAttribute('data-journal');

      const composeTag = this.container.querySelector('#compose-active-tag');
      if (composeTag) {
        composeTag.textContent = this.activeJournal === 'all' ? 'Personal' : (this.activeJournal.charAt(0).toUpperCase() + this.activeJournal.slice(1));
      }
      this.renderEntriesFeed();
    });

    // Starred filter
    const btnStarFilter = this.container.querySelector('#btn-toggle-starred-filter');
    btnStarFilter.addEventListener('click', () => {
      this.filterStarred = !this.filterStarred;
      btnStarFilter.classList.toggle('active-star', this.filterStarred);
      const svg = btnStarFilter.querySelector('svg');
      svg.setAttribute('fill', this.filterStarred ? 'var(--accent-primary)' : 'none');
      this.renderEntriesFeed();
    });

    // Export Journal
    const btnExport = this.container.querySelector('#btn-export-journal');
    btnExport.addEventListener('click', async () => {
      btnExport.style.opacity = '0.5';
      const success = await this.store.exportDiary(this.selectedDate);
      btnExport.style.opacity = '1';
      if (success && window.toast) {
        window.toast.show('Journal exported successfully', 'success');
      }
    });

    // Mood Selector in compose
    const moodSelector = this.container.querySelector('#compose-mood-selector');
    moodSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.mood-btn');
      if (!btn) return;
      moodSelector.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    // Prompts drawer toggle
    const btnPrompts = this.container.querySelector('#btn-open-prompts');
    const drawer = this.container.querySelector('#prompt-drawer');
    btnPrompts.addEventListener('click', () => {
      this.promptsOpen = !this.promptsOpen;
      drawer.style.display = this.promptsOpen ? 'flex' : 'none';
    });

    drawer.addEventListener('click', (e) => {
      const item = e.target.closest('.prompt-item');
      if (!item) return;
      const textToAppend = item.getAttribute('data-prompt');
      const textarea = this.container.querySelector('#compose-content');
      textarea.value = (textarea.value ? textarea.value + '\n\n' : '') + textToAppend;
      textarea.focus();
      this.promptsOpen = false;
      drawer.style.display = 'none';
    });

    // Energy picker
    const energyPicker = this.container.querySelector('#compose-energy-picker');
    let currentEnergy = 3;
    energyPicker.addEventListener('click', (e) => {
      const dot = e.target.closest('.energy-dot');
      if (!dot) return;
      currentEnergy = Number(dot.getAttribute('data-level')) || 3;
      energyPicker.querySelectorAll('.energy-dot').forEach(d => {
        const lvl = Number(d.getAttribute('data-level'));
        d.classList.toggle('active', lvl <= currentEnergy);
      });
    });

    // Audio Voice Note Recording
    const btnStartAudio = this.container.querySelector('#btn-start-audio-record');
    const recordPanel = this.container.querySelector('#voice-record-panel');
    const timerLabel = this.container.querySelector('#recording-timer');
    const btnStopAudio = this.container.querySelector('#btn-stop-recording');
    const btnCancelAudio = this.container.querySelector('#btn-cancel-recording');
    const pendingAudio = this.container.querySelector('#pending-audio-preview');
    const pendingDuration = this.container.querySelector('#pending-audio-duration');
    const btnDiscardAudio = this.container.querySelector('#btn-discard-audio');

    btnStartAudio.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (window.toast) window.toast.show('Microphone is not supported in this environment', 'error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        this.recordStartTime = Date.now();

        this.mediaRecorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) this.audioChunks.push(ev.data);
        };

        this.mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          clearInterval(this.recordTimerInterval);
          recordPanel.style.display = 'none';
          btnStartAudio.style.display = 'inline-flex';

          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const durationSeconds = Math.max(1, Math.round((Date.now() - this.recordStartTime) / 1000));
          const arrayBuffer = await audioBlob.arrayBuffer();

          this.currentRecordedAudio = { arrayBuffer, durationSeconds };
          pendingDuration.textContent = `${this.formatTime(durationSeconds)} Voice Note`;
          pendingAudio.style.display = 'flex';
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        recordPanel.style.display = 'flex';
        btnStartAudio.style.display = 'none';

        this.recordTimerInterval = setInterval(() => {
          const elapsed = Math.round((Date.now() - this.recordStartTime) / 1000);
          timerLabel.textContent = this.formatTime(elapsed);
        }, 1000);

      } catch (err) {
        console.error('[DiaryView] Microphone access failed:', err);
        if (window.toast) window.toast.show('Microphone access denied or unavailable', 'error');
      }
    });

    btnStopAudio.addEventListener('click', () => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    });

    btnCancelAudio.addEventListener('click', () => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
        this.currentRecordedAudio = null;
        pendingAudio.style.display = 'none';
      }
    });

    btnDiscardAudio.addEventListener('click', () => {
      this.currentRecordedAudio = null;
      pendingAudio.style.display = 'none';
    });

    // Save Entry Handler
    const btnSave = this.container.querySelector('#btn-save-diary-entry');
    btnSave.addEventListener('click', async () => {
      const titleInput = this.container.querySelector('#compose-title');
      const textInput = this.container.querySelector('#compose-content');
      const text = textInput.value.trim();
      const title = titleInput.value.trim();

      if (!text && !title && !this.currentRecordedAudio) {
        if (window.toast) window.toast.show('Please write some thoughts or record audio', 'warning');
        return;
      }

      btnSave.style.opacity = '0.5';

      let audioData = null;
      if (this.currentRecordedAudio && window.api?.saveAudioRecording) {
        audioData = await window.api.saveAudioRecording(
          this.currentRecordedAudio.arrayBuffer,
          this.currentRecordedAudio.durationSeconds
        );
      }

      // Check active foreground window title for context
      let contextTitle = null;
      if (window.api?.getActiveWindow) {
        try { contextTitle = await window.api.getActiveWindow(); } catch (e) {}
      }

      const activeMoodBtn = moodSelector.querySelector('.mood-btn.active');
      const mood = activeMoodBtn ? activeMoodBtn.getAttribute('data-mood') : 'good';
      const journal = this.activeJournal === 'all' ? 'personal' : this.activeJournal;

      // Extract inline hashtags
      const tags = (text.match(/#[a-zA-Z0-9_\-]+/g) || []).map(t => t.slice(1).toLowerCase());

      this.store.addDiaryEntry({
        date: this.selectedDate,
        journal,
        title,
        text,
        mood,
        energy: currentEnergy,
        starred: false,
        tags,
        audio: audioData,
        context: contextTitle
      });

      // Clear compose form
      titleInput.value = '';
      textInput.value = '';
      this.currentRecordedAudio = null;
      pendingAudio.style.display = 'none';
      btnSave.style.opacity = '1';

      if (window.toast) {
        window.toast.show('Entry saved to diary', 'success');
      }
    });

    // Search filter
    const searchInput = this.container.querySelector('#diary-search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderEntriesFeed();
    });

    // Day strip click delegation
    const dayStrip = this.container.querySelector('#diary-day-strip');
    dayStrip.addEventListener('click', (e) => {
      const pill = e.target.closest('.diary-day-pill');
      if (!pill) return;
      this.selectedDate = pill.getAttribute('data-date');
      this.renderDayStrip();
      this.renderFlashback();
      this.renderEntriesFeed();
    });

    // Delegate feed card actions (Star, Delete, Audio Playback)
    const feed = this.container.querySelector('#diary-feed');
    feed.addEventListener('click', (e) => {
      const starBtn = e.target.closest('.btn-diary-star');
      if (starBtn) {
        const id = Number(starBtn.getAttribute('data-id'));
        this.store.toggleDiaryStar(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-diary-delete');
      if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute('data-id'));
        this.store.deleteDiaryEntry(id);
        if (window.toast) window.toast.show('Entry deleted', 'info');
        return;
      }

      const audioPlayBtn = e.target.closest('.btn-play-voice-note');
      if (audioPlayBtn) {
        const audioSrc = audioPlayBtn.getAttribute('data-audio-src');
        if (!audioSrc) return;
        let audioEl = audioPlayBtn.parentElement.querySelector('audio');
        if (!audioEl) {
          audioEl = new Audio(audioSrc);
          audioPlayBtn.parentElement.appendChild(audioEl);
          audioEl.onended = () => {
            audioPlayBtn.classList.remove('playing');
          };
        }

        if (audioEl.paused) {
          this.container.querySelectorAll('audio').forEach(a => {
            if (a !== audioEl && !a.paused) {
              a.pause();
              const otherBtn = a.parentElement.querySelector('.btn-play-voice-note');
              if (otherBtn) otherBtn.classList.remove('playing');
            }
          });
          audioEl.play().catch(e => console.error(e));
          audioPlayBtn.classList.add('playing');
        } else {
          audioEl.pause();
          audioPlayBtn.classList.remove('playing');
        }
        return;
      }
    });
  }

  renderDayStrip() {
    const strip = this.container.querySelector('#diary-day-strip');
    if (!strip) return;

    const today = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const entries = this.store.get('diary') || [];

    // 7 days window centered on today
    const start = new Date(today);
    start.setDate(today.getDate() - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isSelected = dStr === this.selectedDate;
      const isToday = dStr === today.toISOString().split('T')[0];
      const hasEntries = entries.some(e => e.date === dStr);

      days.push(`
        <div class="diary-day-pill ${isSelected ? 'active' : ''}" data-date="${dStr}">
          <span class="day-name">${dayNames[d.getDay()]}</span>
          <span class="day-num" style="${isToday ? 'color:var(--accent-primary); font-weight:700;' : ''}">${d.getDate()}</span>
          ${hasEntries ? '<span class="entry-dot"></span>' : '<span class="entry-dot-placeholder"></span>'}
        </div>
      `);
    }

    strip.innerHTML = days.join('');
  }

  renderFlashback() {
    const flashbackArea = this.container.querySelector('#diary-flashback-area');
    if (!flashbackArea) return;

    const entries = this.store.get('diary') || [];
    const today = new Date();
    const curMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const curYear = today.getFullYear();

    // Look for entries on this month & day in previous years or 30 days ago
    const flashbacks = entries.filter(e => {
      if (!e.date || e.date === this.selectedDate) return false;
      const parts = e.date.split('-');
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const mDay = `${parts[1]}-${parts[2]}`;
        return mDay === curMonthDay && year < curYear;
      }
      return false;
    });

    if (flashbacks.length === 0) {
      flashbackArea.innerHTML = '';
      return;
    }

    const memory = flashbacks[0];
    flashbackArea.innerHTML = `
      <div class="flashback-banner">
        <div class="flashback-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          <span style="font-weight:600; font-size:11.5px;">On This Day (${memory.date.split('-')[0]})</span>
        </div>
        <div class="flashback-body">
          <div style="font-weight:500; font-size:12px; margin-bottom:2px;">${this.escapeHtml(memory.title || 'Past Reflection')}</div>
          <div style="font-size:11.5px; opacity:0.85; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${this.escapeHtml(memory.text)}
          </div>
        </div>
      </div>
    `;
  }

  renderEntriesFeed() {
    const feed = this.container.querySelector('#diary-feed');
    if (!feed) return;

    let entries = this.store.get('diary') || [];

    // Filter by journal
    if (this.activeJournal !== 'all') {
      entries = entries.filter(e => e.journal === this.activeJournal);
    }

    // Filter by date
    entries = entries.filter(e => e.date === this.selectedDate);

    // Filter by starred
    if (this.filterStarred) {
      entries = entries.filter(e => e.starred);
    }

    // Search query
    if (this.searchQuery) {
      entries = entries.filter(e => {
        const t = (e.text || '').toLowerCase();
        const h = (e.title || '').toLowerCase();
        const tags = (e.tags || []).join(' ').toLowerCase();
        return t.includes(this.searchQuery) || h.includes(this.searchQuery) || tags.includes(this.searchQuery);
      });
    }

    if (entries.length === 0) {
      feed.innerHTML = `
        <div class="empty-state" style="text-align:center; padding:36px 12px; color:var(--text-muted);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="margin-bottom:8px; opacity:0.6;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <div style="font-size:12.5px; font-weight:500; color:var(--text-secondary);">No Diary Entries for this Day</div>
          <div style="font-size:11px; margin-top:2px;">Capture your thoughts, voice notes, or daily reflection above</div>
        </div>
      `;
      return;
    }

    let html = '';
    entries.forEach(entry => {
      const formattedText = window.renderMarkdownSafe
        ? window.renderMarkdownSafe(entry.text)
        : this.escapeHtml(entry.text).replace(/\n/g, '<br/>');

      const audioPlayerHtml = entry.audio
        ? `
          <div class="voice-note-player-card">
            <button class="btn-play-voice-note" data-audio-src="${entry.audio.mediaUrl || ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <div style="flex:1;">
              <div style="font-size:11px; font-weight:500;">Voice Note</div>
              <div style="font-size:10px; color:var(--text-muted);">${this.formatTime(entry.audio.duration || 0)}</div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
          </div>
        `
        : '';

      const contextBadge = entry.context
        ? `<span class="entry-meta-badge" title="Captured while using ${this.escapeHtml(entry.context)}">${this.escapeHtml(entry.context.length > 25 ? entry.context.slice(0, 25) + '...' : entry.context)}</span>`
        : '';

      html += `
        <div class="diary-card" data-id="${entry.id}">
          <div class="diary-card-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="diary-card-journal-badge ${entry.journal}">${entry.journal}</span>
              <span style="font-size:10.5px; color:var(--text-muted);">${entry.time || ''}</span>
              ${contextBadge}
            </div>
            <div style="display:flex; align-items:center; gap:4px;">
              <button class="task-action-btn btn-diary-star" data-id="${entry.id}" title="Star Entry">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="${entry.starred ? 'var(--accent-primary)' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
              <button class="task-action-btn btn-diary-delete" data-id="${entry.id}" title="Delete Entry" style="color:var(--danger);">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          ${entry.title ? `<div class="diary-card-title">${this.escapeHtml(entry.title)}</div>` : ''}

          <div class="diary-card-body markdown-body">
            ${formattedText}
          </div>

          ${audioPlayerHtml}

          <div class="diary-card-footer">
            <div class="diary-card-mood-tag">
              <span style="font-size:10.5px; color:var(--text-muted);">Mood: ${entry.mood}</span>
              <span style="font-size:10.5px; color:var(--text-muted); margin-left:6px;">Energy: ${entry.energy || 3}/5</span>
            </div>
          </div>
        </div>
      `;
    });

    feed.innerHTML = html;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

window.DiaryViewComponent = DiaryViewComponent;
