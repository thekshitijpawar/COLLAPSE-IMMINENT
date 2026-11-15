/**
 * MARS: BEYOND SURVIVAL 🚀
 * gameState.js — Core Game State, Mission Definitions, Resources, Inventory & Scientific Data
 */

const GAME_SETTINGS = {
  mouseSensitivity: 0.0022,
  invertY: false,
  volume: 0.7,
  graphicsQuality: 'medium',
  showHelmetVisor: true
};

const NASA_SCIENCE_DATA = {
  atmosphere: {
    title: "Martian Atmosphere & The Armstrong Limit",
    source: "NASA Mars Exploration Program (science.nasa.gov/mars)",
    content: "The Martian atmosphere is extraordinarily thin, with an average surface pressure of roughly 610 Pascals (0.088 psi), less than 1% of Earth's sea-level pressure (101,325 Pa). It is composed of 95.3% Carbon Dioxide (CO₂), 2.6% Nitrogen (N₂), and 1.9% Argon (Ar). Because the atmospheric pressure is far below the Armstrong Limit (approx. 6,300 Pa), exposed water boils at human body temperature (37°C / 98.6°F). A pressurized EVA suit is mandatory for survival.",
    link: "https://science.nasa.gov/mars/"
  },
  solarDust: {
    title: "Solar Panel Dust Accumulation",
    source: "NASA Jet Propulsion Laboratory (InSight & Opportunity Missions)",
    content: "Martian dust consists of extremely fine pulverized basaltic rock and iron oxides (hematite/rust). Without rain to clean surfaces, settling dust steadily blocks photovoltaic cells. NASA's Opportunity rover survived 14 years thanks to serendipitous wind 'cleaning events', while NASA's InSight lander officially concluded its mission in December 2022 after dust reduced its daily solar output from 5,000 watt-hours to under 500 watt-hours.",
    link: "https://science.nasa.gov/mission/insight/"
  },
  waterRecovery: {
    title: "Closed-Loop Life Support & Water Recovery",
    source: "NASA Open Science Data Repository (osdr.nasa.gov)",
    content: "The International Space Station's Environmental Control and Life Support System (ECLSS) recovers approximately 98% of all water using multi-filtration beds, catalytic oxidizers, and vacuum distillation assemblies. On Mars, where surface liquid water cannot stably exist, recycling astronaut perspiration, hygiene runoff, and metabolic wastewater is critical for extended missions.",
    link: "https://osdr.nasa.gov/"
  },
  radiation: {
    title: "Space Radiation & Space Weather",
    source: "NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)",
    content: "Mars lacks a global intrinsic dipole magnetic field (magnetosphere) and has a thin atmosphere, leaving the surface exposed to Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). Typical surface dose rates are 0.2 to 0.7 mSv/day (over 100 times Earth's background). During intense solar storms, astronauts must seek shelter beneath regolith berms or within hydrogen-rich habitat shielding.",
    link: "https://ccmc.gsfc.nasa.gov/tools/DONKI/"
  },
  speedOfLightDelay: {
    title: "Interplanetary Radio Transmission Delay",
    source: "NASA Deep Space Network (DSN)",
    content: "Because radio waves travel at the speed of light (299,792 km/s), communications between Earth and Mars experience an inescapable physical latency. Depending on their orbital positions—ranging from 54.6 million km at close opposition to 401 million km at superior conjunction—a one-way message takes between 3.0 minutes and 22.3 minutes. Astronauts must operate autonomously in emergencies.",
    link: "https://science.nasa.gov/mars/"
  }
};

