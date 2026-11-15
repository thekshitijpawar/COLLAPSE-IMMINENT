/**
 * MARS: BEYOND SURVIVAL 🚀
 * puzzles.js — Interactive Environmental Puzzles & Rover AI Mechanics
 */

class PuzzleManager {
  constructor() {
    // Level 2: Solar Junction Puzzle State
    this.solarPuzzle = {
      fuseInstalled: false,
      circuits: [
        { id: 1, angle: 90, target: 0, connected: false },
        { id: 2, angle: 180, target: 90, connected: false },
        { id: 3, angle: 270, target: 180, connected: false },
        { id: 4, angle: 0, target: 270, connected: false }
      ],
      currentVoltage: 120,
      targetVoltage: 480
    };

    // Level 3: ECLSS Water Pressure Valve Sequencer
    this.waterPuzzle = {
      filterInstalled: false,
      valves: {
        inlet: { val: 40, target: 90, min: 20, max: 140 },
        catalytic: { val: 65, target: 110, min: 40, max: 160 },
        condenser: { val: 30, target: 85, min: 20, max: 130 }
      },
      isBalanced: false,
      isBalancingTriggered: false
    };

    // Level 5: Deep Space Relay Alignment Puzzle
    this.relayPuzzle = {
      transponderInstalled: false,
      cryoAmpInstalled: false,
      azimuth: 190,
      targetAzimuth: 248,
      elevation: 15,
      targetElevation: 34,
      signalStrength: -110, // dBm
      isLocked: false
    };
  }

