/**
 * Doing It — Product Website Client Controller
 * Gallery Tab Switcher, Web Audio Procedural Synthesizer, FAQ Accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Gallery Tab Switcher
  const tabs = document.querySelectorAll('.gallery-tab-item');
  const galleryImg = document.getElementById('gallery-target-img');

  const galleryData = {
    tasks: 'imgs/tasks-view.png',
    focus: 'imgs/focus-view.png',
    notes: 'imgs/notes-view.png',
    planner: 'imgs/planner-view.png',
    palette: 'imgs/palette-view.png',
    settings: 'imgs/settings-view.png'
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const view = tab.getAttribute('data-view');
      if (galleryData[view] && galleryImg) {
        galleryImg.style.opacity = '0';
        galleryImg.style.transform = 'scale(0.97)';
        setTimeout(() => {
          galleryImg.src = galleryData[view];
          galleryImg.alt = view + ' interface';
          galleryImg.style.opacity = '1';
          galleryImg.style.transform = 'scale(1)';
        }, 140);
      }
    });
  });

  // 2. Interactive Web Audio Ambient Synthesizer (Staff Engineer Feature)
  let audioCtx = null;
  let activeSource = null;
  let activeGain = null;
  let currentSound = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
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
    document.querySelectorAll('.sound-btn').forEach(btn => btn.classList.remove('playing'));
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
    btn.classList.add('playing');

    const bufferSize = ctx.sampleRate * 3; // 3 second loop
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

    if (type === 'lofi') {
      // Binaural dual oscillators with 6Hz offset
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 216; // A3
      osc2.frequency.value = 222; // A3 + 6Hz theta wave

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      activeSource = {
        stop: () => { osc1.stop(); osc2.stop(); },
        disconnect: () => { osc1.disconnect(); osc2.disconnect(); }
      };
      activeGain = gain;
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'brown' ? 450 : type === 'rain' ? 1200 : 700;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    activeSource = source;
    activeGain = gain;
  }

  document.querySelectorAll('.sound-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-sound');
      playSound(type, btn);
    });
  });

  // 3. FAQ Accordion
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

  // 4. Smooth Anchor Scrolling
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
});