const ITEM_DATABASE = {
  suit_patch: {
    id: 'suit_patch',
    name: 'Suit Pressure Seal Kit',
    icon: '🩹',
    category: 'tool',
    desc: 'Self-vulcanizing polyurethane mastic patch. Essential for sealing micro-punctures and tears in the EVA outer layer.',
    science: 'A puncture in Mars ambient pressure results in rapid depressurization. NASA suits use multi-layer ortho-fabric and Dacron bladders.',
    consumable: false
  },
  o2_canister: {
    id: 'o2_canister',
    name: 'Emergency O2 Cylinder',
    icon: '🫁',
    category: 'consumable',
    desc: 'High-pressure 300-bar oxygen canister. Refills 35% of your spacesuit rebreather tank.',
    science: 'Simulated value: EVA suits deliver 100% pure oxygen at 29.6 kPa (4.3 psi) to maintain alveolar oxygen absorption without nitrogen bends.',
    consumable: true,
    effect: { oxygen: 35 }
  },
  hydration_pack: {
    id: 'hydration_pack',
    name: 'Electrolyte Hydration Pack',
    icon: '💧',
    category: 'consumable',
    desc: 'Purified mineral-infused hydration pouch with suit valved straw. Restores 30% hydration.',
    science: 'Simulated value: Astronauts consume ~2.5L of water daily to maintain cognitive function and kidney health in low gravity.',
    consumable: true,
    effect: { water: 30 }
  },
  nutrient_paste: {
    id: 'nutrient_paste',
    name: 'Caloric Survival Paste',
    icon: '🥫',
    category: 'consumable',
    desc: 'High-density nutrient paste with complex carbohydrates and proteins. Restores 30% food energy.',
    science: 'Simulated value: NASA space flight rations provide 2,800 to 3,200 kcal/day tailored to crew metabolic rates.',
    consumable: true,
    effect: { food: 30 }
  },
  keycard_hab: {
    id: 'keycard_hab',
    name: 'Habitat Alpha Security Card',
    icon: '💳',
    category: 'key',
    desc: 'Encrypted magnetic NFC keycard recovered from the Ares Rescue flight data recorder. Unlocks Habitat Alpha Airlock.',
    science: 'Habitats use dual-redundant electronic airlocks with mechanical overrides to prevent explosive depressurization.',
    consumable: false
  },
  pv_calibrator: {
    id: 'pv_calibrator',
    name: 'Photovoltaic Calibrator',
    icon: '📟',
    category: 'tool',
    desc: 'Handheld diagnostic tool used to test open-circuit voltage (Voc) and short-circuit current (Isc) across solar panels.',
    science: 'Used to pinpoint defective bypass diodes and measure spectral irradiance under Martian atmospheric attenuation.',
    consumable: false
  },
  cleaning_brush: {
    id: 'cleaning_brush',
    name: 'Electrostatic Dust Brush',
    icon: '🧹',
    category: 'tool',
    desc: 'Conductive carbon-fiber brush with active electrostatic charge to dislodge microscopic clinging iron oxide particles.',
    science: 'Martian dust particles hold static electrical charges from solar UV ionization and friction in dust storms.',
    consumable: false
  },
  junction_fuse: {
    id: 'junction_fuse',
    name: 'Silicon Junction 480V Fuse',
    icon: '⚡',
    category: 'component',
    desc: 'Heavy-duty ceramic-encased power fuse rated for 480V DC solar array bus lines.',
    science: 'Essential component to prevent electrical arc fires in high-voltage DC arrays under low Martian atmospheric dielectric breakdown.',
    consumable: false
  },
  hydraulic_wrench: {
    id: 'hydraulic_wrench',
    name: 'Torque Hydraulic Wrench',
    icon: '🔧',
    category: 'tool',
    desc: 'High-torque calibrated wrench designed for cold-welded Martian habitat plumbing fittings and heavy valves.',
    science: 'In near-vacuum, metals can undergo cold welding if oxide films wear away, requiring specialized torque tools.',
    consumable: false
  },
  ceramic_filter: {
    id: 'ceramic_filter',
    name: 'ECLSS Sub-Micron Ceramic Filter',
    icon: '🧪',
    category: 'component',
    desc: 'Porous sintered alumina ceramic membrane cartridge that filters microbial contaminants down to 0.1 microns.',
    science: 'NASA life support systems use ceramic and titanium multi-filtration beds to purify reclaimed wastewater.',
    consumable: false
  },
  kband_transponder: {
    id: 'kband_transponder',
    name: 'K-Band Transponder Module',
    icon: '📡',
    category: 'component',
    desc: '32 GHz deep-space radio frequency transponder unit capable of high-bandwidth data bursts to Mars orbiters.',
    science: 'NASA uses Ka-band and X-band frequencies for interplanetary telemetry to overcome solar plasma scintillation.',
    consumable: false
  },
  cryo_amp: {
    id: 'cryo_amp',
    name: 'Cryogenic Low-Noise Amplifier',
    icon: '💾',
    category: 'component',
    desc: 'HEMT-based ultra-low-noise microwave preamplifier cooled to minimize thermal noise floor.',
    science: 'Cryogenic amplification allows weak radio signals from millions of miles away to be extracted from cosmic background noise.',
    consumable: false
  }
};

