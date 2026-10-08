/**
 * Doing It — Public Website Showcase Controller
 * Drives Interactive Product Stage, Real-Time Web Audio Synth, Chrono NLP, and Command Palette.
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. INTERACTIVE PRODUCT SHOWCASE STAGE
  // =========================================================================
  const stageData = {
    tasks: {
      tag: 'Core Task Engine',
      title: 'Natural Language Tasks & Daily Habits',
      desc: 'Type natural language task schedules like <code>Submit quarterly report tomorrow 3pm !high #finance</code>. The local Chrono engine parses dates, tags, and priorities without internet access.',
      bullets: [
        'Smart sections (Today, Upcoming, Backlog)',
        'Daily habit streaks with midnight reset guard',
        '1-click linkage to Focus Studio pomodoro timer'
      ],
      shortcut: 'Ctrl + 1',
      image: 'imgs/tasks-view.png',
      spec1: { label: 'Input Architecture', val: 'Synchronous', detail: 'Instant local state mutation' },
      spec2: { label: 'Storage Architecture', val: 'Local JSON', detail: 'Atomic file staging & 5-day backup' },
      spec3: { label: 'Privacy Model', val: 'Zero Telemetry', detail: 'Network only for features you enable' }
    },
    diary: {
      tag: 'Journaling & Mindfulness',
      title: 'Daily Journal & Voice Notes',
      desc: 'Segregate personal thoughts from sprint debriefs. Record voice reflections directly via your microphone, log 5-point mood & energy ratings, and revisit On This Day flashbacks.',
      bullets: [
        'Multi-journal segregation (Work, Personal, Gratitude)',
        'Zero-dependency microphone voice memos with waveform player',
        'Daily guided prompts and calendar streak dots'
      ],
      shortcut: 'Ctrl + 5',
      image: 'imgs/diary-view.png',
      spec1: { label: 'Audio Engine', val: 'WebM / Opus', detail: 'Local disk storage, zero cloud latency' },
      spec2: { label: 'Flashback Query', val: 'Indexed O(1)', detail: 'Instant historical memory retrieval' },
      spec3: { label: 'Markdown Format', val: 'GFM Spec', detail: 'Plain text portable export anytime' }
    },
    focus: {
      tag: 'Deep Flow Studio',
      title: 'Pomodoro Timer with Native Spotify Link',
      desc: 'Link active tasks directly to your focus blocks. Inspects Windows desktop processes to display your active Spotify track with zero lag and zero browser tab overhead.',
      bullets: [
        '25:00 circular pomodoro countdown with status ring',
        'Native Windows Spotify process link & playlist launcher',
        'Procedural ambient soundscapes (Brown noise, Rain, Binaural)'
      ],
      shortcut: 'Ctrl + 3',
      image: 'imgs/focus-view.png',
      spec1: { label: 'Process Polling', val: 'Low Overhead', detail: 'Native Windows API title detection' },
      spec2: { label: 'Audio Synth', val: 'Web Audio', detail: '0 bytes downloaded, synthesized live' },
      spec3: { label: 'Session Logging', val: 'Per-Task', detail: 'Active apps and minutes tracked' }
    },
    analytics: {
      tag: 'Cognitive Momentum',
      title: '0–100 Circadian Rhythm & Burnout Guard',
      desc: 'Mathematically calculate your cognitive velocity. Analyzes completed habits, focused hours, and circadian energy peaks to prevent burnout before it happens.',
      bullets: [
        '0–100 Productivity Pulse momentum score',
        '24-hour circadian energy distribution curve',
        '12-week GitHub-style consistency activity heatmap'
      ],
      shortcut: 'Ctrl + 6',
      image: 'imgs/analytics-view.png',
      spec1: { label: 'Momentum Metric', val: '0–100 Pulse', detail: 'Habit streaks + focus duration' },
      spec2: { label: 'Heatmap Window', val: '84 Days', detail: '12-week rolling consistency grid' },
      spec3: { label: 'Burnout Guard', val: 'Proactive', detail: 'Configurable continuous work alerts' }
    },
    planner: {
      tag: 'Calendar Coordination',
      title: 'Day Planner Agenda & 1-Click Meetings',
      desc: 'Sync RFC 5545 iCalendar feeds (.ics URLs) from Google Calendar, Outlook, Fastmail, or Apple. View your 7-day strip and launch Google Meet or Zoom calls in 1 click.',
      bullets: [
        'RFC 5545 offline parser with zero cloud OAuth dependencies',
        '1-click launcher for Google Meet, Zoom, and Teams links',
        'Unified time-blocking alongside native task list'
      ],
      shortcut: 'Ctrl + 4',
      image: 'imgs/planner-view.png',
      spec1: { label: 'Feed Protocol', val: 'RFC 5545', detail: 'Unfolded standard iCalendar sync' },
      spec2: { label: 'Meeting Join', val: '1-Click', detail: 'Regex link detector for Meet/Zoom' },
      spec3: { label: 'Week Strip', val: '7-Day View', detail: 'Fast day-by-day task navigation' }
    },
    notes: {
      tag: 'Scratchpad & Notes',
      title: 'Instant Markdown Scratchpad & Checklists',
      desc: 'A split-second scratchpad that saves every keystroke locally. Create tagged markdown notes, toggle interactive checklists, and search across thousands of words instantly.',
      bullets: [
        'Instant auto-saving scratchpad for rapid thought capture',
        'GitHub-Flavored Markdown with checklists and tags',
        'Zero-latency full-text local search'
      ],
      shortcut: 'Ctrl + 2',
      image: 'imgs/notes-view.png',
      spec1: { label: 'Save Debounce', val: '300 ms', detail: 'Atomic staging with rollback safety' },
      spec2: { label: 'Markdown Parse', val: 'Marked.js', detail: 'Full GFM checklist and code syntax' },
      spec3: { label: 'Search Speed', val: '< 2 ms', detail: 'In-memory inverted index filter' }
    }
  };

  const stageTabs = document.querySelectorAll('.stage-tab-btn');
  const stageImg = document.getElementById('stage-view-image');
  const stageTag = document.getElementById('stage-view-tag');
  const stageTitle = document.getElementById('stage-view-title');
  const stageDesc = document.getElementById('stage-view-desc');
  const stageBullets = document.getElementById('stage-view-bullets');
  const stageRailSpecs = document.getElementById('stage-right-rail');

  function updateStage(viewKey) {
    const data = stageData[viewKey];
    if (!data) return;

    // Update active tab button
    stageTabs.forEach(tab => {
      const isMatch = tab.dataset.view === viewKey;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    // Crossfade main image
    if (stageImg) {
      stageImg.style.opacity = '0';
      setTimeout(() => {
        stageImg.src = data.image;
        stageImg.alt = `Doing It ${data.title}`;
        stageImg.style.opacity = '1';
      }, 120);
    }

    // Update left rail info
    if (stageTag) stageTag.textContent = data.tag;
    if (stageTitle) stageTitle.textContent = data.title;
    if (stageDesc) stageDesc.innerHTML = data.desc;

    if (stageBullets) {
      stageBullets.innerHTML = data.bullets.map(b => `
        <div class="stage-bullet-item">
          <span class="bullet-check">✔</span>
          <span>${b}</span>
        </div>
      `).join('');
    }

    // Update right rail specs
    if (stageRailSpecs) {
      stageRailSpecs.innerHTML = `
        <div class="spec-card">
          <span class="spec-label">${data.spec1.label}</span>
          <span class="spec-value">${data.spec1.val}</span>
          <span class="spec-detail">${data.spec1.detail}</span>
        </div>
        <div class="spec-card">
          <span class="spec-label">${data.spec2.label}</span>
          <span class="spec-value">${data.spec2.val}</span>
          <span class="spec-detail">${data.spec2.detail}</span>
        </div>
        <div class="spec-card">
          <span class="spec-label">${data.spec3.label}</span>
          <span class="spec-value">${data.spec3.val}</span>
          <span class="spec-detail">${data.spec3.detail}</span>
        </div>
      `;
    }
  }

  stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view) updateStage(view);
    });
  });

  // =========================================================================
  // 2. LIVE NATURAL LANGUAGE TASK PARSER (INTERACTIVE PLAYGROUND)
  // =========================================================================
  const nlpInput = document.getElementById('demo-nlp-input');
  const btnClearNlp = document.getElementById('btn-nlp-clear');
  const nlpActionText = document.getElementById('nlp-action-text');
  const nlpDateChip = document.getElementById('nlp-date-chip');
  const nlpPriorityChip = document.getElementById('nlp-priority-chip');
  const nlpTagChip = document.getElementById('nlp-tag-chip');
  const presetBtns = document.querySelectorAll('.nlp-preset-btn');

  function parseNaturalLanguage(raw) {
    if (!raw || !raw.trim()) {
      if (nlpActionText) nlpActionText.textContent = 'None';
      if (nlpDateChip) nlpDateChip.style.display = 'none';
      if (nlpPriorityChip) nlpPriorityChip.style.display = 'none';
      if (nlpTagChip) nlpTagChip.style.display = 'none';
      return;
    }

    let text = raw.trim();

    // Priority detection
    let priority = 'Normal';
    let priClass = 'chip-normal';
    if (/[!#](high|h)\b/i.test(text)) {
      priority = 'High';
      priClass = 'chip-high';
      text = text.replace(/[!#](high|h)\b/gi, '').trim();
    } else if (/[!#](medium|med|m)\b/i.test(text)) {
      priority = 'Medium';
      priClass = 'chip-med';
      text = text.replace(/[!#](medium|med|m)\b/gi, '').trim();
    } else if (/[!#](low|l)\b/i.test(text)) {
      priority = 'Low';
      priClass = 'chip-low';
      text = text.replace(/[!#](low|l)\b/gi, '').trim();
    }

    // Tag detection
    const tags = [];
    const tagMatch = text.match(/#(\w+)/g);
    if (tagMatch) {
      tagMatch.forEach(t => tags.push(t));
      text = text.replace(/#(\w+)/g, '').trim();
    }

    // Date heuristic detection
    let dateStr = 'No date assigned';
    const hasTomorrow = /\btomorrow\b/i.test(text);
    const hasToday = /\btoday\b/i.test(text);
    const hasFriday = /\bfriday\b/i.test(text);
    const hasTonight = /\btonight\b/i.test(text);
    const hasMorning = /\bmorning\b/i.test(text);
    const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);

    if (hasTomorrow) {
      dateStr = '📅 Tomorrow' + (timeMatch ? `, ${timeMatch[0]}` : ', 9:00 AM');
      text = text.replace(/\btomorrow\b/gi, '').trim();
    } else if (hasFriday) {
      dateStr = '📅 Friday' + (timeMatch ? `, ${timeMatch[0]}` : ', 10:00 AM');
      text = text.replace(/\bfriday\b/gi, '').trim();
    } else if (hasTonight) {
      dateStr = '📅 Tonight' + (timeMatch ? `, ${timeMatch[0]}` : ', 8:00 PM');
      text = text.replace(/\btonight\b/gi, '').trim();
    } else if (hasToday) {
      dateStr = '📅 Today' + (timeMatch ? `, ${timeMatch[0]}` : '');
      text = text.replace(/\btoday\b/gi, '').trim();
    } else if (hasMorning) {
      dateStr = '📅 Every Morning' + (timeMatch ? `, ${timeMatch[0]}` : ', 7:00 AM');
      text = text.replace(/\b(every\s+)?morning\b/gi, '').trim();
    }

    // Clean up stray words
    text = text.replace(/\b(at|on|due)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '').trim();
    text = text.replace(/\s+/g, ' ');

    if (nlpActionText) nlpActionText.textContent = text || raw;
    if (nlpDateChip) {
      nlpDateChip.textContent = dateStr;
      nlpDateChip.style.display = 'inline-flex';
    }
    if (nlpPriorityChip) {
      nlpPriorityChip.textContent = `⚡ Priority: ${priority}`;
      nlpPriorityChip.className = `chip-pill chip-priority ${priClass}`;
      nlpPriorityChip.style.display = 'inline-flex';
    }
    if (nlpTagChip) {
      if (tags.length > 0) {
        nlpTagChip.textContent = `🏷️ ${tags.join(' ')}`;
        nlpTagChip.style.display = 'inline-flex';
      } else {
        nlpTagChip.style.display = 'none';
      }
    }
  }

  if (nlpInput) {
    nlpInput.addEventListener('input', (e) => parseNaturalLanguage(e.target.value));
    parseNaturalLanguage(nlpInput.value);
  }

  if (btnClearNlp && nlpInput) {
    btnClearNlp.addEventListener('click', () => {
      nlpInput.value = '';
      nlpInput.focus();
      parseNaturalLanguage('');
    });
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (preset && nlpInput) {
        nlpInput.value = preset;
        parseNaturalLanguage(preset);
      }
    });
  });

  // =========================================================================
  // 3. ZERO-ASSET WEB AUDIO PROCEDURAL SYNTHESIZER
  // Synthesizes Brown Noise, Rain, and 6Hz Binaural beats in Web Audio
  // =========================================================================
  let audioCtx = null;
  let activeNodes = [];
  let masterGain = null;
  let currentSound = 'none';
  let animId = null;

  const synthBtns = document.querySelectorAll('.synth-btn');
  const synthCanvas = document.getElementById('synth-canvas');
  const synthStatus = document.getElementById('synth-status-label');
  const synthVolSlider = document.getElementById('synth-volume');
  const synthVolText = document.getElementById('synth-vol-text');

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function stopSynthesizer() {
    activeNodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    activeNodes = [];
    currentSound = 'none';
    if (synthStatus) synthStatus.textContent = 'Synthesizer Idle — Select a soundscape above';
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    clearVisualizer();
  }

  function startBrownNoise() {
    stopSynthesizer();
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    noiseNode.connect(filter);
    filter.connect(masterGain);
    noiseNode.start(0);

    activeNodes.push(noiseNode, filter);
    currentSound = 'brown';
    if (synthStatus) synthStatus.textContent = 'Synthesizing: Deep Brown Noise (400Hz Low-pass)';
    startVisualizer();
  }

  function startRainfall() {
    stopSynthesizer();
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.6;

    noiseNode.connect(filter);
    filter.connect(masterGain);
    noiseNode.start(0);

    activeNodes.push(noiseNode, filter);
    currentSound = 'rain';
    if (synthStatus) synthStatus.textContent = 'Synthesizing: Ambient Rainfall (Pink Bandpass)';
    startVisualizer();
  }

  function startBinaural() {
    stopSynthesizer();
    const ctx = getAudioContext();

    // Base carrier 200Hz in left ear, 206Hz in right ear = 6Hz Theta frequency
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.value = 200;
    oscRight.frequency.value = 206;

    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    merger.connect(gain);
    gain.connect(masterGain);

    oscLeft.start(0);
    oscRight.start(0);

    activeNodes.push(oscLeft, oscRight, merger, gain);
    currentSound = 'binaural';
    if (synthStatus) synthStatus.textContent = 'Synthesizing: 6Hz Theta Binaural Beats (200Hz & 206Hz)';
    startVisualizer();
  }

  synthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      synthBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sound = btn.dataset.sound;

      if (sound === 'brown') startBrownNoise();
      else if (sound === 'rain') startRainfall();
      else if (sound === 'binaural') startBinaural();
      else stopSynthesizer();
    });
  });

  if (synthVolSlider) {
    synthVolSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (synthVolText) synthVolText.textContent = `${val}%`;
      if (masterGain) masterGain.gain.value = val / 100;
    });
  }

  // Visualizer Animation
  function clearVisualizer() {
    if (!synthCanvas) return;
    const ctx = synthCanvas.getContext('2d');
    ctx.clearRect(0, 0, synthCanvas.width, synthCanvas.height);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, synthCanvas.height / 2);
    ctx.lineTo(synthCanvas.width, synthCanvas.height / 2);
    ctx.stroke();
  }
  clearVisualizer();

  function startVisualizer() {
    if (!synthCanvas) return;
    const ctx = synthCanvas.getContext('2d');
    const width = synthCanvas.width;
    const height = synthCanvas.height;
    let phase = 0;

    function render() {
      if (currentSound === 'none') return;
      ctx.clearRect(0, 0, width, height);

      phase += 0.08;
      ctx.beginPath();
      ctx.strokeStyle = currentSound === 'brown' ? '#f59e0b' : currentSound === 'rain' ? '#38bdf8' : '#a855f7';
      ctx.lineWidth = 2;

      for (let x = 0; x < width; x++) {
        let y = height / 2;
        if (currentSound === 'brown') {
          y += Math.sin(x * 0.02 + phase) * 14 + (Math.random() - 0.5) * 6;
        } else if (currentSound === 'rain') {
          y += (Math.random() - 0.5) * 22;
        } else if (currentSound === 'binaural') {
          y += Math.sin(x * 0.05 + phase) * 18 * Math.sin(x * 0.008 + phase * 0.2);
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animId = requestAnimationFrame(render);
    }
    render();
  }

  // =========================================================================
  // 4. MOBILE NAVIGATION DRAWER
  // =========================================================================
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
    });

    mobileDrawer.querySelectorAll('.m-nav-item').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // =========================================================================
  // 5. COMMAND PALETTE MODAL (Ctrl + K / Global Launcher)
  // =========================================================================
  const raycastBackdrop = document.getElementById('raycast-backdrop');
  const raycastSearch = document.getElementById('raycast-search');
  const raycastResults = document.getElementById('raycast-results');
  const openRaycastBtns = document.querySelectorAll('.open-raycast-btn');

  const commands = [
    { name: 'Switch to Tasks & Habits', category: 'Workspace', action: () => { updateStage('tasks'); scrollToSection('showcase'); } },
    { name: 'Switch to Daily Journal', category: 'Workspace', action: () => { updateStage('diary'); scrollToSection('showcase'); } },
    { name: 'Switch to Focus Studio', category: 'Workspace', action: () => { updateStage('focus'); scrollToSection('showcase'); } },
    { name: 'Switch to Rhythm Analytics', category: 'Workspace', action: () => { updateStage('analytics'); scrollToSection('showcase'); } },
    { name: 'Switch to Day Planner', category: 'Workspace', action: () => { updateStage('planner'); scrollToSection('showcase'); } },
    { name: 'Switch to Instant Notes', category: 'Workspace', action: () => { updateStage('notes'); scrollToSection('showcase'); } },
    { name: 'Start Brown Noise Audio', category: 'Soundscapes', action: () => { startBrownNoise(); scrollToSection('lab'); } },
    { name: 'Start Rainfall Ambient Audio', category: 'Soundscapes', action: () => { startRainfall(); scrollToSection('lab'); } },
    { name: 'Start 6Hz Binaural Beats', category: 'Soundscapes', action: () => { startBinaural(); scrollToSection('lab'); } },
    { name: 'Download Doing It for Windows 11', category: 'Download', action: () => { window.location.href = 'https://github.com/sidhu1512/doing-it/releases/download/v4.4.0/Doing.It.Setup.4.4.0.exe'; } },
    { name: 'View GitHub Repository', category: 'External', action: () => { window.open('https://github.com/sidhu1512/doing-it', '_blank'); } }
  ];

  let selectedIdx = 0;
  let filteredCommands = [...commands];

  function renderRaycastResults() {
    if (!raycastResults) return;
    if (filteredCommands.length === 0) {
      raycastResults.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">No matching commands found</div>';
      return;
    }

    raycastResults.innerHTML = filteredCommands.map((cmd, idx) => `
      <div class="raycast-item ${idx === selectedIdx ? 'active' : ''}" data-idx="${idx}">
        <div class="raycast-item-left">
          <span>${cmd.name}</span>
        </div>
        <span class="raycast-item-badge">${cmd.category}</span>
      </div>
    `).join('');

    raycastResults.querySelectorAll('.raycast-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx);
        executeCommand(idx);
      });
    });
  }

  function executeCommand(idx) {
    const cmd = filteredCommands[idx];
    if (cmd && cmd.action) {
      cmd.action();
      closeRaycast();
    }
  }

  function openRaycast() {
    if (!raycastBackdrop) return;
    raycastBackdrop.style.display = 'flex';
    if (raycastSearch) {
      raycastSearch.value = '';
      raycastSearch.focus();
    }
    filteredCommands = [...commands];
    selectedIdx = 0;
    renderRaycastResults();
  }

  function closeRaycast() {
    if (!raycastBackdrop) return;
    raycastBackdrop.style.display = 'none';
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  openRaycastBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRaycast();
    });
  });

  if (raycastBackdrop) {
    raycastBackdrop.addEventListener('click', (e) => {
      if (e.target === raycastBackdrop) closeRaycast();
    });
  }

  if (raycastSearch) {
    raycastSearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        filteredCommands = [...commands];
      } else {
        filteredCommands = commands.filter(c => 
          c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
        );
      }
      selectedIdx = 0;
      renderRaycastResults();
    });

    raycastSearch.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % filteredCommands.length;
        renderRaycastResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + filteredCommands.length) % filteredCommands.length;
        renderRaycastResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(selectedIdx);
      } else if (e.key === 'Escape') {
        closeRaycast();
      }
    });
  }

  // Global Keyboard listener for Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (raycastBackdrop && raycastBackdrop.style.display === 'flex') {
        closeRaycast();
      } else {
        openRaycast();
      }
    } else if (e.key === 'Escape') {
      closeRaycast();
      closeLightbox();
    }
  });

  // =========================================================================
  // 6. HIGH-DPI LIGHTBOX INSPECTOR
  // =========================================================================
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxCaption = document.getElementById('lightbox-caption');

  function openLightbox(src, caption = '') {
    if (!lightboxBackdrop || !lightboxImg) return;
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption || 'Doing It Native Resolution Capture';
    lightboxBackdrop.style.display = 'flex';
  }

  function closeLightbox() {
    if (!lightboxBackdrop) return;
    lightboxBackdrop.style.display = 'none';
  }

  document.querySelectorAll('.zoomable-img').forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(img.src, img.alt);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === lightboxBackdrop) closeLightbox();
    });
  }

});
