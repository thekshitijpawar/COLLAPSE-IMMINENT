/**
 * MARS: BEYOND SURVIVAL 🚀
 * app.js — Main Application Orchestrator, Game Loop & Mission Manager
 */

class App {
  constructor() {
    this.lastTime = 0;
    this.isRunning = false;
  }

  init() {
    console.log("Initializing MARS: BEYOND SURVIVAL...");

    // 1. Initialize Sound System
    if (window.soundSystem) {
      window.soundSystem.init();

      // Ensure AudioContext resumes upon first user interaction
      const resumeAudio = () => {
        if (window.soundSystem) window.soundSystem.resume();
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      };
      window.addEventListener('click', resumeAudio);
      window.addEventListener('keydown', resumeAudio);
    }

    // 2. Initialize 3D WebGL Engine
    const success3D = window.gameEngine3D ? window.gameEngine3D.init('webgl-canvas') : false;
    if (!success3D) {
      console.warn("3D Engine fallback mode engaging.");
    }

    // 3. Initialize UI System
    if (window.uiManager) {
      window.uiManager.init();
    }

    // 4. Check saved game
    const hasSave = !!localStorage.getItem('mars_beyond_survival_save_v1');
    const continueBtn = document.getElementById('btn-continue-game');
    if (continueBtn) {
      continueBtn.style.display = hasSave ? 'inline-block' : 'none';
    }

    // 5. Start Render / Game Loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));

    // Show Main Menu on initial load
    if (window.uiManager) {
      window.uiManager.showMainMenu();
    }
  }

  startNewCampaign() {
    window.gameState.startMission(1);
    if (window.uiManager) {
      window.uiManager.hideMainMenu();
      window.uiManager.playOpeningCinematic(() => {
        this.loadMission(1);
        const canvas = window.gameEngine3D?.renderer?.domElement;
        if (canvas) canvas.requestPointerLock();
      });
    } else {
      this.loadMission(1);
    }
  }

  continueCampaign() {
    window.gameState.loadProgress();
    const missionId = window.gameState.currentMissionId || 1;
    if (window.uiManager) {
      window.uiManager.hideMainMenu();
    }
    this.loadMission(missionId);
    const canvas = window.gameEngine3D?.renderer?.domElement;
    if (canvas) canvas.requestPointerLock();
  }

  loadMission(missionId, isRetry = false) {
    console.log(`Loading Mission 0${missionId} (Retry: ${isRetry})...`);
    window.gameState.startMission(missionId, isRetry);

    if (window.gameEngine3D) {
      let spawnX = 0, spawnZ = 0;
      if (missionId === 1) {
        spawnX = -10; spawnZ = -4; // Clear of wreckage collider, facing crash site!
      } else if (missionId === 2) {
        spawnX = 4; spawnZ = 14;   // Outside Habitat Alpha toward Solar Farm
      } else if (missionId === 3) {
        spawnX = 0; spawnZ = 22;   // Inside Habitat Alpha engineering section
      } else if (missionId === 4) {
        spawnX = 2; spawnZ = 12;   // Outside Hab facing Storm Trench
      } else if (missionId === 5) {
        spawnX = 66; spawnZ = -8;  // Base of Crater Ridge path
      }

      const spawnY = window.gameEngine3D.getTerrainHeight(spawnX, spawnZ) + window.gameEngine3D.playerHeight;
      window.gameEngine3D.position.set(spawnX, spawnY, spawnZ);
      window.gameEngine3D.velocity.set(0, 0, 0);

      window.gameEngine3D.buildMissionWorld(missionId);
    }

    if (window.uiManager) {
      const missionDef = MISSIONS.find(m => m.id === missionId);
      if (missionDef) {
        window.uiManager.showBanner(`🚀 ${missionDef.title} INITIATED!`);
      }
      window.uiManager.updateHUD();
    }

    window.gameState.isPaused = false;
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (window.gameEngine3D) {
      window.gameEngine3D.update(delta);
      window.gameEngine3D.render();
    }

    if (window.uiManager) {
      window.uiManager.updateHUD();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.app = new App();

window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