const MISSIONS = [
  {
    id: 1,
    title: "LEVEL 1 — RESCUE LOST",
    location: "Ares Rescue Crash Site • Acidalia Basin",
    weather: "Thin Dust Haze • 215 K (-58°C)",
    radiationLevel: 0.05,
    briefing: "Commander Reyes, stranded on Mars. Earth launched the Ares Rescue rocket to extract you. But moments ago on atmospheric descent, the rocket suffered a catastrophic engine failure and crashed 2 km away in Acidalia Basin. Telemetry confirmed: YOU ARE STILL ALONE. FIND ANOTHER WAY HOME. Trek out across the vast desert to the burning wreckage, patch your venting suit, unlock the Flight Data Recorder black box (Passcode: 412) to salvage the Habitat Alpha Security Keycard, and reach shelter.",
    scienceFocus: "Martian Atmospheric Pressure (0.6% Earth) & Suit Depressurization Dynamics",
    startingResources: {
      oxygen: 65,
      water: 70,
      food: 75,
      energy: 85,
      radiation: 2.1
    },
    objectives: [
      { id: 'seal_suit', text: "Inspect damaged spacesuit & patch pressure leak with Suit Seal Kit", completed: false },
      { id: 'find_supplies', text: "Search scattered rescue cargo pods for emergency O2, water, and food", completed: false, count: 0, target: 3 },
      { id: 'find_keycard', text: "Unlock Flight Data Recorder in Ares Rescue wreckage for Habitat Keycard", completed: false },
      { id: 'reach_hab', text: "Trek across the plain to Habitat Alpha and cycle the pressurized airlock", completed: false }
    ],
    nextProblem: "The habitat's power supply is critically low. Solar array is completely offline."
  },
  {
    id: 2,
    title: "LEVEL 2 — POWER CRISIS",
    location: "Solar Farm Substation & Research Trailer",
    weather: "Calm Martian Noon • 228 K (-45°C)",
    radiationLevel: 0.07,
    briefing: "Habitat auxiliary batteries are down to critical reserves. The exterior photovoltaic solar farm is disabled: heavy iron oxide dust covers the panels, and a high-voltage junction fuse blew during the storm. Locate the Photovoltaic Calibrator and cleaning tools, brush off the solar arrays, find a replacement fuse, and solve the power junction circuit matrix to restore habitat life support power.",
    scienceFocus: "Photovoltaic Dust Attenuation (InSight Mission) & High-Voltage Solar Distribution",
    startingResources: {
      oxygen: 75,
      water: 65,
      food: 68,
      energy: 35,
      radiation: 4.5
    },
    objectives: [
      { id: 'find_solar_tools', text: "Collect Photovoltaic Calibrator and Electrostatic Dust Brush from Tool Locker", completed: false },
      { id: 'find_fuse', text: "Search Research Trailer for a 480V Silicon Junction Fuse", completed: false },
      { id: 'clean_panels', text: "Clean Martian iron oxide dust off the 3 primary solar array tables (0/3)", completed: false, count: 0, target: 3 },
      { id: 'solve_junction', text: "Access Solar Substation Panel and calibrate the power circuit matrix", completed: false },
      { id: 'route_power', text: "Engage Main Breaker to route 480V solar power to Habitat Life Support", completed: false }
    ],
    nextProblem: "The habitat's ECLSS water recovery system has stopped working."
  },
  {
    id: 3,
    title: "LEVEL 3 — THE LAST DROP",
    location: "Subsurface ECLSS Water Recovery Facility",
    weather: "Pressurized Subterranean Facility • 288 K (15°C)",
    radiationLevel: 0.02,
    briefing: "The Habitat's closed-loop Environmental Control and Life Support System (ECLSS) water recovery plant has suffered a catastrophic pressure imbalance. The primary ceramic filter is fouled and the valve sequence is locked. Retrieve the Hydraulic Wrench, descend into the subterranean plant, replace the filtration core, and calibrate the 3-stage valve sequence to restore potable water recycling.",
    scienceFocus: "Closed-Loop ECLSS Fluid Recovery (ISS ECLSS & Sabatier Catalytic Recycling)",
    startingResources: {
      oxygen: 70,
      water: 35,
      food: 60,
      energy: 70,
      radiation: 5.2
    },
    objectives: [
      { id: 'find_wrench', text: "Obtain Torque Hydraulic Wrench from the engineering rack", completed: false },
      { id: 'find_filter', text: "Locate replacement ECLSS Ceramic Sub-Micron Filter in secure parts bin", completed: false },
      { id: 'descend_plant', text: "Enter Subsurface Water Recovery Facility vault", completed: false },
      { id: 'replace_filter', text: "Remove fouled filter assembly and install new Ceramic Membrane", completed: false },
      { id: 'calibrate_valves', text: "Solve 3-stage valve pressure sequence (Inlet, Catalytic, Condenser)", completed: false },
      { id: 'verify_flow', text: "Engage water recirculation pump and verify 98% recovery flow", completed: false }
    ],
    nextProblem: "Meteorological radar detects a massive Class-4 dust storm approaching!"
  },
  {
    id: 4,
    title: "LEVEL 4 — THE RED STORM",
    location: "Storm Trench & Maintenance Corridor",
    weather: "Class-4 Severe Dust Storm • 85 km/h Winds • Low Visibility",
    radiationLevel: 0.18,
    briefing: "A furious Martian dust storm has engulfed the sector, reducing visibility to a few meters. Strong gusts threaten to tear away the exterior backup generator flaps. To make matters worse, a fictional autonomous maintenance rover ('HAULER-9') has suffered an optical sensor malfunction and is aggressively patrolling the transit corridor. Secure the generator, avoid the rover's searchlight cone, follow beacon flares, and make it safely back into Habitat Alpha.",
    scienceFocus: "Martian Dust Storm Dynamics, Atmospheric Optical Depth (Tau), & Stealth Navigation",
    startingResources: {
      oxygen: 65,
      water: 60,
      food: 55,
      energy: 60,
      radiation: 7.8
    },
    objectives: [
      { id: 'secure_generator', text: "Lock exterior backup generator storm latches before high winds strike", completed: false },
      { id: 'avoid_rover', text: "Navigate transit trench while avoiding malfunctioning rover HAULER-9", completed: false },
      { id: 'activate_beacons', text: "Activate 3 emergency route guidance beacons in the dust storm (0/3)", completed: false, count: 0, target: 3 },
      { id: 'reach_shelter', text: "Return safely to Habitat Alpha airlock and seal storm bulkheads", completed: false }
    ],
    nextProblem: "Emergency rescue requires direct high-frequency communication with Earth."
  },
  {
    id: 5,
    title: "LEVEL 5 — THE FINAL TRANSMISSION",
    location: "Crater Ridge Deep Space Relay Station",
    weather: "Dust Storm Clearing • Martian Dusk • 208 K (-65°C)",
    radiationLevel: 0.08,
    briefing: "The storm is clearing and the NASA rescue orbiter Hermes-II is entering orbital pass window. You must trek to the High-Gain Deep Space Relay Dish perched on Crater Ridge. Find the missing K-Band Transponder and Cryogenic Low-Noise Amplifier, scale the ridge access catwalks, install the components, align the dish with Earth's astronomical coordinate (accounting for 14-minute signal delay), and transmit your survival telemetry burst.",
    scienceFocus: "Interplanetary Radio Speed-of-Light Delay (3 to 22 mins) & High-Gain Microwave Telemetry",
    startingResources: {
      oxygen: 70,
      water: 55,
      food: 50,
      energy: 55,
      radiation: 10.4
    },
    objectives: [
      { id: 'find_relay_parts', text: "Retrieve K-Band Transponder and Cryo Amplifier from Relay Shed", completed: false },
      { id: 'climb_ridge', text: "Ascend Crater Ridge catwalk to the 12-meter parabolic dish platform", completed: false },
      { id: 'mount_transponder', text: "Mount K-Band Transponder and Cryogenic Amp onto dish feed horn", completed: false },
      { id: 'align_dish', text: "Solve Earth Tracking Dish Alignment puzzle (Azimuth 248°, Elevation 34°)", completed: false },
      { id: 'send_transmission', text: "Transmit high-gain emergency burst to Earth rescue command", completed: false }
    ],
    nextProblem: "Awaiting rescue vehicle arrival..."
  }
];

