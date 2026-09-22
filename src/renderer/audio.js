/**
 * Web Audio Engine — Singleton Audio Context with Ambient Sound & Acoustic Chimes
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.ambientFilter = null;
    this.masterVolume = 0.5;
    this.activeType = 'none';
  }

  _getCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setVolume(level) {
    this.masterVolume = Math.max(0, Math.min(1, level));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.ctx.currentTime + 0.1);
    }
  }

  /**
   * Delightful subtle pop/click when checking off a task
   */
  playTaskPop() {
    const ctx = this._getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Harmonious warm chime for Pomodoro session completion (C5-E5-G5 triad)
   */
  playCompletionChime() {
    const ctx = this._getCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 triad
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 1.3);
    });
  }

  /**
   * Soft notification chime for reminders (A5-D6)
   */
  playNotificationChime() {
    const ctx = this._getCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  /**
   * High-quality synthesized ambient focus sounds (Brown Noise, Rain, Forest, Binaural)
   */
  startAmbient(type) {
    if (type === 'none' || !type) {
      this.stopAmbient();
      return;
    }

    const ctx = this._getCtx();
    if (!ctx) return;

    this.stopAmbient(true);
    this.activeType = type;

    const bufferSize = ctx.sampleRate * 4; // 4s buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'brown' || type === 'deep') {
        // Deep Brown Noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.6;
      } else if (type === 'rain') {
        // Rainfall
        lastOut = (lastOut + 0.035 * white) / 1.03;
        output[i] = lastOut * 2.8;
      } else if (type === 'forest') {
        // Forest breeze
        const lfo = Math.sin((i / bufferSize) * Math.PI * 4);
        lastOut = (lastOut + 0.025 * white) / 1.025;
        output[i] = lastOut * (2.2 + lfo * 0.8);
      } else if (type === 'binaural') {
        // Binaural Lo-Fi Calm Drone
        const t = i / ctx.sampleRate;
        const tone1 = Math.sin(2 * Math.PI * 136.1 * t); // Om frequency
        const tone2 = Math.sin(2 * Math.PI * 144.1 * t); // 8Hz alpha beat
        lastOut = (lastOut + 0.01 * white) / 1.01;
        output[i] = (tone1 + tone2) * 0.35 + lastOut * 0.5;
      } else {
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = lastOut * 3.5;
      }
    }

    if (type === 'rain') {
      // Soft raindrops pattern
      for (let i = 0; i < bufferSize; i += Math.floor(Math.random() * 1200 + 400)) {
        output[i] = (Math.random() - 0.5) * 1.8;
      }
    }

    this.ambientSource = ctx.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;

    this.ambientFilter = ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.value = type === 'rain' ? 1400 : (type === 'forest' ? 950 : 450);

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);

    this.ambientSource.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(ctx.destination);

    this.ambientSource.start(0);
    // Smooth fade in
    this.ambientGain.gain.linearRampToValueAtTime(this.masterVolume * 0.55, ctx.currentTime + 1.6);
  }

  stopAmbient(fast = false) {
    if (this.ambientGain && this.ctx) {
      const fadeTime = fast ? 0.12 : 1.2;
      const targetGain = this.ambientGain;
      const targetSource = this.ambientSource;

      targetGain.gain.setValueAtTime(targetGain.gain.value, this.ctx.currentTime);
      targetGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + fadeTime);
      setTimeout(() => {
        try {
          if (targetSource) {
            targetSource.stop();
            targetSource.disconnect();
          }
        } catch (e) {}
      }, (fadeTime + 0.1) * 1000);

      this.ambientGain = null;
      this.ambientSource = null;
      this.activeType = 'none';
    }
  }
}

window.audioEngine = new AudioEngine();
