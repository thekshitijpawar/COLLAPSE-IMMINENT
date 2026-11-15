/**
 * MARS: BEYOND SURVIVAL 🚀
 * audio.js — High-Fidelity Procedural Web Audio API Sound Synthesizer
 * Zero external audio files required. 100% synthesized procedural sound effects.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambienceGain = null;
    this.musicGain = null;

    this.windNode = null;
    this.windGain = null;
    this.windFilter = null;
    this.spaceAmbienceNode = null;
    this.spaceAmbienceGain = null;

    this.roverOsc = null;
    this.roverGain = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.sfxVolume = 0.85;
    this.ambienceVolume = 0.75;
    this.musicVolume = 0.80;

    this.initialized = false;
    this.breathingActive = false;
    this.breathingTimer = null;
    this.heartbeatTimer = null;
    this.currentWindTarget = 0.15;
    this.alarmLoopInterval = null;
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

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

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

  setSFXVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setAmbienceVolume(val) {
    this.ambienceVolume = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
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

  // 15. Rocket Cryogenic Pre-Ignition Venting Hiss & Bleed Valve
  playRocketPreIgnition() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const bufSize = this.ctx.sampleRate * 2.5;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(4.0, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 16. Rocket Main Engine Ignition Shockwave Burst
  playRocketIgnition() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(24, now + 1.2);
    oscGain.gain.setValueAtTime(0.65, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);

    const bufSize = this.ctx.sampleRate * 1.5;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.4));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + 1.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  // 17. Continuous High-Power Rocket Engine Roar & Acoustic Flutter
  startRocketRoar() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    if (this.rocketRoarActive) return;
    this.rocketRoarActive = true;

    const now = this.ctx.currentTime;

    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + (0.04 * white)) / 1.04;
      data[i] = last * 3.5;
    }
    this.rocketNoiseNode = this.ctx.createBufferSource();
    this.rocketNoiseNode.buffer = buf;
    this.rocketNoiseNode.loop = true;

    this.rocketFilter = this.ctx.createBiquadFilter();
    this.rocketFilter.type = 'lowpass';
    this.rocketFilter.frequency.setValueAtTime(220, now);
    this.rocketFilter.Q.setValueAtTime(1.8, now);

    this.rocketRoarGain = this.ctx.createGain();
    this.rocketRoarGain.gain.setValueAtTime(0.01, now);
    this.rocketRoarGain.gain.linearRampToValueAtTime(0.5, now + 1.2);

    this.rocketNoiseNode.connect(this.rocketFilter);
    this.rocketFilter.connect(this.rocketRoarGain);
    this.rocketRoarGain.connect(this.masterGain);
    this.rocketNoiseNode.start(now);

    this.rocketSubOsc1 = this.ctx.createOscillator();
    this.rocketSubOsc1.type = 'sawtooth';
    this.rocketSubOsc1.frequency.setValueAtTime(38, now);

    this.rocketSubOsc2 = this.ctx.createOscillator();
    this.rocketSubOsc2.type = 'sine';
    this.rocketSubOsc2.frequency.setValueAtTime(46, now);

    this.rocketSubGain = this.ctx.createGain();
    this.rocketSubGain.gain.setValueAtTime(0.01, now);
    this.rocketSubGain.gain.linearRampToValueAtTime(0.35, now + 1.2);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(120, now);

    this.rocketSubOsc1.connect(subFilter);
    this.rocketSubOsc2.connect(subFilter);
    subFilter.connect(this.rocketSubGain);
    this.rocketSubGain.connect(this.masterGain);

    this.rocketSubOsc1.start(now);
    this.rocketSubOsc2.start(now);
  }

  updateRocketRoar(intensity, filterCutoff) {
    if (!this.rocketRoarActive || !this.ctx) return;
    const now = this.ctx.currentTime;
    const targetGain = Math.max(0, Math.min(0.8, intensity));
    const targetFreq = filterCutoff || (200 + intensity * 600);

    if (this.rocketRoarGain) {
      this.rocketRoarGain.gain.setTargetAtTime(targetGain, now, 0.15);
    }
    if (this.rocketSubGain) {
      this.rocketSubGain.gain.setTargetAtTime(targetGain * 0.7, now, 0.15);
    }
    if (this.rocketFilter) {
      this.rocketFilter.frequency.setTargetAtTime(targetFreq, now, 0.15);
    }
  }

  stopRocketRoar(fadeTime = 1.5) {
    if (!this.rocketRoarActive || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rocketRoarGain) {
      this.rocketRoarGain.gain.linearRampToValueAtTime(0.001, now + fadeTime);
    }
    if (this.rocketSubGain) {
      this.rocketSubGain.gain.linearRampToValueAtTime(0.001, now + fadeTime);
    }
    setTimeout(() => {
      try {
        if (this.rocketNoiseNode) this.rocketNoiseNode.stop();
        if (this.rocketSubOsc1) this.rocketSubOsc1.stop();
        if (this.rocketSubOsc2) this.rocketSubOsc2.stop();
      } catch (e) {}
      this.rocketRoarActive = false;
    }, fadeTime * 1000 + 100);
  }

  // 18. Mission Control Countdown Telemetry Tone
  playCountdownBeep(isFinal) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 1760 : 880, now);
    gain.gain.setValueAtTime(isFinal ? 0.35 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.15));
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isFinal ? 0.35 : 0.15));
  }

  // 19. Epic Sci-Fi Cliffhanger Ambient Music (Procedural Synthesizer Progression)
  playEpicCliffhangerMusic() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    this.stopEpicCliffhangerMusic();

    this.musicActive = true;
    this.musicNodes = [];

    const chordFrequencies = [
      [146.83, 174.61, 220.00, 293.66], // Dm
      [116.54, 146.83, 174.61, 233.08], // Bb
      [87.31, 130.81, 174.61, 220.00],  // F
      [130.81, 164.81, 196.00, 261.63], // C
      [146.83, 220.00, 293.66, 349.23]  // Dm (High octave)
    ];

    let chordIndex = 0;
    const playChordStep = () => {
      if (!this.musicActive || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = chordFrequencies[chordIndex % chordFrequencies.length];
      chordIndex++;

      const stepGain = this.ctx.createGain();
      stepGain.gain.setValueAtTime(0.001, now);
      stepGain.gain.linearRampToValueAtTime(0.18, now + 1.2);
      stepGain.gain.exponentialRampToValueAtTime(0.001, now + 4.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 2.0);

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 4.9);
        this.musicNodes.push(osc);
      });

      filter.connect(stepGain);
      stepGain.connect(this.masterGain);

      this.musicTimer = setTimeout(playChordStep, 4500);
    };

    playChordStep();
  }

  stopEpicCliffhangerMusic() {
    this.musicActive = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicNodes) {
      this.musicNodes.forEach(n => {
        try { n.stop(); } catch (e) {}
      });
      this.musicNodes = [];
    }
  }

  // 20. Realistic Deep Space Interior Ambience (Vacuum silence outside, gentle interior ventilation & hum)
  startSpaceAmbience() {
    if (!this.ctx || this.spaceAmbienceNode) return;
    try {
      this.resume();
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.05;
      }
      this.spaceAmbienceNode = this.ctx.createBufferSource();
      this.spaceAmbienceNode.buffer = buffer;
      this.spaceAmbienceNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.spaceAmbienceGain = this.ctx.createGain();
      this.spaceAmbienceGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

      this.spaceAmbienceNode.connect(filter);
      filter.connect(this.spaceAmbienceGain);
      this.spaceAmbienceGain.connect(this.ambienceGain || this.masterGain);
      this.spaceAmbienceNode.start();
    } catch (e) {
      console.warn("Could not start space ambience:", e);
    }
  }

  stopSpaceAmbience() {
    if (this.spaceAmbienceNode) {
      try { this.spaceAmbienceNode.stop(); } catch (e) {}
      this.spaceAmbienceNode = null;
    }
  }

  // 21. Authentic Mission Control Radio Comms & Quindar Tones (2524 Hz / 2475 Hz pure sine bursts)
  playRadioComms(type = 'intro') {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Quindar tone intro beep
    const qOsc = this.ctx.createOscillator();
    const qGain = this.ctx.createGain();
    qOsc.type = 'sine';
    qOsc.frequency.setValueAtTime(2524, now);
    qGain.gain.setValueAtTime(0.12, now);
    qGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    qOsc.connect(qGain);
    qGain.connect(this.sfxGain || this.masterGain);
    qOsc.start(now);
    qOsc.stop(now + 0.12);

    // Filtered radio static burst
    const bufSize = this.ctx.sampleRate * 0.28;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1800, now + 0.12);
    bpf.Q.setValueAtTime(3.5, now + 0.12);
    const sGain = this.ctx.createGain();
    sGain.gain.setValueAtTime(0.15, now + 0.12);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
    src.connect(bpf);
    bpf.connect(sGain);
    sGain.connect(this.sfxGain || this.masterGain);
    src.start(now + 0.12);
  }

  // 22. Re-entry Plasma Sheath Roar & Atmospheric Buffeting
  playReentryPlasmaRoar() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = 3.5;
    const bufSize = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * (0.5 + Math.sin(i / (bufSize * 0.1)) * 0.25);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'lowpass';
    bpf.frequency.setValueAtTime(180, now);
    bpf.frequency.linearRampToValueAtTime(650, now + 1.2);
    bpf.frequency.linearRampToValueAtTime(220, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    src.start(now);
  }

  // 23. Retro-Propulsion Landing Burn & Touchdown Thud
  playRetroLandingBurn() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    const dur = 4.2;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + dur);

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(350, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.38, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + dur);

    // Touchdown thud at landing contact
    setTimeout(() => {
      if (!this.ctx) return;
      const tNow = this.ctx.currentTime;
      const tOsc = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      tOsc.type = 'sine';
      tOsc.frequency.setValueAtTime(90, tNow);
      tOsc.frequency.exponentialRampToValueAtTime(28, tNow + 0.35);
      tGain.gain.setValueAtTime(0.45, tNow);
      tGain.gain.exponentialRampToValueAtTime(0.001, tNow + 0.45);
      tOsc.connect(tGain);
      tGain.connect(this.sfxGain || this.masterGain);
      tOsc.start(tNow);
      tOsc.stop(tNow + 0.45);
    }, 2800);
  }

  // 24. Carbon Storage Container Open (Pneumatic release + heavy lid pivot)
  playCarbonBoxOpen() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Pneumatic pressure hiss (hiss-psssht)
    const bufSize = this.ctx.sampleRate * 0.28;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(2200, now);
    bpf.Q.setValueAtTime(2.0, now);
    const pGain = this.ctx.createGain();
    pGain.gain.setValueAtTime(0.25, now);
    pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    src.connect(bpf);
    bpf.connect(pGain);
    pGain.connect(this.sfxGain || this.masterGain);
    src.start(now);

    // Mechanical latch clack + carbon lid swing resonance
    const osc = this.ctx.createOscillator();
    const mGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    mGain.gain.setValueAtTime(0.22, now + 0.05);
    mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(mGain);
    mGain.connect(this.sfxGain || this.masterGain);
    osc.start(now + 0.05);
    osc.stop(now + 0.25);
  }

  // 25. Collect Food & Supplies from Storage Container
  playCollectFood() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // High-tech affirmative chime (A4 -> E5 -> A5)
    [440.0, 659.25, 880.0].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.16, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.18);
    });
  }

  // 26. Consume Food Ration / Drink Water
  playFoodConsume() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;
    
    // Gulp / sip bubble effect
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 27. Cockpit Avionics Boot & System Power Sweep
  playCockpitBoot() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.65);

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(450, now);
    lpf.frequency.linearRampToValueAtTime(1800, now + 0.65);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.7);
  }

  // 28. Spaceship Bulkhead Door Open / Close
  playSpaceshipDoor() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.5);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // 29. Raptor Vacuum Engines Ignition for Mars Liftoff
  playRaptorIgnition() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    this.playRocketIgnition();
    this.startRocketRoar();
    this.updateRocketRoar(0.9, 1200);
  }

  // 30. Terrifying Giant Tentacle Emergence & Alien Subterranean Roar
  playTentacleEmergence() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Sub-bass organic shudder (28 Hz - 45 Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(32, now);
    subOsc.frequency.linearRampToValueAtTime(48, now + 1.5);
    subOsc.frequency.linearRampToValueAtTime(22, now + 3.0);
    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.55, now + 1.2);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain || this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 3.2);

    // Eerie alien organic vocalization / resonance
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    const roarFilter = this.ctx.createBiquadFilter();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(95, now);
    roarOsc.frequency.exponentialRampToValueAtTime(145, now + 0.8);
    roarOsc.frequency.exponentialRampToValueAtTime(55, now + 2.5);

    roarFilter.type = 'bandpass';
    roarFilter.frequency.setValueAtTime(420, now);
    roarFilter.Q.setValueAtTime(4.0, now);

    roarGain.gain.setValueAtTime(0.01, now);
    roarGain.gain.linearRampToValueAtTime(0.38, now + 0.7);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    roarOsc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(this.sfxGain || this.masterGain);
    roarOsc.start(now);
    roarOsc.stop(now + 2.8);
  }

  // 31. Tentacle Violent Hull Impact Slam
  playTentacleSlam() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Deep metallic hull impact shockwave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);

    // Harsh metal distortion screech
    const bufSize = this.ctx.sampleRate * 0.35;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.2));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'highpass';
    bpf.frequency.setValueAtTime(800, now);
    const sGain = this.ctx.createGain();
    sGain.gain.setValueAtTime(0.4, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    src.connect(bpf);
    bpf.connect(sGain);
    sGain.connect(this.sfxGain || this.masterGain);
    src.start(now);
  }

  // 32. Metal Hull Creaking & Crushing Under Tentacle Constriction
  playTentacleConstrict() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(88, now + 0.4);
    osc.frequency.linearRampToValueAtTime(42, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(6.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.32, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 1.3);
  }

  // 33. Spaceship Cockpit Emergency Red Alert Siren Loop
  playEmergencyAlarm(loop = true) {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    this.stopEmergencyAlarm();

    const triggerBeep = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.setValueAtTime(740, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    };

    triggerBeep();
    if (loop) {
      this.alarmLoopInterval = setInterval(triggerBeep, 450);
    }
  }

  stopEmergencyAlarm() {
    if (this.alarmLoopInterval) {
      clearInterval(this.alarmLoopInterval);
      this.alarmLoopInterval = null;
    }
  }

  // 34. Dramatic Cliffhanger Orchestral Climax Music (Ominous Tension Build)
  playTentacleCliffhangerMusic() {
    if (!this.initialized || this.isMuted) return;
    this.resume();
    this.stopEpicCliffhangerMusic();

    this.musicActive = true;
    this.musicNodes = [];

    // Ominous minor second dissonance & heavy brass swell
    const dissonantChords = [
      [65.41, 69.30, 130.81, 138.59], // C2 + C#2 clash
      [58.27, 61.74, 116.54, 123.47], // Bb1 + B1 clash
      [55.00, 58.27, 110.00, 116.54], // A1 + Bb1 terror swell
      [43.65, 87.31, 130.81, 174.61]  // Deep sub-octave doom
    ];

    let cIdx = 0;
    const playDoomStep = () => {
      if (!this.musicActive || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = dissonantChords[cIdx % dissonantChords.length];
      cIdx++;

      const stepGain = this.ctx.createGain();
      stepGain.gain.setValueAtTime(0.01, now);
      stepGain.gain.linearRampToValueAtTime(0.35, now + 1.0);
      stepGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.linearRampToValueAtTime(2200, now + 1.2);

      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 15, now);
        osc.connect(filter);
        osc.start(now);
        osc.stop(now + 3.9);
        this.musicNodes.push(osc);
      });

      filter.connect(stepGain);
      stepGain.connect(this.musicGain || this.masterGain);

      this.musicTimer = setTimeout(playDoomStep, 2600);
    };

    playDoomStep();
  }
}

// Global sound system singleton instance
window.soundSystem = new SoundSystem();
