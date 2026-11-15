/**
 * MARS: BEYOND SURVIVAL 🚀
 * ui.js — User Interface, HUD Vitals, Tactical Map, Inventory & Cutscenes
 */

class UIManager {
  constructor() {
    this.bannerTimeout = null;
    this.mapCanvas = null;
    this.mapCtx = null;
    this.activeInventoryTab = 'all';
    this.selectedItem = null;
    this.recorderPin = '';
    this.recorderUnlocked = false;
  }

  init() {
    this.mapCanvas = document.getElementById('tactical-map-canvas');
    if (this.mapCanvas) {
      this.mapCtx = this.mapCanvas.getContext('2d');
    }

    this.bindButtons();
    this.renderNASAData();
    this.applySettingsToUI();
  }

  bindButtons() {
    const btnNewGame = document.getElementById('btn-new-game');
    if (btnNewGame) {
      btnNewGame.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        window.app.startNewCampaign();
      });
    }

    const btnContinue = document.getElementById('btn-continue-game');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        window.app.continueCampaign();
      });
    }

    const btnArchive = document.getElementById('btn-open-archive');
    if (btnArchive) {
      btnArchive.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.openMissionArchive();
      });
    }

    const btnScience = document.getElementById('btn-open-science');
    if (btnScience) {
      btnScience.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.openNASAScienceModal();
      });
    }

    const btnSettings = document.getElementById('btn-open-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.openSettingsModal();
      });
    }

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.soundSystem) window.soundSystem.playClick();
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.add('hidden');
        window.gameState.isPaused = false;
        const canvas = window.gameEngine3D?.renderer?.domElement;
        if (canvas) canvas.requestPointerLock();
      });
    });

    const sensInput = document.getElementById('setting-mouse-sens');
    if (sensInput) {
      sensInput.addEventListener('input', (e) => {
        GAME_SETTINGS.mouseSensitivity = parseFloat(e.target.value);
        window.gameState.saveSettings();
      });
    }

    const volInput = document.getElementById('setting-master-vol');
    if (volInput) {
      volInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        GAME_SETTINGS.volume = val;
        if (window.soundSystem) window.soundSystem.setVolume(val);
        window.gameState.saveSettings();
      });
    }

    const visorCheck = document.getElementById('setting-visor-toggle');
    if (visorCheck) {
      visorCheck.addEventListener('change', (e) => {
        GAME_SETTINGS.showHelmetVisor = e.target.checked;
        const visor = document.getElementById('helmet-visor-overlay');
        if (visor) visor.style.display = e.target.checked ? 'block' : 'none';
        window.gameState.saveSettings();
      });
    }

    const qualitySelect = document.getElementById('setting-graphics-quality');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        GAME_SETTINGS.graphicsQuality = e.target.value;
        window.gameState.saveSettings();
      });
    }

    const btnRetry = document.getElementById('btn-retry-mission');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.hideMissionFailure();
        window.gameState.restoreCheckpoint();
        window.app.loadMission(window.gameState.currentMissionId, true);
      });
    }

    const btnNextMission = document.getElementById('btn-next-mission');
    if (btnNextMission) {
      btnNextMission.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.hideMissionSuccess();
        const nextId = window.gameState.currentMissionId + 1;
        if (nextId <= 5) {
          window.app.loadMission(nextId);
        } else {
          this.triggerEndingCinematic();
        }
      });
    }

    const btnResume = document.getElementById('btn-resume-game');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.togglePauseMenu(false);
      });
    }

    const btnQuitMenu = document.getElementById('btn-quit-to-menu');
    if (btnQuitMenu) {
      btnQuitMenu.addEventListener('click', () => {
        if (window.soundSystem) window.soundSystem.playClick();
        this.togglePauseMenu(false);
        this.showMainMenu();
      });
    }
  }

  handleEscapeKey() {
    const openModals = [
      'modal-inventory',
      'modal-map',
      'modal-flight-recorder',
      'modal-puzzle-solar',
      'modal-puzzle-water',
      'modal-puzzle-relay',
      'modal-science-terminal',
      'modal-mission-archive',
      'modal-settings'
    ];

    for (const id of openModals) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) {
        el.classList.add('hidden');
        window.gameState.isPaused = false;
        const canvas = window.gameEngine3D?.renderer?.domElement;
        if (canvas) canvas.requestPointerLock();
        return;
      }
    }

    this.togglePauseMenu();
  }

  // ==========================================
  // FLIGHT DATA RECORDER KEYPAD MODAL
  // ==========================================
  openFlightRecorderModal() {
    const modal = document.getElementById('modal-flight-recorder');
    if (!modal) return;
    this.recorderPin = '';
    this.updatePinDisplay();
    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeFlightRecorderModal() {
    const modal = document.getElementById('modal-flight-recorder');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
    const canvas = window.gameEngine3D?.renderer?.domElement;
    if (canvas) canvas.requestPointerLock();
  }

  pressPinKey(digit) {
    if (this.recorderUnlocked) return;
    if (this.recorderPin.length < 3) {
      this.recorderPin += digit;
      if (window.soundSystem) window.soundSystem.playClick();
      this.updatePinDisplay();
    }
  }

  clearPinKey() {
    if (this.recorderUnlocked) return;
    this.recorderPin = '';
    if (window.soundSystem) window.soundSystem.playClick();
    this.updatePinDisplay();
  }

  updatePinDisplay() {
    const display = document.getElementById('recorder-pin-display');
    if (display) {
      display.textContent = this.recorderPin.padEnd(3, '-');
    }
  }

  submitPinCode() {
    if (this.recorderUnlocked) return;
    // Sol 412 is the override PIN
    if (this.recorderPin === '412') {
      this.recorderUnlocked = true;
      if (window.soundSystem) window.soundSystem.playLockerUnlock();

      const badge = document.getElementById('recorder-status-badge');
      if (badge) {
        badge.textContent = "UNLOCKED // LATCH RELEASED";
        badge.className = "badge badge-success";
      }

      const unlockedBox = document.getElementById('recorder-unlocked-content');
      if (unlockedBox) unlockedBox.classList.remove('hidden');

      // Animate 3D physical lid open in gameEngine3D
      if (window.gameEngine3D && window.gameEngine3D.flightRecorderLid) {
        window.gameEngine3D.flightRecorderLid.rotation.x = -Math.PI / 2.2;
      }
    } else {
      if (window.soundSystem) window.soundSystem.playFailure();
      this.showBanner("⚠️ INVALID SECURITY PIN — HINT: Sol 412 Protocol");
      this.clearPinKey();
    }
  }

  takeHabKeycardFromRecorder() {
    window.gameState.addItem('keycard_hab');
    window.gameState.completeObjective('find_keycard');
    if (window.soundSystem) window.soundSystem.playPickup();
    this.showBanner("💳 HABITAT ALPHA SECURITY KEYCARD ACQUIRED!");
    this.closeFlightRecorderModal();

    // Update 3D physical model & interactable state
    if (window.gameEngine3D) {
      if (window.gameEngine3D.flightRecorderLid) {
        window.gameEngine3D.flightRecorderLid.rotation.x = -Math.PI / 2.5;
      }
      if (window.gameEngine3D.flightRecorderStrobeMat) {
        window.gameEngine3D.flightRecorderStrobeMat.color.setHex(0x00ff88);
      }
      if (window.gameEngine3D.flightRecorderLight) {
        window.gameEngine3D.flightRecorderLight.color.setHex(0x00ff88);
      }
      if (window.gameEngine3D.flightRecorderWaypoint) {
        window.gameEngine3D.flightRecorderWaypoint.visible = false;
      }
    }

    const frItem = window.gameEngine3D?.interactables?.find(i => i.type === 'flight_recorder');
    if (frItem) {
      frItem.label = "[Flight Recorder: Decrypted & Salvaged]";
      frItem.callback = () => {
        this.showBanner("Flight data recorder already opened and keycard salvaged.");
      };
    }
  }

  applySettingsToUI() {
    const sensInput = document.getElementById('setting-mouse-sens');
    if (sensInput) sensInput.value = GAME_SETTINGS.mouseSensitivity || 0.0022;

    const volInput = document.getElementById('setting-master-vol');
    if (volInput) volInput.value = Math.round((GAME_SETTINGS.volume || 0.7) * 100);

    const visorCheck = document.getElementById('setting-visor-toggle');
    if (visorCheck) visorCheck.checked = GAME_SETTINGS.showHelmetVisor !== false;

    const visor = document.getElementById('helmet-visor-overlay');
    if (visor) visor.style.display = GAME_SETTINGS.showHelmetVisor !== false ? 'block' : 'none';

    const qualitySelect = document.getElementById('setting-graphics-quality');
    if (qualitySelect) qualitySelect.value = GAME_SETTINGS.graphicsQuality || 'medium';
  }

  showMainMenu() {
    window.gameState.isPaused = true;
    const menu = document.getElementById('main-menu-overlay');
    if (menu) menu.classList.remove('hidden');
    const hud = document.getElementById('hud-overlay');
    if (hud) hud.classList.add('hidden');
    if (document.exitPointerLock) document.exitPointerLock();
  }

  hideMainMenu() {
    const menu = document.getElementById('main-menu-overlay');
    if (menu) menu.classList.add('hidden');
    const hud = document.getElementById('hud-overlay');
    if (hud) hud.classList.remove('hidden');
    window.gameState.isPaused = false;
  }

  togglePauseMenu(forceState) {
    const pauseModal = document.getElementById('modal-pause');
    if (!pauseModal) return;

    const isOpening = forceState !== undefined ? forceState : pauseModal.classList.contains('hidden');

    if (isOpening) {
      pauseModal.classList.remove('hidden');
      window.gameState.isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      pauseModal.classList.add('hidden');
      window.gameState.isPaused = false;
      const canvas = window.gameEngine3D?.renderer?.domElement;
      if (canvas) canvas.requestPointerLock();
    }
  }

  // ==========================================
  // HUD TELEMETRY UPDATE
  // ==========================================
  updateHUD() {
    const gs = window.gameState;
    if (!gs) return;

    // 1. Oxygen Bar & Low O2 Vignette
    const o2Val = Math.round(gs.resources.oxygen);
    const o2Elem = document.getElementById('val-hud-o2');
    const o2Bar = document.getElementById('bar-hud-o2');
    if (o2Elem) o2Elem.textContent = `${o2Val}%`;
    if (o2Bar) {
      o2Bar.style.width = `${o2Val}%`;
      if (o2Val <= 20) {
        o2Bar.className = "fill fill-red pulse-fast";
        if (Math.random() < 0.05 && window.soundSystem) window.soundSystem.playHeartbeat();
      } else if (o2Val <= 40) {
        o2Bar.className = "fill fill-amber";
      } else {
        o2Bar.className = "fill fill-cyan";
      }
    }

    const o2Vignette = document.getElementById('low-o2-vignette');
    if (o2Vignette) {
      if (o2Val <= 20 || gs.suitBreached) {
        o2Vignette.classList.remove('hidden');
      } else {
        o2Vignette.classList.add('hidden');
      }
    }

    // 2. Hydration & Nutrition
    const h2oVal = Math.round(gs.resources.water);
    const h2oElem = document.getElementById('val-hud-water');
    const h2oBar = document.getElementById('bar-hud-water');
    if (h2oElem) h2oElem.textContent = `${h2oVal}%`;
    if (h2oBar) h2oBar.style.width = `${h2oVal}%`;

    const foodVal = Math.round(gs.resources.food);
    const foodElem = document.getElementById('val-hud-food');
    const foodBar = document.getElementById('bar-hud-food');
    if (foodElem) foodElem.textContent = `${foodVal}%`;
    if (foodBar) foodBar.style.width = `${foodVal}%`;

    // 3. Suit Battery & Flashlight
    const energyVal = Math.round(gs.resources.energy);
    const energyElem = document.getElementById('val-hud-energy');
    const energyBar = document.getElementById('bar-hud-energy');
    if (energyElem) energyElem.textContent = `${energyVal}%`;
    if (energyBar) energyBar.style.width = `${energyVal}%`;

    const flashlightIndicator = document.getElementById('hud-flashlight-icon');
    if (flashlightIndicator) {
      flashlightIndicator.className = gs.flashlightOn ? "badge badge-success" : "badge badge-dim";
    }

    // 4. Radiation Dosimeter
    const radElem = document.getElementById('val-hud-radiation');
    if (radElem) radElem.textContent = `${gs.resources.radiation.toFixed(2)} mSv`;

    // 5. Suit Breach Warning Tag
    const breachTag = document.getElementById('hud-breach-alert');
    if (breachTag) {
      if (gs.suitBreached) {
        breachTag.classList.remove('hidden');
      } else {
        breachTag.classList.add('hidden');
      }
    }

    // 6. Sol Clock & Sol Number
    const solElem = document.getElementById('hud-sol-number');
    if (solElem) solElem.textContent = `SOL ${gs.solNumber}`;

    const hrs = Math.floor(gs.solTimeMinutes / 60);
    const mins = Math.floor(gs.solTimeMinutes % 60);
    const clockElem = document.getElementById('hud-sol-clock');
    if (clockElem) clockElem.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')} LST`;

    // 7. Objectives List
    this.updateObjectivesList();

    // 8. Compass Waypoint Bar
    this.updateCompass();
  }

  updateObjectivesList() {
    const listElem = document.getElementById('hud-objectives-list');
    if (!listElem) return;

    const missionDef = MISSIONS.find(m => m.id === window.gameState.currentMissionId);
    if (!missionDef) return;

    const titleElem = document.getElementById('hud-mission-title');
    if (titleElem) titleElem.textContent = missionDef.title;

    listElem.innerHTML = '';
    window.gameState.missionObjectives.forEach(obj => {
      const li = document.createElement('li');
      li.className = obj.completed ? 'obj-item completed' : 'obj-item active';

      let countText = '';
      if (obj.target && !obj.completed) {
        countText = ` (${obj.count || 0}/${obj.target})`;
      }

      li.innerHTML = `
        <span class="obj-check">${obj.completed ? '✅' : '🔘'}</span>
        <span class="obj-text">${obj.text}${countText}</span>
      `;
      listElem.appendChild(li);
    });
  }

  updateCompass() {
    const marker = document.getElementById('compass-objective-marker');
    if (!marker || !window.gameEngine3D) return;

    const camEuler = window.gameEngine3D.euler;
    if (!camEuler) return;

    let target = { x: 0, z: 25 };
    const curObj = window.gameState.missionObjectives.find(o => !o.completed);

    if (curObj) {
      if (curObj.id === 'seal_suit') target = { x: -14, z: -8 };
      else if (curObj.id === 'find_supplies') target = { x: -15, z: -12 };
      else if (curObj.id === 'find_keycard') target = { x: -13.5, z: -9.5 };
      else if (curObj.id === 'reach_hab') target = { x: 0, z: 12 };
      else if (curObj.id === 'find_solar_tools') target = { x: 12, z: 18 };
      else if (curObj.id === 'find_fuse') target = { x: 22, z: 34 };
      else if (curObj.id === 'clean_panels') target = { x: 45, z: 22 };
      else if (curObj.id === 'solve_junction' || curObj.id === 'route_power') target = { x: 60, z: 20 };
      else if (curObj.id === 'find_wrench') target = { x: 6, z: 26 };
      else if (curObj.id === 'find_filter') target = { x: -6, z: 28 };
      else if (curObj.id === 'descend_plant' || curObj.id === 'replace_filter' || curObj.id === 'calibrate_valves') target = { x: -35, z: 38 };
      else if (curObj.id === 'secure_generator') target = { x: 55, z: -8 };
      else if (curObj.id === 'activate_beacons') target = { x: 26, z: 12 };
      else if (curObj.id === 'reach_shelter') target = { x: 0, z: 12 };
      else if (curObj.id === 'find_relay_parts') target = { x: 79, z: -11 };
      else if (curObj.id === 'climb_ridge' || curObj.id === 'align_dish' || curObj.id === 'send_transmission') target = { x: 85, z: -15 };
    }

    const pPos = window.gameEngine3D.position;
    const dx = target.x - pPos.x;
    const dz = target.z - pPos.z;

    // In Three.js forward camera vector is along -Z, so angle is Math.atan2(dx, -dz)
    const angleToTarget = Math.atan2(dx, -dz);
    let diff = angleToTarget - camEuler.y;

    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const px = (diff / (Math.PI / 2)) * 120;
    if (Math.abs(diff) < Math.PI / 2) {
      marker.style.display = 'block';
      marker.style.transform = `translateX(${px}px)`;
    } else {
      marker.style.display = 'none';
    }
  }

  showBanner(message, durationMs = 3800) {
    const banner = document.getElementById('hud-notification-banner');
    if (!banner) return;
    banner.textContent = message;
    banner.classList.remove('hidden');

    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, durationMs);
  }

  // ==========================================
  // INVENTORY MODAL (TAB)
  // ==========================================
  toggleInventory() {
    const modal = document.getElementById('modal-inventory');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');

    if (isHidden) {
      this.renderInventoryGrid();
      modal.classList.remove('hidden');
      window.gameState.isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      modal.classList.add('hidden');
      window.gameState.isPaused = false;
      const canvas = window.gameEngine3D?.renderer?.domElement;
      if (canvas) canvas.requestPointerLock();
    }
  }

  renderInventoryGrid() {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const inv = window.gameState.inventory;
    for (let i = 0; i < 12; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';

      if (i < inv.length) {
        const item = inv[i];
        slot.innerHTML = `<span class="inv-icon">${item.icon}</span>`;
        slot.title = item.name;
        slot.addEventListener('click', () => {
          this.selectInventoryItem(item);
        });
      } else {
        slot.classList.add('empty');
      }

      grid.appendChild(slot);
    }

    if (inv.length > 0 && !this.selectedItem) {
      this.selectInventoryItem(inv[0]);
    } else if (inv.length === 0) {
      this.selectInventoryItem(null);
    }
  }

  selectInventoryItem(item) {
    this.selectedItem = item;
    const nameElem = document.getElementById('inv-item-name');
    const descElem = document.getElementById('inv-item-desc');
    const scienceElem = document.getElementById('inv-item-science');
    const actionBtn = document.getElementById('btn-inv-use');

    if (!item) {
      if (nameElem) nameElem.textContent = "NO ITEM SELECTED";
      if (descElem) descElem.textContent = "Your suit inventory is empty or no item is active.";
      if (scienceElem) scienceElem.textContent = "NASA Science Notes will appear here when an item is selected.";
      if (actionBtn) actionBtn.classList.add('hidden');
      return;
    }

    if (nameElem) nameElem.textContent = `${item.icon} ${item.name}`;
    if (descElem) descElem.textContent = item.desc;
    if (scienceElem) scienceElem.innerHTML = `<strong>NASA Scientific Fact:</strong> ${item.science}`;

    if (actionBtn) {
      actionBtn.classList.remove('hidden');
      actionBtn.textContent = item.id === 'suit_patch' ? "USE (PATCH SUIT)" : item.consumable ? "CONSUME / RESTORE" : "EXAMINE / EQUIP";
      actionBtn.onclick = () => {
        const res = window.gameState.useItem(item.id);
        if (res && res.message) {
          this.showBanner(res.message);
        }
        this.renderInventoryGrid();
      };
    }
  }

  // ==========================================
  // TACTICAL MARS MAP (M)
  // ==========================================
  toggleMap() {
    const modal = document.getElementById('modal-map');
    if (!modal) return;
    const isHidden = modal.classList.contains('hidden');

    if (isHidden) {
      this.drawTacticalMap();
      modal.classList.remove('hidden');
      window.gameState.isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
    } else {
      modal.classList.add('hidden');
      window.gameState.isPaused = false;
      const canvas = window.gameEngine3D?.renderer?.domElement;
      if (canvas) canvas.requestPointerLock();
    }
  }

  drawTacticalMap() {
    if (!this.mapCtx || !this.mapCanvas) return;
    const ctx = this.mapCtx;
    const w = this.mapCanvas.width;
    const h = this.mapCanvas.height;

    ctx.fillStyle = '#1c0c08';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(217, 83, 30, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const toMapX = (wx) => ((wx + 60) / 170) * w;
    const toMapY = (wz) => ((wz + 50) / 110) * h;

    // Draw Operational Sector Geofence Perimeter
    const bx1 = toMapX(-52);
    const by1 = toMapY(-44);
    const bx2 = toMapX(104);
    const by2 = toMapY(56);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 136, 0, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);
    ctx.font = '9px Share Tech Mono, monospace';
    ctx.fillStyle = 'rgba(255, 136, 0, 0.75)';
    ctx.fillText("OPERATIONAL SECTOR GEOFENCE", bx1 + 6, by1 + 12);
    ctx.restore();

    const locations = [
      { name: "CRASH SITE", x: -18, z: -12, color: "#ff4444" },
      { name: "HABITAT ALPHA", x: 0, z: 25, color: "#00e5ff" },
      { name: "SOLAR FARM", x: 45, z: 22, color: "#ffcc00" },
      { name: "ECLSS WATER VAULT", x: -35, z: 40, color: "#3399ff" },
      { name: "STORM GENERATOR", x: 55, z: -8, color: "#ff9900" },
      { name: "DEEP SPACE RELAY", x: 85, z: -15, color: "#00ff88" }
    ];

    locations.forEach(loc => {
      const mx = toMapX(loc.x);
      const my = toMapY(loc.z);

      ctx.fillStyle = loc.color;
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '11px Share Tech Mono, monospace';
      ctx.fillStyle = '#ffeedd';
      ctx.fillText(loc.name, mx + 9, my + 4);
    });

    if (window.gameEngine3D) {
      const px = toMapX(window.gameEngine3D.position.x);
      const py = toMapY(window.gameEngine3D.position.z);
      const yaw = window.gameEngine3D.euler.y;

      ctx.fillStyle = 'rgba(0, 255, 136, 0.25)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 25, -yaw - Math.PI / 2 - 0.4, -yaw - Math.PI / 2 + 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText("YOU (EVA SUIT)", px + 8, py - 6);
    }
  }

  // ==========================================
  // NASA SCIENCE DOSSIER MODAL
  // ==========================================
  openNASAScienceModal() {
    const modal = document.getElementById('modal-science-terminal');
    if (!modal) return;
    this.renderNASAData();
    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  renderNASAData() {
    const container = document.getElementById('nasa-dossier-content');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(NASA_SCIENCE_DATA).forEach(key => {
      const entry = NASA_SCIENCE_DATA[key];
      const card = document.createElement('div');
      card.className = 'science-card';
      card.innerHTML = `
        <div class="science-card-header">
          <h4>${entry.title}</h4>
          <span class="science-source">Source: ${entry.source}</span>
        </div>
        <p class="science-card-text">${entry.content}</p>
        <div class="science-card-footer">
          <a href="${entry.link}" target="_blank" rel="noopener noreferrer" class="link-nasa">🔗 Visit NASA Data Portal →</a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  openMissionArchive() {
    const modal = document.getElementById('modal-mission-archive');
    if (!modal) return;
    const list = document.getElementById('mission-archive-list');
    if (!list) return;

    list.innerHTML = '';
    MISSIONS.forEach(m => {
      const isUnlocked = m.id <= window.gameState.unlockedMissionMax;
      const card = document.createElement('div');
      card.className = isUnlocked ? 'mission-archive-card unlocked' : 'mission-archive-card locked';
      card.innerHTML = `
        <div class="mission-header">
          <span class="mission-num">MISSION 0${m.id}</span>
          <span class="mission-status">${isUnlocked ? 'AVAILABLE' : 'LOCKED'}</span>
        </div>
        <h3>${m.title}</h3>
        <p class="mission-brief">${m.briefing}</p>
        <div class="mission-focus">🔬 Science: ${m.scienceFocus}</div>
        ${isUnlocked ? `<button class="btn btn-primary btn-sm" onclick="window.app.loadMission(${m.id}); document.getElementById('modal-mission-archive').classList.add('hidden');">DEPLOY MISSION</button>` : `<span class="text-dim">Complete previous missions to unlock.</span>`}
      `;
      list.appendChild(card);
    });

    modal.classList.remove('hidden');
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  openSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (modal) {
      modal.classList.remove('hidden');
      window.gameState.isPaused = true;
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }

  showMissionSuccess() {
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();
    if (window.soundSystem) window.soundSystem.playMissionSuccess();

    const modal = document.getElementById('modal-mission-success');
    if (!modal) return;

    const missionDef = MISSIONS.find(m => m.id === window.gameState.currentMissionId);
    const titleElem = document.getElementById('success-mission-title');
    const debriefElem = document.getElementById('success-mission-debrief');
    const problemElem = document.getElementById('success-next-problem');

    if (titleElem) titleElem.textContent = `${missionDef.title} COMPLETE!`;
    if (debriefElem) debriefElem.textContent = `All mission objectives accomplished. Life support and survival protocols stabilized for Sol ${window.gameState.solNumber}. Checkpoint saved.`;
    if (problemElem) problemElem.textContent = missionDef.nextProblem;

    modal.classList.remove('hidden');
  }

  hideMissionSuccess() {
    const modal = document.getElementById('modal-mission-success');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
  }

  showMissionFailure(reason) {
    window.gameState.isPaused = true;
    if (document.exitPointerLock) document.exitPointerLock();

    const modal = document.getElementById('modal-mission-failure');
    if (!modal) return;

    const reasonElem = document.getElementById('failure-reason-text');
    if (reasonElem) reasonElem.textContent = reason || "Your resources were insufficient to complete this mission.";

    modal.classList.remove('hidden');
  }

  hideMissionFailure() {
    const modal = document.getElementById('modal-mission-failure');
    if (modal) modal.classList.add('hidden');
    window.gameState.isPaused = false;
  }

  playOpeningCinematic(onComplete) {
    const overlay = document.getElementById('cinematic-overlay');
    const content = document.getElementById('cinematic-text-box');
    const skipBtn = document.getElementById('btn-skip-cinematic');
    if (!overlay || !content) {
      if (onComplete) onComplete();
      return;
    }

    window.gameState.inCutscene = true;
    overlay.classList.remove('hidden');

    const scenes = [
      {
        text: "ACIDALIA PLANITIA, MARS • SOL 412\n\nYou are stranded alone on the rust-red plains.",
        duration: 3200
      },
      {
        text: "INCOMING TRANSMISSION FROM EARTH...\n\n\"Commander Reyes, the Ares Rescue vehicle has launched successfully and is descending through the Martian atmosphere. Prepare for immediate extraction.\"",
        duration: 4400,
        sound: 'radio'
      },
      {
        text: "RESCUE APPROACHING...\n\nThe rocket streaks through the Martian sky.\nRescue was so close.",
        duration: 3400
      },
      {
        text: "⚠️ CATASTROPHIC ENGINE MALFUNCTION\n\n\"Emergency! Main engine flameout! Trajectory unstable! We are losing attitude control! We're spinning out— BRACE FOR IMPACT!\"",
        duration: 4200,
        sound: 'alarm'
      },
      {
        text: "💥 DISTANT IMPACT DETECTED — 2.1 KM NORTH-WEST\n\nA massive dust plume rocks the horizon.\nZero survivor telemetry returned.",
        duration: 3800,
        sound: 'crash'
      },
      {
        text: "INCOMING TRANSMISSION FROM EARTH...\n\nRESCUE MISSION LOST. ROCKET SIGNAL TERMINATED.",
        duration: 4000,
        sound: 'static'
      },
      {
        text: "YOU ARE STILL ALONE.\n\nFIND ANOTHER WAY HOME.",
        duration: 4200
      }
    ];

    let current = 0;
    let timer = null;
    let finished = false;

    const cleanupAndFinish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      overlay.classList.add('hidden');
      window.gameState.inCutscene = false;
      document.removeEventListener('keydown', onKeyDown);
      overlay.removeEventListener('click', onOverlayClick);
      if (skipBtn) skipBtn.onclick = null;
      if (onComplete) onComplete();
    };

    const onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        cleanupAndFinish();
      }
    };

    const onOverlayClick = (e) => {
      if (e.target === skipBtn) return;
      showNext();
    };

    document.addEventListener('keydown', onKeyDown);
    overlay.addEventListener('click', onOverlayClick);

    if (skipBtn) {
      skipBtn.onclick = (e) => {
        e.stopPropagation();
        cleanupAndFinish();
      };
    }

    const showNext = () => {
      if (finished) return;
      if (timer) clearTimeout(timer);
      if (current >= scenes.length) {
        cleanupAndFinish();
        return;
      }

      const s = scenes[current];
      content.innerHTML = `<p class="cinematic-text">${s.text.replace(/\n/g, '<br>')}</p>`;

      if (window.soundSystem) {
        if (s.sound === 'radio') window.soundSystem.playRadioBeep();
        else if (s.sound === 'alarm') window.soundSystem.playRoverAlarm();
        else if (s.sound === 'crash') window.soundSystem.playCrashImpact();
        else if (s.sound === 'static') window.soundSystem.playFailure();
      }

      current++;
      timer = setTimeout(showNext, s.duration);
    };

    showNext();
  }

  triggerEndingCinematic() {
    const overlay = document.getElementById('cinematic-overlay');
    const content = document.getElementById('cinematic-text-box');
    if (!overlay || !content) return;

    window.gameState.inCutscene = true;
    overlay.classList.remove('hidden');
    if (window.soundSystem) window.soundSystem.setWindStorm(false);

    const scenes = [
      { text: "SOL 7 • THE MARTIAN SUNSET\n\nYou step through the Habitat Alpha airlock into the rust-red twilight.", duration: 3800 },
      { text: "In the distance, across the Martian horizon...\nTwo powerful headlights pierce the dusty haze.", duration: 4200 },
      { text: "A heavy planetary rescue rover approaches through the dunes.\nIts engine rumbling grows louder.", duration: 4200 },
      { text: "The rover slows to a halt mere meters in front of you.\n\nIts pressurized hatch begins to unlock...", duration: 4200 }
    ];

    let current = 0;
    const showNext = () => {
      if (current >= scenes.length) {
        content.innerHTML = `
          <div class="cliffhanger-box">
            <h1 class="text-green font-orbitron">MISSION SUCCESSFUL</h1>
            <h2 class="text-amber">RESCUE VEHICLE ARRIVED.</h2>
            <br>
            <h3 class="text-white">BUT IS THIS REALLY THE END?</h3>
            <br>
            <h2 class="text-cyan font-bold">MARS: BEYOND SURVIVAL — CHAPTER 01 COMPLETE</h2>
            <br><br>
            <button class="btn btn-primary btn-lg" onclick="location.reload()">RETURN TO MAIN MENU</button>
          </div>
        `;
        if (window.soundSystem) window.soundSystem.playMissionSuccess();
        return;
      }

      const s = scenes[current];
      content.innerHTML = `<p class="cinematic-text">${s.text.replace(/\n/g, '<br>')}</p>`;
      if (window.soundSystem && current === 2) window.soundSystem.updateRoverSound(8, false);

      current++;
      setTimeout(showNext, s.duration);
    };

    showNext();
  }
}

window.uiManager = new UIManager();