  // ==========================================
  // LEVEL 2: SOLAR POWER JUNCTION PUZZLE
  // ==========================================
  openSolarPuzzle() {
    const modal = document.getElementById('modal-puzzle-solar');
    if (!modal) return;
    this.solarPuzzle.fuseInstalled = window.gameState.hasItem('junction_fuse') || this.solarPuzzle.fuseInstalled;
    this.renderSolarPuzzle();
    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeSolarPuzzle() {
    const modal = document.getElementById('modal-puzzle-solar');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
    const canvas = window.gameEngine3D?.renderer?.domElement;
    if (canvas) canvas.requestPointerLock();
  }

  rotateSolarCircuit(index) {
    if (window.soundSystem) window.soundSystem.playSpark();
    const c = this.solarPuzzle.circuits[index];
    c.angle = (c.angle + 90) % 360;
    this.updateSolarVoltage();
    this.renderSolarPuzzle();
  }

  insertSolarFuse() {
    if (this.solarPuzzle.fuseInstalled) return;
    if (window.gameState.hasItem('junction_fuse')) {
      window.gameState.removeItem('junction_fuse');
      this.solarPuzzle.fuseInstalled = true;
      if (window.soundSystem) window.soundSystem.playSuccess();
      this.updateSolarVoltage();
      this.renderSolarPuzzle();
      if (window.uiManager) window.uiManager.showBanner("⚡ 480V SILICON FUSE INSTALLED!");
    } else {
      if (window.uiManager) window.uiManager.showBanner("⚠️ Missing 480V Silicon Junction Fuse! Search the Research Trailer.");
    }
  }

  updateSolarVoltage() {
    let alignedCount = 0;
    this.solarPuzzle.circuits.forEach(c => {
      c.connected = (c.angle === c.target);
      if (c.connected) alignedCount++;
    });

    if (!this.solarPuzzle.fuseInstalled) {
      this.solarPuzzle.currentVoltage = 0;
    } else {
      this.solarPuzzle.currentVoltage = 120 + alignedCount * 90;
    }

    if (this.solarPuzzle.fuseInstalled && alignedCount === 4) {
      this.solarPuzzle.currentVoltage = 480;
      setTimeout(() => {
        if (window.soundSystem) window.soundSystem.playMissionSuccess();
        window.gameState.completeObjective('solve_junction');
        window.gameState.completeObjective('route_power');
        this.closeSolarPuzzle();
        if (window.uiManager) window.uiManager.showBanner("⚡ SOLAR POWER GRID RESTORED! 480V ROUTED TO HABITAT.");
      }, 900);
    }
  }

  renderSolarPuzzle() {
    const voltageElem = document.getElementById('solar-voltage-readout');
    const statusElem = document.getElementById('solar-status-badge');
    const fuseSlot = document.getElementById('solar-fuse-slot');
    if (voltageElem) voltageElem.textContent = `${this.solarPuzzle.currentVoltage} V / 480 V`;

    if (this.solarPuzzle.fuseInstalled) {
      if (fuseSlot) {
        fuseSlot.innerHTML = `<span class="text-green">⚡ FUSE INSTALLED (480V BUS OK)</span>`;
        fuseSlot.classList.add('fuse-installed');
      }
    } else {
      if (fuseSlot) {
        fuseSlot.innerHTML = `<button class="btn btn-primary btn-sm" onclick="window.puzzleManager.insertSolarFuse()">[E] INSERT 480V SILICON FUSE</button>`;
        fuseSlot.classList.remove('fuse-installed');
      }
    }

    for (let i = 0; i < 4; i++) {
      const knob = document.getElementById(`circuit-knob-${i}`);
      if (knob) {
        knob.style.transform = `rotate(${this.solarPuzzle.circuits[i].angle}deg)`;
        if (this.solarPuzzle.circuits[i].angle === this.solarPuzzle.circuits[i].target) {
          knob.classList.add('aligned');
        } else {
          knob.classList.remove('aligned');
        }
      }
    }

    if (statusElem) {
      if (this.solarPuzzle.currentVoltage === 480) {
        statusElem.textContent = "BUS BALANCED • 480V ONLINE";
        statusElem.className = "badge badge-success";
      } else if (!this.solarPuzzle.fuseInstalled) {
        statusElem.textContent = "FUSE BLOWN (OPEN CIRCUIT)";
        statusElem.className = "badge badge-danger";
      } else {
        statusElem.textContent = "CIRCUIT PHASE MISALIGNED";
        statusElem.className = "badge badge-warning";
      }
    }
  }

  // ==========================================
  // LEVEL 3: ECLSS WATER RECOVERY VALVE PUZZLE
  // ==========================================
  openWaterPuzzle() {
    const modal = document.getElementById('modal-puzzle-water');
    if (!modal) return;
    this.renderWaterPuzzle();
    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeWaterPuzzle() {
    const modal = document.getElementById('modal-puzzle-water');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
    const canvas = window.gameEngine3D?.renderer?.domElement;
    if (canvas) canvas.requestPointerLock();
  }

  insertWaterFilter() {
    if (this.waterPuzzle.filterInstalled) return;
    if (window.gameState.hasItem('ceramic_filter') && window.gameState.hasItem('hydraulic_wrench')) {
      window.gameState.removeItem('ceramic_filter');
      this.waterPuzzle.filterInstalled = true;
      if (window.soundSystem) window.soundSystem.playSuccess();
      window.gameState.completeObjective('replace_filter');
      this.renderWaterPuzzle();
      if (window.uiManager) window.uiManager.showBanner("🧪 CERAMIC MEMBRANE INSTALLED & TORQUED TO SPEC.");
    } else {
      if (window.uiManager) window.uiManager.showBanner("⚠️ Requires Ceramic Sub-Micron Filter and Torque Hydraulic Wrench!");
    }
  }

  adjustValve(valveKey, delta) {
    if (this.waterPuzzle.isBalancingTriggered) return;
    if (window.soundSystem) window.soundSystem.playValveRelease();
    const v = this.waterPuzzle.valves[valveKey];
    v.val = Math.max(v.min, Math.min(v.max, v.val + delta));

    if (valveKey === 'inlet') {
      this.waterPuzzle.valves.catalytic.val = Math.max(40, Math.min(160, this.waterPuzzle.valves.catalytic.val + delta * 0.3));
    } else if (valveKey === 'catalytic') {
      this.waterPuzzle.valves.condenser.val = Math.max(20, Math.min(130, this.waterPuzzle.valves.condenser.val + delta * 0.25));
    }

    this.checkWaterBalance();
    this.renderWaterPuzzle();
  }

  checkWaterBalance() {
    if (this.waterPuzzle.isBalancingTriggered) return;
    const v = this.waterPuzzle.valves;
    const inletOk = Math.abs(v.inlet.val - v.inlet.target) <= 5;
    const catOk = Math.abs(v.catalytic.val - v.catalytic.target) <= 5;
    const condOk = Math.abs(v.condenser.val - v.condenser.target) <= 5;

    if (this.waterPuzzle.filterInstalled && inletOk && catOk && condOk) {
      this.waterPuzzle.isBalanced = true;
      this.waterPuzzle.isBalancingTriggered = true;
      setTimeout(() => {
        if (window.soundSystem) window.soundSystem.playMissionSuccess();
        window.gameState.completeObjective('calibrate_valves');
        window.gameState.completeObjective('verify_flow');
        this.closeWaterPuzzle();
        if (window.uiManager) window.uiManager.showBanner("💧 ECLSS CLOSED-LOOP RECOVERY RESTORED (98% EFFICIENCY)!");
      }, 900);
    }
  }

  renderWaterPuzzle() {
    const filterSlot = document.getElementById('water-filter-slot');
    if (filterSlot) {
      if (this.waterPuzzle.filterInstalled) {
        filterSlot.innerHTML = `<span class="text-green">✅ CERAMIC MEMBRANE SEATED (TORQUE 85 N·m)</span>`;
      } else {
        filterSlot.innerHTML = `<button class="btn btn-primary btn-sm" onclick="window.puzzleManager.insertWaterFilter()">[E] INSTALL CERAMIC FILTER (WRENCH REQ)</button>`;
      }
    }

    ['inlet', 'catalytic', 'condenser'].forEach(key => {
      const v = this.waterPuzzle.valves[key];
      const valElem = document.getElementById(`val-${key}-pressure`);
      const gaugeElem = document.getElementById(`gauge-${key}`);
      if (valElem) valElem.textContent = `${Math.round(v.val)} kPa (Target: ${v.target} kPa)`;
      if (gaugeElem) {
        const pct = ((v.val - v.min) / (v.max - v.min)) * 100;
        gaugeElem.style.width = `${pct}%`;
        const diff = Math.abs(v.val - v.target);
        if (diff <= 5) {
          gaugeElem.className = "fill fill-green";
        } else if (diff <= 15) {
          gaugeElem.className = "fill fill-amber";
        } else {
          gaugeElem.className = "fill fill-cyan";
        }
      }
    });

    const statusElem = document.getElementById('water-status-badge');
    if (statusElem) {
      if (this.waterPuzzle.isBalanced) {
        statusElem.textContent = "ECLSS HYDRAULIC PRESSURE BALANCED";
        statusElem.className = "badge badge-success";
      } else if (!this.waterPuzzle.filterInstalled) {
        statusElem.textContent = "PRIMARY FILTER CAVITATING (FOULING)";
        statusElem.className = "badge badge-danger";
      } else {
        statusElem.textContent = "PRESSURE RATIO OUT OF SPECIFICATION";
        statusElem.className = "badge badge-warning";
      }
    }
  }

  // ==========================================
  // LEVEL 5: DEEP SPACE RELAY ALIGNMENT PUZZLE
  // ==========================================
  openRelayPuzzle() {
    const modal = document.getElementById('modal-puzzle-relay');
    if (!modal) return;
    this.renderRelayPuzzle();
    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeRelayPuzzle() {
    const modal = document.getElementById('modal-puzzle-relay');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
    const canvas = window.gameEngine3D?.renderer?.domElement;
    if (canvas) canvas.requestPointerLock();
  }

  mountRelayParts() {
    if (this.relayPuzzle.transponderInstalled && this.relayPuzzle.cryoAmpInstalled) return;
    if (window.gameState.hasItem('kband_transponder') && window.gameState.hasItem('cryo_amp')) {
      window.gameState.removeItem('kband_transponder');
      window.gameState.removeItem('cryo_amp');
      this.relayPuzzle.transponderInstalled = true;
      this.relayPuzzle.cryoAmpInstalled = true;
      if (window.soundSystem) window.soundSystem.playSuccess();
      window.gameState.completeObjective('mount_transponder');
      this.updateRelaySignal();
      this.renderRelayPuzzle();
      if (window.uiManager) window.uiManager.showBanner("📡 K-BAND FEED HORN & CRYO AMPLIFIER ATTACHED.");
    } else {
      if (window.uiManager) window.uiManager.showBanner("⚠️ Missing K-Band Transponder and Cryogenic Low-Noise Amplifier! Search Relay Shed.");
    }
  }

  adjustDish(axis, delta) {
    if (window.soundSystem) window.soundSystem.playClick();
    if (axis === 'azimuth') {
      this.relayPuzzle.azimuth = (this.relayPuzzle.azimuth + delta + 360) % 360;
    } else if (axis === 'elevation') {
      this.relayPuzzle.elevation = Math.max(0, Math.min(90, this.relayPuzzle.elevation + delta));
    }
    this.updateRelaySignal();
    this.renderRelayPuzzle();
  }

  updateRelaySignal() {
    if (!this.relayPuzzle.transponderInstalled || !this.relayPuzzle.cryoAmpInstalled) {
      this.relayPuzzle.signalStrength = -120;
      this.relayPuzzle.isLocked = false;
      return;
    }

    const azDiff = Math.abs(this.relayPuzzle.azimuth - this.relayPuzzle.targetAzimuth);
    const elDiff = Math.abs(this.relayPuzzle.elevation - this.relayPuzzle.targetElevation);
    const totalError = Math.sqrt(azDiff * azDiff + elDiff * elDiff);

    if (totalError < 2.5) {
      this.relayPuzzle.signalStrength = +14.2;
      this.relayPuzzle.isLocked = true;
    } else if (totalError < 8.0) {
      this.relayPuzzle.signalStrength = -60 + (8.0 - totalError) * 8;
      this.relayPuzzle.isLocked = false;
    } else {
      this.relayPuzzle.signalStrength = Math.max(-120, -110 - totalError);
      this.relayPuzzle.isLocked = false;
    }
  }

  transmitEmergencyBurst() {
    if (!this.relayPuzzle.isLocked) {
      if (window.uiManager) window.uiManager.showBanner("⚠️ Cannot transmit: Dish carrier signal is not locked with Earth coordinate!");
      return;
    }
    if (window.soundSystem) window.soundSystem.playRadioBeep();
    window.gameState.completeObjective('align_dish');
    window.gameState.completeObjective('send_transmission');
    this.closeRelayPuzzle();
    if (window.uiManager) {
      window.uiManager.showBanner("🚀 HIGH-GAIN EMERGENCY TRANSMISSION BROADCAST TO EARTH (14m DELAY CONFIRMED)!");
    }
  }

  renderRelayPuzzle() {
    const partsSlot = document.getElementById('relay-parts-slot');
    if (partsSlot) {
      if (this.relayPuzzle.transponderInstalled && this.relayPuzzle.cryoAmpInstalled) {
        partsSlot.innerHTML = `<span class="text-green">✅ FEED HORN ACTIVE (K-BAND 32 GHz LOCKED)</span>`;
      } else {
        partsSlot.innerHTML = `<button class="btn btn-primary btn-sm" onclick="window.puzzleManager.mountRelayParts()">[E] MOUNT K-BAND TRANSPONDER & CRYO AMP</button>`;
      }
    }

    const azElem = document.getElementById('display-dish-azimuth');
    const elElem = document.getElementById('display-dish-elevation');
    const snrElem = document.getElementById('display-dish-snr');
    const delayElem = document.getElementById('display-dish-delay');
    const transmitBtn = document.getElementById('btn-dish-transmit');

    if (azElem) azElem.textContent = `${this.relayPuzzle.azimuth}° (Target: ${this.relayPuzzle.targetAzimuth}°)`;
    if (elElem) elElem.textContent = `${this.relayPuzzle.elevation}° (Target: ${this.relayPuzzle.targetElevation}°)`;
    if (snrElem) {
      snrElem.textContent = `${this.relayPuzzle.signalStrength.toFixed(1)} dBm`;
      snrElem.className = this.relayPuzzle.isLocked ? "t-value text-green font-bold" : "t-value text-amber";
    }
    if (delayElem) {
      delayElem.textContent = "14 min 22 sec (One-Way Light Travel Time @ 258M km)";
    }
    if (transmitBtn) {
      transmitBtn.disabled = !this.relayPuzzle.isLocked;
      if (this.relayPuzzle.isLocked) {
        transmitBtn.classList.add('pulse-button');
      } else {
        transmitBtn.classList.remove('pulse-button');
      }
    }
  }
}

window.puzzleManager = new PuzzleManager();
