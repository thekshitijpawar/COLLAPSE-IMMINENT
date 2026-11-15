/**
 * MARS: BEYOND SURVIVAL 🚀
 * gameEngine3D.js — 3D First-Person WebGL Engine, Martian World & Physics
 * Upgraded Visual Environment & Epic Rocket Launch Cliffhanger (Reference Images 1 & 2)
 */

class GameEngine3D {
  constructor() {
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // First person viewmodel (astronaut gloves / suit hands)
    this.viewModel = null;
    this.leftHand = null;
    this.rightHand = null;
    this.suitScanner = null;
    this.flashlight = null;

    // Movement & Controls
    this.keys = {};
    this.isPointerLocked = false;
    this.euler = null;
    this.playerHeight = 1.75;
    this.playerRadius = 0.5;
    this.position = null;
    this.velocity = null;
    this.isGrounded = true;
    this.bobTimer = 0;
    this.reachTimer = 0;

    // World & Environment
    this.terrain = null;
    this.terrainSize = 360;
    this.terrainSegments = 96;
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.dustParticles = null;
    this.interactables = [];
    this.colliders = [];
    this.raycaster = null;
    this.hoveredObject = null;

    // Enhanced Sci-Fi Environment & Colony Objects (Reference Image 1)
    this.skyDome = null;
    this.cloudDome = null;
    this.mountainRing = null;
    this.colonyGroup = null;
    this.astronautsGroup = null;
    this.explorationRoverGroup = null;

    // Massive SpaceX-Inspired Launch Complex & Spacecraft
    this.rocketComplex = null;
    this.rocketStack = null;
    this.spacexStarship = null;
    this.superHeavyBooster = null;
    this.gridFins = [];
    this.aerodynamicFlaps = [];
    this.srbLeft = null;
    this.srbRight = null;
    this.engineFlames = [];
    this.rocketPointLight = null;
    this.cryoVaporParticles = null;
    this.launchSmokeParticles = null;
    this.smokeVelocities = null;

    // Deep Space & Planetary Bodies (Earth & Mars)
    this.spaceSceneGroup = null;
    this.earthGroup = null;
    this.earthMesh = null;
    this.earthClouds = null;
    this.marsGroup = null;
    this.marsMesh = null;
    this.starField = null;

    // Giant Mysterious Alien Tentacle & Creature
    this.tentacleGroup = null;
    this.tentacleSegments = [];
    this.cockpitRedAlertLight = null;

    // Carbon Storage Boxes & Food Supplies
    this.carbonBoxes = [];

    // Cinematic Controllers (Opening Earth Launch Prologue & Final Tentacle Cliffhanger)
    this.isPrologueActive = false;
    this.prologueTime = 0;
    this.prologuePhase = 0;
    this.prologueCallback = null;

    this.isEscapeActive = false;
    this.escapeTime = 0;
    this.escapePhase = 0;

    this.isCliffhangerActive = false;
    this.cliffhangerTime = 0;
    this.cliffhangerPhase = 0;

    // Rover & Dynamic Objects
    this.rover = null;
    this.roverSpotlight = null;
    this.roverBeacon = null;
    this.roverWaypoints = [
      { x: 35, z: 20 },
      { x: 75, z: 45 },
      { x: 90, z: -10 },
      { x: 50, z: -35 },
      { x: 15, z: -15 }
    ];
    this.roverCurrentWp = 0;
    this.roverSpeed = 4.2;

    // Dust storm effects
    this.isStormActive = false;
    this.stormParticleCount = 2800;

    // Clock
    this.clock = null;
    this.lastFrameTime = 0;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container || !window.THREE) {
      console.error("Three.js or container not available!");
      return false;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd25b2a); // Rich Martian ochre
    this.scene.fog = new THREE.FogExp2(0xc85b2e, 0.0095);

    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 1400);
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.position = new THREE.Vector3(0, this.playerHeight, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 3. Cinematic Lighting (Warm Martian Sun + Rich Atmospheric Fill)
    this.ambientLight = new THREE.AmbientLight(0xcc5528, 0.65);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xff8844, 0x5a2010, 0.7);
    this.scene.add(this.hemiLight);

    // Low-angle dramatic Martian sun (creates long shadows matching Image 1)
    this.sunLight = new THREE.DirectionalLight(0xffa258, 1.6);
    this.sunLight.position.set(160, 95, -120);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 480;
    const d = 120;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);

    // 4. Suit Flashlight attached to camera
    this.flashlight = new THREE.SpotLight(0xfff4e0, 2.4, 50, Math.PI / 4.5, 0.35, 1.2);
    this.flashlight.position.set(0.2, -0.2, 0.1);
    this.flashlight.target.position.set(0, 0, -10);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlight.target);
    this.flashlight.visible = false;
    this.scene.add(this.camera);

    // 5. First-Person Astronaut Gloves / Viewmodel
    this.setupAstronautGloves();

    // 6. Build Sky Dome & Distant Mountains (Reference Image 1)
    this.buildMarsSkyAndAtmosphere();

    // 7. Build Procedural Martian Dune Terrain & Rocks (Reference Image 1)
    this.buildMartianTerrain();

    // 8. Build Atmospheric Particle Field
    this.setupDustParticles();

    // 9. Build Futuristic Mars Research Colony Complex (Reference Image 1)
    this.buildColonyComplex();

    // 10. Build Astronaut Explorers on EVA (Reference Image 1)
    this.buildAstronautExplorers();

    // 11. Build Massive Rocket Launch Complex & Stack (Reference Image 2 + Specs)
    this.buildRocketLaunchComplex();

    // 12. Build Orbital Earth & Starfield Climax Scene
    this.buildSpaceAndEarthScene();

    // 13. Raycaster for Interactions
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.2;

    // 14. Input & Pointer Lock Setup
    this.setupControls();

    this.clock = new THREE.Clock();
    window.addEventListener('resize', () => this.onWindowResize());

    return true;
  }

  // ==========================================
  // FIRST-PERSON VIEWMODEL: ASTRONAUT GLOVES
  // ==========================================
  setupAstronautGloves() {
    this.viewModel = new THREE.Group();

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.65,
      metalness: 0.15
    });
    const orangeStripeMat = new THREE.MeshStandardMaterial({
      color: 0xd9531e, // NASA Ares flight suit orange
      roughness: 0.5
    });
    const cuffMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8
    });
    const palmMat = new THREE.MeshStandardMaterial({
      color: 0x444444, // Silicone grip texture
      roughness: 0.9
    });

    const createArm = (isLeft) => {
      const armGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Forearm sleeve
      const forearmGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.35, 12);
      const forearm = new THREE.Mesh(forearmGeo, suitMat);
      forearm.rotation.x = Math.PI / 2.6;
      forearm.rotation.z = sign * 0.12;
      forearm.position.set(0, 0, -0.12);
      armGroup.add(forearm);

      // Orange Sleeve Stripe
      const stripeGeo = new THREE.CylinderGeometry(0.068, 0.072, 0.06, 12);
      const stripe = new THREE.Mesh(stripeGeo, orangeStripeMat);
      stripe.rotation.x = Math.PI / 2.6;
      stripe.position.set(0, -0.01, -0.15);
      armGroup.add(stripe);

      // Pressurized Wrist Coupling Ring
      const ringGeo = new THREE.TorusGeometry(0.066, 0.012, 8, 16);
      const ring = new THREE.Mesh(ringGeo, cuffMat);
      ring.rotation.x = Math.PI / 2.6;
      ring.position.set(0, 0.07, 0.03);
      armGroup.add(ring);

      // Glove Hand
      const handGeo = new THREE.BoxGeometry(0.09, 0.045, 0.11);
      const hand = new THREE.Mesh(handGeo, gloveMat);
      hand.position.set(0, 0.09, 0.1);
      armGroup.add(hand);

      // Silicone Palm Grip
      const palmGeo = new THREE.BoxGeometry(0.075, 0.01, 0.09);
      const palm = new THREE.Mesh(palmGeo, palmMat);
      palm.position.set(0, 0.07, 0.1);
      armGroup.add(palm);

      // Thumb
      const thumbGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.06, 8);
      const thumb = new THREE.Mesh(thumbGeo, gloveMat);
      thumb.rotation.z = -sign * Math.PI / 3;
      thumb.position.set(sign * 0.05, 0.09, 0.07);
      armGroup.add(thumb);

      // Fingers
      for (let i = 0; i < 4; i++) {
        const fingerGeo = new THREE.CylinderGeometry(0.013, 0.015, 0.07, 6);
        const finger = new THREE.Mesh(fingerGeo, gloveMat);
        finger.rotation.x = Math.PI / 4;
        finger.position.set((i - 1.5) * 0.022, 0.08, 0.16);
        armGroup.add(finger);
      }

      return armGroup;
    };

    this.leftHand = createArm(true);
    this.leftHand.position.set(-0.28, -0.28, -0.45);
    this.viewModel.add(this.leftHand);

    this.rightHand = createArm(false);
    this.rightHand.position.set(0.28, -0.28, -0.45);

    // Handheld Telemetry Scanner / Flashlight Tool
    const scannerGroup = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.06, 0.14, 0.04);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const scannerBody = new THREE.Mesh(bodyGeo, bodyMat);
    scannerGroup.add(scannerBody);

    const screenGeo = new THREE.PlaneGeometry(0.045, 0.07);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0.01, 0.022);
    scannerGroup.add(screen);

    const lensGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 12);
    const lensMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.5 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.08, 0);
    scannerGroup.add(lens);

    scannerGroup.position.set(0, 0.13, 0.12);
    scannerGroup.rotation.x = -Math.PI / 4;
    this.rightHand.add(scannerGroup);
    this.suitScanner = scannerGroup;

    this.viewModel.add(this.rightHand);
    this.camera.add(this.viewModel);
  }

  // ==========================================
  // PROCEDURAL MARTIAN SKY, CLOUDS & MOUNTAINS (Reference Image 1)
  // ==========================================
  buildMarsSkyAndAtmosphere() {
    // 1. Inverted Sky Dome with Atmospheric Gradient
    const skyGeo = new THREE.SphereGeometry(680, 32, 24);
    skyGeo.scale(-1, 1, 1);

    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');

    // Photorealistic Martian atmospheric scattering gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#4a1e12'); // Deep muted dusty brown at zenith
    grad.addColorStop(0.30, '#7d381c'); // Natural iron oxide ochre
    grad.addColorStop(0.60, '#a8572c'); // Warm atmospheric butterscotch
    grad.addColorStop(0.82, '#ca7946'); // Dusty salmon horizon haze
    grad.addColorStop(0.94, '#db8f5c'); // Warm suspended regolith dust scattering
    grad.addColorStop(1.0, '#bd6a39'); // Horizon dust attenuation
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle atmospheric dust haze bands with gentle Mie scattering
    for (let i = 0; i < 9; i++) {
      const y = 220 + i * 28;
      ctx.fillStyle = `rgba(240, 185, 145, ${0.03 + Math.random() * 0.04})`;
      ctx.fillRect(0, y, 512, 14 + Math.random() * 12);
    }

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.renderOrder = -100;
    this.scene.add(this.skyDome);

    // 2. High-Altitude Cirrus Ice-Dust Cloud Dome (Image 1)
    const cloudGeo = new THREE.SphereGeometry(660, 32, 18);
    cloudGeo.scale(-1, 1, 1);

    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 512;
    const cCtx = cloudCanvas.getContext('2d');
    cCtx.clearRect(0, 0, 512, 512);

    // Soft wispy horizontal cloud streaks
    for (let c = 0; c < 14; c++) {
      const cy = 120 + c * 22;
      const cAlpha = 0.08 + Math.sin(c * 0.45) * 0.07;
      cCtx.fillStyle = `rgba(255, 235, 220, ${cAlpha})`;
      cCtx.beginPath();
      cCtx.moveTo(0, cy);
      for (let x = 0; x <= 512; x += 32) {
        const offset = Math.sin((x / 512) * Math.PI * 4 + c) * 6;
        cCtx.lineTo(x, cy + offset);
      }
      cCtx.lineTo(512, cy + 12);
      cCtx.lineTo(0, cy + 12);
      cCtx.closePath();
      cCtx.fill();
    }

    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    cloudTexture.wrapS = THREE.RepeatWrapping;
    cloudTexture.wrapT = THREE.ClampToEdgeWrapping;
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    this.cloudDome = new THREE.Mesh(cloudGeo, cloudMat);
    this.cloudDome.renderOrder = -95;
    this.scene.add(this.cloudDome);

    // 3. Ring of Distant Martian Mountains & Crater Rims (Image 1)
    this.buildDistantMountains();
  }

  buildDistantMountains() {
    this.mountainRing = new THREE.Group();
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x822f18, // Basalt iron-oxide red rock
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    const numPeaks = 48;
    const radius = 380;
    for (let i = 0; i < numPeaks; i++) {
      const angle = (i / numPeaks) * Math.PI * 2;
      const r = radius + (Math.sin(i * 3.7) * 45);
      const x = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      const peakHeight = 35 + Math.abs(Math.sin(i * 1.8 + Math.cos(i * 2.5))) * 50;
      const peakWidth = 35 + (i % 5) * 12;

      const geo = new THREE.ConeGeometry(peakWidth * 0.5, peakHeight, 5 + (i % 3));
      const pos = geo.attributes.position;
      for (let p = 0; p < pos.count; p++) {
        if (pos.getY(p) > 0) {
          pos.setX(p, pos.getX(p) + (Math.random() - 0.5) * 4);
          pos.setZ(p, pos.getZ(p) + (Math.random() - 0.5) * 4);
        }
      }
      geo.computeVertexNormals();

      const peak = new THREE.Mesh(geo, mountainMat);
      peak.position.set(x, peakHeight * 0.45 - 6, z);
      peak.rotation.y = Math.random() * Math.PI;
      this.mountainRing.add(peak);
    }

    this.scene.add(this.mountainRing);
  }

  // ==========================================
  // PROCEDURAL MARTIAN TERRAIN & GEOLOGY (Image 1)
  // ==========================================
  computeTerrainHeight(x, z) {
    // 1. Natural sweeping sand dunes & wind ridges (Image 1)
    let h = Math.sin(x * 0.024 + Math.cos(z * 0.02) * 1.6) * 3.2;
    h += Math.sin(z * 0.038 - x * 0.018) * 1.8;
    h += Math.sin((x * 0.8 + z * 0.5) * 0.12) * 0.25;

    // 2. Crash crater at x=-15, z=-10
    const distCrash = Math.hypot(x + 15, z + 10);
    if (distCrash < 30) {
      const rim = Math.sin((distCrash / 30) * Math.PI) * 2.2;
      h += rim - (30 - distCrash) * 0.12;
    }

    // 3. Crater Ridge in Level 5 area (x > 50)
    if (x > 50) {
      const ridgeFactor = Math.min(1, (x - 50) / 40);
      h += Math.sin(z * 0.05) * 4.0 * ridgeFactor + ridgeFactor * 14.0;
    }

    // 4. Flat foundation for Habitat Alpha & Colony Complex at x=0, z=25
    const distHab = Math.hypot(x, z - 25);
    if (distHab < 28) {
      const factor = distHab / 28;
      h = h * factor + 0 * (1 - factor);
    }

    // 5. Flat foundation for Rocket Launch Complex at x=-85, z=-85
    const distPad = Math.hypot(x + 85, z + 85);
    if (distPad < 36) {
      const factor = distPad / 36;
      h = h * factor + 0.5 * (1 - factor);
    }

    return h;
  }

  buildMartianTerrain() {
    const size = this.terrainSize;
    const segs = this.terrainSegments;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.computeTerrainHeight(x, z));
    }

    geo.computeVertexNormals();

    // 1024x1024 High-Resolution Martian Sand Texture (Image 1)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base terracotta desert wash
    ctx.fillStyle = '#b74922';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine parallel windblown sand ripples (Image 1)
    for (let r = 0; r < 1024; r += 14) {
      const rippleShade = Math.sin(r * 0.08) > 0 ? 'rgba(215, 105, 50, 0.35)' : 'rgba(135, 48, 18, 0.4)';
      ctx.fillStyle = rippleShade;
      ctx.fillRect(0, r, 1024, 8);
    }

    // Scattered dark basalt mineral speckles & iron-oxide dust granules
    for (let p = 0; p < 22000; p++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const radius = Math.random() * 2.2 + 0.4;
      const isDark = Math.random() > 0.45;
      ctx.fillStyle = isDark ? 'rgba(92, 32, 12, 0.45)' : 'rgba(235, 130, 68, 0.5)';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(22, 22);

    // Bump map for micro sand-grain tactile relief reacting to sunlight
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);
    for (let bp = 0; bp < 12000; bp++) {
      const bx = Math.random() * 512;
      const by = Math.random() * 512;
      const br = Math.random() * 2.0 + 0.5;
      bCtx.fillStyle = Math.random() > 0.5 ? '#a0a0a0' : '#606060';
      bCtx.beginPath();
      bCtx.arc(bx, by, br, 0, Math.PI * 2);
      bCtx.fill();
    }
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(22, 22);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      roughness: 0.94,
      metalness: 0.06
    });

    this.terrain = new THREE.Mesh(geo, terrainMat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    // Scatter authentic rocks and flat shale slabs matching Image 1
    this.scatterMartianRocks();
  }

  getTerrainHeight(x, z) {
    return this.computeTerrainHeight(x, z);
  }

  scatterMartianRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x6e2a16, // Dark weathered basalt
      roughness: 0.96,
      metalness: 0.08
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x7c341c, // Layered sedimentary Martian shale
      roughness: 0.92,
      metalness: 0.05
    });

    // 1. Scattered Boulders & Craggy Rocks (Image 1)
    for (let i = 0; i < 75; i++) {
      const x = (Math.random() - 0.5) * 260;
      const z = (Math.random() - 0.5) * 260;

      // Keep clear of habitat center, launch complex, and crash site
      if (Math.hypot(x, z - 25) < 16) continue;
      if (Math.hypot(x + 85, z + 85) < 32) continue;
      if (Math.hypot(x + 15, z + 10) < 14) continue;

      const scale = 0.5 + Math.random() * 2.4;
      const geo = new THREE.DodecahedronGeometry(scale, 1);

      const pos = geo.attributes.position;
      for (let p = 0; p < pos.count; p++) {
        pos.setX(p, pos.getX(p) * (0.8 + Math.random() * 0.4));
        pos.setY(p, pos.getY(p) * (0.7 + Math.random() * 0.4));
        pos.setZ(p, pos.getZ(p) * (0.8 + Math.random() * 0.4));
      }
      geo.computeVertexNormals();

      const rock = new THREE.Mesh(geo, rockMat);
      const y = this.getTerrainHeight(x, z) + scale * 0.35;
      rock.position.set(x, y, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      this.colliders.push({
        type: 'sphere',
        x: x,
        z: z,
        radius: scale * 0.85
      });
    }

    // 2. Flat Shale Slabs (Matching foreground rocks in Image 1!)
    for (let s = 0; s < 30; s++) {
      const x = (Math.random() - 0.5) * 220;
      const z = (Math.random() - 0.5) * 220;
      if (Math.hypot(x, z - 25) < 14) continue;
      if (Math.hypot(x + 85, z + 85) < 30) continue;

      const slabW = 1.6 + Math.random() * 2.2;
      const slabL = 1.2 + Math.random() * 1.8;
      const slabH = 0.18 + Math.random() * 0.22;
      const slabGeo = new THREE.BoxGeometry(slabW, slabH, slabL);
      const slab = new THREE.Mesh(slabGeo, slabMat);
      const y = this.getTerrainHeight(x, z) + slabH * 0.4;
      slab.position.set(x, y, z);
      slab.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, (Math.random() - 0.5) * 0.25);
      slab.castShadow = true;
      slab.receiveShadow = true;
      this.scene.add(slab);
    }
  }

  // ==========================================
  // FUTURISTIC MARS RESEARCH COLONY & HABITATS (Reference Image 1)
  // ==========================================
  buildColonyComplex() {
    if (this.colonyGroup) {
      this.scene.remove(this.colonyGroup);
    }
    this.colonyGroup = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.35,
      roughness: 0.32
    });
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x2e3036,
      metalness: 0.8,
      roughness: 0.35
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x484a50,
      metalness: 0.85,
      roughness: 0.25
    });
    const goldWindowMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Reflective gold observation glass
      metalness: 0.95,
      roughness: 0.1
    });
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x112244,
      metalness: 0.9,
      roughness: 0.15
    });

    // Helper: create cylindrical habitat module (Image 1)
    const createCylindricalHab = (x, z, length, radius, rotationY, hasLargeEndcapWindow = false) => {
      const hab = new THREE.Group();
      const y = this.getTerrainHeight(x, z) + radius + 0.6;
      hab.position.set(x, y, z);
      hab.rotation.y = rotationY;

      // 1. Horizontal Main Cylinder Hull
      const cylGeo = new THREE.CylinderGeometry(radius, radius, length, 28);
      const cyl = new THREE.Mesh(cylGeo, hullMat);
      cyl.rotation.z = Math.PI / 2;
      cyl.castShadow = true;
      cyl.receiveShadow = true;
      hab.add(cyl);

      // 2. Rounded Dome Endcaps
      const capGeo = new THREE.SphereGeometry(radius, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      
      const cap1 = new THREE.Mesh(capGeo, hullMat);
      cap1.rotation.z = -Math.PI / 2;
      cap1.position.set(length * 0.5, 0, 0);
      cap1.castShadow = true;
      hab.add(cap1);

      const cap2 = new THREE.Mesh(capGeo, hullMat);
      cap2.rotation.z = Math.PI / 2;
      cap2.position.set(-length * 0.5, 0, 0);
      cap2.castShadow = true;
      hab.add(cap2);

      // 3. Iconic Circular Observation Endcap Window (Image 1)
      if (hasLargeEndcapWindow) {
        const ringGeo = new THREE.TorusGeometry(radius * 0.62, radius * 0.14, 12, 24);
        const ring = new THREE.Mesh(ringGeo, ribMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(length * 0.5 + radius * 0.92, 0, 0);
        hab.add(ring);

        const winGeo = new THREE.CircleGeometry(radius * 0.58, 24);
        const win = new THREE.Mesh(winGeo, goldWindowMat);
        win.rotation.y = Math.PI / 2;
        win.position.set(length * 0.5 + radius * 0.95, 0, 0);
        hab.add(win);
      }

      // 4. Circumferential Structural Ribs
      const ribCount = Math.floor(length / 2.6);
      for (let r = 0; r <= ribCount; r++) {
        const rx = -length * 0.5 + (r / ribCount) * length;
        const ribGeo = new THREE.TorusGeometry(radius + 0.05, 0.08, 8, 28);
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.rotation.y = Math.PI / 2;
        rib.position.set(rx, 0, 0);
        rib.castShadow = true;
        hab.add(rib);
      }

      // 5. Support Stilts & Footpads resting on Martian sand (Image 1)
      const legPositions = [
        { x: -length * 0.35, z: radius * 0.8 },
        { x: -length * 0.35, z: -radius * 0.8 },
        { x: length * 0.35, z: radius * 0.8 },
        { x: length * 0.35, z: -radius * 0.8 }
      ];
      legPositions.forEach(lp => {
        const stiltHeight = radius + 0.8;
        const legGeo = new THREE.CylinderGeometry(0.08, 0.1, stiltHeight, 8);
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lp.x, -stiltHeight * 0.5, lp.z);
        leg.castShadow = true;
        hab.add(leg);

        const padGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.12, 10);
        const pad = new THREE.Mesh(padGeo, legMat);
        pad.position.set(lp.x, -stiltHeight, lp.z);
        hab.add(pad);
      });

      return hab;
    };

    // Module 1: Habitat Beta (Crew Living Quarters with prominent circular portal, Image 1)
    const habBeta = createCylindricalHab(16, 35, 14, 2.6, 0.35, true);
    this.colonyGroup.add(habBeta);

    // Module 2: Habitat Gamma (Science & Geology Laboratory)
    const habGamma = createCylindricalHab(-18, 30, 12, 2.4, -0.4, true);
    const radGeo = new THREE.BoxGeometry(4.2, 0.1, 2.2);
    const rad = new THREE.Mesh(radGeo, solarMat);
    rad.position.set(0, 3.2, 0);
    rad.rotation.x = -Math.PI / 6;
    habGamma.add(rad);
    this.colonyGroup.add(habGamma);

    // Module 3: Habitat Delta (ECLSS & Closed-Loop Agriculture Hub)
    const habDelta = createCylindricalHab(6, 46, 13, 2.5, 1.2, false);
    this.colonyGroup.add(habDelta);

    // Interconnected Pressurized Corridors (Image 1)
    const createCorridor = (x1, z1, x2, z2) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const mx = (x1 + x2) * 0.5;
      const mz = (z1 + z2) * 0.5;
      const my = this.getTerrainHeight(mx, mz) + 1.8;

      const corGroup = new THREE.Group();
      corGroup.position.set(mx, my, mz);
      corGroup.rotation.y = angle;

      const tubeGeo = new THREE.CylinderGeometry(1.25, 1.25, dist, 16);
      const tube = new THREE.Mesh(tubeGeo, hullMat);
      tube.rotation.x = Math.PI / 2;
      tube.castShadow = true;
      corGroup.add(tube);

      const collarGeo = new THREE.TorusGeometry(1.35, 0.12, 8, 16);
      const collar1 = new THREE.Mesh(collarGeo, ribMat);
      collar1.position.z = -dist * 0.3;
      corGroup.add(collar1);
      const collar2 = collar1.clone();
      collar2.position.z = dist * 0.3;
      corGroup.add(collar2);

      return corGroup;
    };

    // Connect Alpha Hub (0, 25) to Beta (16, 35) and Gamma (-18, 30)
    this.colonyGroup.add(createCorridor(4, 26, 12, 33));
    this.colonyGroup.add(createCorridor(-4, 25, -14, 29));
    this.colonyGroup.add(createCorridor(14, 38, 8, 44));

    // Futuristic Manned Exploration Rover (Reference Image 1)
    this.buildExplorationRover();

    // White Supply Containers & Scientific Cargo (Reference Image 1)
    this.buildSupplyContainers();

    this.scene.add(this.colonyGroup);
  }

  buildExplorationRover() {
    this.explorationRoverGroup = new THREE.Group();
    const rx = -11, rz = 12;
    const ry = this.getTerrainHeight(rx, rz);
    this.explorationRoverGroup.position.set(rx, ry, rz);
    this.explorationRoverGroup.rotation.y = 0.45; // Angled facing the desert plain

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.35, metalness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.1, metalness: 0.95 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.9, metalness: 0.2 });
    const darkChassisMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.8 });

    // 1. Aerodynamic Pressurized Cabin
    const cabinGeo = new THREE.BoxGeometry(2.8, 1.8, 4.2);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.y = 1.9;
    cabin.castShadow = true;
    this.explorationRoverGroup.add(cabin);

    // 2. Faceted Panoramic Front Cockpit Glass (Image 1)
    const noseGeo = new THREE.CylinderGeometry(1.2, 1.4, 2.5, 5);
    const nose = new THREE.Mesh(noseGeo, glassMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI / 5;
    nose.position.set(0, 1.9, 2.1);
    this.explorationRoverGroup.add(nose);

    // Multi-pane observation window frames
    const frameGeo = new THREE.BoxGeometry(2.5, 1.0, 0.1);
    const frame = new THREE.Mesh(frameGeo, darkChassisMat);
    frame.position.set(0, 2.1, 2.05);
    frame.rotation.x = -Math.PI / 6;
    this.explorationRoverGroup.add(frame);

    // 3. Rooftop Equipment Rack & Steerable Parabolic Antenna (Image 1)
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.6, 8);
    const mast = new THREE.Mesh(mastGeo, darkChassisMat);
    mast.position.set(0.6, 3.4, -0.6);
    this.explorationRoverGroup.add(mast);

    const dishGeo = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3);
    const dish = new THREE.Mesh(dishGeo, bodyMat);
    dish.rotation.x = -Math.PI / 4;
    dish.position.set(0.6, 4.2, -0.6);
    this.explorationRoverGroup.add(dish);

    // Dual High-Intensity LED Searchlights
    const lightGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.3, 12);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
    [-0.8, 0.8].forEach(lx => {
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(lx, 2.7, 1.6);
      this.explorationRoverGroup.add(light);
    });

    // 4. Six Heavy-Duty High-Traction Wheels with Articulated Rocker-Bogie (Image 1)
    const wheelPositions = [
      { x: -1.7, z: 1.5 },
      { x: 1.7, z: 1.5 },
      { x: -1.75, z: 0.0 },
      { x: 1.75, z: 0.0 },
      { x: -1.7, z: -1.5 },
      { x: 1.7, z: -1.5 }
    ];

    wheelPositions.forEach(wp => {
      const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
      const strut = new THREE.Mesh(strutGeo, darkChassisMat);
      strut.rotation.z = wp.x > 0 ? -0.3 : 0.3;
      strut.position.set(wp.x * 0.7, 1.2, wp.z);
      this.explorationRoverGroup.add(strut);

      const tireGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.52, 18);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wp.x, 0.65, wp.z);
      tire.castShadow = true;
      this.explorationRoverGroup.add(tire);

      const hubGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.54, 12);
      const hub = new THREE.Mesh(hubGeo, bodyMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wp.x, 0.65, wp.z);
      this.explorationRoverGroup.add(hub);
    });

    this.colonyGroup.add(this.explorationRoverGroup);
  }

  buildSupplyContainers() {
    this.buildCarbonStorageBoxes();
  }

  // ==========================================
  // INTERACTIVE CARBON-FIBRE STORAGE BOXES & 3D SURVIVAL SUPPLIES
  // ==========================================
  createCarbonWeaveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18191c';
    ctx.fillRect(0, 0, 128, 128);

    const c1 = '#26272e';
    const c2 = '#121316';
    const s = 16;
    for (let y = 0; y < 128; y += s) {
      for (let x = 0; x < 128; x += s) {
        const isWeave = ((x / s) + (y / s)) % 2 === 0;
        ctx.fillStyle = isWeave ? c1 : c2;
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(x, y + s * 0.45, s, 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    return tex;
  }

  buildCarbonStorageBoxes() {
    // Clear any existing boxes
    this.carbonBoxes.forEach(b => {
      if (b.group && b.group.parent) b.group.parent.remove(b.group);
    });
    this.carbonBoxes = [];

    const carbonTex = this.createCarbonWeaveTexture();
    const carbonMat = new THREE.MeshStandardMaterial({
      map: carbonTex,
      roughness: 0.32,
      metalness: 0.82
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x2d3036,
      metalness: 0.92,
      roughness: 0.22
    });
    const latchMat = new THREE.MeshStandardMaterial({
      color: 0x4a505b,
      metalness: 0.95,
      roughness: 0.15
    });

    // 7 Strategic locations across Mars
    const boxLocations = [
      { id: 'box_landing', x: -16, z: -8, yaw: 0.25, items: ['packaged_ration', 'water_pouch', 'emergency_food'] },
      { id: 'box_hab', x: -4, z: 16, yaw: -0.4, items: ['canned_food', 'nutrition_bar', 'packaged_ration'] },
      { id: 'box_solar', x: 40, z: 22, yaw: 0.8, items: ['packaged_ration', 'water_pouch'] },
      { id: 'box_eclss', x: -32, z: 38, yaw: 1.2, items: ['water_pouch', 'survival_medkit', 'nutrition_bar'] },
      { id: 'box_desert', x: 22, z: -28, yaw: -0.6, items: ['emergency_food', 'packaged_ration', 'canned_food'] },
      { id: 'box_storm', x: 50, z: -6, yaw: 0.1, items: ['nutrition_bar', 'water_pouch'] },
      { id: 'box_ridge', x: 70, z: -14, yaw: -0.9, items: ['survival_medkit', 'emergency_food', 'packaged_ration'] }
    ];

    boxLocations.forEach(bLoc => {
      const boxGroup = new THREE.Group();
      const cy = this.getTerrainHeight(bLoc.x, bLoc.z);
      boxGroup.position.set(bLoc.x, cy + 0.35, bLoc.z);
      boxGroup.rotation.y = bLoc.yaw;

      // 1. Lower Main Cargo Hull
      const baseGeo = new THREE.BoxGeometry(1.25, 0.65, 0.75);
      const baseMesh = new THREE.Mesh(baseGeo, carbonMat);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      boxGroup.add(baseMesh);

      // Corner titanium armor brackets
      const bracketGeo = new THREE.BoxGeometry(1.29, 0.08, 0.79);
      const topBracket = new THREE.Mesh(bracketGeo, titaniumMat);
      topBracket.position.y = 0.28;
      boxGroup.add(topBracket);

      const btmBracket = new THREE.Mesh(bracketGeo, titaniumMat);
      btmBracket.position.y = -0.28;
      boxGroup.add(btmBracket);

      // Neon Biometric Status Strip (Cyan when locked, Green when opened)
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const ledGeo = new THREE.BoxGeometry(0.55, 0.06, 0.02);
      const ledStrip = new THREE.Mesh(ledGeo, ledMat);
      ledStrip.position.set(0, 0.18, 0.38);
      boxGroup.add(ledStrip);

      // Dual heavy mechanical latch levers
      [-0.32, 0.32].forEach(lx => {
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.05), latchMat);
        latch.position.set(lx, 0.12, 0.39);
        boxGroup.add(latch);
      });

      // 2. Animated Hinged Lid Pivot
      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0.325, -0.375); // Hinge line along rear top

      const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.75), carbonMat);
      lidMesh.position.set(0, 0.06, 0.375);
      lidMesh.castShadow = true;
      lidPivot.add(lidMesh);

      const lidRim = new THREE.Mesh(new THREE.BoxGeometry(1.27, 0.04, 0.77), titaniumMat);
      lidRim.position.set(0, 0.1, 0.375);
      lidPivot.add(lidRim);

      boxGroup.add(lidPivot);

      // 3. Interior Compartment Lighting (Turns on when opened)
      const interiorLight = new THREE.PointLight(0xfff0dd, 0, 3.5, 2.0);
      interiorLight.position.set(0, 0.45, 0);
      boxGroup.add(interiorLight);

      // 4. 3D Collectible Food Items inside the container
      const itemSlots = [];
      const itemSpacing = 0.36;
      const startX = -((bLoc.items.length - 1) * itemSpacing) * 0.5;

      bLoc.items.forEach((itemKey, idx) => {
        const itemObj = this.create3DFoodItem(itemKey);
        if (itemObj) {
          const ix = startX + idx * itemSpacing;
          const iy = 0.18;
          const iz = 0.02;
          itemObj.position.set(ix, iy, iz);
          boxGroup.add(itemObj);

          itemSlots.push({
            key: itemKey,
            mesh: itemObj,
            interactableRecord: null
          });
        }
      });

      this.scene.add(boxGroup);

      // Box State Record
      const boxRecord = {
        id: bLoc.id,
        group: boxGroup,
        lidPivot: lidPivot,
        ledStrip: ledStrip,
        interiorLight: interiorLight,
        isOpened: false,
        isOpening: false,
        openProgress: 0,
        itemSlots: itemSlots
      };
      this.carbonBoxes.push(boxRecord);

      // Register closed box interaction
      const boxInteractable = {
        type: 'carbon_box',
        boxId: bLoc.id,
        label: '[E] Open Carbon Storage Box',
        mesh: baseMesh,
        x: bLoc.x,
        y: cy + 0.35,
        z: bLoc.z,
        callback: () => {
          this.openCarbonStorageBox(boxRecord);
        }
      };
      this.interactables.push(boxInteractable);
    });
  }

  // Create high-detail 3D procedural models of survival rations
  create3DFoodItem(itemKey) {
    const itemGroup = new THREE.Group();

    if (itemKey === 'packaged_ration') {
      // Silver vacuum-sealed astronaut ration pouch
      const foilMat = new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.95, roughness: 0.18 });
      const labelMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.30), foilMat);
      pouch.castShadow = true;
      itemGroup.add(pouch);
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.065, 0.16), labelMat);
      itemGroup.add(label);
    } else if (itemKey === 'canned_food') {
      // Metallic protein ration tin with pull ring
      const tinMat = new THREE.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.9, roughness: 0.25 });
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.15, 18), tinMat);
      can.castShadow = true;
      itemGroup.add(can);
    } else if (itemKey === 'nutrition_bar') {
      // Shiny foil wrapped survival energy bar
      const barMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.28 });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.045, 0.22), barMat);
      bar.castShadow = true;
      itemGroup.add(bar);
    } else if (itemKey === 'water_pouch') {
      // Translucent cyan potable water pouch with valved straw
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x33b5e5,
        transparent: true,
        opacity: 0.85,
        roughness: 0.15,
        metalness: 0.2
      });
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.26), waterMat);
      pouch.castShadow = true;
      itemGroup.add(pouch);
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      valve.position.set(0, 0.04, -0.12);
      itemGroup.add(valve);
    } else if (itemKey === 'emergency_food') {
      // High-density compressed survival ration block
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xe65100, roughness: 0.65 });
      const brick = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.22), brickMat);
      brick.castShadow = true;
      itemGroup.add(brick);
    } else if (itemKey === 'survival_medkit') {
      // White and red survival first aid module
      const medMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.35 });
      const crossMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      const med = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.22), medMat);
      med.castShadow = true;
      itemGroup.add(med);
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.105, 0.04), crossMat);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.105, 0.12), crossMat);
      itemGroup.add(c1);
      itemGroup.add(c2);
    }

    return itemGroup;
  }

  // Open Carbon Storage Box Handler
  openCarbonStorageBox(boxRecord) {
    if (boxRecord.isOpened || boxRecord.isOpening) return;
    boxRecord.isOpening = true;

    if (window.soundSystem) {
      if (window.soundSystem.playCarbonBoxOpen) window.soundSystem.playCarbonBoxOpen();
      else window.soundSystem.playLockerUnlock();
    }

    // Update status LED to green
    if (boxRecord.ledStrip) {
      boxRecord.ledStrip.material.color.setHex(0x00ff88);
    }
    if (boxRecord.interiorLight) {
      boxRecord.interiorLight.intensity = 1.8;
    }

    if (window.uiManager) {
      window.uiManager.showBanner("📦 CARBON STORAGE BOX OPENED — SURVIVAL SUPPLIES READY");
    }

    // Increment explore_site objective
    window.gameState.incrementObjective('explore_site');

    // Remove the closed-box prompt from interactables
    const bIdx = this.interactables.findIndex(i => i.boxId === boxRecord.id && i.type === 'carbon_box');
    if (bIdx !== -1) {
      this.interactables.splice(bIdx, 1);
    }
    this.hoveredObject = null;

    // Register each inside item as an interactive target
    boxRecord.itemSlots.forEach(slot => {
      const dbItem = ITEM_DATABASE[slot.key];
      const itemName = dbItem ? dbItem.name : "Survival Ration";
      const itemRecord = {
        type: 'pickup',
        itemId: slot.key,
        label: `[E] Take ${itemName}`,
        mesh: slot.mesh,
        callback: () => {
          if (window.soundSystem) {
            if (window.soundSystem.playCollectFood) window.soundSystem.playCollectFood();
            else window.soundSystem.playPickup();
          }
          window.gameState.addItem(slot.key);
          window.gameState.incrementObjective('collect_food');
          if (window.uiManager) {
            window.uiManager.showBanner(`✅ ${itemName.toUpperCase()} ADDED TO INVENTORY [TAB]`);
          }
          if (slot.mesh && slot.mesh.parent) {
            slot.mesh.parent.remove(slot.mesh);
          }
        }
      };
      this.interactables.push(itemRecord);
      slot.interactableRecord = itemRecord;
    });
  }

  updateCarbonBoxes(delta) {
    this.carbonBoxes.forEach(box => {
      if (box.isOpening && !box.isOpened) {
        box.openProgress += delta * 2.2;
        const p = Math.min(1.0, box.openProgress);
        // Pivot open by -115 degrees (-2.0 radians)
        box.lidPivot.rotation.x = -p * 2.0;

        if (p >= 1.0) {
          box.isOpened = true;
          box.isOpening = false;
        }
      }
    });
  }

  // ==========================================
  // REALISTIC WHITE EVA ASTRONAUTS (Reference Image 1)
  // ==========================================
  buildAstronautExplorers() {
    if (this.astronautsGroup) {
      this.scene.remove(this.astronautsGroup);
    }
    this.astronautsGroup = new THREE.Group();

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.55,
      metalness: 0.15
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xcca033, // Golden reflective EVA helmet visor
      roughness: 0.08,
      metalness: 0.96
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x333338,
      roughness: 0.7
    });
    const packMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.4,
      metalness: 0.3
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xd9531e, // NASA Ares mission orange
      roughness: 0.5
    });

    const createAstronaut = (x, z, rotY) => {
      const astro = new THREE.Group();
      const y = this.getTerrainHeight(x, z);
      astro.position.set(x, y, z);
      astro.rotation.y = rotY;

      // 1. Pressurized Suit Torso
      const torsoGeo = new THREE.BoxGeometry(0.58, 0.75, 0.38);
      const torso = new THREE.Mesh(torsoGeo, suitMat);
      torso.position.y = 1.35;
      torso.castShadow = true;
      astro.add(torso);

      // Chest Display Unit (DCM)
      const dcmGeo = new THREE.BoxGeometry(0.28, 0.24, 0.08);
      const dcm = new THREE.Mesh(dcmGeo, jointMat);
      dcm.position.set(0, 1.45, 0.22);
      astro.add(dcm);

      // 2. Helmet with Golden Reflective Visor (Image 1)
      const helmetGeo = new THREE.SphereGeometry(0.24, 18, 16);
      const helmet = new THREE.Mesh(helmetGeo, suitMat);
      helmet.position.set(0, 1.92, 0.02);
      helmet.castShadow = true;
      astro.add(helmet);

      const visorGeo = new THREE.SphereGeometry(0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 1.7);
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.rotation.x = Math.PI / 2.3;
      visor.position.set(0, 1.93, 0.08);
      astro.add(visor);

      // 3. PLSS Backpack (Portable Life Support System)
      const packGeo = new THREE.BoxGeometry(0.52, 0.72, 0.28);
      const pack = new THREE.Mesh(packGeo, packMat);
      pack.position.set(0, 1.42, -0.26);
      pack.castShadow = true;
      astro.add(pack);

      // Dual Oxygen Tanks on PLSS
      [-0.14, 0.14].forEach(tx => {
        const tankGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
        const tank = new THREE.Mesh(tankGeo, packMat);
        tank.position.set(tx, 1.45, -0.42);
        astro.add(tank);
      });

      // Whip Antenna
      const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 6);
      const ant = new THREE.Mesh(antGeo, jointMat);
      ant.position.set(-0.2, 2.05, -0.32);
      astro.add(ant);

      // 4. Articulated Legs & Heavy Martian Boots
      [-0.15, 0.15].forEach(lx => {
        const thighGeo = new THREE.CylinderGeometry(0.12, 0.11, 0.45, 10);
        const thigh = new THREE.Mesh(thighGeo, suitMat);
        thigh.position.set(lx, 0.85, 0);
        thigh.castShadow = true;
        astro.add(thigh);

        const shinGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.45, 10);
        const shin = new THREE.Mesh(shinGeo, suitMat);
        shin.position.set(lx, 0.42, 0.02);
        shin.castShadow = true;
        astro.add(shin);

        const bootGeo = new THREE.BoxGeometry(0.22, 0.18, 0.34);
        const boot = new THREE.Mesh(bootGeo, jointMat);
        boot.position.set(lx, 0.1, 0.08);
        boot.castShadow = true;
        astro.add(boot);
      });

      // 5. Articulated Arms & Gloves
      [-1, 1].forEach(sign => {
        const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.45, 10);
        const arm = new THREE.Mesh(armGeo, suitMat);
        arm.position.set(sign * 0.38, 1.35, 0);
        arm.rotation.z = -sign * 0.18;
        arm.castShadow = true;
        astro.add(arm);

        const stripeGeo = new THREE.CylinderGeometry(0.092, 0.092, 0.08, 10);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(sign * 0.38, 1.48, 0);
        astro.add(stripe);

        const gloveGeo = new THREE.BoxGeometry(0.12, 0.12, 0.16);
        const glove = new THREE.Mesh(gloveGeo, jointMat);
        glove.position.set(sign * 0.42, 1.05, 0.06);
        glove.castShadow = true;
        astro.add(glove);
      });

      return astro;
    };

    // Astronaut 1: In front of colony surveying the dunes (Image 1)
    const astro1 = createAstronaut(-3.8, 8.5, 0.2);
    this.astronautsGroup.add(astro1);

    // Astronaut 2: Standing near the white supply crate looking toward the mountains (Image 1)
    const astro2 = createAstronaut(2.8, 7.6, -0.4);
    this.astronautsGroup.add(astro2);

    this.scene.add(this.astronautsGroup);
  }

  // ==========================================
  // SPACEX-INSPIRED STARSHIP & LAUNCH COMPLEX
  // ==========================================
  buildRocketLaunchComplex() {
    if (this.rocketComplex) {
      this.scene.remove(this.rocketComplex);
    }
    this.rocketComplex = new THREE.Group();

    const px = -85, pz = -85;
    const py = this.getTerrainHeight(px, pz);
    this.rocketComplex.position.set(px, py, pz);

    // High-tech aerospace materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe6ecf2, // Gleaming stainless steel 304L
      metalness: 0.96,
      roughness: 0.16
    });
    const heatShieldTileMat = new THREE.MeshStandardMaterial({
      color: 0x111214, // Hexagonal ceramic thermal protection tiles
      metalness: 0.65,
      roughness: 0.35
    });
    const towerSteelMat = new THREE.MeshStandardMaterial({
      color: 0x363940,
      metalness: 0.85,
      roughness: 0.38
    });
    const towerArmMat = new THREE.MeshStandardMaterial({
      color: 0xc4301d, // Mechazilla crimson & hazard accents
      metalness: 0.75,
      roughness: 0.35
    });
    const trenchMat = new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.95
    });
    const engineNozzleMat = new THREE.MeshStandardMaterial({
      color: 0x242428,
      metalness: 0.98,
      roughness: 0.22
    });

    // 1. Mobile Launcher Platform Mount & Flame Deflector Trench
    const mlpGeo = new THREE.BoxGeometry(36, 4.5, 32);
    const mlp = new THREE.Mesh(mlpGeo, towerSteelMat);
    mlp.position.y = 2.25;
    mlp.castShadow = true;
    mlp.receiveShadow = true;
    this.rocketComplex.add(mlp);

    const trenchGeo = new THREE.BoxGeometry(16, 5.2, 12);
    const trench = new THREE.Mesh(trenchGeo, trenchMat);
    trench.position.set(0, 1.4, 0);
    this.rocketComplex.add(trench);

    // Launch Mount Staging Ring with 20 Hold-Down Clamps
    const mountRingGeo = new THREE.CylinderGeometry(4.2, 4.6, 2.8, 32);
    const mountRing = new THREE.Mesh(mountRingGeo, towerSteelMat);
    mountRing.position.y = 4.8;
    this.rocketComplex.add(mountRing);

    // 2. Mechazilla Launch Tower (65m Structural Steel Lattice Tower with Chopsticks)
    const towerHeight = 65;
    const towerGroup = new THREE.Group();
    towerGroup.position.set(13, 4.5, 0);

    const colGeo = new THREE.BoxGeometry(1.0, towerHeight, 1.0);
    [
      { x: -3.0, z: -3.0 },
      { x: 3.0, z: -3.0 },
      { x: -3.0, z: 3.0 },
      { x: 3.0, z: 3.0 }
    ].forEach(c => {
      const col = new THREE.Mesh(colGeo, towerSteelMat);
      col.position.set(c.x, towerHeight * 0.5, c.z);
      col.castShadow = true;
      towerGroup.add(col);
    });

    // Cross-bracing and gantry floor platforms
    for (let t = 0; t < 9; t++) {
      const ty = t * 7.0 + 3.5;
      const tierGeo = new THREE.BoxGeometry(7.2, 0.35, 7.2);
      const tier = new THREE.Mesh(tierGeo, towerSteelMat);
      tier.position.y = ty;
      towerGroup.add(tier);

      // Diagonal structural braces
      const braceGeo = new THREE.CylinderGeometry(0.14, 0.14, 8.8, 8);
      const b1 = new THREE.Mesh(braceGeo, towerSteelMat);
      b1.rotation.z = Math.PI / 4;
      b1.position.set(0, ty + 3.5, -3.0);
      towerGroup.add(b1);
    }

    // Mechazilla "Chopsticks" Catching Carriage & Arms
    const carriageGeo = new THREE.BoxGeometry(2.5, 5.0, 7.5);
    const carriage = new THREE.Mesh(carriageGeo, towerArmMat);
    carriage.position.set(-3.2, 42, 0);
    towerGroup.add(carriage);

    // Dual Catching Arms extending toward the rocket
    [-2.2, 2.2].forEach(az => {
      const armGeo = new THREE.BoxGeometry(11.5, 0.8, 0.6);
      const arm = new THREE.Mesh(armGeo, towerArmMat);
      arm.position.set(-8.5, 42, az);
      arm.castShadow = true;
      towerGroup.add(arm);
    });

    // Quick Disconnect (QD) Cryogenic Umbilical Service Arm
    const qdArmGeo = new THREE.BoxGeometry(9.0, 0.6, 1.0);
    const qdArm = new THREE.Mesh(qdArmGeo, towerSteelMat);
    qdArm.position.set(-7.5, 48, 0);
    towerGroup.add(qdArm);

    // Red Flashing Aviation Safety Beacons
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const beaconGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, towerHeight + 0.8, 0);
    towerGroup.add(beacon);

    this.rocketComplex.add(towerGroup);

    // 3. Cryogenic Propellant Tank Farm (Liquid Oxygen & Liquid Methane Storage)
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, metalness: 0.6, roughness: 0.3 });
    [
      { x: 30, z: -15, r: 4.5 },
      { x: 30, z: 15, r: 4.5 },
      { x: 42, z: 0, r: 5.5 }
    ].forEach(tp => {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(tp.r, 24, 18), tankMat);
      sphere.position.set(tp.x, tp.r + 0.5, tp.z);
      sphere.castShadow = true;
      this.rocketComplex.add(sphere);

      // Support legs
      for (let sl = 0; sl < 4; sl++) {
        const ang = (sl / 4) * Math.PI * 2;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, tp.r, 8), towerSteelMat);
        leg.position.set(tp.x + Math.sin(ang) * (tp.r * 0.7), tp.r * 0.5, tp.z + Math.cos(ang) * (tp.r * 0.7));
        this.rocketComplex.add(leg);
      }
    });

    // 4. THE SPACEX STARSHIP & SUPER HEAVY LAUNCH VEHICLE
    this.rocketStack = new THREE.Group();
    this.rocketStack.position.set(0, 4.8, 0);

    // ==========================================
    // STAGE 1: SUPER HEAVY BOOSTER (Height 48m, Radius 3.2m)
    // ==========================================
    this.superHeavyBooster = new THREE.Group();
    this.superHeavyBooster.position.set(0, 0, 0);

    const boosterHeight = 46;
    const boosterRadius = 3.2;

    const boosterGeo = new THREE.CylinderGeometry(boosterRadius, boosterRadius, boosterHeight, 36);
    const boosterMesh = new THREE.Mesh(boosterGeo, steelMat);
    boosterMesh.position.y = boosterHeight * 0.5 + 2.5;
    boosterMesh.castShadow = true;
    this.superHeavyBooster.add(boosterMesh);

    // Super Heavy Interstage Vented Ring
    const interstageGeo = new THREE.CylinderGeometry(boosterRadius + 0.05, boosterRadius + 0.05, 3.2, 36, 1, true);
    const interstageMesh = new THREE.Mesh(interstageGeo, towerSteelMat);
    interstageMesh.position.y = boosterHeight + 2.5;
    this.superHeavyBooster.add(interstageMesh);

    // 4 Titanium Lattice Grid Fins for Hypersonic Control
    this.gridFins = [];
    const gridFinMat = new THREE.MeshStandardMaterial({ color: 0x2b2d32, metalness: 0.9, roughness: 0.25 });
    for (let gf = 0; gf < 4; gf++) {
      const ang = (gf / 4) * Math.PI * 2;
      const finGroup = new THREE.Group();
      finGroup.position.set(
        Math.sin(ang) * (boosterRadius + 0.2),
        boosterHeight + 1.2,
        Math.cos(ang) * (boosterRadius + 0.2)
      );
      finGroup.rotation.y = ang;

      const finGeo = new THREE.BoxGeometry(0.18, 1.8, 2.8);
      const finMesh = new THREE.Mesh(finGeo, gridFinMat);
      finGroup.add(finMesh);
      this.superHeavyBooster.add(finGroup);
      this.gridFins.push(finGroup);
    }

    // 33 Raptor Booster Engine Cluster Nozzles
    this.boosterNozzles = [];
    const createRaptorNozzle = (x, z) => {
      const nozGeo = new THREE.CylinderGeometry(0.28, 0.65, 1.8, 16);
      const noz = new THREE.Mesh(nozGeo, engineNozzleMat);
      noz.position.set(x, 1.6, z);
      this.superHeavyBooster.add(noz);
      this.boosterNozzles.push(noz);
      return noz;
    };

    // Center cluster of 3
    createRaptorNozzle(0, 0);
    createRaptorNozzle(0.7, 0);
    createRaptorNozzle(-0.7, 0);

    // Inner ring of 10
    for (let r1 = 0; r1 < 10; r1++) {
      const a = (r1 / 10) * Math.PI * 2;
      createRaptorNozzle(Math.sin(a) * 1.5, Math.cos(a) * 1.5);
    }
    // Outer ring of 20
    for (let r2 = 0; r2 < 20; r2++) {
      const a = (r2 / 20) * Math.PI * 2;
      createRaptorNozzle(Math.sin(a) * 2.6, Math.cos(a) * 2.6);
    }

    this.rocketStack.add(this.superHeavyBooster);

    // ==========================================
    // STAGE 2: STARSHIP UPPER STAGE (Height 32m, Radius 3.0m)
    // ==========================================
    this.spacexStarship = new THREE.Group();
    this.spacexStarship.position.set(0, boosterHeight + 3.0, 0);

    const shipCylinderHeight = 20;
    const shipRadius = 3.0;

    // Starship Body Cylinder (Stainless Steel Half)
    const shipGeo = new THREE.CylinderGeometry(shipRadius, shipRadius, shipCylinderHeight, 36);
    const shipBody = new THREE.Mesh(shipGeo, steelMat);
    shipBody.position.y = shipCylinderHeight * 0.5;
    shipBody.castShadow = true;
    this.spacexStarship.add(shipBody);

    // Starship Hexagonal Heat Shield Half (Windward Side)
    const heatShieldGeo = new THREE.CylinderGeometry(shipRadius + 0.03, shipRadius + 0.03, shipCylinderHeight, 36, 1, false, -Math.PI * 0.5, Math.PI);
    const heatShieldMesh = new THREE.Mesh(heatShieldGeo, heatShieldTileMat);
    heatShieldMesh.position.y = shipCylinderHeight * 0.5;
    this.spacexStarship.add(heatShieldMesh);

    // Starship Ogive Aerodynamic Nosecone
    const noseHeight = 12;
    const noseGeo = new THREE.ConeGeometry(shipRadius, noseHeight, 36);
    const noseMesh = new THREE.Mesh(noseGeo, steelMat);
    noseMesh.position.y = shipCylinderHeight + noseHeight * 0.5;
    noseMesh.castShadow = true;
    this.spacexStarship.add(noseMesh);

    const noseHeatGeo = new THREE.ConeGeometry(shipRadius + 0.03, noseHeight, 36, 1, false, -Math.PI * 0.5, Math.PI);
    const noseHeatMesh = new THREE.Mesh(noseHeatGeo, heatShieldTileMat);
    noseHeatMesh.position.y = shipCylinderHeight + noseHeight * 0.5;
    this.spacexStarship.add(noseHeatMesh);

    // Forward Aerodynamic Flaps (Canards)
    this.aerodynamicFlaps = [];
    [-1, 1].forEach(side => {
      const flapGroup = new THREE.Group();
      flapGroup.position.set(side * 2.8, shipCylinderHeight + noseHeight * 0.35, 0);

      const fGeo = new THREE.BoxGeometry(0.15, 3.2, 1.8);
      const fMesh = new THREE.Mesh(fGeo, side < 0 ? heatShieldTileMat : steelMat);
      fMesh.position.set(side * 0.9, 0, 0);
      flapGroup.add(fMesh);
      this.spacexStarship.add(flapGroup);
      this.aerodynamicFlaps.push(flapGroup);
    });

    // Aft Large Delta Body Flaps
    [-1, 1].forEach(side => {
      const aftGroup = new THREE.Group();
      aftGroup.position.set(side * 2.9, 4.5, 0);

      const afGeo = new THREE.BoxGeometry(0.2, 6.2, 2.8);
      const afMesh = new THREE.Mesh(afGeo, side < 0 ? heatShieldTileMat : steelMat);
      afMesh.position.set(side * 1.4, 0, 0);
      afMesh.castShadow = true;
      aftGroup.add(afMesh);
      this.spacexStarship.add(aftGroup);
      this.aerodynamicFlaps.push(aftGroup);
    });

    // Starship Raptor Engines (3 Vacuum + 3 Center Sea-Level)
    this.shipNozzles = [];
    const createShipNozzle = (x, z, isVac) => {
      const nR = isVac ? 0.95 : 0.55;
      const nH = isVac ? 2.6 : 1.8;
      const nGeo = new THREE.CylinderGeometry(0.3, nR, nH, 20);
      const noz = new THREE.Mesh(nGeo, engineNozzleMat);
      noz.position.set(x, -0.6, z);
      this.spacexStarship.add(noz);
      this.shipNozzles.push(noz);
      return noz;
    };

    // 3 Center sea-level Raptors
    createShipNozzle(0, 0.6, false);
    createShipNozzle(-0.52, -0.3, false);
    createShipNozzle(0.52, -0.3, false);

    // 3 Large vacuum Raptor bells
    createShipNozzle(0, -1.6, true);
    createShipNozzle(-1.38, 0.8, true);
    createShipNozzle(1.38, 0.8, true);

    // Cockpit Flight Deck Visor Window & Interior Illumination
    const cockpitGeo = new THREE.BoxGeometry(0.8, 1.2, 0.1);
    const cockpitGlass = new THREE.Mesh(cockpitGeo, new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x007799,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    }));
    cockpitGlass.position.set(0, shipCylinderHeight + 4.5, 2.8);
    this.spacexStarship.add(cockpitGlass);

    // Cockpit Red Alert Flashing Light (for Tentacle sequence)
    this.cockpitRedAlertLight = new THREE.PointLight(0xff0022, 0, 15, 2.0);
    this.cockpitRedAlertLight.position.set(0, shipCylinderHeight + 4.5, 2.5);
    this.spacexStarship.add(this.cockpitRedAlertLight);

    this.rocketStack.add(this.spacexStarship);
    this.rocketComplex.add(this.rocketStack);

    // 5. Engine Combustion Flames & VFX
    this.buildEngineFlames();
    this.buildLaunchVfx();

    this.scene.add(this.rocketComplex);

    // Launch Complex Platform Collider
    this.colliders.push({
      type: 'box',
      minX: px - 18,
      maxX: px + 18,
      minZ: pz - 16,
      maxZ: pz + 16
    });
  }

  // ==========================================
  // SUPERSONIC SHOCK DIAMOND COMBUSTION FLAMES
  // ==========================================
  buildEngineFlames() {
    this.engineFlames = [];

    const createPlume = (parent, x, y, z, r, len) => {
      const plumeGroup = new THREE.Group();
      plumeGroup.position.set(x, y, z);

      // Outer supersonic combustion sheath (orange/blue)
      const outerGeo = new THREE.ConeGeometry(r, len, 24, 1, true);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const outer = new THREE.Mesh(outerGeo, outerMat);
      outer.rotation.x = Math.PI;
      outer.position.y = -len * 0.5;
      plumeGroup.add(outer);

      // Supersonic Shock Diamond core (bright white/yellow)
      const innerGeo = new THREE.ConeGeometry(r * 0.45, len * 0.8, 16, 1, true);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.rotation.x = Math.PI;
      inner.position.y = -len * 0.4;
      plumeGroup.add(inner);

      // Shock Diamond Rings
      for (let d = 1; d <= 4; d++) {
        const ringGeo = new THREE.TorusGeometry(r * 0.35 * (1 - d * 0.18), 0.08, 8, 16);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffeedd, blending: THREE.AdditiveBlending }));
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -d * (len * 0.18);
        plumeGroup.add(ring);
      }

      plumeGroup.visible = false;
      parent.add(plumeGroup);
      this.engineFlames.push(plumeGroup);
      return plumeGroup;
    };

    // Booster Raptor Plumes (Massive Cluster)
    createPlume(this.superHeavyBooster, 0, 0, 0, 3.8, 26.0);
    createPlume(this.superHeavyBooster, -1.6, 0, 0, 2.5, 20.0);
    createPlume(this.superHeavyBooster, 1.6, 0, 0, 2.5, 20.0);

    // Starship Upper Stage Raptors (6 engines)
    this.shipNozzles.forEach(noz => {
      createPlume(noz, 0, -0.8, 0, 1.1, 9.5);
    });

    // Launch Pad Illumination Light
    this.rocketPointLight = new THREE.PointLight(0xffa244, 0, 220, 1.4);
    this.rocketPointLight.position.set(0, 3.0, 0);
    this.rocketStack.add(this.rocketPointLight);
  }

  // ==========================================
  // LAUNCH VFX: CRYOGENIC VAPOR & GROUND SMOKE
  // ==========================================
  buildLaunchVfx() {
    // 1. Cryogenic Boil-Off Vapor Venting
    const ventCount = 220;
    const ventGeo = new THREE.BufferGeometry();
    const ventPos = new Float32Array(ventCount * 3);
    for (let i = 0; i < ventCount; i++) {
      ventPos[i * 3] = (Math.random() - 0.5) * 2.2;
      ventPos[i * 3 + 1] = 46 + Math.random() * 6;
      ventPos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    ventGeo.setAttribute('position', new THREE.BufferAttribute(ventPos, 3));
    const ventMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending
    });
    this.cryoVaporParticles = new THREE.Points(ventGeo, ventMat);
    this.rocketStack.add(this.cryoVaporParticles);

    // 2. Billowing Ground Launch Smoke Cloud Field
    const smokeCount = 850;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(smokeCount * 3);
    this.smokeVelocities = new Float32Array(smokeCount * 3);

    for (let i = 0; i < smokeCount; i++) {
      smokePos[i * 3] = (Math.random() - 0.5) * 8;
      smokePos[i * 3 + 1] = 1.0 + Math.random() * 2;
      smokePos[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const angle = Math.random() * Math.PI * 2;
      const spd = 7 + Math.random() * 24;
      this.smokeVelocities[i * 3] = Math.cos(angle) * spd;
      this.smokeVelocities[i * 3 + 1] = 1.5 + Math.random() * 7;
      this.smokeVelocities[i * 3 + 2] = Math.sin(angle) * spd;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xe6b588,
      size: 4.5,
      transparent: true,
      opacity: 0.0,
      blending: THREE.NormalBlending
    });
    this.launchSmokeParticles = new THREE.Points(smokeGeo, smokeMat);
    this.launchSmokeParticles.position.set(0, 0, 0);
    this.rocketComplex.add(this.launchSmokeParticles);
  }

  // ==========================================
  // DEEP SPACE, 3D EARTH, 3D MARS & ALIEN TENTACLE
  // ==========================================
  buildSpaceAndEarthScene() {
    this.spaceSceneGroup = new THREE.Group();
    this.spaceSceneGroup.position.set(-85, 620, -85);
    this.spaceSceneGroup.visible = false;

    // 1. Deep Space Starfield (3,500 Twinkling Cosmic Stars)
    const starCount = 3500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 400 + Math.random() * 150;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const temp = Math.random();
      if (temp > 0.75) {
        starColors[i * 3] = 0.85; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 1.0;
      } else if (temp > 0.4) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      } else if (temp > 0.15) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.92; starColors[i * 3 + 2] = 0.7;
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.65; starColors[i * 3 + 2] = 0.45;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.92
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.spaceSceneGroup.add(this.starField);

    // 2. Spectacular 3D Planet Earth (With Swirling Clouds & Blue Atmospheric Limb)
    this.earthGroup = new THREE.Group();
    this.earthGroup.position.set(0, 45, -140);

    const earthCanvas = document.createElement('canvas');
    earthCanvas.width = 1024;
    earthCanvas.height = 512;
    const eCtx = earthCanvas.getContext('2d');
    const oceanGrad = eCtx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0.0, '#103055');
    oceanGrad.addColorStop(0.5, '#16487e');
    oceanGrad.addColorStop(1.0, '#0e2b4d');
    eCtx.fillStyle = oceanGrad;
    eCtx.fillRect(0, 0, 1024, 512);

    eCtx.fillStyle = '#2d5e2e'; // Continents
    eCtx.beginPath();
    eCtx.ellipse(280, 210, 110, 85, -0.2, 0, Math.PI * 2);
    eCtx.ellipse(340, 360, 75, 110, 0.3, 0, Math.PI * 2);
    eCtx.ellipse(620, 180, 180, 95, 0.1, 0, Math.PI * 2);
    eCtx.ellipse(580, 310, 90, 120, -0.1, 0, Math.PI * 2);
    eCtx.fill();

    eCtx.fillStyle = '#b38848';
    eCtx.beginPath();
    eCtx.ellipse(570, 260, 65, 35, 0, 0, Math.PI * 2);
    eCtx.ellipse(820, 380, 60, 45, 0, 0, Math.PI * 2);
    eCtx.fill();

    eCtx.fillStyle = '#ffffff'; // Ice caps
    eCtx.fillRect(0, 0, 1024, 38);
    eCtx.fillRect(0, 474, 1024, 38);

    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15
    });
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(52, 48, 36), earthMat);
    this.earthGroup.add(this.earthMesh);

    // Dynamic Clouds
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const clCtx = cloudCanvas.getContext('2d');
    clCtx.clearRect(0, 0, 1024, 512);
    clCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let sw = 0; sw < 32; sw++) {
      const sx = Math.random() * 1024;
      const sy = 80 + Math.random() * 350;
      clCtx.beginPath();
      clCtx.ellipse(sx, sy, 80 + Math.random() * 70, 25 + Math.random() * 30, (Math.random() - 0.5) * 0.8, 0, Math.PI * 2);
      clCtx.fill();
    }
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.75
    });
    this.earthClouds = new THREE.Mesh(new THREE.SphereGeometry(53.2, 48, 36), cloudMat);
    this.earthGroup.add(this.earthClouds);

    // Atmospheric limb glow
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00b4d8,
      transparent: true,
      opacity: 0.32,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const earthHalo = new THREE.Mesh(new THREE.SphereGeometry(56.5, 36, 28), haloMat);
    this.earthGroup.add(earthHalo);
    this.spaceSceneGroup.add(this.earthGroup);

    // 3. Spectacular 3D Planet Mars (With Canyons, Volcanic Plateaus & Ice Caps)
    this.marsGroup = new THREE.Group();
    this.marsGroup.position.set(0, 45, 160);

    const marsCanvas = document.createElement('canvas');
    marsCanvas.width = 1024;
    marsCanvas.height = 512;
    const mCtx = marsCanvas.getContext('2d');

    // Rich volcanic rust base
    const mGrad = mCtx.createLinearGradient(0, 0, 0, 512);
    mGrad.addColorStop(0.0, '#752b14');
    mGrad.addColorStop(0.5, '#b34720');
    mGrad.addColorStop(1.0, '#662310');
    mCtx.fillStyle = mGrad;
    mCtx.fillRect(0, 0, 1024, 512);

    // Dark basalt plains (Acidalia, Syrtis Major)
    mCtx.fillStyle = '#42170d';
    mCtx.beginPath();
    mCtx.ellipse(320, 220, 140, 95, 0.2, 0, Math.PI * 2);
    mCtx.ellipse(720, 260, 160, 110, -0.3, 0, Math.PI * 2);
    mCtx.fill();

    // Valles Marineris canyon cut
    mCtx.strokeStyle = '#2d0f07';
    mCtx.lineWidth = 14;
    mCtx.beginPath();
    mCtx.moveTo(400, 290);
    mCtx.lineTo(650, 310);
    mCtx.stroke();

    // Olympus Mons caldera ring
    mCtx.fillStyle = '#7a2d16';
    mCtx.beginPath();
    mCtx.arc(280, 240, 38, 0, Math.PI * 2);
    mCtx.fill();

    // Polar ice caps (frozen CO2 & H2O)
    mCtx.fillStyle = '#f0f5fa';
    mCtx.fillRect(0, 0, 1024, 28);
    mCtx.fillRect(0, 484, 1024, 28);

    const marsTex = new THREE.CanvasTexture(marsCanvas);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTex,
      roughness: 0.85,
      metalness: 0.08
    });
    this.marsMesh = new THREE.Mesh(new THREE.SphereGeometry(44, 48, 36), marsMat);
    this.marsGroup.add(this.marsMesh);

    // Mars atmospheric limb halo
    const marsHalo = new THREE.Mesh(new THREE.SphereGeometry(47.2, 36, 28), new THREE.MeshBasicMaterial({
      color: 0xd95f2a,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    }));
    this.marsGroup.add(marsHalo);
    this.spaceSceneGroup.add(this.marsGroup);

    // 4. THE GIANT MYSTERIOUS ALIEN TENTACLE
    this.buildGiantTentacle();

    this.scene.add(this.spaceSceneGroup);
  }

  // ==========================================
  // THE COLOSSAL MYSTERIOUS ALIEN TENTACLE
  // ==========================================
  buildGiantTentacle() {
    this.tentacleGroup = new THREE.Group();
    this.tentacleGroup.position.set(0, 18, 0);
    this.tentacleGroup.visible = false;

    // Organic alien flesh material
    const skinCanvas = document.createElement('canvas');
    skinCanvas.width = 256;
    skinCanvas.height = 256;
    const sCtx = skinCanvas.getContext('2d');
    sCtx.fillStyle = '#260a1c'; // Deep extraterrestrial maroon
    sCtx.fillRect(0, 0, 256, 256);
    // Mottled alien scales
    for (let i = 0; i < 400; i++) {
      sCtx.fillStyle = Math.random() > 0.5 ? '#3d112d' : '#190613';
      sCtx.beginPath();
      sCtx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 6 + 2, 0, Math.PI * 2);
      sCtx.fill();
    }
    const skinTex = new THREE.CanvasTexture(skinCanvas);
    skinTex.wrapS = THREE.RepeatWrapping;
    skinTex.wrapT = THREE.RepeatWrapping;

    const tentacleMat = new THREE.MeshStandardMaterial({
      map: skinTex,
      color: 0x481232,
      roughness: 0.28,
      metalness: 0.35
    });

    const suctionMat = new THREE.MeshStandardMaterial({
      color: 0x82225a,
      roughness: 0.2,
      metalness: 0.4
    });

    const veinMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa, // Pulsating bioluminescent veins
      transparent: true,
      opacity: 0.85
    });

    // 18 Articulated Kinematic Segments chained together
    this.tentacleSegments = [];
    const numSegments = 18;
    let prevGroup = this.tentacleGroup;

    for (let i = 0; i < numSegments; i++) {
      const p = i / numSegments;
      const segGroup = new THREE.Group();
      const segRadius = THREE.MathUtils.lerp(4.2, 0.45, p);
      const segHeight = 2.4;

      const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(segRadius * 0.88, segRadius, segHeight, 20), tentacleMat);
      segMesh.position.y = segHeight * 0.5;
      segMesh.castShadow = true;
      segGroup.add(segMesh);

      // Suction cups along inner gripping curve
      [-0.4, 0.4].forEach(off => {
        const cup = new THREE.Mesh(new THREE.TorusGeometry(segRadius * 0.28, 0.08, 8, 16), suctionMat);
        cup.rotation.y = Math.PI / 2;
        cup.position.set(segRadius * 0.95, segHeight * 0.5, off * segRadius * 0.4);
        segGroup.add(cup);
      });

      // Bioluminescent vein streak
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.08, segHeight * 0.8, 0.15), veinMat);
      vein.position.set(-segRadius * 0.96, segHeight * 0.5, 0);
      segGroup.add(vein);

      if (i === 0) {
        segGroup.position.set(0, -18, 0);
      } else {
        segGroup.position.set(0, segHeight, 0);
      }

      prevGroup.add(segGroup);
      this.tentacleSegments.push(segGroup);
      prevGroup = segGroup;
    }

    this.spaceSceneGroup.add(this.tentacleGroup);
  }

  // ==========================================
  // PROLOGUE: CINEMATIC SPACEX ROCKET LAUNCH & MARS LANDING
  // ==========================================
  startEarthLaunchPrologue(onComplete) {
    this.isPrologueActive = true;
    this.prologueTime = 0;
    this.prologuePhase = 0;
    this.prologueCallback = onComplete;
    window.gameState.inCutscene = true;

    if (document.exitPointerLock) document.exitPointerLock();
    if (this.viewModel) this.viewModel.visible = false;

    const overlay = document.getElementById('rocket-cliffhanger-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const blackout = document.getElementById('cliffhanger-blackout');
    if (blackout) blackout.classList.remove('visible');

    // Reset rocket stack
    if (this.rocketStack) {
      this.rocketStack.position.set(0, 4.8, 0);
      this.rocketStack.rotation.set(0, 0, 0);
    }
    if (this.superHeavyBooster) this.superHeavyBooster.position.set(0, 0, 0);
    if (this.spacexStarship) this.spacexStarship.position.set(0, 49, 0);

    this.engineFlames.forEach(f => f.visible = false);
    if (this.rocketPointLight) this.rocketPointLight.intensity = 0;
    if (this.launchSmokeParticles) this.launchSmokeParticles.material.opacity = 0;
    if (this.spaceSceneGroup) this.spaceSceneGroup.visible = false;
    if (this.tentacleGroup) this.tentacleGroup.visible = false;

    // Earth sunrise sky
    this.scene.background.setHex(0x1a3b5c);
    this.scene.fog.color.setHex(0x22486a);
    if (this.skyDome) this.skyDome.visible = false;

    if (window.soundSystem) {
      window.soundSystem.setWindStorm(false);
      window.soundSystem.playRocketPreIgnition();
      if (window.soundSystem.playRadioComms) window.soundSystem.playRadioComms();
    }
  }

  updatePrologue(delta) {
    this.prologueTime += delta;
    const t = this.prologueTime;
    const px = -85, pz = -85;

    const hudStatus = document.getElementById('launch-telemetry-status');
    const hudPhase = document.getElementById('launch-seq-phase');
    const camBadge = document.getElementById('cinematic-cam-badge');
    const subtitles = document.getElementById('cinematic-dialogue-subtitles');

    if (this.earthMesh) this.earthMesh.rotation.y += 0.001 * delta;
    if (this.earthClouds) this.earthClouds.rotation.y += 0.002 * delta;
    if (this.marsMesh) this.marsMesh.rotation.y += 0.0014 * delta;

    // STEP 1: Launch Pad at Dawn & Mission Control Countdown (0.0s - 7.0s)
    if (t < 7.0) {
      const p = t / 7.0;
      const camX = THREE.MathUtils.lerp(-45, -68, p);
      const camY = THREE.MathUtils.lerp(18, 14, p);
      const camZ = THREE.MathUtils.lerp(-45, -72, p);
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(px, 32, pz);

      if (camBadge) camBadge.textContent = "📹 CAM 01 // KENNEDY LAUNCH COMPLEX 39A";
      if (hudPhase) hudPhase.textContent = "SPACEX-INSPIRED STARSHIP // FLIGHT READY";
      const sec = Math.max(0, Math.ceil(7.0 - t));
      if (hudStatus) hudStatus.textContent = `T-MINUS 00:0${sec} // DSN CARRIER LOCKED`;
      if (subtitles) subtitles.textContent = "Mission Control: \"Carrier lock confirmed. All 33 Raptor propulsion chill circuits nominal.\"";

      if (this.cryoVaporParticles) {
        this.cryoVaporParticles.rotation.y += 0.6 * delta;
      }

      if (window.soundSystem && Math.floor(t * 1.5) !== Math.floor((t - delta) * 1.5)) {
        window.soundSystem.playCountdownBeep(sec <= 3);
      }
    }
    // STEP 2: Raptor Ignition & Lift-off (7.0s - 14.0s)
    else if (t < 14.0) {
      if (this.prologuePhase < 1) {
        this.prologuePhase = 1;
        if (window.soundSystem) {
          window.soundSystem.playRocketIgnition();
          window.soundSystem.startRocketRoar();
          window.soundSystem.updateRocketRoar(0.9, 1400);
        }
      }

      this.engineFlames.forEach(f => f.visible = true);
      if (this.rocketPointLight) this.rocketPointLight.intensity = 9.5;

      // Billowing smoke
      if (this.launchSmokeParticles) {
        this.launchSmokeParticles.material.opacity = Math.min(0.85, (t - 7.0) * 0.35);
        const pos = this.launchSmokeParticles.geometry.attributes.position.array;
        const vel = this.smokeVelocities;
        for (let i = 0; i < 850; i++) {
          pos[i * 3] += vel[i * 3] * delta;
          pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
          pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        }
        this.launchSmokeParticles.geometry.attributes.position.needsUpdate = true;
      }

      const liftP = Math.max(0, (t - 9.0) / 5.0);
      const liftY = 4.8 + Math.pow(liftP, 2.2) * 45;
      if (this.rocketStack) this.rocketStack.position.y = liftY;

      // Heavy ground camera rumble
      const shake = Math.sin(t * 60) * 0.12;
      this.camera.position.set(-62 + shake, 15 + liftP * 8, -66 + shake);
      this.camera.lookAt(px, liftY * 0.6 + 18, pz);

      if (camBadge) camBadge.textContent = "📹 CAM 02 // MECHAZILLA TOWER GANTRY";
      if (hudPhase) hudPhase.textContent = "RAPTOR IGNITION // 34,000 kN THRUST ENGAGED";
      if (hudStatus) hudStatus.textContent = "LIFTOFF! WE HAVE LIFTOFF OF THE ARES EXPEDITION!";
      if (subtitles) subtitles.textContent = "Mission Control: \"Tower clearance confirmed. Hold-down clamps released. Godspeed Ares-Venture!\"";
    }
    // STEP 3: Ascent & Transition to Space (14.0s - 21.0s)
    else if (t < 21.0) {
      const ascP = (t - 14.0) / 7.0;
      const ascY = 49.8 + Math.pow(ascP * 7.0, 2.3) * 14;
      if (this.rocketStack) {
        this.rocketStack.position.y = ascY;
        this.rocketStack.rotation.z = Math.min(0.5, ascP * 0.5);
      }

      // Tracking camera looking up into the stratosphere
      this.camera.position.set(-42, 22 + ascP * 12, -42);
      this.camera.lookAt(px, Math.min(ascY, 400), pz);

      // Deepening sky into cosmic black
      const darkP = Math.min(1.0, ascP * 1.2);
      const r = THREE.MathUtils.lerp(0.1, 0.01, darkP);
      const g = THREE.MathUtils.lerp(0.2, 0.01, darkP);
      const b = THREE.MathUtils.lerp(0.35, 0.02, darkP);
      this.scene.background.setRGB(r, g, b);
      this.scene.fog.color.setRGB(r, g, b);

      if (camBadge) camBadge.textContent = "📹 CAM 03 // UPPER STRATOSPHERE TRACKING";
      if (hudPhase) hudPhase.textContent = "MAX-Q TRANSONIC PENETRATION // LEAVING EARTH ATMOSPHERE";
      if (hudStatus) hudStatus.textContent = "ALTITUDE: 65,000 METERS // HEADING TO MARS ORBIT";
      if (subtitles) subtitles.textContent = "Mission Control: \"Max-Q passed. Trajectory nominal. Staging sequence in 3... 2... 1...\"";
    }
    // STEP 4: Deep Space Cruise (21.0s - 28.0s)
    else if (t < 28.0) {
      if (this.spaceSceneGroup) this.spaceSceneGroup.visible = true;

      if (this.prologuePhase < 2) {
        this.prologuePhase = 2;
        if (window.soundSystem) {
          window.soundSystem.stopRocketRoar(0.5);
          if (window.soundSystem.startSpaceAmbience) window.soundSystem.startSpaceAmbience();
        }
      }

      // Hide booster, Starship upper stage continues into space
      if (this.superHeavyBooster) this.superHeavyBooster.visible = false;
      this.engineFlames.forEach((f, idx) => {
        // Only subtle vacuum raptor glow
        f.visible = (idx >= 3);
      });

      const spaceTime = t - 21.0;
      const targetY = 620;
      if (this.rocketStack) {
        this.rocketStack.position.set(px, targetY, pz);
        this.rocketStack.rotation.set(0, spaceTime * 0.04, 0.35);
      }

      // Camera glides past Starship showing Earth receding and Mars ahead
      const camP = spaceTime / 7.0;
      this.camera.position.set(px + 28 - camP * 14, targetY + 6, pz + 24 - camP * 20);
      this.camera.lookAt(px, targetY, pz);

      if (this.earthGroup) {
        this.earthGroup.position.set(px - 140 - camP * 80, targetY - 40, pz - 180 - camP * 90);
        this.earthGroup.scale.setScalar(Math.max(0.3, 1.0 - camP * 0.5));
      }
      if (this.marsGroup) {
        this.marsGroup.position.set(px + 120 - camP * 50, targetY + 20, pz + 160 - camP * 60);
        this.marsGroup.scale.setScalar(0.4 + camP * 0.5);
      }

      if (camBadge) camBadge.textContent = "📹 CAM 04 // DEEP SPACE INTERPLANETARY CRUISE";
      if (hudPhase) hudPhase.textContent = "INTERPLANETARY TRANSFER // 54.6 MILLION KM VOYAGE";
      if (hudStatus) hudStatus.textContent = "DEEP SPACE SILENCE // MARS PROXIMITY APPROACHING";
      if (subtitles) subtitles.textContent = "Flight Telemetry: \"Silent cosmic transit. Deep Space Network locked. Mars orbital insertion on schedule.\"";
    }
    // STEP 5: Atmospheric Entry at Mars (28.0s - 35.0s)
    else if (t < 35.0) {
      if (this.prologuePhase < 3) {
        this.prologuePhase = 3;
        if (window.soundSystem) {
          if (window.soundSystem.stopSpaceAmbience) window.soundSystem.stopSpaceAmbience();
          if (window.soundSystem.playReentryPlasmaRoar) window.soundSystem.playReentryPlasmaRoar();
        }
      }

      const reTime = t - 28.0;
      const p = reTime / 7.0;

      // Fiery plasma glow on heat shield
      const plasmaR = THREE.MathUtils.lerp(0.01, 0.85, Math.sin(p * Math.PI));
      const plasmaG = THREE.MathUtils.lerp(0.01, 0.35, Math.sin(p * Math.PI));
      const plasmaB = THREE.MathUtils.lerp(0.02, 0.12, Math.sin(p * Math.PI));
      this.scene.background.setRGB(plasmaR, plasmaG, plasmaB);
      this.scene.fog.color.setRGB(plasmaR, plasmaG, plasmaB);

      // Starship in belly-flop aerodynamic re-entry posture
      if (this.rocketStack) {
        this.rocketStack.position.set(px, 320 - p * 240, pz);
        this.rocketStack.rotation.set(Math.PI * 0.45, 0, Math.sin(t * 12) * 0.04);
      }

      // Aerodynamic flap trimming
      this.aerodynamicFlaps.forEach((flap, idx) => {
        flap.rotation.x = Math.sin(t * 8 + idx) * 0.25;
      });

      const entryShake = Math.sin(t * 45) * 0.08;
      this.camera.position.set(px - 18 + entryShake, 322 - p * 240 + entryShake, pz + 16);
      this.camera.lookAt(px, 320 - p * 240, pz);

      if (camBadge) camBadge.textContent = "📹 CAM 05 // MARTIAN RE-ENTRY PLASMA SHEATH";
      if (hudPhase) hudPhase.textContent = "HYPERSONIC ENTRY // CERAMIC HEAT SHIELD: 1,600°C";
      if (hudStatus) hudStatus.textContent = "ATMOSPHERIC DECELERATION // BELLY-FLOP AERODYNAMIC TRIM";
      if (subtitles) subtitles.textContent = "Automated Nav: \"Entry interface verified. Plasma ionization peak. Preparing landing flip maneuver.\"";
    }
    // STEP 6: Retro-Propulsion Landing Burn & Touchdown on Mars (35.0s - 43.0s)
    else if (t < 43.0) {
      if (this.prologuePhase < 4) {
        this.prologuePhase = 4;
        if (this.spaceSceneGroup) this.spaceSceneGroup.visible = false;
        if (this.skyDome) this.skyDome.visible = true;

        // Reset to Mars daylight atmosphere
        this.scene.background.setHex(0xd25b2a);
        this.scene.fog.color.setHex(0xc85b2e);

        if (window.soundSystem) {
          if (window.soundSystem.playRetroLandingBurn) window.soundSystem.playRetroLandingBurn();
        }
      }

      const landP = (t - 35.0) / 8.0;
      const landY = 80 - Math.pow(landP, 1.4) * 75.2;

      // Rocket flips to vertical landing orientation
      if (this.rocketStack) {
        this.rocketStack.position.set(-18, Math.max(4.8, landY), -12);
        this.rocketStack.rotation.set(0, 0, 0);
      }

      // Starship landing thrusters firing
      this.shipNozzles.forEach(noz => {
        if (noz.children[0]) noz.children[0].visible = landP < 0.85;
      });

      // Ground camera at landing site watching descent
      this.camera.position.set(-8, this.getTerrainHeight(-8, 6) + 2.0, 6);
      this.camera.lookAt(-18, Math.max(4.8, landY) + 6, -12);

      if (camBadge) camBadge.textContent = "📹 CAM 06 // ACIDALIA PLANITIA LANDING ZONE";
      if (hudPhase) hudPhase.textContent = "RETRO-PROPULSION LANDING BURN // FINAL TOUCHDOWN";
      if (hudStatus) hudStatus.textContent = landP >= 0.85 ? "TOUCHDOWN CONFIRMED // ENGINES CUTOFF // WELCOME TO MARS!" : "DESCENDING // RETRO THRUST 100% // RADAR ALTIMETER LOCKED";
      if (subtitles) subtitles.textContent = landP >= 0.85 ?
        "Automated Telemetry: \"Contact light! Touchdown confirmed. Pressurization sealed. You have arrived on Mars.\"" :
        "Automated Nav: \"Altitude 40 meters. Vertical descent velocity 1.8 m/s. Landing gear deployed.\"";
    }
    // STEP 7: Seamless Transition to Mars Surface Gameplay (43.0s+)
    else {
      this.completePrologue();
    }
  }

  completePrologue() {
    this.isPrologueActive = false;
    window.gameState.inCutscene = false;

    const overlay = document.getElementById('rocket-cliffhanger-overlay');
    if (overlay) overlay.classList.add('hidden');

    // Restore Mars daylight scene
    this.scene.background.setHex(0xd25b2a);
    this.scene.fog.color.setHex(0xc85b2e);
    if (this.skyDome) this.skyDome.visible = true;
    if (this.spaceSceneGroup) this.spaceSceneGroup.visible = false;
    if (this.viewModel) this.viewModel.visible = true;

    // Reset rocket stack to landing pad
    if (this.rocketStack) {
      this.rocketStack.position.set(0, 4.8, 0);
      this.rocketStack.rotation.set(0, 0, 0);
    }
    if (this.superHeavyBooster) this.superHeavyBooster.visible = true;
    this.engineFlames.forEach(f => f.visible = false);

    if (window.soundSystem) {
      window.soundSystem.stopRocketRoar(0.1);
    }

    if (this.prologueCallback) {
      this.prologueCallback();
      this.prologueCallback = null;
    }
  }

  // ==========================================
  // FINAL SPACESHIP ESCAPE & TENTACLE CLIFFHANGER
  // ==========================================
  startSpaceshipEscapeCliffhanger() {
    this.isEscapeActive = true;
    this.escapeTime = 0;
    this.escapePhase = 0;
    window.gameState.inCutscene = true;

    if (document.exitPointerLock) document.exitPointerLock();
    if (this.viewModel) this.viewModel.visible = false;

    const overlay = document.getElementById('rocket-cliffhanger-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const blackout = document.getElementById('cliffhanger-blackout');
    if (blackout) blackout.classList.remove('visible');

    // Position Starship for liftoff from Mars landing site
    const lx = -18, lz = -12;
    if (this.spacexStarship) {
      this.spacexStarship.position.set(lx, 4.8, lz);
      this.spacexStarship.rotation.set(0, 0, 0);
    }
    if (this.superHeavyBooster) this.superHeavyBooster.visible = false;

    this.shipNozzles.forEach(noz => {
      if (noz.children[0]) noz.children[0].visible = false;
    });

    if (this.spaceSceneGroup) this.spaceSceneGroup.visible = false;
    if (this.tentacleGroup) this.tentacleGroup.visible = false;
    if (this.cockpitRedAlertLight) this.cockpitRedAlertLight.intensity = 0;

    if (window.soundSystem) {
      window.soundSystem.setWindStorm(false);
      if (window.soundSystem.playCockpitBoot) window.soundSystem.playCockpitBoot();
      if (window.soundSystem.playRaptorIgnition) window.soundSystem.playRaptorIgnition();
    }
  }

  updateSpaceshipEscape(delta) {
    this.escapeTime += delta;
    const t = this.escapeTime;

    const hudStatus = document.getElementById('launch-telemetry-status');
    const hudPhase = document.getElementById('launch-seq-phase');
    const camBadge = document.getElementById('cinematic-cam-badge');
    const subtitles = document.getElementById('cinematic-dialogue-subtitles');

    if (this.marsMesh) this.marsMesh.rotation.y += 0.0015 * delta;
    if (this.earthMesh) this.earthMesh.rotation.y += 0.001 * delta;

    // SCENE 1: The Escape — Liftoff from Mars (0.0s - 8.0s)
    if (t < 8.0) {
      const p = t / 8.0;
      const ascY = 4.8 + Math.pow(p * 8.0, 2.2) * 8.5;

      if (this.spacexStarship) {
        this.spacexStarship.position.y = ascY;
      }
      this.shipNozzles.forEach(noz => {
        if (noz.children[0]) noz.children[0].visible = true;
      });

      // Camera watching Starship rise from Mars plains
      this.camera.position.set(-6, this.getTerrainHeight(-6, 8) + 3.0 + p * 12, 8);
      this.camera.lookAt(-18, ascY * 0.7 + 6, -12);

      if (camBadge) camBadge.textContent = "📹 CAM 01 // ARES STARSHIP ASCENT";
      if (hudPhase) hudPhase.textContent = "MARS ESCAPE TRAJECTORY // RAPTOR PROPULSION NOMINAL";
      if (hudStatus) hudStatus.textContent = "LIFTOFF! RETURNING TO EARTH // 104% RATED THRUST";
      if (subtitles) subtitles.textContent = "Commander Reyes: \"Ascent engines locked. Breaking Mars gravity well. We're going home!\"";
    }
    // SCENE 2: Leaving Mars & Triumph (8.0s - 16.0s)
    else if (t < 16.0) {
      if (this.spaceSceneGroup) this.spaceSceneGroup.visible = true;

      if (this.escapePhase < 1) {
        this.escapePhase = 1;
        if (window.soundSystem) {
          window.soundSystem.updateRocketRoar(0.3, 200);
          window.soundSystem.playEpicCliffhangerMusic();
        }
      }

      const spaceTime = t - 8.0;
      const p = spaceTime / 8.0;

      // Spacecraft positioned in deep space heading towards Earth
      if (this.spacexStarship) {
        this.spacexStarship.position.set(0, 620, 0);
        this.spacexStarship.rotation.set(0.2, 0, Math.sin(t * 0.5) * 0.05);
      }

      // Mars shrinking into the background, Earth visible in distance
      if (this.marsGroup) {
        this.marsGroup.position.set(0, 580, 140 + p * 120);
        this.marsGroup.scale.setScalar(Math.max(0.25, 0.9 - p * 0.5));
      }
      if (this.earthGroup) {
        this.earthGroup.position.set(0, 640, -160 + p * 20);
        this.earthGroup.scale.setScalar(0.7 + p * 0.2);
      }

      // Majestic gliding cinematic camera
      this.camera.position.set(18 - p * 10, 624 + Math.sin(p * Math.PI) * 4, 18 - p * 8);
      this.camera.lookAt(0, 620, 0);

      if (camBadge) camBadge.textContent = "📹 CAM 02 // EARTH RETURN TRANSFER TRAJECTORY";
      if (hudPhase) hudPhase.textContent = "MARTIAN ORBIT ESCAPED // INTERPLANETARY CRUISE";
      if (hudStatus) hudStatus.textContent = "COURSE: HOME // YOU HAVE SURVIVED THE RED PLANET";
      if (subtitles) subtitles.textContent = "Commander Reyes: \"Telemetry confirmed. Mars is behind us. Survival mission accomplished.\"";
    }
    // SCENE 3: The Mysterious Creature Strikes! (16.0s - 25.0s)
    else if (t < 25.0) {
      if (this.escapePhase < 2) {
        this.escapePhase = 2;
        if (this.tentacleGroup) this.tentacleGroup.visible = true;

        if (window.soundSystem) {
          window.soundSystem.stopEpicCliffhangerMusic();
          if (window.soundSystem.playTentacleEmergence) window.soundSystem.playTentacleEmergence();
          if (window.soundSystem.playEmergencyAlarm) window.soundSystem.playEmergencyAlarm(true);
        }
      }

      const strikeTime = t - 16.0;
      const sP = strikeTime / 9.0;

      // Flash cockpit red alert strobe
      if (this.cockpitRedAlertLight) {
        this.cockpitRedAlertLight.intensity = Math.sin(t * 18) > 0 ? 3.5 : 0;
      }

      // Tentacle curls and violently constricts around the Starship
      if (this.tentacleSegments.length > 0) {
        this.tentacleSegments.forEach((seg, idx) => {
          const curlFactor = THREE.MathUtils.lerp(0.02, 0.22, Math.min(1.0, sP * 1.5));
          seg.rotation.z = Math.sin(strikeTime * 3.5 + idx * 0.4) * curlFactor;
          seg.rotation.x = Math.cos(strikeTime * 2.8 + idx * 0.35) * (curlFactor * 0.8);
        });
      }

      // Spaceship violent vibration and off-course tilt under tentacle crushing force
      if (this.spacexStarship) {
        const shudder = Math.sin(t * 35) * 0.25;
        this.spacexStarship.position.set(shudder, 620 - sP * 25, shudder * 0.8);
        this.spacexStarship.rotation.set(0.2 + sP * 0.6, shudder * 0.4, -sP * 0.8);
      }

      if (strikeTime >= 2.2 && this.escapePhase < 3) {
        this.escapePhase = 3;
        if (window.soundSystem) {
          if (window.soundSystem.playTentacleSlam) window.soundSystem.playTentacleSlam();
          if (window.soundSystem.playTentacleConstrict) window.soundSystem.playTentacleConstrict();
          if (window.soundSystem.playTentacleCliffhangerMusic) window.soundSystem.playTentacleCliffhangerMusic();
        }
      }

      // Violent alternating camera cuts between exterior grip and shaking cockpit
      const isCockpitCut = Math.sin(t * 5) > 0.2;
      if (isCockpitCut) {
        // Cockpit interior view
        this.camera.position.set(0, 642 - sP * 25, 2.2);
        this.camera.lookAt(0, 642 - sP * 25, 4.0);
        if (camBadge) camBadge.textContent = "⚠️ CAM 03 // COCKPIT ALARM OVERRIDE";
      } else {
        // Exterior horrifying close-up of tentacle wrapped around hull
        const extShake = Math.sin(t * 50) * 0.35;
        this.camera.position.set(12 + extShake, 624 - sP * 25 + extShake, -10);
        this.camera.lookAt(0, 620 - sP * 25, 0);
        if (camBadge) camBadge.textContent = "⚠️ CAM 04 // EXTERIOR STRUCTURAL FAILURE";
      }

      if (hudPhase) hudPhase.textContent = "⚠️ UNIDENTIFIED MASS DETECTED // STRUCTURAL CRUSHING";
      if (hudStatus) hudStatus.textContent = "HULL BREACH IMMINENT! BEING PULLED DOWN! MAYDAY!";
      if (subtitles) subtitles.textContent = "Commander Reyes: \"WHAT IS THAT?! SOMETHING'S GOT THE SHIP! THE HULL IS BUCKLING— MAYDAY! MAYD—\"";
    }
    // SCENE 4: The Cliffhanger Blackout (25.0s+)
    else {
      if (this.escapePhase < 4) {
        this.escapePhase = 4;
        if (window.soundSystem) {
          window.soundSystem.stopRocketRoar(0.01);
          if (window.soundSystem.stopEmergencyAlarm) window.soundSystem.stopEmergencyAlarm();
        }

        const blackout = document.getElementById('cliffhanger-blackout');
        if (blackout) {
          blackout.classList.add('visible');
        }
      }
    }
  }

  // ==========================================
  // SKIP CINEMATIC CONTROLLER
  // ==========================================
  skipCinematic() {
    if (this.isPrologueActive) {
      this.completePrologue();
    } else if (this.isEscapeActive || this.isCliffhangerActive) {
      if (window.soundSystem) {
        window.soundSystem.stopRocketRoar(0.05);
        if (window.soundSystem.stopEmergencyAlarm) window.soundSystem.stopEmergencyAlarm();
      }
      const blackout = document.getElementById('cliffhanger-blackout');
      if (blackout) blackout.classList.add('visible');
    }
  }

  // Backward compatibility alias
  startRocketLaunchCliffhanger() {
    this.startSpaceshipEscapeCliffhanger();
  }

  resetFromCliffhanger() {
    this.isCliffhangerActive = false;
    this.isEscapeActive = false;
    this.isPrologueActive = false;
    window.gameState.inCutscene = false;

    if (this.viewModel) this.viewModel.visible = true;

    this.scene.background.setHex(0xd25b2a);
    this.scene.fog.color.setHex(0xc85b2e);
    if (this.skyDome) this.skyDome.visible = true;

    if (this.rocketStack) {
      this.rocketStack.position.set(0, 4.8, 0);
      this.rocketStack.rotation.set(0, 0, 0);
    }
    if (this.spacexStarship) {
      this.spacexStarship.position.set(0, 49, 0);
      this.spacexStarship.rotation.set(0, 0, 0);
    }
    if (this.superHeavyBooster) this.superHeavyBooster.visible = true;
    this.engineFlames.forEach(f => f.visible = false);
    if (this.rocketPointLight) this.rocketPointLight.intensity = 0;
    if (this.spaceSceneGroup) this.spaceSceneGroup.visible = false;
    if (this.tentacleGroup) this.tentacleGroup.visible = false;
  }

  updateEnvironmentAnimations(delta) {
    if (this.cloudDome) {
      this.cloudDome.rotation.y += 0.0003 * delta;
    }

    if (this.astronautsGroup && this.astronautsGroup.children.length > 0) {
      const time = this.clock ? this.clock.getElapsedTime() : 0;
      this.astronautsGroup.children.forEach((astro, idx) => {
        astro.rotation.y += Math.sin(time * 0.8 + idx) * 0.0008;
      });
    }

    if (this.cryoVaporParticles && !this.isCliffhangerActive) {
      this.cryoVaporParticles.rotation.y += 0.4 * delta;
    }
  }

  // ==========================================
  // DUST STORM PARTICLE SYSTEM
  // ==========================================
  setupDustParticles() {
    const count = this.stormParticleCount;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;

      velocities[i * 3] = -8 - Math.random() * 12;
      velocities[i * 3 + 1] = -0.5 - Math.random() * 1.5;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleVelocities = velocities;

    const mat = new THREE.PointsMaterial({
      color: 0xc87042,
      size: 0.18,
      transparent: true,
      opacity: 0.4,
      blending: THREE.NormalBlending
    });

    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  updateDustParticles(delta, isStorm) {
    if (!this.dustParticles) return;
    const positions = this.dustParticles.geometry.attributes.position.array;
    const velocities = this.particleVelocities;
    const speedMult = isStorm ? 3.0 : 0.6;

    for (let i = 0; i < this.stormParticleCount; i++) {
      positions[i * 3] += velocities[i * 3] * speedMult * delta;
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      if (positions[i * 3] < this.position.x - 70) positions[i * 3] = this.position.x + 70;
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 22;
      if (positions[i * 3 + 2] < this.position.z - 70) positions[i * 3 + 2] = this.position.z + 70;
      if (positions[i * 3 + 2] > this.position.z + 70) positions[i * 3 + 2] = this.position.z - 70;
    }

    this.dustParticles.geometry.attributes.position.needsUpdate = true;
    this.dustParticles.material.opacity = isStorm ? 0.75 : 0.25;
    this.dustParticles.material.size = isStorm ? 0.32 : 0.15;
  }

  // ==========================================
  // LEVEL ARCHITECTURE: PROPS & STATIONS
  // ==========================================
  buildMissionWorld(missionId) {
    this.interactables.forEach(item => {
      if (item.mesh && item.mesh.parent) {
        item.mesh.parent.remove(item.mesh);
      }
    });
    this.interactables = [];
    this.colliders = this.colliders.filter(c => c.type === 'sphere');

    this.buildCrashSite();
    this.buildHabitatAlpha();
    this.buildSolarFarm();
    this.buildWaterPlant();
    this.buildRelayRidge();
    this.buildMaintenanceRover(missionId === 4);

    // Ensure persistent Mars research colony, astronauts and rocket launch complex
    if (!this.colonyGroup || !this.colonyGroup.parent) this.buildColonyComplex();
    if (!this.astronautsGroup || !this.astronautsGroup.parent) this.buildAstronautExplorers();
    if (!this.rocketComplex || !this.rocketComplex.parent) this.buildRocketLaunchComplex();

    this.applyMissionAtmosphere(missionId);
    this.spawnMissionItems(missionId);
  }

  applyMissionAtmosphere(missionId) {
    if (missionId === 4) {
      this.isStormActive = true;
      this.scene.fog.color.setHex(0x732912);
      this.scene.fog.density = 0.045;
      this.scene.background.setHex(0x732912);
      this.ambientLight.color.setHex(0xaa4422);
      this.ambientLight.intensity = 0.5;
      this.sunLight.intensity = 0.3;
    } else if (missionId === 5) {
      this.isStormActive = false;
      this.scene.fog.color.setHex(0x2a1420);
      this.scene.fog.density = 0.012;
      this.scene.background.setHex(0x1a0a14);
      this.ambientLight.color.setHex(0x553344);
      this.ambientLight.intensity = 0.45;
      this.sunLight.color.setHex(0xdd6644);
      this.sunLight.intensity = 0.6;
      this.sunLight.position.set(-150, 20, 80);
    } else {
      this.isStormActive = false;
      this.scene.fog.color.setHex(0xc85b2e);
      this.scene.fog.density = 0.0095;
      this.scene.background.setHex(0xd25b2a);
      this.ambientLight.color.setHex(0xcc5528);
      this.ambientLight.intensity = 0.65;
      this.sunLight.intensity = 1.6;
      this.sunLight.position.set(160, 95, -120);
    }
  }

  buildCrashSite() {
    const group = new THREE.Group();
    const cx = -18, cz = -12;
    const cy = this.getTerrainHeight(cx, cz);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe6ecf2, metalness: 0.95, roughness: 0.16 });
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: 0.7, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22242a, metalness: 0.9, roughness: 0.25 });

    // Starship Standing Upright on Mars Landing Legs
    const shipHeight = 28;
    const shipRadius = 2.8;

    const shipGeo = new THREE.CylinderGeometry(shipRadius, shipRadius, 18, 32);
    const shipBody = new THREE.Mesh(shipGeo, steelMat);
    shipBody.position.set(cx, cy + 12, cz);
    shipBody.castShadow = true;
    group.add(shipBody);

    const heatGeo = new THREE.CylinderGeometry(shipRadius + 0.03, shipRadius + 0.03, 18, 32, 1, false, -Math.PI * 0.5, Math.PI);
    const heatBody = new THREE.Mesh(heatGeo, tileMat);
    heatBody.position.set(cx, cy + 12, cz);
    group.add(heatBody);

    const noseGeo = new THREE.ConeGeometry(shipRadius, 10, 32);
    const nose = new THREE.Mesh(noseGeo, steelMat);
    nose.position.set(cx, cy + 26, cz);
    nose.castShadow = true;
    group.add(nose);

    // Aerodynamic flaps
    [-1, 1].forEach(side => {
      const fGeo = new THREE.BoxGeometry(0.12, 5.0, 2.2);
      const flap = new THREE.Mesh(fGeo, side < 0 ? tileMat : steelMat);
      flap.position.set(cx + side * 3.8, cy + 7, cz);
      group.add(flap);
    });

    // 6 Hydraulic Landing Leg Struts
    for (let l = 0; l < 6; l++) {
      const ang = (l / 6) * Math.PI * 2;
      const legGroup = new THREE.Group();
      legGroup.position.set(cx + Math.sin(ang) * 2.6, cy + 3.2, cz + Math.cos(ang) * 2.6);
      legGroup.rotation.y = ang;

      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 12), darkMat);
      strut.rotation.z = 0.35;
      strut.position.set(0.7, -1.8, 0);
      legGroup.add(strut);

      const footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.15, 12), steelMat);
      footPad.position.set(1.4, -3.2, 0);
      legGroup.add(footPad);
      group.add(legGroup);
    }

    // Boarding Ramp & Crew Airlock
    const rampGeo = new THREE.BoxGeometry(1.6, 0.15, 6.5);
    const ramp = new THREE.Mesh(rampGeo, darkMat);
    ramp.rotation.x = -0.32;
    ramp.position.set(cx, cy + 1.2, cz + 4.2);
    group.add(ramp);

    // Departure Escape Console at base of ramp
    const escapeConsoleGeo = new THREE.BoxGeometry(0.6, 1.2, 0.5);
    const escapeConsole = new THREE.Mesh(escapeConsoleGeo, new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x006688,
      emissiveIntensity: 0.5,
      metalness: 0.8
    }));
    escapeConsole.position.set(cx + 1.8, cy + 0.6, cz + 6.8);
    group.add(escapeConsole);

    this.scene.add(group);

    // Register Escape Departure Console Interaction
    this.interactables.push({
      type: 'escape_console',
      label: '[E] Enter Ares Starship & Initiate Escape',
      mesh: escapeConsole,
      x: cx + 1.8,
      y: cy + 0.6,
      z: cz + 6.8,
      callback: () => {
        if (window.soundSystem) {
          if (window.soundSystem.playSpaceshipDoor) window.soundSystem.playSpaceshipDoor();
          else window.soundSystem.playAirlock();
        }
        if (window.uiManager) {
          window.uiManager.showBanner("🚀 BOARDING ARES STARSHIP // PREPARING DEPARTURE...");
        }
        setTimeout(() => {
          this.startSpaceshipEscapeCliffhanger();
        }, 1200);
      }
    });

    this.colliders.push({
      type: 'box',
      minX: cx - 5.5,
      maxX: cx + 5.5,
      minZ: cz - 5.5,
      maxZ: cz + 7.5
    });
  }

  buildHabitatAlpha() {
    const group = new THREE.Group();
    const hx = 0, hz = 25;
    const hy = this.getTerrainHeight(hx, hz);

    const domeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.2, roughness: 0.4 });
    const domeGeo = new THREE.SphereGeometry(11, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(hx, hy, hz);
    dome.castShadow = true;
    dome.receiveShadow = true;
    group.add(dome);

    const tunnelGeo = new THREE.CylinderGeometry(2.1, 2.1, 6.5, 16);
    const tunnelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.5 });
    const tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.set(hx, hy + 1.9, hz - 11);
    tunnel.castShadow = true;
    group.add(tunnel);

    const doorFrameGeo = new THREE.BoxGeometry(2.8, 3.2, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
    doorFrame.position.set(hx, hy + 1.9, hz - 14.2);
    group.add(doorFrame);

    const doorGeo = new THREE.BoxGeometry(2.2, 2.7, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xd9531e, metalness: 0.4, roughness: 0.4 });
    this.airlockDoorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.airlockDoorMesh.position.set(hx, hy + 1.9, hz - 14.1);
    this.airlockDoorMesh.opened = false;
    group.add(this.airlockDoorMesh);

    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(hx, hy + 11.5, hz);
    group.add(beacon);

    this.scene.add(group);

    this.colliders.push({
      type: 'sphere',
      x: hx,
      z: hz,
      radius: 10.5
    });
  }

  buildSolarFarm() {
    const group = new THREE.Group();
    const sx = 45, sz = 22;
    const sy = this.getTerrainHeight(sx, sz);

    this.solarPanels = [];
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x112244, metalness: 0.9, roughness: 0.2 });
    const standMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });

    for (let i = 0; i < 3; i++) {
      const px = sx + (i - 1) * 9;
      const pz = sz;
      const py = this.getTerrainHeight(px, pz);

      const tableGroup = new THREE.Group();
      tableGroup.position.set(px, py, pz);

      const mastGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.4, 8);
      const mast = new THREE.Mesh(mastGeo, standMat);
      mast.position.y = 1.2;
      tableGroup.add(mast);

      const pGeo = new THREE.BoxGeometry(4.8, 0.12, 2.6);
      const panel = new THREE.Mesh(pGeo, panelMat.clone());
      panel.position.set(0, 2.4, 0);
      panel.rotation.x = -Math.PI / 4;
      panel.castShadow = true;
      tableGroup.add(panel);

      group.add(tableGroup);
      this.solarPanels.push(panel);
    }

    const boxGeo = new THREE.BoxGeometry(1.6, 2.2, 1.2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xddaa22, metalness: 0.6, roughness: 0.4 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(sx + 15, sy + 1.1, sz - 2);
    box.castShadow = true;
    group.add(box);

    this.scene.add(group);
  }

  buildWaterPlant() {
    const group = new THREE.Group();
    const wx = -35, wz = 40;
    const wy = this.getTerrainHeight(wx, wz);

    const hatchGeo = new THREE.BoxGeometry(4.5, 1.8, 4.5);
    const hatchMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(wx, wy + 0.9, wz);
    hatch.castShadow = true;
    group.add(hatch);

    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3388bb, metalness: 0.8, roughness: 0.3 });
    const p1Geo = new THREE.CylinderGeometry(0.25, 0.25, 6, 12);
    const p1 = new THREE.Mesh(p1Geo, pipeMat);
    p1.rotation.z = Math.PI / 2;
    p1.position.set(wx, wy + 1.9, wz - 1.2);
    group.add(p1);

    this.scene.add(group);

    this.colliders.push({
      type: 'box',
      minX: wx - 2.5,
      maxX: wx + 2.5,
      minZ: wz - 2.5,
      maxZ: wz + 2.5
    });
  }

  buildRelayRidge() {
    const group = new THREE.Group();
    const rx = 85, rz = -15;
    const ry = this.getTerrainHeight(rx, rz);

    const towerGeo = new THREE.CylinderGeometry(0.9, 1.6, 9, 6);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(rx, ry + 4.5, rz);
    tower.castShadow = true;
    group.add(tower);

    const dishGeo = new THREE.SphereGeometry(4.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3 });
    this.relayDishMesh = new THREE.Mesh(dishGeo, dishMat);
    this.relayDishMesh.position.set(rx, ry + 9.5, rz);
    this.relayDishMesh.rotation.x = Math.PI / 3;
    this.relayDishMesh.castShadow = true;
    group.add(this.relayDishMesh);

    const hornGeo = new THREE.CylinderGeometry(0.12, 0.3, 2.2, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xcc9900, metalness: 0.9 });
    const horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(0, 1.8, 0);
    this.relayDishMesh.add(horn);

    const shedGeo = new THREE.BoxGeometry(3.5, 2.5, 3.5);
    const shedMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.6 });
    const shed = new THREE.Mesh(shedGeo, shedMat);
    shed.position.set(rx - 6, ry + 1.25, rz + 4);
    group.add(shed);

    this.scene.add(group);

    this.colliders.push({
      type: 'box',
      minX: rx - 8,
      maxX: rx + 3,
      minZ: rz - 3,
      maxZ: rz + 7
    });
  }

  buildMaintenanceRover(active) {
    if (this.rover) {
      this.scene.remove(this.rover);
      this.rover = null;
    }
    if (!active) return;

    this.rover = new THREE.Group();
    const rx = 35, rz = 20;
    const ry = this.getTerrainHeight(rx, rz);
    this.rover.position.set(rx, ry, rz);

    const bodyGeo = new THREE.BoxGeometry(2.4, 1.1, 3.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc8800, metalness: 0.6, roughness: 0.5 });
    const chassis = new THREE.Mesh(bodyGeo, bodyMat);
    chassis.position.y = 1.0;
    chassis.castShadow = true;
    this.rover.add(chassis);

    const stripeGeo = new THREE.BoxGeometry(2.42, 0.25, 3.62);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.1;
    this.rover.add(stripe);

    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    for (let s = -1; s <= 1; s += 2) {
      for (let w = -1; w <= 1; w++) {
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 14);
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(s * 1.4, 0.5, w * 1.3);
        wheel.castShadow = true;
        this.rover.add(wheel);
      }
    }

    const beaconGeo = new THREE.SphereGeometry(0.2, 12, 12);
    this.roverBeaconMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    this.roverBeacon = new THREE.Mesh(beaconGeo, this.roverBeaconMat);
    this.roverBeacon.position.set(0, 1.8, -0.6);
    this.rover.add(this.roverBeacon);

    this.roverSpotlight = new THREE.SpotLight(0xff3300, 3.5, 32, Math.PI / 4, 0.3, 1.5);
    this.roverSpotlight.position.set(0, 1.5, 1.6);
    this.roverSpotlightTarget = new THREE.Object3D();
    this.roverSpotlightTarget.position.set(0, 0, 18);
    this.rover.add(this.roverSpotlightTarget);
    this.roverSpotlight.target = this.roverSpotlightTarget;
    this.rover.add(this.roverSpotlight);

    this.scene.add(this.rover);
  }

  // ==========================================
  // SPAWN MISSION-SPECIFIC INTERACTABLES
  // ==========================================
  spawnMissionItems(missionId) {
    const addInteractable = (type, itemId, label, x, z, yOffset, mesh, callback) => {
      const y = this.getTerrainHeight(x, z) + yOffset;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.scene.add(mesh);

      const itemRecord = {
        type: type,
        itemId: itemId,
        label: label,
        mesh: mesh,
        x: x,
        y: y,
        z: z,
        callback: callback,
        completed: false
      };
      this.interactables.push(itemRecord);
      return itemRecord;
    };

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x336699, metalness: 0.5, roughness: 0.4 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xdd6622, metalness: 0.3, roughness: 0.6 });

    if (missionId === 1) {
      // 1. Mission Flight Terminal (Flight Data Recorder)
      const terminalGeo = new THREE.BoxGeometry(0.8, 1.4, 0.5);
      const terminalMesh = new THREE.Mesh(terminalGeo, boxMat);
      addInteractable('terminal', 'keycard_hab', '[E] Access Flight Terminal for Security Keycard', -19, -12, 0.7, terminalMesh, () => {
        if (!window.gameState.hasItem('keycard_hab')) {
          window.gameState.addItem('keycard_hab');
          window.gameState.completeObjective('find_keycard');
          if (window.soundSystem) window.soundSystem.playRadioBeep();
          if (window.uiManager) window.uiManager.showBanner("💳 HABITAT ALPHA SECURITY KEYCARD ACQUIRED FROM TERMINAL!");
        } else {
          if (window.uiManager) window.uiManager.showBanner("💳 Flight Terminal already retrieved: Habitat Alpha Keycard.");
        }
      });

      // 2. Habitat Alpha Airlock Door
      const airlockSensor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      addInteractable('door', null, '[E] Cycle Habitat Alpha Airlock', 0, 11, 1.8, airlockSensor, () => {
        if (this.airlockDoorMesh && this.airlockDoorMesh.opened) {
          if (window.uiManager) window.uiManager.showBanner("🚪 Airlock already equalized and open.");
          return;
        }
        if (window.gameState.hasItem('keycard_hab')) {
          if (window.soundSystem) window.soundSystem.playAirlock();
          window.gameState.completeObjective('reach_hab');
          if (this.airlockDoorMesh) {
            this.airlockDoorMesh.opened = true;
            this.airlockDoorMesh.position.x += 1.8;
          }
          if (window.uiManager) window.uiManager.showBanner("🚪 AIRLOCK CYCLING... EQUALIZING PRESSURE (101.3 kPa).");
        } else {
          if (window.uiManager) window.uiManager.showBanner("⚠️ Airlock Locked! Requires Habitat Alpha Security Keycard from spacecraft wreckage.");
        }
      });
    } else if (missionId === 2) {
      // 1. Tool Locker
      const toolBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), boxMat);
      addInteractable('pickup', 'pv_calibrator', '[E] Search Exterior Tool Locker', 12, 18, 0.4, toolBox, () => {
        window.gameState.addItem('pv_calibrator');
        window.gameState.addItem('cleaning_brush');
        window.gameState.completeObjective('find_solar_tools');
        if (window.uiManager) window.uiManager.showBanner("📟 PHOTOVOLTAIC CALIBRATOR & 🧹 DUST BRUSH ACQUIRED!");
      });

      // 2. Research Trailer Fuse
      const trailerRack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.5), crateMat);
      addInteractable('pickup', 'junction_fuse', '[E] Search Research Trailer Spares Rack', 22, 34, 0.6, trailerRack, () => {
        window.gameState.addItem('junction_fuse');
        window.gameState.completeObjective('find_fuse');
        if (window.uiManager) window.uiManager.showBanner("⚡ 480V SILICON JUNCTION FUSE ACQUIRED!");
      });

      // 3. Clean 3 Solar Panels
      const sx = 45, sz = 22;
      for (let i = 0; i < 3; i++) {
        const px = sx + (i - 1) * 9;
        const pz = sz;
        const sensor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), new THREE.MeshBasicMaterial({ color: 0x994411 }));
        const panelRecord = addInteractable('panel', null, `[E] Clean Solar Table ${i + 1} with Dust Brush`, px, pz - 1.2, 1.2, sensor, () => {
          if (panelRecord.completed) {
            if (window.uiManager) window.uiManager.showBanner(`Solar Table ${i + 1} already cleaned.`);
            return;
          }
          if (window.gameState.hasItem('cleaning_brush')) {
            panelRecord.completed = true;
            panelRecord.label = `[Solar Table ${i + 1}: Clean & Operational]`;
            window.gameState.incrementObjective('clean_panels');
            if (this.solarPanels[i]) {
              this.solarPanels[i].material.color.setHex(0x1166dd);
            }
            if (window.uiManager) window.uiManager.showBanner(`✨ Solar Panel ${i + 1} cleaned! Dust attenuation removed.`);
          } else {
            if (window.uiManager) window.uiManager.showBanner("⚠️ Requires Electrostatic Dust Brush from Tool Locker!");
          }
        });
      }

      // 4. Solar Substation Power Junction
      const junctionSensor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      addInteractable('puzzle_solar', null, '[E] Open 480V Solar Power Junction Box', sx + 15, sz - 2, 1.8, junctionSensor, () => {
        if (window.puzzleManager) window.puzzleManager.openSolarPuzzle();
      });
    } else if (missionId === 3) {
      // 1. Engineering Rack: Hydraulic Wrench
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.5), boxMat);
      addInteractable('pickup', 'hydraulic_wrench', '[E] Take Torque Hydraulic Wrench', 6, 26, 0.8, rack, () => {
        window.gameState.addItem('hydraulic_wrench');
        window.gameState.completeObjective('find_wrench');
        if (window.uiManager) window.uiManager.showBanner("🔧 TORQUE HYDRAULIC WRENCH ACQUIRED!");
      });

      // 2. Parts Bin: Ceramic Sub-Micron Filter
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), crateMat);
      addInteractable('pickup', 'ceramic_filter', '[E] Retrieve ECLSS Ceramic Filter', -6, 28, 0.4, bin, () => {
        window.gameState.addItem('ceramic_filter');
        window.gameState.completeObjective('find_filter');
        if (window.uiManager) window.uiManager.showBanner("🧪 ECLSS CERAMIC SUB-MICRON FILTER ACQUIRED!");
      });

      // 3. Subsurface Water Recovery Facility Vault
      const wx = -35, wz = 40;
      const vaultDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x0088cc }));
      addInteractable('puzzle_water', null, '[E] Enter ECLSS Water Recovery Vault', wx, wz - 2.2, 1.0, vaultDoor, () => {
        window.gameState.completeObjective('descend_plant');
        if (window.puzzleManager) window.puzzleManager.openWaterPuzzle();
      });
    } else if (missionId === 4) {
      // 1. Generator Hurricane Latches
      const genMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x555555 }));
      const genRecord = addInteractable('generator', null, '[E] Lock Generator Hurricane Latches', 55, -8, 0.8, genMesh, () => {
        if (genRecord.completed) {
          if (window.uiManager) window.uiManager.showBanner("Generator hurricane latches already secured.");
          return;
        }
        genRecord.completed = true;
        genRecord.label = "[Generator: Latches Secured]";
        window.gameState.completeObjective('secure_generator');
        if (window.uiManager) window.uiManager.showBanner("🔒 BACKUP GENERATOR HURRICANE LATCHES SECURED!");
      });

      // 2. Three Guidance Route Beacons
      const beaconCoords = [
        { x: 42, z: 5, label: "Beacon Alpha" },
        { x: 26, z: 12, label: "Beacon Beta" },
        { x: 10, z: 18, label: "Beacon Gamma" }
      ];

      beaconCoords.forEach(b => {
        const beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.8, 8), new THREE.MeshBasicMaterial({ color: 0xff3300 }));
        const beaconRecord = addInteractable('beacon', null, `[E] Activate Route ${b.label}`, b.x, b.z, 0.9, beaconMesh, () => {
          if (beaconRecord.completed) {
            if (window.uiManager) window.uiManager.showBanner(`${b.label} already online.`);
            return;
          }
          beaconRecord.completed = true;
          beaconRecord.label = `[${b.label}: Active]`;
          beaconMesh.material.color.setHex(0x00ff66);
          window.gameState.incrementObjective('activate_beacons');
          if (window.uiManager) window.uiManager.showBanner(`📡 ${b.label} online! Nav guidance triangulated.`);
        });
      });

      // 3. Hab Storm Bulkheads
      const stormBulkhead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      addInteractable('door', null, '[E] Seal Habitat Storm Bulkheads', 0, 11, 1.8, stormBulkhead, () => {
        const beaconsDone = window.gameState.missionObjectives.find(o => o.id === 'activate_beacons')?.completed;
        const genDone = window.gameState.missionObjectives.find(o => o.id === 'secure_generator')?.completed;
        if (beaconsDone && genDone) {
          window.gameState.completeObjective('avoid_rover');
          window.gameState.completeObjective('reach_shelter');
          if (window.uiManager) window.uiManager.showBanner("🚪 STORM BULKHEADS SEALED! Habitat protected.");
        } else {
          if (window.uiManager) window.uiManager.showBanner("⚠️ Secure the generator and activate all 3 route beacons first!");
        }
      });
    } else if (missionId === 5) {
      // 1. Relay Shed Parts
      const relayBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), crateMat);
      addInteractable('pickup', 'kband_transponder', '[E] Search Relay Storage Locker', 79, -11, 0.4, relayBox, () => {
        window.gameState.addItem('kband_transponder');
        window.gameState.addItem('cryo_amp');
        window.gameState.completeObjective('find_relay_parts');
        if (window.uiManager) window.uiManager.showBanner("📡 K-BAND TRANSPONDER & 💾 CRYO AMPLIFIER ACQUIRED!");
      });

      // 2. Parabolic Dish Platform Terminal
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), boxMat);
      const rx = 85, rz = -15;
      addInteractable('puzzle_relay', null, '[E] Access Deep Space Dish Tracking Terminal', rx, rz - 2.5, 1.2, terminal, () => {
        window.gameState.completeObjective('climb_ridge');
        if (window.puzzleManager) window.puzzleManager.openRelayPuzzle();
      });
    }
  }

  // ==========================================
  // INPUT & CONTROLS SETUP
  // ==========================================
  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Handle Escape with smart modal stack priority
      if (e.code === 'Escape') {
        if (window.uiManager) window.uiManager.handleEscapeKey();
        return;
      }

      // Ignore gameplay action hotkeys if paused or in cutscene
      if (window.gameState.isPaused || window.gameState.inCutscene) return;

      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }
      if (e.code === 'Tab') {
        e.preventDefault();
        if (window.uiManager) window.uiManager.toggleInventory();
      }
      if (e.code === 'KeyM') {
        e.preventDefault();
        if (window.uiManager) window.uiManager.toggleMap();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
    });

    // Pointer Lock for First-Person Mouse Look
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (!this.isPointerLocked && !window.gameState.isPaused && !window.gameState.inCutscene) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || window.gameState.isPaused || window.gameState.inCutscene) return;

      const sens = GAME_SETTINGS.mouseSensitivity || 0.0022;
      const invert = GAME_SETTINGS.invertY ? -1 : 1;

      this.euler.y -= e.movementX * sens;
      this.euler.x -= e.movementY * sens * invert;
      this.euler.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.euler.x));

      this.camera.quaternion.setFromEuler(this.euler);
    });
  }

  toggleFlashlight() {
    if (!this.flashlight) return;
    this.flashlight.visible = !this.flashlight.visible;
    window.gameState.flashlightOn = this.flashlight.visible;
    if (window.soundSystem) window.soundSystem.playFlashlight();
  }

  // ==========================================
  // RAYCASTING & INTERACTION EXECUTION
  // ==========================================
  updateRaycasting() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes = this.interactables.map(i => i.mesh).filter(Boolean);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    const promptElem = document.getElementById('interaction-prompt');

    if (intersects.length > 0) {
      const hit = intersects[0];
      const item = this.interactables.find(it => {
        let cur = hit.object;
        while (cur) {
          if (cur === it.mesh) return true;
          cur = cur.parent;
        }
        return false;
      });

      if (item && hit.distance <= 3.8) {
        this.hoveredObject = item;
        if (promptElem) {
          promptElem.textContent = item.label;
          promptElem.classList.remove('hidden');
        }
        return;
      }
    }

    this.hoveredObject = null;
    if (promptElem) {
      promptElem.classList.add('hidden');
    }
  }

  triggerInteraction() {
    if (!this.hoveredObject || window.gameState.isPaused) return;

    this.reachTimer = 0.35;

    const obj = this.hoveredObject;
    if (obj.callback) {
      obj.callback();
      if (obj.type === 'pickup' || obj.type === 'crate') {
        if (obj.mesh && obj.mesh.parent) {
          obj.mesh.parent.remove(obj.mesh);
        }
        const idx = this.interactables.indexOf(obj);
        if (idx !== -1) this.interactables.splice(idx, 1);
        this.hoveredObject = null;
      }
    }
  }

  // ==========================================
  // PHYSICS, ROVER AI & FRAME UPDATE LOOP
  // ==========================================
  update(delta) {
    if (this.isPrologueActive) {
      this.updatePrologue(delta);
      return;
    }
    if (this.isEscapeActive) {
      this.updateSpaceshipEscape(delta);
      return;
    }
    if (this.isCliffhangerActive) {
      this.updateCliffhanger(delta);
      return;
    }
    if (window.gameState.isPaused || window.gameState.inCutscene) return;

    this.updatePlayerMovement(delta);
    this.updateViewModel(delta);
    this.updateRoverAI(delta);
    this.updateDustParticles(delta, this.isStormActive);
    this.updateCarbonBoxes(delta);
    this.updateRaycasting();
    this.updateEnvironmentAnimations(delta);

    // Check if player is outdoors vs inside Habitat safe haven
    const distToHab = Math.hypot(this.position.x, this.position.z - 25);
    const isOutdoors = distToHab > 9.5;

    window.gameState.updateResources(delta, isOutdoors);
  }

  updatePlayerMovement(delta) {
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    window.gameState.isSprinting = isSprinting;
    const speed = isSprinting ? 7.2 : 4.2;

    const moveVector = new THREE.Vector3(0, 0, 0);
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyEuler(new THREE.Euler(0, this.euler.y, 0));

      const targetVx = moveVector.x * speed;
      const targetVz = moveVector.z * speed;
      this.velocity.x += (targetVx - this.velocity.x) * 12 * delta;
      this.velocity.z += (targetVz - this.velocity.z) * 12 * delta;

      this.bobTimer += delta * (isSprinting ? 12 : 7.5);
      if (Math.sin(this.bobTimer) > 0.95 && !this.playedStep) {
        this.playedStep = true;
        const distToHab = Math.hypot(this.position.x, this.position.z - 25);
        const surface = distToHab < 9.5 ? 'metal' : 'dirt';
        if (window.soundSystem) window.soundSystem.playFootstep(surface);
      } else if (Math.sin(this.bobTimer) <= 0.8) {
        this.playedStep = false;
      }
    } else {
      this.velocity.x += (0 - this.velocity.x) * 14 * delta;
      this.velocity.z += (0 - this.velocity.z) * 14 * delta;
    }

    // 0.38g Low Martian Gravity Jump
    const martianGravity = 9.8 * 0.38;
    this.velocity.y -= martianGravity * delta;

    if (this.keys['Space'] && this.isGrounded) {
      this.velocity.y = 5.2;
      this.isGrounded = false;
    }

    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextY = this.position.y + this.velocity.y * delta;

    // Axis-independent collision detection
    let canMoveX = true;
    for (const c of this.colliders) {
      if (c.type === 'sphere') {
        const d = Math.hypot(nextX - c.x, this.position.z - c.z);
        if (d < c.radius + this.playerRadius) {
          const curD = Math.hypot(this.position.x - c.x, this.position.z - c.z);
          if (d <= curD) {
            canMoveX = false;
            break;
          }
        }
      } else if (c.type === 'box') {
        const inX = nextX >= c.minX - this.playerRadius && nextX <= c.maxX + this.playerRadius;
        const inZ = this.position.z >= c.minZ - this.playerRadius && this.position.z <= c.maxZ + this.playerRadius;
        if (inX && inZ) {
          const centerX = (c.minX + c.maxX) / 2;
          const curDistX = Math.abs(this.position.x - centerX);
          const nextDistX = Math.abs(nextX - centerX);
          if (nextDistX <= curDistX) {
            canMoveX = false;
            break;
          }
        }
      }
    }

    let canMoveZ = true;
    for (const c of this.colliders) {
      if (c.type === 'sphere') {
        const d = Math.hypot(this.position.x - c.x, nextZ - c.z);
        if (d < c.radius + this.playerRadius) {
          const curD = Math.hypot(this.position.x - c.x, this.position.z - c.z);
          if (d <= curD) {
            canMoveZ = false;
            break;
          }
        }
      } else if (c.type === 'box') {
        const inX = this.position.x >= c.minX - this.playerRadius && this.position.x <= c.maxX + this.playerRadius;
        const inZ = nextZ >= c.minZ - this.playerRadius && nextZ <= c.maxZ + this.playerRadius;
        if (inX && inZ) {
          const centerZ = (c.minZ + c.maxZ) / 2;
          const curDistZ = Math.abs(this.position.z - centerZ);
          const nextDistZ = Math.abs(nextZ - centerZ);
          if (nextDistZ <= curDistZ) {
            canMoveZ = false;
            break;
          }
        }
      }
    }

    if (canMoveX) this.position.x = nextX;
    if (canMoveZ) this.position.z = nextZ;

    const groundY = this.getTerrainHeight(this.position.x, this.position.z) + this.playerHeight;
    if (nextY <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      this.isGrounded = false;
    }

    this.camera.position.copy(this.position);
  }

  updateViewModel(delta) {
    if (!this.viewModel) return;

    const bobX = Math.cos(this.bobTimer * 0.5) * 0.012;
    const bobY = Math.abs(Math.sin(this.bobTimer)) * -0.018;

    this.leftHand.position.x = -0.28 + bobX;
    this.leftHand.position.y = -0.28 + bobY;

    this.rightHand.position.x = 0.28 - bobX;
    this.rightHand.position.y = -0.28 + bobY;

    if (this.reachTimer > 0) {
      this.reachTimer -= delta;
      const reachProgress = Math.sin((1 - this.reachTimer / 0.35) * Math.PI);
      this.rightHand.position.z = -0.45 + reachProgress * 0.16;
    } else {
      this.rightHand.position.z = -0.45;
    }
  }

  updateRoverAI(delta) {
    if (!this.rover) return;

    const wp = this.roverWaypoints[this.roverCurrentWp];
    const dx = wp.x - this.rover.position.x;
    const dz = wp.z - this.rover.position.z;
    const distToWp = Math.hypot(dx, dz);

    if (distToWp < 2.0) {
      this.roverCurrentWp = (this.roverCurrentWp + 1) % this.roverWaypoints.length;
    } else {
      const angle = Math.atan2(dx, dz);
      this.rover.rotation.y = angle;
      this.rover.position.x += Math.sin(angle) * this.roverSpeed * delta;
      this.rover.position.z += Math.cos(angle) * this.roverSpeed * delta;
      this.rover.position.y = this.getTerrainHeight(this.rover.position.x, this.rover.position.z);
    }

    if (this.roverBeaconMat) {
      const blink = Math.sin(this.clock.getElapsedTime() * 10) > 0;
      this.roverBeaconMat.color.setHex(blink ? 0xff2200 : 0x440000);
    }

    const toPlayerX = this.position.x - this.rover.position.x;
    const toPlayerZ = this.position.z - this.rover.position.z;
    const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

    const forwardX = Math.sin(this.rover.rotation.y);
    const forwardZ = Math.cos(this.rover.rotation.y);
    const dot = (toPlayerX * forwardX + toPlayerZ * forwardZ) / Math.max(1, distToPlayer);

    let isCovered = false;
    for (const c of this.colliders) {
      if (c.type === 'sphere') {
        const dRoverRock = Math.hypot(c.x - this.rover.position.x, c.z - this.rover.position.z);
        const dPlayerRock = Math.hypot(this.position.x - c.x, this.position.z - c.z);
        if (dRoverRock + dPlayerRock < distToPlayer + 1.2) {
          isCovered = true;
          break;
        }
      }
    }

    const isInLightCone = (distToPlayer < 24 && dot > 0.65 && !isCovered);
    const isAlerted = isInLightCone;

    window.gameState.roverState.distanceToPlayer = distToPlayer;
    window.gameState.roverState.isAlerted = isAlerted;
    if (window.soundSystem) {
      window.soundSystem.updateRoverSound(distToPlayer, isAlerted);
    }

    const alertBanner = document.getElementById('rover-detection-warning');
    if (alertBanner) {
      if (isAlerted) {
        alertBanner.classList.remove('hidden');
        if (window.soundSystem && Math.random() < 0.05) window.soundSystem.playRoverAlarm();
      } else {
        alertBanner.classList.add('hidden');
      }
    }

    if (isAlerted && distToPlayer < 6.5) {
      if (window.soundSystem) window.soundSystem.playSpark();
      window.gameState.resources.energy = Math.max(15, window.gameState.resources.energy - 20);
      this.position.set(2, this.getTerrainHeight(2, 16) + this.playerHeight, 16);
      if (window.uiManager) window.uiManager.showBanner("⚡ EMP SHOCK! Detected by HAULER-9. Energy drained, retreated to cover.");
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.gameEngine3D = new GameEngine3D();
