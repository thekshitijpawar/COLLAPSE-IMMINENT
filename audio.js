/**
 * MARS: BEYOND SURVIVAL 🚀
 * audio.js — High-Fidelity Procedural Web Audio API Sound Synthesizer
 * Zero external audio files required. 100% synthesized procedural sound effects.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;
    this.roverOsc = null;
    this.roverGain = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.initialized = false;
    this.breathingActive = false;
    this.breathingTimer = null;
    this.heartbeatTimer = null;
    this.currentWindTarget = 0.15;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;

      this.startAmbientWind();
      this.setupRoverAudio();
    } catch (e) {
      console.warn("Web Audio API could not initialize:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 1. Procedural Ambient Wind with Pink/Brown Noise Filter
  startAmbientWind() {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.2;
        output[i] = (b0 + b1 + b2) * 0.25;
      }

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = noiseBuffer;
      this.windNode.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.windNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      this.windNode.start();

      // Slow dynamic wind gusting
      setInterval(() => {
        if (!this.ctx || !this.windFilter || !this.windGain) return;
        const now = this.ctx.currentTime;
        const freq = 200 + Math.random() * 220 + (this.currentWindTarget > 0.4 ? 400 : 0);
        this.windFilter.frequency.setTargetAtTime(freq, now, 1.8);
        const targetGain = this.currentWindTarget * (0.8 + Math.random() * 0.4);
        this.windGain.gain.setTargetAtTime(targetGain, now, 2.0);
      }, 2500);
    } catch (e) {
      console.warn("Could not start wind audio:", e);
    }
  }

  setWindStorm(isStorm) {
    this.currentWindTarget = isStorm ? 0.35 : 0.08;
    if (this.windFilter && this.ctx) {
      this.windFilter.frequency.setTargetAtTime(isStorm ? 600 : 260, this.ctx.currentTime, 1.0);
      this.windFilter.Q.setTargetAtTime(isStorm ? 1.5 : 3.0, this.ctx.currentTime, 1.0);
    }
  }

  // 2. Continuous Malfunctioning Rover Motor & Proximity Humming
  setupRoverAudio() {
    if (!this.ctx) return;
    try {
      this.roverOsc = this.ctx.createOscillator();
      const roverLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      this.roverGain = this.ctx.createGain();
      const roverFilter = this.ctx.createBiquadFilter();

      this.roverOsc.type = 'sawtooth';
      this.roverOsc.frequency.setValueAtTime(58, this.ctx.currentTime); // Low mechanical engine rumble

      roverLfo.type = 'sine';
      roverLfo.frequency.setValueAtTime(4.5, this.ctx.currentTime); // Motor cycle oscillation
      lfoGain.gain.setValueAtTime(14, this.ctx.currentTime);
      roverLfo.connect(lfoGain);
      lfoGain.connect(this.roverOsc.frequency);

      roverFilter.type = 'lowpass';
      roverFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.roverGain.gain.setValueAtTime(0.0001, this.ctx.currentTime); // Silent until rover exists

      this.roverOsc.connect(roverFilter);
      roverFilter.connect(this.roverGain);
      this.roverGain.connect(this.masterGain);

      this.roverOsc.start();
      roverLfo.start();
    } catch (e) {
      console.warn("Could not init rover audio:", e);
    }
  }

  updateRoverSound(distance, isAlerted) {
    if (!this.roverGain || !this.ctx) return;
    const maxDist = 45;
    if (distance > maxDist) {
      this.roverGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      return;
    }
    const factor = Math.max(0, 1 - distance / maxDist);
    const targetVolume = (factor * factor * 0.22) * (isAlerted ? 1.5 : 1.0);
    this.roverGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
  }

  // 3. Rover Alert Klaxon (When detecting player)
  playRoverAlarm() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(780, this.ctx.currentTime);
    osc.frequency.setValueAtTime(940, this.ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(780, this.ctx.currentTime + 0.24);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  // Out of Bounds Emergency EVA Geofence Siren
  playOutOfBoundsAlarm() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(520, now + 0.35);

    osc2.frequency.setValueAtTime(884, now);
    osc2.frequency.exponentialRampToValueAtTime(524, now + 0.35);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  }

  // 4. Astronaut Footsteps (Regolith soil vs Metal habitat floor)
  playFootstep(surface = 'dirt') {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    if (surface === 'metal') {
      // Metallic thud with resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Crunchy Martian regolith crunch
      const bufferSize = this.ctx.sampleRate * 0.07;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + Math.random() * 100, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
    }
  }

  // 5. Astronaut Breathing / Heartbeat (Triggers on Low Oxygen or Sprint)
  startBreathingLoop(intensity = 'normal') {
    if (this.breathingActive) return;
    this.breathingActive = true;
    this.runBreathingCycle(intensity);
  }

  stopBreathingLoop() {
    this.breathingActive = false;
    if (this.breathingTimer) clearTimeout(this.breathingTimer);
  }

  runBreathingCycle(intensity) {
    if (!this.breathingActive || !this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    const isHeavy = intensity === 'heavy' || intensity === 'critical';

    // Inhale (filtered white noise rising)
    const bufSize = this.ctx.sampleRate * (isHeavy ? 0.6 : 0.9);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.08 * Math.sin((i / bufSize) * Math.PI);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(700, now + (isHeavy ? 0.6 : 0.9));
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isHeavy ? 0.16 : 0.08, now);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);

    const interval = isHeavy ? 1300 : 2600;
    this.breathingTimer = setTimeout(() => {
      this.runBreathingCycle(intensity);
    }, interval);
  }

  playHeartbeat() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const playThump = (time, freq, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.1);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.12);
    };
    playThump(now, 75, 0.22);
    playThump(now + 0.15, 60, 0.18);
  }

  // 6. UI Interaction & Item Pickup Sounds
  playClick() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playPickup() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playInteract() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playFlashlight() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  // 7. Airlock Cycle Pneumatic Hiss
  playAirlock() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 1.4;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.45));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 1.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  // 8. Electrical Spark / Circuit Puzzle Feedback
  playSpark() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(800, now + 0.02);
    osc.frequency.setValueAtTime(120, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 9. Valve Pressure Release Sound
  playValveRelease() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  // 10. Radio Telemetry Beep (NASA Deep Space Burst)
  playRadioBeep() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.07);
    });
  }

  // 11. Mission Complete & Victory Fanfare
  playMissionSuccess() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.16);
      gain.gain.setValueAtTime(0.2, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.6);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.6);
    });
  }

  // 12. Mission Failure / Asphyxiation Drone
  playFailure() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 1.8);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  // 13. Flight Recorder Pneumatic Latch Release
  playLockerUnlock() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Heavy mechanical solenoid click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);

    // Pressurized gas decompression hiss
    const bufSize = this.ctx.sampleRate * 0.45;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.25));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    src.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(now);
  }

  // 14. Distant Rocket Crash Impact Thunder
  playCrashImpact() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Deep seismic shockwave rumble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 2.8);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 3.0);

    // Low-passed atmospheric blast
    const bufSize = this.ctx.sampleRate * 2.2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 2.0);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    src.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    src.start(now);
  }
}

// Global sound system singleton instance
window.soundSystem = new SoundSystem();
