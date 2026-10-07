/**
 * Doing It — Aceternity UI Product Experience Controller
 * 
 * Features:
 * 1. 60fps Canvas Sparkles / Starfield Engine (battery-aware via IntersectionObserver)
 * 2. 3D Perspective Tilt Parallax on Hero Showcase & Bento Cards
 * 3. Interactive Raycast Command Palette Modal (Ctrl+K / Cmd+K global shortcuts)
 * 4. Interactive Natural Language Task Capture (Chrono NLP Playground) with Habit Streaks
 * 5. Web Audio Procedural Synthesizer (Brown, Rain, Forest, Lo-Fi Calm) with Real-Time Canvas Waveform Visualizer
 * 6. Interactive Picture-in-Picture Mini-Timer Widget (ticking countdown, SVG circular progress)
 * 7. Circadian Rhythm & 12-Week Interactive Heatmap with Hover Tooltips
 * 8. Interface Showcase Tab Switcher with Animated Sliding Highlight
 * 9. Screenshot Lightbox Zoom Inspection Modal
 * 10. Reactive Mouse Spotlight Engine for Bento Grid
 * 11. FAQ Accordion with Smooth Animated Disclosure
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. 60FPS CANVAS SPARKLES / STARFIELD ENGINE (ACETERNITY SIGNATURE)
  // =========================================================================
  const canvas = document.getElementById('sparkles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let particles = [];
    let isVisible = true;
    let width = 0;
    let height = 0;

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const particleCount = Math.floor(Math.min(width, 1400) / 12);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.2 + 0.6,
          speedY: Math.random() * 0.45 + 0.15,
          speedX: (Math.random() - 0.5) * 0.25,
          opacity: Math.random() * 0.7 + 0.2,
          pulseSpeed: Math.random() * 0.02 + 0.008,
          pulseVal: Math.random() * Math.PI,
          isCyan: Math.random() > 0.6
        });
      }
    }

    function drawParticles() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulseVal += p.pulseSpeed;
        const currentOpacity = Math.max(0.1, p.opacity + Math.sin(p.pulseVal) * 0.35);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.isCyan) {
          ctx.fillStyle = `rgba(56, 189, 248, ${currentOpacity})`;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
          ctx.shadowBlur = p.size * 3;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.9})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          ctx.shadowBlur = p.size * 2;
        }
        ctx.fill();

        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
      }

      animationFrameId = requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          drawParticles();
        } else if (!isVisible && animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      });
    }, { threshold: 0.05 });

    observer.observe(canvas.parentElement);
    drawParticles();
  }

  // =========================================================================
  // 2. 3D PERSPECTIVE TILT PARALLAX (HERO STAGE)
  // =========================================================================
  const stageWrap = document.querySelector('.stage-wrap');
  const stageInner = document.querySelector('.stage-inner');

  if (stageWrap && stageInner && window.matchMedia('(hover: hover)').matches) {
    stageWrap.addEventListener('mousemove', (e) => {
      const rect = stageWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg
      const rotateY = ((x - centerX) / centerX) * 8;   // Max 8 deg

      stageInner.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    stageWrap.addEventListener('mouseleave', () => {
      stageInner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // =========================================================================
  // 3. INTERACTIVE RAYCAST COMMAND PALETTE (CTRL + K)
  // =========================================================================
  const raycastModal = document.getElementById('raycast-modal');
  const raycastInput = document.getElementById('raycast-search-input');
  const raycastList = document.getElementById('raycast-results-list');
  const openPaletteBtns = document.querySelectorAll('.open-raycast-btn, .satellite-palette');

  const commandCatalog = [
    { id: 'tasks', category: 'Views', title: 'Open Tasks & Streaks', subtitle: 'View natural language tasks and daily habit streaks', icon: 'tasks', shortcut: '1', action: () => switchHeroView('tasks') },
    { id: 'diary', category: 'Views', title: 'Open Day One Diary', subtitle: 'View daily reflections, mood tracking & voice notes', icon: 'diary', shortcut: '2', action: () => switchHeroView('diary') },
    { id: 'analytics', category: 'Views', title: 'Open Productivity Analytics', subtitle: 'Inspect 0–100 rhythm score, peak hours & heatmap', icon: 'analytics', shortcut: '3', action: () => switchHeroView('analytics') },
    { id: 'focus', category: 'Views', title: 'Open Focus Studio', subtitle: 'Pomodoro timer with procedural sound & Spotify', icon: 'focus', shortcut: '4', action: () => switchHeroView('focus') },
    { id: 'notes', category: 'Views', title: 'Open Markdown Notes', subtitle: 'Rich scratchpad with syntax highlighting & link cards', icon: 'notes', shortcut: '5', action: () => switchHeroView('notes') },
    { id: 'planner', category: 'Views', title: 'Open Day Planner', subtitle: 'RFC 5545 iCalendar sync with 1-click video meetings', icon: 'planner', shortcut: '6', action: () => switchHeroView('planner') },
    { id: 'sound-brown', category: 'Audio', title: 'Play Brown Noise', subtitle: 'Low-pass filtered deep acoustic rumble', icon: 'audio', shortcut: 'B', action: () => triggerSoundById('brown') },
    { id: 'sound-rain', category: 'Audio', title: 'Play Rainfall Soundscape', subtitle: 'Multi-band acoustic precipitation', icon: 'audio', shortcut: 'R', action: () => triggerSoundById('rain') },
    { id: 'sound-forest', category: 'Audio', title: 'Play Forest Breeze', subtitle: 'Modulated pine forest wind', icon: 'audio', shortcut: 'F', action: () => triggerSoundById('forest') },
    { id: 'sound-lofi', category: 'Audio', title: 'Play Lo-Fi Binaural Theta Waves', subtitle: '6Hz dual-oscillator focus waves', icon: 'audio', shortcut: 'L', action: () => triggerSoundById('lofi') },
    { id: 'add-task', category: 'Tasks', title: 'Quick Add Task', subtitle: 'Open natural language parser', icon: 'add', shortcut: 'Ctrl+Shift+A', action: () => scrollToSection('#demos') },
    { id: 'github', category: 'External', title: 'Open GitHub Repository', subtitle: 'github.com/sidhu1512/doing-it (MIT)', icon: 'github', shortcut: 'G', action: () => window.open('https://github.com/sidhu1512/doing-it', '_blank') },
    { id: 'download', category: 'System', title: 'Download Doing It v4.4.0', subtitle: '64-bit Windows installer for Windows 10/11', icon: 'download', shortcut: 'D', action: () => window.location.href = 'https://github.com/sidhu1512/doing-it/releases/download/v4.4.0/Doing.It.Setup.4.4.0.exe' }
  ];

  let selectedIndex = 0;
  let filteredCommands = [...commandCatalog];

  function openRaycast() {
    if (!raycastModal) return;
    raycastModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (raycastInput) {
      raycastInput.value = '';
      raycastInput.focus();
    }
    filterCommands('');
  }

  function closeRaycast() {
    if (!raycastModal) return;
    raycastModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function filterCommands(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      filteredCommands = [...commandCatalog];
    } else {
      filteredCommands = commandCatalog.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    selectedIndex = 0;
    renderRaycastList();
  }

  function renderRaycastList() {
    if (!raycastList) return;
    if (filteredCommands.length === 0) {
      raycastList.innerHTML = `
        <div class="raycast-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No matching actions found. Try "focus", "sound", or "diary".</p>
        </div>
      `;
      return;
    }

    let html = '';
    let currentCategory = '';

    filteredCommands.forEach((cmd, idx) => {
      if (cmd.category !== currentCategory) {
        currentCategory = cmd.category;
        html += `<div class="raycast-group-header">${currentCategory}</div>`;
      }
      const isSelected = idx === selectedIndex;
      html += `
        <div class="raycast-item ${isSelected ? 'selected' : ''}" data-idx="${idx}">
          <div class="raycast-item-left">
            <span class="raycast-item-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
            <div class="raycast-item-text">
              <span class="raycast-item-title">${cmd.title}</span>
              <span class="raycast-item-desc">${cmd.subtitle}</span>
            </div>
          </div>
          <span class="raycast-item-badge">${cmd.shortcut}</span>
        </div>
      `;
    });

    raycastList.innerHTML = html;

    raycastList.querySelectorAll('.raycast-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        executeCommand(idx);
      });
      item.addEventListener('mouseenter', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        selectedIndex = idx;
        updateSelectedHighlight();
      });
    });

    scrollSelectedIntoView();
  }

  function updateSelectedHighlight() {
    if (!raycastList) return;
    const items = raycastList.querySelectorAll('.raycast-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedIndex);
    });
  }

  function scrollSelectedIntoView() {
    const selected = raycastList?.querySelector('.raycast-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  function executeCommand(idx) {
    if (filteredCommands[idx]) {
      const cmd = filteredCommands[idx];
      closeRaycast();
      setTimeout(() => {
        cmd.action();
      }, 100);
    }
  }

  openPaletteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openRaycast();
    });
  });

  if (raycastInput) {
    raycastInput.addEventListener('input', (e) => {
      filterCommands(e.target.value);
    });

    raycastInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          selectedIndex = (selectedIndex + 1) % filteredCommands.length;
          updateSelectedHighlight();
          scrollSelectedIntoView();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredCommands.length > 0) {
          selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
          updateSelectedHighlight();
          scrollSelectedIntoView();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(selectedIndex);
      } else if (e.key === 'Escape') {
        closeRaycast();
      }
    });
  }

  // Global Keyboard listener for Ctrl+K / Cmd+K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (raycastModal?.classList.contains('active')) {
        closeRaycast();
      } else {
        openRaycast();
      }
    } else if (e.key === 'Escape') {
      closeRaycast();
      closeLightbox();
    }
  });

  const modalBackdrop = document.querySelector('.raycast-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeRaycast);
  }

  // =========================================================================
  // 4. INTERACTIVE NATURAL LANGUAGE TASK CAPTURE (CHRONO NLP DEMO)
  // =========================================================================
  const nlpInput = document.getElementById('nlp-demo-input');
  const nlpParsedTitle = document.getElementById('nlp-parsed-title');
  const nlpDueDateBadge = document.getElementById('nlp-due-date-badge');
  const nlpPriorityBadge = document.getElementById('nlp-priority-badge');
  const nlpAddBtn = document.getElementById('nlp-add-btn');
  const nlpTasksList = document.getElementById('nlp-tasks-demo-list');

  function parseNaturalLanguage(text) {
    let clean = text.trim();
    let priority = 'normal';
    let dateStr = 'No due date';

    // Priority flag check
    if (/!(high|urgent|p1)/i.test(clean)) {
      priority = 'high';
      clean = clean.replace(/!(high|urgent|p1)/i, '').trim();
    } else if (/!(med|medium|p2)/i.test(clean)) {
      priority = 'medium';
      clean = clean.replace(/!(med|medium|p2)/i, '').trim();
    } else if (/!(low|p3)/i.test(clean)) {
      priority = 'low';
      clean = clean.replace(/!(low|p3)/i, '').trim();
    }

    // Natural date phrases
    const lower = clean.toLowerCase();
    const today = new Date();
    if (lower.includes('today')) {
      dateStr = 'Today, ' + today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      clean = clean.replace(/today/gi, '').trim();
    } else if (lower.includes('tomorrow')) {
      const tmrw = new Date(today);
      tmrw.setDate(tmrw.getDate() + 1);
      dateStr = 'Tomorrow, ' + tmrw.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      clean = clean.replace(/tomorrow/gi, '').trim();
    } else if (lower.includes('friday')) {
      dateStr = 'This Friday';
      clean = clean.replace(/friday/gi, '').trim();
    } else if (lower.includes('next week') || lower.includes('monday')) {
      dateStr = 'Next Monday';
      clean = clean.replace(/(next week|monday)/gi, '').trim();
    }

    // Time detection (e.g. 3pm, 4:30pm, 11am)
    const timeMatch = clean.match(/(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)/i);
    if (timeMatch) {
      dateStr += (dateStr === 'No due date' ? 'Today ' : ' ') + timeMatch[1].toUpperCase();
      clean = clean.replace(timeMatch[0], '').trim();
    }

    // Clean whitespace
    clean = clean.replace(/\s+/g, ' ');

    return {
      title: clean || 'New Task',
      priority,
      dateStr
    };
  }

  function updateNlpPreview() {
    if (!nlpInput) return;
    const parsed = parseNaturalLanguage(nlpInput.value || 'Deploy Doing It v4.4 to GitHub Pages tomorrow 5pm !high');
    if (nlpParsedTitle) nlpParsedTitle.textContent = parsed.title;
    if (nlpDueDateBadge) nlpDueDateBadge.textContent = parsed.dateStr;
    if (nlpPriorityBadge) {
      nlpPriorityBadge.textContent = parsed.priority.toUpperCase();
      nlpPriorityBadge.className = `nlp-badge nlp-badge-${parsed.priority}`;
    }
  }

  if (nlpInput) {
    nlpInput.addEventListener('input', updateNlpPreview);
    updateNlpPreview();

    if (nlpAddBtn) {
      nlpAddBtn.addEventListener('click', () => {
        const text = nlpInput.value.trim();
        if (!text) return;
        const parsed = parseNaturalLanguage(text);

        if (nlpTasksList) {
          const item = document.createElement('div');
          item.className = 'demo-task-item';
          item.innerHTML = `
            <div class="demo-task-left">
              <input type="checkbox" class="demo-task-check">
              <span class="demo-task-label">${parsed.title}</span>
            </div>
            <div class="demo-task-tags">
              <span class="demo-date-tag">${parsed.dateStr}</span>
              <span class="nlp-badge nlp-badge-${parsed.priority}">${parsed.priority.toUpperCase()}</span>
            </div>
          `;
          nlpTasksList.prepend(item);

          const chk = item.querySelector('.demo-task-check');
          chk.addEventListener('change', () => {
            item.classList.toggle('completed', chk.checked);
          });
        }

        nlpInput.value = '';
        updateNlpPreview();
      });
    }

    // Preset buttons
    document.querySelectorAll('.nlp-preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        nlpInput.value = pill.getAttribute('data-preset');
        updateNlpPreview();
        nlpInput.focus();
      });
    });
  }

  // Pre-bound checkboxes in demo task list
  document.querySelectorAll('.demo-task-check').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const item = e.target.closest('.demo-task-item');
      if (item) item.classList.toggle('completed', e.target.checked);
    });
  });

  // =========================================================================
  // 5. WEB AUDIO PROCEDURAL SYNTHESIZER & REAL-TIME CANVAS VISUALIZER
  // =========================================================================
  let audioCtx = null;
  let activeSource = null;
  let activeGain = null;
  let analyserNode = null;
  let currentSound = null;
  let visualizerAnimId = null;

  const visualizerCanvas = document.getElementById('audio-visualizer-canvas');
  const visualizerCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
  const volumeSlider = document.getElementById('audio-volume-slider');

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 64;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function startVisualizer() {
    if (!visualizerCanvas || !visualizerCtx || !analyserNode) return;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const w = visualizerCanvas.width;
    const h = visualizerCanvas.height;

    function renderFrame() {
      visualizerAnimId = requestAnimationFrame(renderFrame);
      analyserNode.getByteFrequencyData(dataArray);

      visualizerCtx.clearRect(0, 0, w, h);

      const barWidth = (w / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.9 + 2;

        const grad = visualizerCtx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.8)');
        grad.addColorStop(1, '#ffffff');

        visualizerCtx.fillStyle = grad;
        visualizerCtx.fillRect(x, h - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    }

    if (!visualizerAnimId) renderFrame();
  }

  function stopVisualizer() {
    if (visualizerAnimId) {
      cancelAnimationFrame(visualizerAnimId);
      visualizerAnimId = null;
    }
    if (visualizerCanvas && visualizerCtx) {
      visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    }
  }

  function stopSound() {
    if (activeGain && audioCtx) {
      try {
        activeGain.gain.setValueAtTime(activeGain.gain.value, audioCtx.currentTime);
        activeGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        const s = activeSource;
        setTimeout(() => {
          try { s.stop(); s.disconnect(); } catch (e) {}
        }, 320);
      } catch (e) {}
    }
    activeSource = null;
    activeGain = null;
    currentSound = null;
    stopVisualizer();
    document.querySelectorAll('.sound-btn').forEach(btn => btn.classList.remove('playing'));
    const nowPlayingBadge = document.getElementById('sound-now-playing');
    if (nowPlayingBadge) nowPlayingBadge.textContent = 'Synthesizer Idle';
  }

  function playSound(type, btn) {
    const ctx = getAudioCtx();
    if (!ctx) return;

    if (currentSound === type) {
      stopSound();
      return;
    }

    stopSound();
    currentSound = type;
    if (btn) btn.classList.add('playing');

    const nowPlayingBadge = document.getElementById('sound-now-playing');
    if (nowPlayingBadge) {
      const names = { brown: 'Brown Noise Active', rain: 'Rainfall Soundscape', forest: 'Forest Breeze', lofi: '6Hz Lo-Fi Theta Waves' };
      nowPlayingBadge.textContent = names[type] || 'Synthesizing...';
    }

    const currentVol = volumeSlider ? parseFloat(volumeSlider.value) : 0.2;

    if (type === 'lofi') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 216; // A3
      osc2.frequency.value = 222; // A3 + 6Hz theta beat

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(currentVol * 0.4, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      osc1.start();
      osc2.start();

      activeSource = {
        stop: () => { osc1.stop(); osc2.stop(); },
        disconnect: () => { osc1.disconnect(); osc2.disconnect(); }
      };
      activeGain = gain;
      startVisualizer();
      return;
    }

    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastVal = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'brown') {
        data[i] = (lastVal + (0.025 * white)) / 1.025;
        lastVal = data[i];
        data[i] *= 2.8;
      } else if (type === 'rain') {
        data[i] = (lastVal + (0.09 * white)) / 1.09;
        lastVal = data[i];
        data[i] *= 1.4;
      } else if (type === 'forest') {
        data[i] = (lastVal + (0.04 * white)) / 1.04;
        lastVal = data[i];
        data[i] *= 1.8;
      } else {
        data[i] = white * 0.15;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'brown' ? 450 : type === 'rain' ? 1200 : 700;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(currentVol, ctx.currentTime + 0.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(analyserNode);
    analyserNode.connect(ctx.destination);

    source.start();
    activeSource = source;
    activeGain = gain;
    startVisualizer();
  }

  function triggerSoundById(soundId) {
    const btn = document.querySelector(`.sound-btn[data-sound="${soundId}"]`);
    if (btn) {
      playSound(soundId, btn);
      scrollToSection('#audio');
    }
  }

  document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-sound');
      playSound(type, btn);
    });
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (activeGain && audioCtx) {
        activeGain.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    });
  }

  // =========================================================================
  // 6. INTERACTIVE MINI-TIMER PICTURE-IN-PICTURE WIDGET
  // =========================================================================
  const timerCircle = document.getElementById('mini-timer-progress-ring');
  const timerDisplay = document.getElementById('mini-timer-time');
  const timerPlayBtn = document.getElementById('mini-timer-toggle-btn');
  const timerResetBtn = document.getElementById('mini-timer-reset-btn');

  let timerRemaining = 1500; // 25:00
  let timerDuration = 1500;
  let timerInterval = null;
  let timerRunning = false;
  const circumference = 2 * Math.PI * 40; // r=40

  if (timerCircle) {
    timerCircle.style.strokeDasharray = `${circumference}`;
    timerCircle.style.strokeDashoffset = '0';
  }

  function updateTimerUI() {
    if (!timerDisplay) return;
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerCircle) {
      const progress = (timerDuration - timerRemaining) / timerDuration;
      const offset = circumference * progress;
      timerCircle.style.strokeDashoffset = `${offset}`;
    }
  }

  function toggleTimer() {
    if (timerRunning) {
      clearInterval(timerInterval);
      timerRunning = false;
      if (timerPlayBtn) {
        timerPlayBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
    } else {
      timerRunning = true;
      if (timerPlayBtn) {
        timerPlayBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      }
      timerInterval = setInterval(() => {
        if (timerRemaining > 0) {
          timerRemaining--;
          updateTimerUI();
        } else {
          clearInterval(timerInterval);
          timerRunning = false;
          timerRemaining = timerDuration;
          updateTimerUI();
          if (timerPlayBtn) {
            timerPlayBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
          }
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerRemaining = timerDuration;
    updateTimerUI();
    if (timerPlayBtn) {
      timerPlayBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }
  }

  if (timerPlayBtn) timerPlayBtn.addEventListener('click', toggleTimer);
  if (timerResetBtn) timerResetBtn.addEventListener('click', resetTimer);

  document.querySelectorAll('.timer-mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.timer-mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const mins = parseInt(pill.getAttribute('data-mins'), 10) || 25;
      timerDuration = mins * 60;
      timerRemaining = timerDuration;
      resetTimer();
    });
  });

  updateTimerUI();

  // =========================================================================
  // 7. INTERFACE SHOWCASE & HERO TAB SWITCHER
  // =========================================================================
  const galleryData = {
    tasks: 'imgs/tasks-view.png',
    diary: 'imgs/diary-view.png',
    analytics: 'imgs/analytics-view.png',
    focus: 'imgs/focus-view.png',
    notes: 'imgs/notes-view.png',
    planner: 'imgs/planner-view.png',
    palette: 'imgs/palette-view.png',
    settings: 'imgs/settings-view.png'
  };

  function switchHeroView(viewName) {
    const heroImg = document.getElementById('hero-mockup-img');
    const heroTabs = document.querySelectorAll('.hero-tab-pill');
    
    heroTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-view') === viewName));

    if (heroImg && galleryData[viewName]) {
      heroImg.style.opacity = '0.15';
      heroImg.style.transform = 'scale(0.985)';
      setTimeout(() => {
        heroImg.src = galleryData[viewName];
        heroImg.alt = `Doing It ${viewName} interface`;
        heroImg.style.opacity = '1';
        heroImg.style.transform = 'scale(1)';
      }, 120);
    }

    // Sync Showcase tabs as well
    const showcaseTabs = document.querySelectorAll('.gallery-tab-item');
    const showcaseImg = document.getElementById('gallery-target-img');
    showcaseTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-view') === viewName));
    if (showcaseImg && galleryData[viewName]) {
      showcaseImg.src = galleryData[viewName];
    }
  }

  // Bind Hero Tabs
  document.querySelectorAll('.hero-tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const view = pill.getAttribute('data-view');
      switchHeroView(view);
    });
  });

  // Bind Showcase Gallery Tabs
  document.querySelectorAll('.gallery-tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      switchHeroView(view);
      if (window.innerWidth <= 1024) {
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  });

  // =========================================================================
  // 8. SCREENSHOT LIGHTBOX ZOOM INSPECTION MODAL
  // =========================================================================
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close-btn');

  function openLightbox(src, caption) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption || 'Doing It Interface View';
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  const lightboxBackdrop = document.querySelector('.lightbox-backdrop');
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  document.querySelectorAll('.zoomable-img').forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(img.src, img.alt);
    });
  });

  // =========================================================================
  // 9. REACTIVE MOUSE SPOTLIGHT ENGINE FOR BENTO GRID
  // =========================================================================
  const spotlightCards = document.querySelectorAll(
    '.bento-item, .soundboard-card, .satellite-card, .kbd-card, .cta-panel, .demo-panel-card'
  );

  spotlightCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', `-999px`);
      card.style.setProperty('--mouse-y', `-999px`);
    });
  });

  // =========================================================================
  // 10. FAQ ACCORDION
  // =========================================================================
  document.querySelectorAll('.faq-card').forEach(card => {
    const q = card.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', () => {
        const isOpen = card.classList.contains('open');
        document.querySelectorAll('.faq-card').forEach(c => c.classList.remove('open'));
        if (!isOpen) card.classList.add('open');
      });
    }
  });

  // =========================================================================
  // 11. SMOOTH SCROLLING
  // =========================================================================
  function scrollToSection(selector) {
    const target = document.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 12. Circadian Dial Animation on Scroll
  const dialNeedle = document.getElementById('circadian-dial-needle');
  if (dialNeedle) {
    const dialObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          dialNeedle.style.transform = 'rotate(78deg)'; // 94 / 100 score angle
        }
      });
    }, { threshold: 0.3 });
    dialObserver.observe(dialNeedle);
  }

});