class GameState {
  constructor() {
    this.currentMissionId = 1;
    this.unlockedMissionMax = 1;
    this.isPaused = false;
    this.inCutscene = false;
    this.gameCompleted = false;

    this.resources = {
      oxygen: 65,
      water: 70,
      food: 75,
      energy: 85,
      radiation: 2.1
    };

    this.suitBreached = true;
    this.flashlightOn = false;
    this.stamina = 100;
    this.isSprinting = false;

    this.inventory = [];
    this.checkpointState = null;
    this.missionObjectives = [];

    this.roverState = {
      active: false,
      position: { x: 0, y: 0, z: 0 },
      distanceToPlayer: 999,
      isAlerted: false,
      detectRadius: 16
    };

    this.solNumber = 1;
    this.solTimeMinutes = 14 * 60 + 30;

    this.loadSettings();
    this.loadProgress();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('mars_beyond_survival_settings');
      if (saved) {
        Object.assign(GAME_SETTINGS, JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load settings:", e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('mars_beyond_survival_settings', JSON.stringify(GAME_SETTINGS));
    } catch (e) {
      console.warn("Could not save settings:", e);
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('mars_beyond_survival_save_v1');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedMissionMax = data.unlockedMissionMax || 1;
        this.currentMissionId = data.currentMissionId || 1;
      }
    } catch (e) {
      console.warn("Could not load progress:", e);
    }
  }

