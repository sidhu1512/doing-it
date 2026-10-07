/**
 * Doing It — Staff-Level Aceternity UI Product Experience Controller
 * 
 * Subsystems:
 * 1. 60fps Canvas Sparkles / Starfield Particle Engine
 * 2. Background Laser Beams with Surface Collision Shockwaves
 * 3. Dynamic Flip Words Typography Engine
 * 4. Hero Stage Video & View Inspector Controller
 * 5. Cinema Video Theater (Timeline scrubber, chapter sync, play/mute/fullscreen)
 * 6. 3D Hero Parallax (Scroll-reactive horizontal tier sliding & perspective tilt)
 * 7. 3D Pin Cards Interactive Perspective Tilt
 * 8. Real-Time Chrono NLP Task Parser with Interactive Streak Checklist
 * 9. Picture-in-Picture Mini-Timer Widget (Ticking countdown, SVG progress arc)
 * 10. Circadian Rhythm 0-100 Gauge & 12-Week Interactive Heatmap
 * 11. Zero-Asset Web Audio Procedural Synthesizer & Real-Time Canvas Spectrum Visualizer
 * 12. Bento Grid Cursor-Tracking Radial Spotlight
 * 13. Global Raycast Command Palette Modal (Ctrl+K fuzzy search & keyboard navigation)
 * 14. Screenshot Lightbox Zoom Inspection Modal
 * 15. Smooth FAQ Accordion
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. 60FPS CANVAS SPARKLES / STARFIELD ENGINE (ACETERNITY SIGNATURE)
  // =========================================================================
  const sparklesCanvas = document.getElementById('sparkles-canvas');
  if (sparklesCanvas) {
    const ctx = sparklesCanvas.getContext('2d');
    let animationFrameId = null;
    let particles = [];
    let isVisible = true;
    let width = 0;
    let height = 0;

    function resizeSparkles() {
      const rect = sparklesCanvas.parentElement.getBoundingClientRect();
      width = sparklesCanvas.width = rect.width;
      height = sparklesCanvas.height = rect.height;
      initSparkles();
    }

    function initSparkles() {
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

    function drawSparkles() {
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

      animationFrameId = requestAnimationFrame(drawSparkles);
    }

    window.addEventListener('resize', resizeSparkles);
    resizeSparkles();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          drawSparkles();
        } else if (!isVisible && animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      });
    }, { threshold: 0.05 });

    observer.observe(sparklesCanvas.parentElement);
    drawSparkles();
  }

  // =========================================================================
  // 2. BACKGROUND LASER BEAMS WITH COLLISION SHOCKWAVES
  // =========================================================================
  const beamsCanvas = document.getElementById('beams-canvas');
  if (beamsCanvas) {
    const ctx = beamsCanvas.getContext('2d');
    let width = beamsCanvas.width = window.innerWidth;
    let height = beamsCanvas.height = window.innerHeight;
    let beams = [];
    let shockwaves = [];

    window.addEventListener('resize', () => {
      width = beamsCanvas.width = window.innerWidth;
      height = beamsCanvas.height = window.innerHeight;
    });

    function spawnBeam() {
      if (beams.length < 5 && Math.random() < 0.03) {
        const x = Math.random() * width;
        beams.push({
          x: x,
          y: -100,
          length: Math.random() * 120 + 80,
          speed: Math.random() * 6 + 4,
          targetY: Math.random() * (height * 0.7) + height * 0.2,
          color: Math.random() > 0.5 ? '#38bdf8' : '#a855f7'
        });
      }
    }

    function updateAndDrawBeams() {
      ctx.clearRect(0, 0, width, height);
      spawnBeam();

      // Draw Beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.y += b.speed;

        const grad = ctx.createLinearGradient(b.x, b.y - b.length, b.x, b.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, b.color);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y - b.length);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        // Collision Check
        if (b.y >= b.targetY) {
          // Trigger collision shockwave
          shockwaves.push({
            x: b.x,
            y: b.targetY,
            radius: 2,
            maxRadius: Math.random() * 30 + 20,
            opacity: 0.8,
            color: b.color
          });
          beams.splice(i, 1);
        }
      }

      // Draw Collision Shockwaves
      for (let j = shockwaves.length - 1; j >= 0; j--) {
        const s = shockwaves[j];
        s.radius += 1.2;
        s.opacity -= 0.025;

        if (s.opacity <= 0 || s.radius >= s.maxRadius) {
          shockwaves.splice(j, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.opacity);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      requestAnimationFrame(updateAndDrawBeams);
    }

    updateAndDrawBeams();
  }

  // =========================================================================
  // 3. DYNAMIC FLIP WORDS TYPOGRAPHY ENGINE
  // =========================================================================
  const flipWordEl = document.getElementById('flip-word');
  if (flipWordEl) {
    const words = [
      'deep flow state',
      'daily journaling',
      'circadian rhythm',
      'focus sprints',
      'meeting clarity',
      'infinite momentum'
    ];
    let currentIndex = 0;

    setInterval(() => {
      flipWordEl.classList.remove('active');
      flipWordEl.classList.add('exiting');

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % words.length;
        flipWordEl.textContent = words[currentIndex];
        flipWordEl.classList.remove('exiting');
        flipWordEl.classList.add('entering');

        setTimeout(() => {
          flipWordEl.classList.remove('entering');
          flipWordEl.classList.add('active');
        }, 50);
      }, 400);
    }, 3200);
  }

  // =========================================================================
  // 4. HERO STAGE VIDEO & VIEW INSPECTOR CONTROLLER
  // =========================================================================
  const modeBtnVideo = document.getElementById('mode-btn-video');
  const modeBtnScreens = document.getElementById('mode-btn-screens');
  const heroVideo = document.getElementById('hero-video-player');
  const heroImg = document.getElementById('hero-mockup-img');
  const heroTabs = document.getElementById('hero-tabs-slider');
  const heroPlayBtn = document.getElementById('hero-video-play-btn');
  const heroPlayIcon = document.getElementById('hero-play-icon');

  if (modeBtnVideo && modeBtnScreens) {
    modeBtnVideo.addEventListener('click', () => {
      modeBtnVideo.classList.add('active');
      modeBtnScreens.classList.remove('active');
      if (heroVideo) heroVideo.style.display = 'block';
      if (heroImg) heroImg.style.display = 'none';
      if (heroTabs) heroTabs.style.display = 'none';
    });

    modeBtnScreens.addEventListener('click', () => {
      modeBtnScreens.classList.add('active');
      modeBtnVideo.classList.remove('active');
      if (heroVideo) heroVideo.style.display = 'none';
      if (heroImg) heroImg.style.display = 'block';
      if (heroTabs) heroTabs.style.display = 'flex';
    });
  }

  if (heroPlayBtn && heroVideo) {
    heroPlayBtn.addEventListener('click', () => {
      if (heroVideo.paused) {
        heroVideo.play();
        heroPlayIcon.textContent = '⏸ Pause';
      } else {
        heroVideo.pause();
        heroPlayIcon.textContent = '▶ Play';
      }
    });
  }

  const viewImages = {
    tasks: 'imgs/tasks-view.png',
    diary: 'imgs/diary-view.png',
    analytics: 'imgs/analytics-view.png',
    focus: 'imgs/focus-view.png',
    notes: 'imgs/notes-view.png',
    planner: 'imgs/planner-view.png',
    palette: 'imgs/palette-view.png',
    settings: 'imgs/settings-view.png'
  };

  const heroTabButtons = document.querySelectorAll('.hero-tab-pill');
  heroTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      heroTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (heroImg && viewImages[view]) {
        heroImg.style.opacity = '0';
        heroImg.style.transform = 'scale(0.98)';
        setTimeout(() => {
          heroImg.src = viewImages[view];
          heroImg.style.opacity = '1';
          heroImg.style.transform = 'scale(1)';
        }, 180);
      }
    });
  });

  // 3D Perspective Tilt on Hero Stage
  const stageWrap = document.querySelector('.stage-wrap');
  const stageInner = document.querySelector('.stage-inner');

  if (stageWrap && stageInner && window.matchMedia('(hover: hover)').matches) {
    stageWrap.addEventListener('mousemove', (e) => {
      const rect = stageWrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 6;

      stageInner.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    stageWrap.addEventListener('mouseleave', () => {
      stageInner.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // =========================================================================
  // 5. CINEMA VIDEO THEATER CONTROLLER
  // =========================================================================
  const tourVideo = document.getElementById('main-tour-video');
  const tourPlayBtn = document.getElementById('tour-play-pause-btn');
  const tourBtnIcon = document.getElementById('tour-btn-icon');
  const tourBtnText = document.getElementById('tour-btn-text');
  const tourMuteBtn = document.getElementById('tour-mute-btn');
  const tourMuteIcon = document.getElementById('tour-mute-icon');
  const timelineFill = document.getElementById('theater-progress-fill');
  const timelineBar = document.getElementById('theater-timeline');
  const fullscreenBtn = document.getElementById('tour-fullscreen-btn');
  const chapterPills = document.querySelectorAll('.chapter-pill');

  if (tourVideo && tourPlayBtn) {
    tourPlayBtn.addEventListener('click', () => {
      if (tourVideo.paused) {
        tourVideo.play();
        tourBtnIcon.textContent = '⏸';
        tourBtnText.textContent = 'Pause';
      } else {
        tourVideo.pause();
        tourBtnIcon.textContent = '▶';
        tourBtnText.textContent = 'Play';
      }
    });

    if (tourMuteBtn) {
      tourMuteBtn.addEventListener('click', () => {
        tourVideo.muted = !tourVideo.muted;
        tourMuteIcon.textContent = tourVideo.muted ? '🔇' : '🔊';
      });
    }

    tourVideo.addEventListener('timeupdate', () => {
      if (tourVideo.duration) {
        const percent = (tourVideo.currentTime / tourVideo.duration) * 100;
        if (timelineFill) timelineFill.style.width = percent + '%';

        // Update active chapter based on time
        chapterPills.forEach(pill => {
          const startTime = parseFloat(pill.dataset.time || 0);
          if (tourVideo.currentTime >= startTime) {
            chapterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
          }
        });
      }
    });

    if (timelineBar) {
      timelineBar.addEventListener('click', (e) => {
        const rect = timelineBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        if (tourVideo.duration) {
          tourVideo.currentTime = (clickX / width) * tourVideo.duration;
        }
      });
    }

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        if (tourVideo.requestFullscreen) {
          tourVideo.requestFullscreen();
        } else if (tourVideo.webkitRequestFullscreen) {
          tourVideo.webkitRequestFullscreen();
        }
      });
    }

    chapterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const time = parseFloat(pill.dataset.time || 0);
        chapterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        tourVideo.currentTime = time;
        if (tourVideo.paused) {
          tourVideo.play();
          tourBtnIcon.textContent = '⏸';
          tourBtnText.textContent = 'Pause';
        }
      });
    });
  }

  // =========================================================================
  // 6. 3D HERO PARALLAX CONTROLLER
  // =========================================================================
  const parallaxGrid = document.getElementById('parallax-grid');
  const row1 = document.querySelector('.parallax-row.row-1');
  const row2 = document.querySelector('.parallax-row.row-2');
  const row3 = document.querySelector('.parallax-row.row-3');

  if (parallaxGrid && row1 && row2 && row3) {
    let ticking = false;

    function onParallaxScroll() {
      const rect = parallaxGrid.parentElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Only calculate if visible
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const shift1 = (progress - 0.5) * 200;
        const shift2 = (progress - 0.5) * -220;
        const shift3 = (progress - 0.5) * 180;

        row1.style.transform = `translateX(${shift1}px)`;
        row2.style.transform = `translateX(${shift2}px)`;
        row3.style.transform = `translateX(${shift3}px)`;
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onParallaxScroll);
        ticking = true;
      }
    }, { passive: true });

    onParallaxScroll();
  }

  // =========================================================================
  // 7. 3D PIN CARDS INTERACTIVE PERSPECTIVE TILT
  // =========================================================================
  const pinContainers = document.querySelectorAll('.pin-card-container');
  pinContainers.forEach(container => {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotX = ((y - centerY) / centerY) * -10;
      const rotY = ((x - centerX) / centerX) * 12;

      container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });

    container.addEventListener('mouseleave', () => {
      container.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // =========================================================================
  // 8. INTERACTIVE CHRONO NLP TASK PARSER
  // =========================================================================
  const nlpInput = document.getElementById('nlp-demo-input');
  const nlpAddBtn = document.getElementById('nlp-add-btn');
  const nlpTitleVal = document.getElementById('nlp-parsed-title');
  const nlpDateBadge = document.getElementById('nlp-due-date-badge');
  const nlpPriorityBadge = document.getElementById('nlp-priority-badge');
  const nlpTaskList = document.getElementById('nlp-tasks-demo-list');
  const nlpPresets = document.querySelectorAll('.nlp-preset-pill');

  function parseNlpString(text) {
    let clean = text;
    let priority = 'NORMAL';
    let priorityClass = 'nlp-badge-normal';
    let dateStr = 'No due date';

    if (/!urgent|!high/i.test(clean)) {
      priority = 'HIGH';
      priorityClass = 'nlp-badge-high';
      clean = clean.replace(/!urgent|!high/gi, '').trim();
    } else if (/!med|!medium/i.test(clean)) {
      priority = 'MEDIUM';
      priorityClass = 'nlp-badge-medium';
      clean = clean.replace(/!med|!medium/gi, '').trim();
    }

    if (/today/i.test(clean)) {
      dateStr = 'Today';
      clean = clean.replace(/today/gi, '').trim();
    } else if (/tomorrow/i.test(clean)) {
      dateStr = 'Tomorrow';
      clean = clean.replace(/tomorrow/gi, '').trim();
    } else if (/friday/i.test(clean)) {
      dateStr = 'Friday, 10:00 AM';
      clean = clean.replace(/friday/gi, '').trim();
    }

    const timeMatch = clean.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (timeMatch) {
      dateStr += `, ${timeMatch[1].toUpperCase()}`;
      clean = clean.replace(timeMatch[0], '').trim();
    }

    if (/#streak/i.test(clean)) {
      priority = 'HABIT';
      priorityClass = 'nlp-badge-medium';
      clean = clean.replace(/#streak/gi, '').trim();
    }

    return { title: clean || 'New Task', dateStr, priority, priorityClass };
  }

  function updateNlpFeedback() {
    if (!nlpInput) return;
    const parsed = parseNlpString(nlpInput.value);
    if (nlpTitleVal) nlpTitleVal.textContent = parsed.title;
    if (nlpDateBadge) nlpDateBadge.textContent = parsed.dateStr;
    if (nlpPriorityBadge) {
      nlpPriorityBadge.textContent = parsed.priority;
      nlpPriorityBadge.className = `nlp-badge ${parsed.priorityClass}`;
    }
  }

  if (nlpInput) {
    nlpInput.addEventListener('input', updateNlpFeedback);
    updateNlpFeedback();

    nlpPresets.forEach(preset => {
      preset.addEventListener('click', () => {
        nlpInput.value = preset.dataset.preset;
        updateNlpFeedback();
      });
    });

    if (nlpAddBtn) {
      nlpAddBtn.addEventListener('click', () => {
        const parsed = parseNlpString(nlpInput.value);
        if (!parsed.title) return;

        const taskItem = document.createElement('div');
        taskItem.className = 'demo-task-item';
        taskItem.innerHTML = `
          <div class="demo-task-left">
            <input type="checkbox" class="demo-task-check">
            <span class="demo-task-label">${escapeHtml(parsed.title)}</span>
          </div>
          <div class="demo-task-tags">
            <span class="demo-date-tag">${escapeHtml(parsed.dateStr)}</span>
            <span class="nlp-badge ${parsed.priorityClass}">${escapeHtml(parsed.priority)}</span>
          </div>
        `;

        if (nlpTaskList) nlpTaskList.prepend(taskItem);
        nlpInput.value = '';
        updateNlpFeedback();
      });
    }

    if (nlpTaskList) {
      nlpTaskList.addEventListener('change', (e) => {
        if (e.target.classList.contains('demo-task-check')) {
          const item = e.target.closest('.demo-task-item');
          if (item) {
            item.classList.toggle('completed', e.target.checked);
          }
        }
      });
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =========================================================================
  // 9. DETACHED MINI-TIMER PIP WIDGET
  // =========================================================================
  const timerRing = document.getElementById('mini-timer-progress-ring');
  const timerTimeDisplay = document.getElementById('mini-timer-time');
  const timerToggleBtn = document.getElementById('mini-timer-toggle-btn');
  const timerResetBtn = document.getElementById('mini-timer-reset-btn');
  const timerModePills = document.querySelectorAll('.timer-mode-pill');

  let totalDurationSec = 25 * 60;
  let remainingSec = totalDurationSec;
  let timerInterval = null;
  let isTimerRunning = false;
  const ringCircumference = 2 * Math.PI * 40; // r = 40, ~251.32

  function updateTimerDisplay() {
    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    if (timerTimeDisplay) {
      timerTimeDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (timerRing) {
      const progress = remainingSec / totalDurationSec;
      const offset = ringCircumference * (1 - progress);
      timerRing.style.strokeDasharray = ringCircumference;
      timerRing.style.strokeDashoffset = offset;
    }
  }

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', () => {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Resume</span>
        `;
      } else {
        isTimerRunning = true;
        timerToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <span>Pause</span>
        `;
        timerInterval = setInterval(() => {
          if (remainingSec > 0) {
            remainingSec--;
            updateTimerDisplay();
          } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerToggleBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Start</span>
            `;
          }
        }, 1000);
      }
    });

    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        isTimerRunning = false;
        remainingSec = totalDurationSec;
        updateTimerDisplay();
        timerToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start</span>
        `;
      });
    }

    timerModePills.forEach(pill => {
      pill.addEventListener('click', () => {
        timerModePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mins = parseInt(pill.dataset.mins, 10);
        totalDurationSec = mins * 60;
        remainingSec = totalDurationSec;
        clearInterval(timerInterval);
        isTimerRunning = false;
        updateTimerDisplay();
        timerToggleBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start</span>
        `;
      });
    });

    updateTimerDisplay();
  }

  // =========================================================================
  // 10. PRODUCTIVITY RHYTHM GAUGE & 12-WEEK HEATMAP
  // =========================================================================
  const needle = document.getElementById('circadian-dial-needle');
  if (needle) {
    setTimeout(() => {
      needle.style.transform = 'rotate(78deg)';
    }, 400);
  }

  // =========================================================================
  // 11. ZERO-ASSET WEB AUDIO PROCEDURAL SYNTHESIZER
  // =========================================================================
  let audioCtx = null;
  let activeNodes = [];
  let currentSound = null;
  let analyser = null;
  let visualizerAnimId = null;

  const visualizerCanvas = document.getElementById('audio-visualizer-canvas');
  const nowPlayingEl = document.getElementById('sound-now-playing');
  const soundBtns = document.querySelectorAll('.sound-btn');
  const volSlider = document.getElementById('audio-volume-slider');

  function initAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function stopAllSounds() {
    activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    activeNodes = [];
    currentSound = null;
    soundBtns.forEach(b => b.classList.remove('active'));
    if (nowPlayingEl) nowPlayingEl.textContent = 'Synthesizer Idle';
    if (visualizerAnimId) {
      cancelAnimationFrame(visualizerAnimId);
      visualizerAnimId = null;
      clearVisualizer();
    }
  }

  function getMasterGain() {
    const gainNode = audioCtx.createGain();
    const vol = volSlider ? parseFloat(volSlider.value) : 0.2;
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    return gainNode;
  }

  function playBrownNoise() {
    initAudioCtx();
    stopAllSounds();
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);

    const master = getMasterGain();
    whiteNoise.connect(filter);
    filter.connect(master);
    whiteNoise.start();

    activeNodes.push(whiteNoise, filter, master);
    currentSound = 'brown';
    if (nowPlayingEl) nowPlayingEl.textContent = 'Playing: Deep Brown Noise (450Hz Low-Pass)';
    startVisualizer();
  }

  function playRain() {
    initAudioCtx();
    stopAllSounds();
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.2, audioCtx.currentTime);

    const master = getMasterGain();
    noise.connect(filter);
    filter.connect(master);
    noise.start();

    activeNodes.push(noise, filter, master);
    currentSound = 'rain';
    if (nowPlayingEl) nowPlayingEl.textContent = 'Playing: Filtered Acoustic Rain';
    startVisualizer();
  }

  function playForest() {
    initAudioCtx();
    stopAllSounds();
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(400, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const master = getMasterGain();
    noise.connect(filter);
    filter.connect(master);
    noise.start();

    activeNodes.push(noise, filter, lfo, lfoGain, master);
    currentSound = 'forest';
    if (nowPlayingEl) nowPlayingEl.textContent = 'Playing: Modulated Forest Wind';
    startVisualizer();
  }

  function playLoFiCalm() {
    initAudioCtx();
    stopAllSounds();

    // 6Hz Theta binaural beat: 216Hz Left, 222Hz Right
    const oscLeft = audioCtx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(216, audioCtx.currentTime);

    const oscRight = audioCtx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(222, audioCtx.currentTime);

    const merger = audioCtx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    const master = getMasterGain();
    merger.connect(master);

    oscLeft.start();
    oscRight.start();

    activeNodes.push(oscLeft, oscRight, merger, master);
    currentSound = 'lofi';
    if (nowPlayingEl) nowPlayingEl.textContent = 'Playing: 6Hz Theta Wave Binaural Calm';
    startVisualizer();
  }

  function clearVisualizer() {
    if (!visualizerCanvas) return;
    const ctx = visualizerCanvas.getContext('2d');
    ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  }

  function startVisualizer() {
    if (!visualizerCanvas || !analyser) return;
    const ctx = visualizerCanvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      visualizerAnimId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

      const barWidth = (visualizerCanvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * visualizerCanvas.height;
        const grad = ctx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#ec4899');

        ctx.fillStyle = grad;
        ctx.fillRect(x, visualizerCanvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }

    draw();
  }

  soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.sound;
      if (currentSound === type) {
        stopAllSounds();
      } else {
        soundBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (type === 'brown') playBrownNoise();
        else if (type === 'rain') playRain();
        else if (type === 'forest') playForest();
        else if (type === 'lofi') playLoFiCalm();
      }
    });
  });

  if (volSlider) {
    volSlider.addEventListener('input', () => {
      if (activeNodes.length > 0) {
        const master = activeNodes[activeNodes.length - 1];
        if (master && master.gain) {
          master.gain.setValueAtTime(parseFloat(volSlider.value), audioCtx.currentTime);
        }
      }
    });
  }

  // =========================================================================
  // 12. BENTO GRID MOUSE SPOTLIGHT ENGINE
  // =========================================================================
  const bentoItems = document.querySelectorAll('.bento-item');
  bentoItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      item.style.setProperty('--mouse-x', `${x}px`);
      item.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // =========================================================================
  // 13. GLOBAL RAYCAST COMMAND PALETTE MODAL (CTRL + K)
  // =========================================================================
  const raycastModal = document.getElementById('raycast-modal');
  const raycastInput = document.getElementById('raycast-search-input');
  const raycastList = document.getElementById('raycast-results-list');
  const openRaycastBtns = document.querySelectorAll('.open-raycast-btn');

  const commandCatalog = [
    { title: 'Open Live Video Tour', sub: 'Watch full screen recording of Doing It on Windows 11', cat: 'Media', action: () => scrollToSection('video-tour') },
    { title: 'Open 3D Hero Parallax', sub: 'Inspect layered workspaces floating in perspective space', cat: 'Showcase', action: () => scrollToSection('parallax') },
    { title: 'Open Chrono NLP Tasks', sub: 'Test natural language parsing and habit streaks', cat: 'Demos', action: () => scrollToSection('demos') },
    { title: 'Play Brown Noise Focus Sound', sub: 'Synthesize low-pass filtered audio in Web Audio', cat: 'Audio', action: () => playBrownNoise() },
    { title: 'Play Lo-Fi Binaural Theta Waves', sub: 'Generate 6Hz theta frequency soundscape', cat: 'Audio', action: () => playLoFiCalm() },
    { title: 'Inspect 0–100 Rhythm Analytics', sub: 'Explore circadian score and 12-week heatmap', cat: 'Analytics', action: () => scrollToSection('demos') },
    { title: 'View Operating System Synergy', sub: 'Always-on-top pinning, Spotify link & atomic staging', cat: 'Features', action: () => scrollToSection('features') },
    { title: 'View Keyboard Shortcuts Matrix', sub: 'Review global Ctrl+Shift+N and Ctrl+K shortcuts', cat: 'Efficiency', action: () => scrollToSection('shortcuts') },
    { title: 'Download Doing It v4.4.0', sub: 'Official Windows 10 & 11 64-bit installer (.exe)', cat: 'Download', action: () => window.location.href = 'https://github.com/sidhu1512/doing-it/releases/download/v4.4.0/Doing.It.Setup.4.4.0.exe' },
    { title: 'GitHub Repository', sub: 'View source code, star project, or report issues', cat: 'Source', action: () => window.open('https://github.com/sidhu1512/doing-it', '_blank') }
  ];

  function openRaycast() {
    if (!raycastModal) return;
    raycastModal.classList.add('open');
    if (raycastInput) {
      raycastInput.value = '';
      raycastInput.focus();
    }
    renderRaycastResults('');
  }

  function closeRaycast() {
    if (!raycastModal) return;
    raycastModal.classList.remove('open');
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    closeRaycast();
  }

  function renderRaycastResults(query) {
    if (!raycastList) return;
    raycastList.innerHTML = '';
    const q = query.toLowerCase().trim();

    const filtered = commandCatalog.filter(c => {
      return !q || c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      raycastList.innerHTML = '<div style="padding: 16px; color: var(--text-muted); font-size: 0.85rem; text-align: center;">No matching commands found.</div>';
      return;
    }

    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `raycast-item ${idx === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <div class="raycast-item-left">
          <div class="raycast-item-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div>
            <div class="raycast-item-title">${escapeHtml(cmd.title)}</div>
            <div class="raycast-item-sub">${escapeHtml(cmd.sub)}</div>
          </div>
        </div>
        <span class="raycast-item-shortcut">${escapeHtml(cmd.cat)}</span>
      `;
      item.addEventListener('click', () => {
        cmd.action();
        closeRaycast();
      });
      raycastList.appendChild(item);
    });
  }

  openRaycastBtns.forEach(btn => btn.addEventListener('click', openRaycast));

  if (raycastInput) {
    raycastInput.addEventListener('input', (e) => {
      renderRaycastResults(e.target.value);
    });

    raycastInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeRaycast();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = raycastList.querySelectorAll('.raycast-item');
        if (!items.length) return;
        let activeIdx = Array.from(items).findIndex(i => i.classList.contains('active'));
        if (e.key === 'ArrowDown') {
          activeIdx = (activeIdx + 1) % items.length;
        } else {
          activeIdx = (activeIdx - 1 + items.length) % items.length;
        }
        items.forEach(i => i.classList.remove('active'));
        items[activeIdx].classList.add('active');
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const active = raycastList.querySelector('.raycast-item.active');
        if (active) active.click();
      }
    });
  }

  if (raycastModal) {
    raycastModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('raycast-backdrop')) closeRaycast();
    });
  }

  // Global Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (raycastModal && raycastModal.classList.contains('open')) {
        closeRaycast();
      } else {
        openRaycast();
      }
    }
  });

  // =========================================================================
  // 14. SCREENSHOT LIGHTBOX ZOOM MODAL
  // =========================================================================
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const zoomableImgs = document.querySelectorAll('.zoomable-img');

  zoomableImgs.forEach(img => {
    img.addEventListener('click', () => {
      if (lightboxModal && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxModal.classList.add('open');
      }
    });
  });

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', () => {
      if (lightboxModal) lightboxModal.classList.remove('open');
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox-backdrop')) {
        lightboxModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 15. SMOOTH FAQ ACCORDION
  // =========================================================================
  const faqCards = document.querySelectorAll('.faq-card');
  faqCards.forEach(card => {
    const q = card.querySelector('.faq-q');
    if (q) {
      q.addEventListener('click', () => {
        const wasOpen = card.classList.contains('open');
        faqCards.forEach(c => c.classList.remove('open'));
        if (!wasOpen) card.classList.add('open');
      });
    }
  });

});