  saveProgress() {
    try {
      const data = {
        unlockedMissionMax: Math.max(this.unlockedMissionMax, this.currentMissionId),
        currentMissionId: this.currentMissionId,
        resources: this.resources
      };
      localStorage.setItem('mars_beyond_survival_save_v1', JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save progress:", e);
    }
  }

  startMission(missionId, isRetry = false) {
    this.currentMissionId = missionId;
    const missionDef = MISSIONS.find(m => m.id === missionId) || MISSIONS[0];

    this.missionObjectives = JSON.parse(JSON.stringify(missionDef.objectives));

    if (!isRetry) {
      this.suitBreached = (missionId === 1);
      if (missionId === 1 || !this.resources) {
        this.resources = { ...missionDef.startingResources };
        this.inventory = [];
      } else {
        this.resources.oxygen = Math.max(this.resources.oxygen, 50);
        this.resources.water = Math.max(this.resources.water, 45);
        this.resources.food = Math.max(this.resources.food, 50);
        this.resources.energy = Math.max(this.resources.energy, 45);
      }
      this.saveCheckpoint();
    }

    if (window.soundSystem) {
      window.soundSystem.setWindStorm(missionId === 4);
    }
  }

  saveCheckpoint() {
    this.checkpointState = {
      missionId: this.currentMissionId,
      resources: { ...this.resources },
      inventory: JSON.parse(JSON.stringify(this.inventory)),
      suitBreached: this.suitBreached
    };
  }

  restoreCheckpoint() {
    if (!this.checkpointState) return false;
    this.currentMissionId = this.checkpointState.missionId;
    this.resources = { ...this.checkpointState.resources };
    this.inventory = JSON.parse(JSON.stringify(this.checkpointState.inventory));
    this.suitBreached = this.checkpointState.suitBreached;

    const missionDef = MISSIONS.find(m => m.id === this.currentMissionId);
    if (missionDef) {
      this.missionObjectives = JSON.parse(JSON.stringify(missionDef.objectives));
    }
    return true;
  }

  addItem(itemId) {
    const itemData = ITEM_DATABASE[itemId];
    if (!itemData) return false;
    if (this.inventory.length >= 12) {
      if (window.uiManager) window.uiManager.showBanner("⚠️ Suit inventory full (12/12)!");
      return false;
    }
    this.inventory.push({ ...itemData });
    if (window.soundSystem) window.soundSystem.playPickup();
    return true;
  }

  hasItem(itemId) {
    return this.inventory.some(i => i.id === itemId);
  }

  removeItem(itemId) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
      return true;
    }
    return false;
  }

  useItem(itemId) {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item) return false;

    if (item.id === 'suit_patch' && this.suitBreached) {
      this.suitBreached = false;
      this.removeItem(itemId);
      this.completeObjective('seal_suit');
      if (window.soundSystem) window.soundSystem.playInteract();
      return { success: true, message: "Suit pressure leak sealed! Depressurization halted." };
    }

    if (item.consumable && item.effect) {
      let effectText = [];
      if (item.effect.oxygen) {
        this.resources.oxygen = Math.min(100, this.resources.oxygen + item.effect.oxygen);
        effectText.push(`+${item.effect.oxygen}% Oxygen`);
      }
      if (item.effect.water) {
        this.resources.water = Math.min(100, this.resources.water + item.effect.water);
        effectText.push(`+${item.effect.water}% Water`);
      }
      if (item.effect.food) {
        this.resources.food = Math.min(100, this.resources.food + item.effect.food);
        effectText.push(`+${item.effect.food}% Food`);
      }
      this.removeItem(itemId);
      if (window.soundSystem) window.soundSystem.playInteract();
      return { success: true, message: `Used ${item.name} (${effectText.join(', ')})` };
    }

    return { success: false, message: `${item.name} cannot be used here.` };
  }

  completeObjective(objId) {
    const obj = this.missionObjectives.find(o => o.id === objId);
    if (obj && !obj.completed) {
      obj.completed = true;
      if (window.soundSystem) window.soundSystem.playSuccess();
      this.checkMissionComplete();
      return true;
    }
    return false;
  }

  incrementObjective(objId) {
    const obj = this.missionObjectives.find(o => o.id === objId);
    if (obj && !obj.completed && obj.target) {
      obj.count = (obj.count || 0) + 1;
      if (obj.count >= obj.target) {
        obj.completed = true;
        if (window.soundSystem) window.soundSystem.playSuccess();
      } else {
        if (window.soundSystem) window.soundSystem.playInteract();
      }
      this.checkMissionComplete();
      return true;
    }
    return false;
  }

  isMissionComplete() {
    return this.missionObjectives.length > 0 && this.missionObjectives.every(o => o.completed);
  }

  checkMissionComplete() {
    if (this.isMissionComplete()) {
      if (this.currentMissionId >= this.unlockedMissionMax) {
        this.unlockedMissionMax = Math.min(5, this.currentMissionId + 1);
      }
      this.saveProgress();
      if (window.uiManager) {
        setTimeout(() => {
          window.uiManager.showMissionSuccess();
        }, 1200);
      }
    }
  }

  updateResources(deltaSeconds, isOutdoors) {
    if (this.isPaused || this.inCutscene) return;

    if (isOutdoors) {
      // Outdoors in harsh Martian vacuum
      let o2Rate = 0.04;
      if (this.suitBreached) o2Rate += 0.22;
      if (this.isSprinting) o2Rate += 0.08;
      this.resources.oxygen = Math.max(0, this.resources.oxygen - o2Rate * deltaSeconds);

      const waterRate = 0.018 * (this.isSprinting ? 1.5 : 1.0);
      this.resources.water = Math.max(0, this.resources.water - waterRate * deltaSeconds);

      const foodRate = 0.012;
      this.resources.food = Math.max(0, this.resources.food - foodRate * deltaSeconds);

      let energyRate = 0.02;
      if (this.flashlightOn) energyRate += 0.12;
      this.resources.energy = Math.max(0, this.resources.energy - energyRate * deltaSeconds);

      const currentMission = MISSIONS.find(m => m.id === this.currentMissionId) || MISSIONS[0];
      const radRate = (currentMission.radiationLevel || 0.05) / 3600;
      this.resources.radiation += radRate * deltaSeconds;
    } else {
      // Inside Habitat Alpha: Safe Haven Life Support
      if (this.suitBreached) {
        // Still leaking if suit outer layer is ruptured
        this.resources.oxygen = Math.max(0, this.resources.oxygen - 0.12 * deltaSeconds);
      } else {
        // Habitat rebreather umbilical replenishes oxygen
        this.resources.oxygen = Math.min(95, this.resources.oxygen + 0.15 * deltaSeconds);
      }

      // Habitat power grid recharges suit battery
      this.resources.energy = Math.min(100, this.resources.energy + 0.08 * deltaSeconds);

      // Mild slow metabolic food/water consumption
      this.resources.water = Math.max(0, this.resources.water - 0.008 * deltaSeconds);
      this.resources.food = Math.max(0, this.resources.food - 0.006 * deltaSeconds);
    }

    this.solTimeMinutes += deltaSeconds * 0.5;
    if (this.solTimeMinutes >= 24 * 60) {
      this.solTimeMinutes -= 24 * 60;
      this.solNumber++;
    }

    if (this.resources.oxygen <= 20) {
      if (window.soundSystem) window.soundSystem.startBreathingLoop('critical');
    } else if (this.isSprinting) {
      if (window.soundSystem) window.soundSystem.startBreathingLoop('heavy');
    } else {
      if (window.soundSystem) window.soundSystem.stopBreathingLoop();
    }

    if (this.resources.oxygen <= 0) {
      this.triggerFailure("Asphyxiation — Your spacesuit ran out of breathable oxygen.");
    } else if (this.resources.water <= 0) {
      this.triggerFailure("Critical Dehydration — Water reserves depleted.");
    } else if (this.resources.energy <= 0) {
      this.triggerFailure("Life Support Power Failure — Suit thermal and rebreather battery died.");
    }
  }

  triggerFailure(reason) {
    if (this.isPaused || this.inCutscene) return;
    this.isPaused = true;
    if (window.soundSystem) window.soundSystem.playFailure();
    if (window.uiManager) {
      window.uiManager.showMissionFailure(reason);
    }
  }
}

window.gameState = new GameState();
