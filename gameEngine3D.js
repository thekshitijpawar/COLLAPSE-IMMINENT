/**
 * MARS: BEYOND SURVIVAL 🚀
 * gameEngine3D.js — 3D First-Person WebGL Engine, Martian World & Physics
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
    this.onScreenSprintHeld = false;
    this.isPointerLocked = false;
    this.euler = null;
    this.playerHeight = 1.75;
    this.playerRadius = 0.5;
    this.position = null;
    this.velocity = null;
    this.isGrounded = true;
    this.bobTimer = 0;
    this.reachTimer = 0;

    // Playable Area & EVA Geofence Boundaries (Acidalia Planitia Sector)
    this.playableBounds = {
      minX: -52,
      maxX: 104,
      minZ: -44,
      maxZ: 56
    };
    this.isOutOfBounds = false;
    this.oobTimer = 10.0;
    this.lastAlarmSoundTime = 0;

    // World & Environment
    this.terrain = null;
    this.terrainSize = 640;
    this.terrainSegments = 80;
    this.sunLight = null;
    this.ambientLight = null;
    this.dustParticles = null;
    this.interactables = [];
    this.colliders = [];
    this.raycaster = null;
    this.hoveredObject = null;

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
    this.stormParticleCount = 2500;

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

    // 1. Scene & Camera (Deep Midnight Space Sky with NASA Atmospheric Depth)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020512); // Deep midnight navy-black space sky (NASA reference)
    this.scene.fog = new THREE.FogExp2(0x070b18, 0.0055); // Subtle dark atmospheric horizon haze

    // Deep Space Sky with Dense Stars, Diffraction Spikes, Galactic Band, Earth & Martian Moons
    this.setupSpaceSky();

    this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 800);
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.position = new THREE.Vector3(0, this.playerHeight, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // 2. Renderer — performance-first, adaptive pixel ratio
    // Detect device tier for smart defaults
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const dpr = window.devicePixelRatio || 1;
    // Cap pixel ratio: mobile=1.0, desktop=1.5 (huge GPU savings, barely visible at distance)
    this._targetDPR = isMobile ? Math.min(dpr, 1.0) : Math.min(dpr, 1.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,          // Skip MSAA on mobile (saves ~30% GPU)
      powerPreference: 'high-performance',
      precision: 'mediump',          // mediump sufficient for game graphics, faster on mobile
      logarithmicDepthBuffer: false  // Not needed here, disable for perf
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this._targetDPR);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;   // Faster than PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = false;           // Manual shadow updates only
    this.renderer.shadowMap.needsUpdate = true;           // Force first update
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    // Optimise draw call sorting
    this.renderer.sortObjects = true;
    this.container.appendChild(this.renderer.domElement);

    // Adaptive quality: track FPS, drop DPR if struggling
    this._fpsHistory = [];
    this._lastFPSCheck = 0;
    this._fpsCheckInterval = 3.0;   // Check every 3 seconds
    this._adaptiveEnabled = true;

    // 3. Lighting (Martian Sun + Atmosphere)
    this.ambientLight = new THREE.AmbientLight(0xcc6633, 0.7);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    this.sunLight.position.set(120, 160, 90);
    this.sunLight.castShadow = true;
    // Shadow map: 2048 on desktop for crisp shadows, 1024 on mobile
    const shadowRes = isMobile ? 1024 : 2048;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;    // Reduced: shadows only within 300u not 400
    this.sunLight.shadow.bias = -0.0003;      // Prevent shadow acne
    const d = 80;                             // Tighter frustum = higher shadow texel density
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
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

    // 6. Build Martian Terrain & Geological Formations
    this.buildMartianTerrain();

    // 7. Build Atmospheric Particle Field
    this.setupDustParticles();

    // 8. Raycaster for Interactions
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.2;

    // 9. Input & Pointer Lock Setup
    this.setupControls();

    this.clock = new THREE.Clock();
    window.addEventListener('resize', () => this.onWindowResize());

    return true;
  }

  // ==========================================
  // DEEP SPACE CELESTIAL SKY DOME (NASA ASTROPHOTOGRAPHY)
  // ==========================================
  createDiffractionSpikeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64, cy = 64;

    // Glowing core
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    radGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    radGrad.addColorStop(0.25, 'rgba(215, 235, 255, 0.85)');
    radGrad.addColorStop(0.6, 'rgba(120, 180, 255, 0.25)');
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    // 4-point sharp diffraction spikes (horizontal & vertical tapered rays)
    const drawSpike = (angle, length, width, alpha) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const spikeGrad = ctx.createLinearGradient(0, -width, 0, width);
      spikeGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
      spikeGrad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
      spikeGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = spikeGrad;

      ctx.beginPath();
      ctx.moveTo(-length, 0);
      ctx.lineTo(0, -width);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, width);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawSpike(0, 60, 2.4, 0.95);           // Horizontal ray
    drawSpike(Math.PI / 2, 60, 2.4, 0.95);  // Vertical ray
    drawSpike(Math.PI / 4, 26, 1.2, 0.5);   // Diagonal subtle ray
    drawSpike(-Math.PI / 4, 26, 1.2, 0.5);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  setupSpaceSky() {
    this.skyGroup = new THREE.Group();

    // 1. Starfield: 4,500 dense background stars with spectral types
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const spectralColors = [
      new THREE.Color(0xb5d8ff), // O/B Brilliant Blue-White
      new THREE.Color(0xf8faff), // A Pure Diamond White
      new THREE.Color(0xfff6d8), // G Solar Warm White
      new THREE.Color(0xffaf6a), // K Amber Orange
      new THREE.Color(0xff6e50)  // M Red Giant
    ];

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 580 + Math.random() * 140;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.max(-20, r * Math.cos(phi));
      const z = r * Math.sin(phi) * Math.sin(theta);

      starPos[i * 3] = x;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = z;

      const spec = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      const brightness = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = spec.r * brightness;
      starColors[i * 3 + 1] = spec.g * brightness;
      starColors[i * 3 + 2] = spec.b * brightness;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Notice: fog: false is CRITICAL so background stars never get extinguished by horizon fog!
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      sizeAttenuation: false,
      fog: false
    });

    const starsMesh = new THREE.Points(starGeo, starMat);
    this.skyGroup.add(starsMesh);

    // 2. 65 Prominent Bright Stars with 4-Point Cross Diffraction Spikes (User Reference Photo)
    const spikeTex = this.createDiffractionSpikeTexture();
    const brightStarPositions = [];

    // Two huge standout primary stars (like the two bright ones in the user's reference photo)
    brightStarPositions.push({ pos: new THREE.Vector3(-180, 420, -320), size: 42, color: 0xffffff });
    brightStarPositions.push({ pos: new THREE.Vector3(-260, 280, -260), size: 36, color: 0xd8eeff });

    // Additional prominent spiked stars forming authentic constellations
    for (let b = 0; b < 60; b++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI * 0.42); // High in celestial dome
      const r = 540;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.max(80, r * Math.cos(phi));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const sz = 14 + Math.random() * 20;
      const clr = Math.random() > 0.6 ? 0xffffff : Math.random() > 0.3 ? 0xcbe5ff : 0xffe2b8;
      brightStarPositions.push({ pos: new THREE.Vector3(x, y, z), size: sz, color: clr });
    }

    brightStarPositions.forEach(b => {
      const sMat = new THREE.SpriteMaterial({
        map: spikeTex,
        color: b.color,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        fog: false
      });
      const sprite = new THREE.Sprite(sMat);
      sprite.position.copy(b.pos);
      sprite.scale.set(b.size, b.size, 1);
      this.skyGroup.add(sprite);
    });

    // 3. Faint Milky Way Galactic Band & Star Dust Lane
    const mwGeo = new THREE.BufferGeometry();
    const mwCount = 1800;
    const mwPos = new Float32Array(mwCount * 3);
    const mwColors = new Float32Array(mwCount * 3);
    const mwColor1 = new THREE.Color(0xa0bce8);
    const mwColor2 = new THREE.Color(0xd2bba2);

    for (let i = 0; i < mwCount; i++) {
      const angle = (i / mwCount) * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 45;
      const dist = 600 + (Math.random() - 0.5) * 40;
      const gx = dist * Math.cos(angle);
      const gy = dist * Math.sin(angle) * 0.78 + spread;
      const gz = dist * Math.sin(angle) * 0.62 + (Math.random() - 0.5) * 55;

      mwPos[i * 3] = gx;
      mwPos[i * 3 + 1] = Math.max(20, gy);
      mwPos[i * 3 + 2] = gz;

      const c = Math.random() > 0.5 ? mwColor1 : mwColor2;
      const a = 0.22 + Math.random() * 0.32;
      mwColors[i * 3] = c.r * a;
      mwColors[i * 3 + 1] = c.g * a;
      mwColors[i * 3 + 2] = c.b * a;
    }
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwColors, 3));
    const mwMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: false,
      fog: false
    });
    this.skyGroup.add(new THREE.Points(mwGeo, mwMat));

    // 4. Earth: The "Pale Blue Dot" with Atmospheric Sapphire Halo
    const earthGroup = new THREE.Group();
    earthGroup.position.set(240, 360, -320);

    const earthDotGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const earthDotMat = new THREE.MeshBasicMaterial({ color: 0x58ccff, fog: false });
    earthGroup.add(new THREE.Mesh(earthDotGeo, earthDotMat));

    const earthHaloGeo = new THREE.SphereGeometry(2.8, 16, 16);
    const earthHaloMat = new THREE.MeshBasicMaterial({
      color: 0x0288d1,
      transparent: true,
      opacity: 0.45,
      fog: false
    });
    earthGroup.add(new THREE.Mesh(earthHaloGeo, earthHaloMat));
    this.skyGroup.add(earthGroup);

    // 5. Martian Moon: Phobos (Irregular potato-shaped cratered moon)
    const phobosGroup = new THREE.Group();
    phobosGroup.position.set(-280, 290, 180);
    const phobosGeo = new THREE.DodecahedronGeometry(5.8, 1);
    const phobosPos = phobosGeo.attributes.position;
    for (let i = 0; i < phobosPos.count; i++) {
      const vx = phobosPos.getX(i);
      const vy = phobosPos.getY(i);
      const vz = phobosPos.getZ(i);
      const noise = 1 + (Math.sin(vx * 2.0) * Math.cos(vy * 2.0)) * 0.18;
      phobosPos.setXYZ(i, vx * noise, vy * 0.85 * noise, vz * noise);
    }
    phobosGeo.computeVertexNormals();

    const phobosMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f76,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
      fog: false
    });
    phobosGroup.add(new THREE.Mesh(phobosGeo, phobosMat));
    this.skyGroup.add(phobosGroup);

    // 6. Martian Moon: Deimos (Smaller, distant smooth moon)
    const deimosGroup = new THREE.Group();
    deimosGroup.position.set(380, 220, 260);
    const deimosGeo = new THREE.DodecahedronGeometry(2.6, 1);
    const deimosMat = new THREE.MeshStandardMaterial({
      color: 0x9a8f88,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
      fog: false
    });
    deimosGroup.add(new THREE.Mesh(deimosGeo, deimosMat));
    this.skyGroup.add(deimosGroup);

    this.scene.add(this.skyGroup);
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
  // PROCEDURAL MARTIAN TERRAIN & GEOLOGY
  // ==========================================
  computeTerrainHeight(x, z) {
    // Continuous mathematical terrain height formula
    let h = Math.sin(x * 0.035) * 1.5 + Math.cos(z * 0.028) * 1.8;
    h += Math.sin((x + z) * 0.06) * 0.8;

    // Crash crater at x=-15, z=-10
    const distCrash = Math.hypot(x + 15, z + 10);
    if (distCrash < 30) {
      const rim = Math.sin((distCrash / 30) * Math.PI) * 2.2;
      h += rim - (30 - distCrash) * 0.12;
    }

    // Crater Ridge in Level 5 area (x > 50)
    if (x > 50) {
      const ridgeFactor = Math.min(1, (x - 50) / 40);
      h += Math.sin(z * 0.05) * 4.0 * ridgeFactor + ridgeFactor * 14.0;
    }

    // Flat foundation for Habitat Alpha at x=0, z=25
    const distHab = Math.hypot(x, z - 25);
    if (distHab < 22) {
      const factor = distHab / 22;
      h = h * factor + 0 * (1 - factor);
    }

    // Continuous undulating regional Martian terrain (seamless landscape as character moves forward)
    h += Math.sin(x * 0.012 + z * 0.015) * 3.8 + Math.cos(x * 0.016 - z * 0.014) * 3.2;

    // Distant perimeter mountain rims far out on the horizon (beyond 250m)
    const distCenter = Math.hypot(x, z);
    if (distCenter > 250) {
      const rimFactor = (distCenter - 250) / 60;
      h += Math.sin(distCenter * 0.04) * 8.0 * rimFactor + rimFactor * 24.0;
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

    // 1. Photorealistic Martian Regolith — Fast procedural texture (512×512, GPU-tiled 48×)
    // Uses only arithmetic (no nested loops/Voronoi) — generates in <10ms on any device
    const TEX = 512;
    const canvas = document.createElement('canvas');
    canvas.width = TEX; canvas.height = TEX;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(TEX, TEX);
    const data = imgData.data;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = TEX; bumpCanvas.height = TEX;
    const bctx = bumpCanvas.getContext('2d');
    const bImgData = bctx.createImageData(TEX, TEX);
    const bData = bImgData.data;

    // Fast hash — integer lattice, no Math.sin
    const P = new Uint8Array(512);
    for (let i = 0; i < 256; i++) P[i] = P[i + 256] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [P[i], P[j]] = [P[j], P[i]];
      P[i + 256] = P[i]; P[j + 256] = P[j];
    }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function grad(h, x, y) {
      h &= 3;
      return (h < 2 ? (h === 0 ? x : -x) : 0) + (h < 2 ? 0 : (h === 1 ? y : -y));
    }
    function perlin(x, y) {
      const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
      const xf = x - Math.floor(x), yf = y - Math.floor(y);
      const u = fade(xf), v = fade(yf);
      const aa = P[P[xi] + yi], ab = P[P[xi] + yi + 1];
      const ba = P[P[xi + 1] + yi], bb = P[P[xi + 1] + yi + 1];
      return lerp(
        lerp(grad(aa, xf, yf),     grad(ba, xf - 1, yf),     u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v
      );
    }
    function fbm2(x, y) {   // 3-octave fBm — fast enough at 512×512
      return perlin(x, y) * 0.5 + perlin(x * 2.1, y * 2.1) * 0.25 + perlin(x * 4.3, y * 4.3) * 0.125;
    }

    const INV = 1 / TEX;
    for (let y = 0; y < TEX; y++) {
      const ny = y * INV;
      for (let x = 0; x < TEX; x++) {
        const nx = x * INV;
        const idx = (y * TEX + x) * 4;

        // --- Large-scale color zone (3-octave fBm, fast) ---
        const zone = fbm2(nx * 3.0, ny * 3.0) * 0.5 + 0.5;   // 0..1

        // NASA ochre palette blend
        const zA = Math.max(0, 1 - Math.abs(zone - 0.35) * 5);  // dark basalt
        const zC = Math.max(0, (zone - 0.65) * 3.5);            // bright dust
        // Base ochre rgb(195,122,68) blended with basalt rgb(118,62,36) & dust rgb(215,160,100)
        let baseR = 195 + zA * (118 - 195) + zC * (215 - 195);
        let baseG = 122 + zA * (62  - 122) + zC * (160 - 122);
        let baseB = 68  + zA * (36  - 68)  + zC * (100 - 68);

        // --- Aeolian ripples (wind angle 35°, cheap sin) ---
        const wa = nx * 0.82 + ny * 0.57;
        const ripple = Math.sin(wa * 40.0) * 0.5 + 0.5;

        // --- Crack network — cheap approximation via fBm derivative ---
        const crack = Math.abs(perlin(nx * 14, ny * 14)) * 2.0;
        const crackMask = Math.min(1, crack * 2.5);             // bright = safe, 0 = crack

        // --- Fine grain (integer hash, 1 op per pixel) ---
        const gi = (x * 1664525 + y * 1013904223) & 0xFFFFFF;
        const grain = (gi & 0xFF) / 255;

        // Compose
        baseR += ripple * 22 + (grain - 0.5) * 16;
        baseG += ripple * 15 + (grain - 0.5) * 10;
        baseB += ripple * 7  + (grain - 0.5) * 5;

        // Crack darkening
        const cm = 0.72 + crackMask * 0.28;
        baseR *= cm; baseG *= cm; baseB *= cm;

        // Hematite concretion spots (integer grid, one hash)
        const sx = x >> 2, sy = y >> 2;         // 4px cell = 128×128 dots
        const sh = (sx * 1664525 + sy * 1013904223) & 0xFFFFFF;
        if ((sh % 1000) < 22) { baseR = 50; baseG = 18; baseB = 8; }         // dark iron-oxide
        else if ((sh % 1000) > 978) { baseR = 225; baseG = 172; baseB = 108; } // bright calcium

        data[idx]     = Math.min(255, Math.max(0, baseR + 0.5) | 0);
        data[idx + 1] = Math.min(255, Math.max(0, baseG + 0.5) | 0);
        data[idx + 2] = Math.min(255, Math.max(0, baseB + 0.5) | 0);
        data[idx + 3] = 255;

        const bVal = (ripple * 0.5 + (1 - crackMask) * 0.3 + grain * 0.2) * 255 | 0;
        bData[idx] = bVal; bData[idx+1] = bVal; bData[idx+2] = bVal; bData[idx+3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    bctx.putImageData(bImgData, 0, 0);

    // Quick canvas scatter for mineral nodules (1500 dots, cheap)
    for (let p = 0; p < 1500; p++) {
      const px = Math.random() * TEX, py = Math.random() * TEX;
      const pr = Math.random() * 1.5 + 0.4;
      const roll = Math.random();
      ctx.fillStyle = roll < 0.6 ? 'rgba(50,16,8,0.68)' : 'rgba(218,162,92,0.5)';
      ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.283); ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(48, 48);
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(48, 48);

    const terrainMat = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: bumpTexture,
      bumpScale: 0.22,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false
    });

    this.terrain = new THREE.Mesh(geo, terrainMat);
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);

    this.scatterMartianRocks();
    this.buildPerimeterMarkers();
  }

  buildPerimeterMarkers() {
    const group = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2b2e34, metalness: 0.8, roughness: 0.3 });
    const stripeGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.4, 8);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, roughness: 0.4 });
    const strobeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    this.perimeterStrobeMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    const b = this.playableBounds;
    const points = [];

    // North & South edges
    for (let x = b.minX; x <= b.maxX; x += 18) {
      points.push({ x: x, z: b.minZ });
      points.push({ x: x, z: b.maxZ });
    }
    // West & East edges
    for (let z = b.minZ + 18; z < b.maxZ; z += 18) {
      points.push({ x: b.minX, z: z });
      points.push({ x: b.maxX, z: z });
    }

    points.forEach(pt => {
      const pGroup = new THREE.Group();
      const y = this.getTerrainHeight(pt.x, pt.z);
      pGroup.position.set(pt.x, y, pt.z);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.9;
      pGroup.add(post);

      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 1.1;
      pGroup.add(stripe);

      const strobe = new THREE.Mesh(strobeGeo, this.perimeterStrobeMat);
      strobe.position.y = 1.85;
      pGroup.add(strobe);

      group.add(pGroup);
    });

    this.scene.add(group);
  }

  handleBoundaryEncounter(direction) {
    const now = performance.now();
    if (!this.lastBoundaryWarnTime || now - this.lastBoundaryWarnTime > 3500) {
      this.lastBoundaryWarnTime = now;
      if (window.soundSystem) window.soundSystem.playRadioBeep();
      if (window.uiManager) {
        window.uiManager.showBanner(`⚠️ EVA GEOFENCE: Mission sector perimeter reached (${direction}). Turn back to operational zone.`, 3000);
      }
    }
  }

  getTerrainHeight(x, z) {
    return this.computeTerrainHeight(x, z);
  }

  createMartianRockTextures() {
    // 1. Sedimentary Weathered Sandstone Diffuse Texture (1024x1024 - NASA Gale/Jezero Crater Mudstone)
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = 1024;
    diffCanvas.height = 1024;
    const ctx = diffCanvas.getContext('2d');
    const imgData = ctx.createImageData(1024, 1024);
    const data = imgData.data;

    // 2. High-Relief Tactile Bump Map (1024x1024)
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 1024;
    const bctx = bumpCanvas.getContext('2d');
    const bImgData = bctx.createImageData(1024, 1024);
    const bData = bImgData.data;

    // 3. Specular Roughness Map (512x512)
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = 512;
    roughCanvas.height = 512;
    const rctx = roughCanvas.getContext('2d');
    const rImgData = rctx.createImageData(512, 512);
    const rData = rImgData.data;

    for (let y = 0; y < 1024; y++) {
      const ny = y / 1024;
      for (let x = 0; x < 1024; x++) {
        const nx = x / 1024;
        const idx = (y * 1024 + x) * 4;

        // Low-frequency organic domain warping for gentle geological variation (NO harsh stripes!)
        const warp1 = Math.sin(nx * 3.2 + ny * 2.8) * 0.08;
        const warp2 = Math.cos(nx * 2.6 - ny * 3.4) * 0.08;
        const wx = nx + warp1;
        const wy = ny + warp2;

        // Very broad, gentle sedimentary bed tone (smooth large-scale grading)
        const strataGrad = Math.sin(wy * 4.2 + wx * 1.6) * 0.07;

        // Multi-scale desert varnish (dark iron-manganese wind polish from NASA rover photos)
        const varnish1 = Math.sin(wx * 4.8) * Math.cos(wy * 5.2) * 0.5 + 0.5;
        const varnish2 = Math.sin(wx * 9.5 + wy * 8.2) * 0.5 + 0.5;
        const varnish = varnish1 * 0.7 + varnish2 * 0.3;

        // Soft airfall dust settling in shallow depressions
        const dust = Math.cos(wx * 6.0 - wy * 5.0) * 0.5 + 0.5;

        // Fine tactile sandstone grain (micro-grit without banding)
        const g1 = ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1 + 1) * 0.5;
        const g2 = ((Math.sin(x * 63.7264 + y * 10.873) * 12345.6789) % 1 + 1) * 0.5;
        const grain = g1 * 0.65 + g2 * 0.35;

        // Authentically calibrated NASA Mars rover mudstone palette (tawny ochre base with varnish & dust)
        const blend = 0.5 + strataGrad + (varnish - 0.5) * 0.28 + (dust - 0.5) * 0.22 + (grain - 0.5) * 0.16;

        const r = Math.min(255, Math.max(0, Math.floor(178 + (blend - 0.5) * 78)));
        const g = Math.min(255, Math.max(0, Math.floor(102 + (blend - 0.5) * 64)));
        const b = Math.min(255, Math.max(0, Math.floor(64 + (blend - 0.5) * 44)));

        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;

        // Bump height: natural micro-pitting, aeolian vents, and tactile stone relief
        const bumpVal = Math.floor((strataGrad * 0.15 + (1 - varnish) * 0.25 + grain * 0.6) * 255);
        bData[idx] = bumpVal;
        bData[idx + 1] = bumpVal;
        bData[idx + 2] = bumpVal;
        bData[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    bctx.putImageData(bImgData, 0, 0);

    // Pale calcium sulfate (gypsum) mineral veins (famous NASA Curiosity discovery in Gale Crater)
    ctx.strokeStyle = 'rgba(235, 225, 210, 0.45)';
    ctx.lineWidth = 1.4;
    for (let v = 0; v < 7; v++) {
      let vx = Math.random() * 1024;
      let vy = Math.random() * 1024;
      const vAngle = Math.random() * Math.PI * 2;
      const vLen = 60 + Math.random() * 100;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < vLen; s += 10) {
        vx += Math.cos(vAngle) * 10 + (Math.random() - 0.5) * 5;
        vy += Math.sin(vAngle) * 10 + (Math.random() - 0.5) * 5;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Subtle natural weathering fractures
    ctx.strokeStyle = 'rgba(48, 22, 12, 0.6)';
    ctx.lineWidth = 1.5;
    bctx.strokeStyle = 'rgb(25, 25, 25)';
    bctx.lineWidth = 2.0;

    for (let c = 0; c < 12; c++) {
      let cx = Math.random() * 1024;
      let cy = Math.random() * 1024;
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const len = 50 + Math.random() * 90;

      ctx.beginPath();
      bctx.beginPath();
      ctx.moveTo(cx, cy);
      bctx.moveTo(cx, cy);

      for (let s = 0; s < len; s += 12) {
        cx += Math.cos(angle) * 12 + (Math.random() - 0.5) * 5;
        cy += Math.sin(angle) * 12 + (Math.random() - 0.5) * 5;
        ctx.lineTo(cx, cy);
        bctx.lineTo(cx, cy);
      }
      ctx.stroke();
      bctx.stroke();
    }

    // Roughness map (512x512)
    for (let ry = 0; ry < 512; ry++) {
      for (let rx = 0; rx < 512; rx++) {
        const ridx = (ry * 512 + rx) * 4;
        const rGrit = ((Math.sin(rx * 12.9898 + ry * 78.233) * 43758.5453) % 1 + 1) * 0.5;
        const rVal = Math.floor(190 + rGrit * 50);
        rData[ridx] = rVal;
        rData[ridx + 1] = rVal;
        rData[ridx + 2] = rVal;
        rData[ridx + 3] = 255;
      }
    }
    rctx.putImageData(rImgData, 0, 0);

    const diffTex = new THREE.CanvasTexture(diffCanvas);
    diffTex.wrapS = THREE.RepeatWrapping;
    diffTex.wrapT = THREE.RepeatWrapping;

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;

    const roughTex = new THREE.CanvasTexture(roughCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;

    return { diffTex, bumpTex, roughTex };
  }

  createSedimentarySlabGeometry(radius, thickness) {
    const radialSegs = 14;
    const geo = new THREE.CylinderGeometry(radius, radius * 1.06, thickness, radialSegs, 1);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (Math.abs(y) > thickness * 0.35) {
        // Planar top-down mapping scaled to broad natural world coordinates (NO stretching or repeating stripes!)
        uvs.setXY(i, (x / 7.5) + 0.5, (z / 7.5) + 0.5);
        pos.setY(i, y + (Math.sin(x * 0.8) * Math.cos(z * 0.8)) * thickness * 0.12);
      } else {
        const angle = Math.atan2(z, x);
        const dist = Math.hypot(x, z);
        const jitter = 1 + (Math.sin(angle * 4.0) * 0.12 + Math.cos(angle * 7.0) * 0.08);
        pos.setX(i, Math.cos(angle) * dist * jitter);
        pos.setZ(i, Math.sin(angle) * dist * jitter);
        uvs.setXY(i, (angle / (Math.PI * 2)) * 2.0, (y / thickness) + 0.5);
      }
    }
    uvs.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  createFracturedBoulderGeometry(radius) {
    const geo = new THREE.DodecahedronGeometry(radius, 1);
    const pos = geo.attributes.position;
    const uvs = geo.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const facet = 1 + (Math.sin(x * 2.2) * Math.sin(z * 2.2) + Math.cos(y * 2.8)) * 0.18;
      pos.setXYZ(i, x * facet, y * Math.max(0.65, facet), z * facet);

      const len = Math.hypot(x, y, z);
      const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
      const v = 0.5 - Math.asin(y / Math.max(0.001, len)) / Math.PI;
      uvs.setXY(i, u * 2.2, v * 2.2);
    }
    uvs.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  createMartianMineralConcretion(x, z, scale = 1.0) {
    // Recreates Curiosity's "Blackthorn Salt Flower" concretion cluster
    const group = new THREE.Group();
    const concretionMat = new THREE.MeshStandardMaterial({
      color: 0xc89d7c, // Mineral salt & desert varnish tan
      roughness: 0.94,
      metalness: 0.08,
      flatShading: true
    });

    // Central rounded nodule
    const coreGeo = new THREE.SphereGeometry(0.35 * scale, 8, 6);
    const coreMesh = new THREE.Mesh(coreGeo, concretionMat);
    coreMesh.scale.set(1.2, 0.4, 1.0);
    group.add(coreMesh);

    // 10 radial dendritic branching lobes
    const lobeCount = 10;
    for (let i = 0; i < lobeCount; i++) {
      const angle = (i / lobeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const lobeLen = (0.5 + Math.random() * 0.6) * scale;
      const lobeWidth = (0.12 + Math.random() * 0.08) * scale;

      const lobeGeo = new THREE.BoxGeometry(lobeLen, lobeWidth * 0.8, lobeWidth);
      const lobeMesh = new THREE.Mesh(lobeGeo, concretionMat);

      lobeMesh.position.set(
        Math.cos(angle) * lobeLen * 0.5,
        (Math.random() - 0.5) * 0.04 * scale,
        Math.sin(angle) * lobeLen * 0.5
      );
      lobeMesh.rotation.y = -angle;
      lobeMesh.rotation.z = (Math.random() - 0.5) * 0.2;
      group.add(lobeMesh);

      // Terminal branching nodules on lobes
      const tipGeo = new THREE.DodecahedronGeometry(lobeWidth * 0.9, 0);
      const tipMesh = new THREE.Mesh(tipGeo, concretionMat);
      tipMesh.position.set(
        Math.cos(angle) * lobeLen,
        0.02 * scale,
        Math.sin(angle) * lobeLen
      );
      group.add(tipMesh);
    }

    const y = this.getTerrainHeight(x, z) + 0.06 * scale;
    group.position.set(x, y, z);
    group.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2);
    group.castShadow = true;
    group.receiveShadow = true;
    this.scene.add(group);
  }

  scatterMartianRocks() {
    const { diffTex, bumpTex, roughTex } = this.createMartianRockTextures();

    // Sedimentary slab & boulder material
    const rockMat = new THREE.MeshStandardMaterial({
      map: diffTex,
      bumpMap: bumpTex,
      bumpScale: 0.22,
      roughnessMap: roughTex,
      roughness: 0.88,
      metalness: 0.06
    });

    // 1. Sedimentary Bedrock Shingle Slabs (Continuous landscape graphics)
    for (let i = 0; i < 140; i++) {
      const x = (Math.random() - 0.5) * 440;
      const z = (Math.random() - 0.5) * 440;

      // Clear habitat foundation and crash site core
      if (Math.hypot(x, z - 25) < 14 || Math.hypot(x + 18, z + 12) < 9) continue;

      const radius = 1.6 + Math.random() * 3.4;
      const thickness = 0.22 + Math.random() * 0.28;
      const slabGeo = this.createSedimentarySlabGeometry(radius, thickness);
      const slab = new THREE.Mesh(slabGeo, rockMat);

      const y = this.getTerrainHeight(x, z) + thickness * 0.35;
      slab.position.set(x, y, z);

      // Tilt slightly conforming to terrain slope (shingle effect)
      slab.rotation.set(
        (Math.random() - 0.5) * 0.25,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.25
      );
      // Slabs don't cast shadows — no shadow draw calls for flat rocks (huge perf win)
      slab.castShadow = false;
      slab.receiveShadow = true;
      this.scene.add(slab);
    }

    // 2. Angular Faceted Ventifact Boulders (Continuous landscape graphics)
    for (let i = 0; i < 85; i++) {
      const x = (Math.random() - 0.5) * 440;
      const z = (Math.random() - 0.5) * 440;

      if (Math.hypot(x, z - 25) < 14 || Math.hypot(x + 18, z + 12) < 9) continue;

      const scale = 0.8 + Math.random() * 2.2;
      const boulderGeo = this.createFracturedBoulderGeometry(scale);
      const boulder = new THREE.Mesh(boulderGeo, rockMat);

      const y = this.getTerrainHeight(x, z) + scale * 0.45;
      boulder.position.set(x, y, z);
      boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      this.scene.add(boulder);

      this.colliders.push({
        type: 'sphere',
        x: x,
        z: z,
        radius: scale * 0.85
      });
    }

    // 3. Vast Instanced Pebble & Gravel Field (Continuous landscape graphics)
    const pebbleCount = 1600;
    const pebbleGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({
      color: 0x9e4827,
      roughness: 0.95,
      metalness: 0.05
    });
    const pebbleMesh = new THREE.InstancedMesh(pebbleGeo, pebbleMat, pebbleCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < pebbleCount; i++) {
      const px = (Math.random() - 0.5) * 460;
      const pz = (Math.random() - 0.5) * 460;
      const py = this.getTerrainHeight(px, pz) + 0.05;
      const s = 0.4 + Math.random() * 1.4;

      dummy.position.set(px, py, pz);
      dummy.scale.set(s, s * 0.7, s);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();

      pebbleMesh.setMatrixAt(i, dummy.matrix);
    }
    pebbleMesh.instanceMatrix.needsUpdate = true;
    pebbleMesh.receiveShadow = true;
    this.scene.add(pebbleMesh);

    // 4. Discoverable Dendritic "Martian Flower" Concretions (Rover Photo 2)
    const flowerLocations = [
      { x: -14, z: -7, s: 1.1 },  // Near crash site discovery
      { x: -5,  z: 18, s: 1.3 },  // Approach to Habitat Alpha
      { x: 38,  z: 16, s: 1.0 },  // Solar farm ridge
      { x: -28, z: 34, s: 1.2 },  // ECLSS water corridor
      { x: 50,  z: -4, s: 1.4 },  // Storm trench pass
      { x: 74,  z: -12, s: 1.5 }  // Base of Crater Ridge
    ];
    flowerLocations.forEach(loc => {
      this.createMartianMineralConcretion(loc.x, loc.z, loc.s);
    });
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

    this.applyMissionAtmosphere(missionId);
    this.spawnMissionItems(missionId);
  }

  applyMissionAtmosphere(missionId) {
    if (missionId === 4) {
      this.isStormActive = true;
      this.scene.fog.color.setHex(0x140604);
      this.scene.fog.density = 0.035;
      this.scene.background.setHex(0x060202); // Deep black storm sky
      this.ambientLight.color.setHex(0x662211);
      this.ambientLight.intensity = 0.4;
      this.sunLight.intensity = 0.3;
    } else if (missionId === 5) {
      this.isStormActive = false;
      this.scene.fog.color.setHex(0x04060e);
      this.scene.fog.density = 0.0035;
      this.scene.background.setHex(0x02040c); // Deep solid black space sky
      this.ambientLight.color.setHex(0x4a2422);
      this.ambientLight.intensity = 0.5;
      this.sunLight.color.setHex(0xdd6644);
      this.sunLight.intensity = 0.7;
      this.sunLight.position.set(-150, 20, 80);
    } else {
      this.isStormActive = false;
      this.scene.fog.color.setHex(0x04060e); // Deep midnight space fog (preserves starfield clarity)
      this.scene.fog.density = 0.0035; // Subtle dark atmospheric depth
      this.scene.background.setHex(0x02040c); // Deep solid midnight black space sky (NASA reference)
      this.ambientLight.color.setHex(0x753b23); // Calibrated warm Martian soil bounce
      this.ambientLight.intensity = 0.65;
      this.sunLight.intensity = 1.35;
      this.sunLight.color.setHex(0xffeedd);
      this.sunLight.position.set(120, 160, 90);
    }
  }

  buildCrashSite() {
    const group = new THREE.Group();
    const cx = -18, cz = -12;
    const cy = this.getTerrainHeight(cx, cz);

    const hullMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.85, roughness: 0.35 });
    const scorchMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const bodyGeo = new THREE.CylinderGeometry(2.4, 2.8, 11, 16);
    const body = new THREE.Mesh(bodyGeo, hullMat);
    body.rotation.z = Math.PI / 3.2;
    body.rotation.x = 0.2;
    body.position.set(cx, cy + 2.5, cz);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const shieldGeo = new THREE.CylinderGeometry(2.82, 2.85, 2.5, 16);
    const shield = new THREE.Mesh(shieldGeo, scorchMat);
    shield.rotation.z = Math.PI / 3.2;
    shield.position.set(cx - 3.2, cy + 0.8, cz);
    group.add(shield);

    const strutGeo = new THREE.BoxGeometry(0.3, 7.5, 1.8);
    const strut = new THREE.Mesh(strutGeo, hullMat);
    strut.rotation.set(0.4, 0.2, 1.2);
    strut.position.set(cx + 4.5, cy + 1.2, cz + 2.5);
    group.add(strut);

    this.scene.add(group);

    this.colliders.push({
      type: 'box',
      minX: cx - 5.5,
      maxX: cx + 5.5,
      minZ: cz - 4.5,
      maxZ: cz + 4.5
    });
  }

  // Procedural habitat dome texture (hexagonal panels, weathering, dust)
  createHabitatTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base: aged off-white with subtle yellowing gradient toward base
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    baseGrad.addColorStop(0.0, '#e9e5dc');
    baseGrad.addColorStop(0.55, '#dedad0');
    baseGrad.addColorStop(1.0, '#c8b898');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Hexagonal panel grid pattern (structural composite, ISS-style)
    const hexSize = 48, hexH = hexSize * Math.sqrt(3);
    ctx.strokeStyle = 'rgba(90,80,65,0.38)';
    ctx.lineWidth = 1.5;
    for (let row = -1; row < 1024 / hexH + 1; row++) {
      for (let col = -1; col < 1024 / (hexSize * 1.5) + 1; col++) {
        const cx2 = col * hexSize * 3 + (row % 2 === 0 ? 0 : hexSize * 1.5);
        const cy2 = row * hexH;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 180 * (60 * i - 30);
          const hpx = cx2 + hexSize * 0.92 * Math.cos(angle);
          const hpy = cy2 + hexSize * 0.92 * Math.sin(angle);
          i === 0 ? ctx.moveTo(hpx, hpy) : ctx.lineTo(hpx, hpy);
        }
        ctx.closePath();
        ctx.stroke();
        // Subtle panel interior shading variation
        const shade = (Math.random() * 18 - 9) | 0;
        ctx.fillStyle = `rgba(${128+shade},${120+shade},${105+shade},0.08)`;
        ctx.fill();
      }
    }

    // Rivet dots at panel intersections
    ctx.fillStyle = 'rgba(60,55,48,0.5)';
    for (let row = -1; row < 1024 / hexH + 1; row++) {
      for (let col = -1; col < 1024 / (hexSize * 1.5) + 1; col++) {
        const cx2 = col * hexSize * 3 + (row % 2 === 0 ? 0 : hexSize * 1.5);
        const cy2 = row * hexH;
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 180 * (60 * i - 30);
          const rpx = cx2 + hexSize * 0.92 * Math.cos(angle);
          const rpy = cy2 + hexSize * 0.92 * Math.sin(angle);
          ctx.beginPath(); ctx.arc(rpx, rpy, 2.2, 0, Math.PI*2); ctx.fill();
        }
      }
    }

    // Thermal protection coating marks (darker base from regolith dust accumulation)
    const dustGrad = ctx.createLinearGradient(0, 600, 0, 1024);
    dustGrad.addColorStop(0, 'rgba(140,88,42,0)');
    dustGrad.addColorStop(1, 'rgba(140,88,42,0.42)');
    ctx.fillStyle = dustGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // UV-weathering darkening stripes
    for (let i = 0; i < 12; i++) {
      const wx = Math.random() * 1024, ww = 20 + Math.random() * 60;
      ctx.fillStyle = 'rgba(90,70,50,0.07)';
      ctx.fillRect(wx, 0, ww, 1024);
    }

    // Metallic thermal tape strips (horizontal bands)
    ctx.strokeStyle = 'rgba(200,195,180,0.6)';
    ctx.lineWidth = 3;
    for (let band = 0; band < 5; band++) {
      const by = 180 + band * 170;
      ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(1024, by); ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  createHabitatMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Brushed aluminum base
    ctx.fillStyle = '#b8b4aa';
    ctx.fillRect(0, 0, 512, 512);
    // Horizontal brush strokes
    for (let i = 0; i < 512; i += 2) {
      const alpha = 0.03 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(${200+Math.random()*20|0},${195+Math.random()*20|0},${185+Math.random()*20|0},${alpha})`;
      ctx.fillRect(0, i, 512, 1);
    }
    // Circumferential weld seam lines
    ctx.strokeStyle = 'rgba(60,55,50,0.45)';
    ctx.lineWidth = 2;
    for (let s = 0; s < 512; s += 64) {
      ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(512, s); ctx.stroke();
    }
    // Dust accumulation at base
    const dg = ctx.createLinearGradient(0, 350, 0, 512);
    dg.addColorStop(0, 'rgba(140,80,30,0)');
    dg.addColorStop(1, 'rgba(140,80,30,0.38)');
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(canvas);
  }

  buildHabitatAlpha() {
    const group = new THREE.Group();
    const hx = 0, hz = 25;
    const hy = this.getTerrainHeight(hx, hz);

    // =====================================================
    // PROCEDURAL TEXTURES
    // =====================================================
    const habTex = this.createHabitatTexture();
    habTex.wrapS = habTex.wrapT = THREE.RepeatWrapping;
    habTex.repeat.set(3, 1.5);

    const metalTex = this.createHabitatMetalTexture();
    metalTex.wrapS = metalTex.wrapT = THREE.RepeatWrapping;
    metalTex.repeat.set(2, 1);

    // =====================================================
    // 1. REGOLITH BLAST-SHIELD FOUNDATION RING
    // =====================================================
    const shieldGeo = new THREE.CylinderGeometry(12.2, 12.8, 0.8, 32);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x9e5c30, roughness: 0.95, metalness: 0.05
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(hx, hy + 0.4, hz);
    shield.receiveShadow = true;
    group.add(shield);

    // =====================================================
    // 2. MAIN DOME (Geodesic hexagonal composite)
    // =====================================================
    const domeMat = new THREE.MeshStandardMaterial({
      map: habTex,
      color: 0xe8e0d4,
      metalness: 0.28,
      roughness: 0.52,
    });
    const domeGeo = new THREE.SphereGeometry(11, 36, 28, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(hx, hy, hz);
    dome.castShadow = true;
    dome.receiveShadow = true;
    group.add(dome);

    // Structural horizontal ring bands (3 latitude bands)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x7a7870, metalness: 0.75, roughness: 0.35
    });
    [3.5, 6.5, 9.0].forEach((rh, ri) => {
      const r = Math.sqrt(11*11 - rh*rh);
      const ringGeo = new THREE.TorusGeometry(r, 0.18, 8, 48);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(hx, hy + rh, hz);
      ring.castShadow = true;
      group.add(ring);
    });

    // Vertical rib struts (8 around dome)
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x888680, metalness: 0.8, roughness: 0.3
    });
    for (let ri = 0; ri < 8; ri++) {
      const angle = (ri / 8) * Math.PI * 2;
      const ribLen = 11.5;
      const ribGeo = new THREE.BoxGeometry(0.22, ribLen, 0.22);
      const rib = new THREE.Mesh(ribGeo, ribMat);
      rib.position.set(
        hx + Math.sin(angle) * 9.0,
        hy + 5.5,
        hz + Math.cos(angle) * 9.0
      );
      rib.rotation.z = -Math.sin(angle) * 0.52;
      rib.rotation.x = Math.cos(angle) * 0.52;
      rib.castShadow = true;
      group.add(rib);
    }

    // =====================================================
    // 3. PRESSURIZED AIRLOCK TUNNEL (segmented ISS-style)
    // =====================================================
    const tunnelMat = new THREE.MeshStandardMaterial({
      map: metalTex, color: 0xc2bdb5, metalness: 0.72, roughness: 0.32
    });
    // 3 tunnel sections with docking rings
    const tunnelPositions = [hz - 11.8, hz - 13.5, hz - 15.2];
    tunnelPositions.forEach((tz, ti) => {
      const tGeo = new THREE.CylinderGeometry(2.0, 2.0, 2.4, 20);
      const t = new THREE.Mesh(tGeo, tunnelMat);
      t.rotation.x = Math.PI / 2;
      t.position.set(hx, hy + 1.9, tz);
      t.castShadow = true;
      group.add(t);

      // Docking ring between sections
      const dockGeo = new THREE.TorusGeometry(2.1, 0.14, 8, 24);
      const dock = new THREE.Mesh(dockGeo, ringMat);
      dock.rotation.x = Math.PI / 2;
      dock.position.set(hx, hy + 1.9, tz - 1.2);
      group.add(dock);
    });

    // Tunnel top handrail bar
    const railGeo = new THREE.CylinderGeometry(0.055, 0.055, 6.0, 8);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x999288, metalness: 0.9, roughness: 0.2 });
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(hx, hy + 4.1, hz - 13.0);
    group.add(rail);

    // EVA equipment stowage box on tunnel side
    const stowGeo = new THREE.BoxGeometry(0.9, 0.7, 1.4);
    const stowMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.5, roughness: 0.5 });
    const stow = new THREE.Mesh(stowGeo, stowMat);
    stow.position.set(hx + 2.4, hy + 2.6, hz - 13.0);
    group.add(stow);

    // =====================================================
    // 4. AIRLOCK DOOR (pressure door with hardware)
    // =====================================================
    const doorFrameGeo = new THREE.BoxGeometry(3.0, 3.6, 0.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3835, metalness: 0.85, roughness: 0.3 });
    const doorFrame = new THREE.Mesh(doorFrameGeo, frameMat);
    doorFrame.position.set(hx, hy + 1.9, hz - 16.4);
    group.add(doorFrame);

    const doorGeo = new THREE.BoxGeometry(2.3, 2.9, 0.22);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xd0510e, metalness: 0.55, roughness: 0.4 });
    this.airlockDoorMesh = new THREE.Mesh(doorGeo, doorMat);
    this.airlockDoorMesh.position.set(hx, hy + 1.9, hz - 16.3);
    this.airlockDoorMesh.opened = false;
    group.add(this.airlockDoorMesh);

    // Door wheel/locking handle
    const wheelGeo = new THREE.TorusGeometry(0.42, 0.065, 8, 20);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xd0a800, metalness: 0.9, roughness: 0.2 });
    const wheel = new THREE.Mesh(wheelGeo, handleMat);
    wheel.position.set(hx, hy + 1.9, hz - 16.2);
    group.add(wheel);

    // Spokes on door wheel
    for (let s = 0; s < 4; s++) {
      const spokeGeo = new THREE.BoxGeometry(0.06, 0.78, 0.06);
      const spoke = new THREE.Mesh(spokeGeo, handleMat);
      spoke.rotation.z = (s / 4) * Math.PI;
      spoke.position.set(hx, hy + 1.9, hz - 16.17);
      group.add(spoke);
    }

    // Pressure equalization LED strip on door frame (green = safe)
    const ledGeo = new THREE.BoxGeometry(0.08, 2.4, 0.06);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(hx + 1.35, hy + 1.9, hz - 16.3);
    group.add(led);

    // =====================================================
    // 5. EXTERNAL UTILITY MODULES
    // =====================================================

    // ECLSS Life-support backpack module (rear of dome)
    const eclssGeo = new THREE.BoxGeometry(2.8, 2.2, 1.6);
    const eclssMat = new THREE.MeshStandardMaterial({
      color: 0xd8d4ca, metalness: 0.55, roughness: 0.45
    });
    const eclss = new THREE.Mesh(eclssGeo, eclssMat);
    eclss.position.set(hx, hy + 5.5, hz + 11.5);
    eclss.castShadow = true;
    group.add(eclss);

    // ECLSS pipe connections
    const pipeM = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.9, roughness: 0.2 });
    [[0.6, 0], [-0.6, 0]].forEach(([ox]) => {
      const pGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8);
      const p = new THREE.Mesh(pGeo, pipeM);
      p.rotation.z = Math.PI / 2;
      p.position.set(hx + ox * 2, hy + 5.5, hz + 10.4);
      group.add(p);
    });

    // Thermal radiator panels (pair flanking dome)
    const radMat = new THREE.MeshStandardMaterial({
      color: 0xf0ede6, metalness: 0.15, roughness: 0.6, emissive: 0xffeecc, emissiveIntensity: 0.04
    });
    [[-1, 7.5], [1, 7.5]].forEach(([side]) => {
      const radGeo = new THREE.BoxGeometry(0.08, 4.0, 2.4);
      const rad = new THREE.Mesh(radGeo, radMat);
      rad.position.set(hx + side * 11.8, hy + 5.5, hz);
      rad.rotation.z = side * 0.38;
      rad.castShadow = true;
      group.add(rad);
      // Radiator tube grid lines
      for (let t = 0; t < 5; t++) {
        const tGeo = new THREE.BoxGeometry(0.12, 0.05, 2.4);
        const tMesh = new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ color: 0xaabbc0, metalness: 0.8 }));
        tMesh.position.set(hx + side * 11.8, hy + 3.8 + t * 0.5, hz);
        group.add(tMesh);
      }
    });

    // Sensor/camera mast near dome apex
    const mastGeo = new THREE.CylinderGeometry(0.07, 0.09, 3.5, 8);
    const mast = new THREE.Mesh(mastGeo, ribMat);
    mast.position.set(hx + 2.5, hy + 10.2, hz + 1.5);
    group.add(mast);

    const camBoxGeo = new THREE.BoxGeometry(0.28, 0.2, 0.22);
    const camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    [0, 0.4].forEach(offset => {
      const cam = new THREE.Mesh(camBoxGeo, camMat);
      cam.position.set(hx + 2.5, hy + 11.95 + offset, hz + 1.5);
      group.add(cam);
    });

    // Utility flood lights mounted on dome exterior (3 positions)
    const lightFixMat = new THREE.MeshStandardMaterial({ color: 0xd0cdc8, metalness: 0.8 });
    [[hz - 14, hx + 2.5, hy + 3.0, 0xfff4d0],
     [hz - 14, hx - 2.5, hy + 3.0, 0xfff4d0],
     [hz + 11, hx,       hy + 7.5, 0xfff0cc]].forEach(([fz, fx, fy, lc]) => {
      const fixGeo = new THREE.BoxGeometry(0.3, 0.2, 0.4);
      const fix = new THREE.Mesh(fixGeo, lightFixMat);
      fix.position.set(fx, fy, fz);
      group.add(fix);
      const pt = new THREE.PointLight(lc, 1.8, 14);
      pt.position.set(fx, fy - 0.3, fz);
      group.add(pt);
    });

    // =====================================================
    // 6. ROTATING STROBE BEACON ASSEMBLY (dome apex)
    // =====================================================
    this.habitatBeaconGroup = new THREE.Group();
    this.habitatBeaconGroup.position.set(hx, hy + 11.6, hz);

    const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 1.0, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 0.5;
    this.habitatBeaconGroup.add(pole);

    const lensGeo = new THREE.SphereGeometry(0.22, 12, 10);
    this.habitatBeaconLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    this.habitatBeaconLens.position.y = 1.1;
    this.habitatBeaconGroup.add(this.habitatBeaconLens);
    this.habitatBeaconLight = new THREE.PointLight(0x00e5ff, 2.5, 18);
    this.habitatBeaconLight.position.y = 1.1;
    this.habitatBeaconGroup.add(this.habitatBeaconLight);

    group.add(this.habitatBeaconGroup);

    // =====================================================
    // FINALIZE
    // =====================================================
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

  createDetailedSupplyCrate(podType, index, labelCode) {
    const group = new THREE.Group();

    // 1. Heavy composite reinforced chassis
    const bodyGeo = new THREE.BoxGeometry(1.25, 0.76, 0.95);
    const bodyColor = podType === 'o2' ? 0x243242 : podType === 'water' ? 0x223832 : 0x3d3024;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.65,
      roughness: 0.35
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 2. Corner bumpers (8 shock-absorbing rubberized composite corner brackets)
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.9, metalness: 0.2 });
    const cornerGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (const cx of [-0.63, 0.63]) {
      for (const cy of [-0.38, 0.38]) {
        for (const cz of [-0.48, 0.48]) {
          const bumper = new THREE.Mesh(cornerGeo, bumperMat);
          bumper.position.set(cx, cy, cz);
          group.add(bumper);
        }
      }
    }

    // 3. Exoskeletal structural ribs along perimeter
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x2f353d, metalness: 0.8, roughness: 0.25 });
    const ribGeoX = new THREE.BoxGeometry(1.28, 0.08, 0.08);
    for (const rz of [-0.46, 0.46]) {
      for (const ry of [-0.36, 0.36]) {
        const rib = new THREE.Mesh(ribGeoX, ribMat);
        rib.position.set(0, ry, rz);
        group.add(rib);
      }
    }

    // 4. Pressure seal latch clamps (safety yellow)
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xf5a623, metalness: 0.5, roughness: 0.4 });
    const latchGeo = new THREE.BoxGeometry(0.08, 0.12, 0.04);
    for (const lx of [-0.35, 0.35]) {
      const latch = new THREE.Mesh(latchGeo, latchMat);
      latch.position.set(lx, 0.1, 0.49);
      group.add(latch);
    }

    // 5. LED Status Strip & glowing point light
    let ledColorHex = 0x00e5ff;
    if (podType === 'water') ledColorHex = 0x00ff88;
    else if (podType === 'food') ledColorHex = 0xffaa00;

    const ledMat = new THREE.MeshBasicMaterial({ color: ledColorHex });
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 0.02), ledMat);
    ledStrip.position.set(0, 0.24, 0.485);
    group.add(ledStrip);

    const crateLight = new THREE.PointLight(ledColorHex, 1.2, 5);
    crateLight.position.set(0, 0.3, 0.6);
    group.add(crateLight);

    // 6. Pod-specific exterior payload hardware:
    if (podType === 'o2') {
      // Twin pressurized cryogenic O2 cylinders on top rack
      const tankGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.82, 12);
      tankGeo.rotateZ(Math.PI / 2);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, metalness: 0.85, roughness: 0.2 });
      for (const tz of [-0.18, 0.18]) {
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0, 0.46, tz);
        group.add(tank);

        const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x00c853 }));
        valve.rotation.z = Math.PI / 2;
        valve.position.set(0.44, 0.46, tz);
        group.add(valve);
      }
    } else if (podType === 'water') {
      // Insulated fluid reservoir tanks & conduits
      const flaskGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.55, 12);
      const flaskMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, metalness: 0.5, roughness: 0.3 });
      for (const fx of [-0.28, 0.28]) {
        const flask = new THREE.Mesh(flaskGeo, flaskMat);
        flask.position.set(fx, 0.44, 0);
        group.add(flask);
      }
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.06), ribMat);
      pipe.position.set(0, 0.55, 0);
      group.add(pipe);
    } else if (podType === 'food') {
      // Thermal freeze-dry cooling radiator heat sink fins
      const finGeo = new THREE.BoxGeometry(0.025, 0.2, 0.65);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x8a929e, metalness: 0.9, roughness: 0.2 });
      for (let i = -4; i <= 4; i++) {
        const fin = new THREE.Mesh(finGeo, finMat);
        fin.position.set(i * 0.075, 0.44, 0);
        group.add(fin);
      }
    }

    // 7. Top strobe beacon dome
    const strobeGeo = new THREE.SphereGeometry(0.07, 10, 8);
    const strobeMesh = new THREE.Mesh(strobeGeo, ledMat);
    strobeMesh.position.set(0, podType === 'water' ? 0.68 : 0.62, 0);
    group.add(strobeMesh);

    // 8. Floating Holographic Waypoint Marker
    const markerGeo = new THREE.OctahedronGeometry(0.18, 0);
    const markerMat = new THREE.MeshBasicMaterial({ color: ledColorHex, wireframe: true });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(0, 1.45, 0);
    group.add(marker);

    if (!this.crateMarkers) this.crateMarkers = [];
    this.crateMarkers.push({ marker, strobe: strobeMesh, light: crateLight });

    return group;
  }

  createFlightDataRecorder() {
    const group = new THREE.Group();

    // 1. Crash-survivable hi-vis safety orange armored housing
    const casingGeo = new THREE.BoxGeometry(0.85, 0.58, 0.65);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0xff4800, // NASA / FAA crash-survivable emergency safety orange
      metalness: 0.35,
      roughness: 0.4
    });
    const casing = new THREE.Mesh(casingGeo, casingMat);
    casing.castShadow = true;
    casing.receiveShadow = true;
    group.add(casing);

    // 2. White reflective crash stripes (high contrast visibility)
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    for (const sx of [-0.22, 0.22]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.59, 0.66), stripeMat);
      stripe.position.set(sx, 0, 0);
      group.add(stripe);
    }

    // 3. Titanium impact roll cage & perimeter brackets
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x2d3238, metalness: 0.85, roughness: 0.25 });
    const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.92, 8);
    railGeo.rotateZ(Math.PI / 2);
    for (const ry of [-0.28, 0.28]) {
      for (const rz of [-0.32, 0.32]) {
        const rail = new THREE.Mesh(railGeo, bracketMat);
        rail.position.set(0, ry, rz);
        group.add(rail);
      }
    }

    // 4. Underwater/Surface Acoustic Pinger Transducer (Brass cylinder on front face)
    const pingerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
    pingerGeo.rotateZ(Math.PI / 2);
    const pingerMat = new THREE.MeshStandardMaterial({ color: 0xcca033, metalness: 0.9, roughness: 0.2 });
    const pinger = new THREE.Mesh(pingerGeo, pingerMat);
    pinger.position.set(0.36, -0.05, 0.34);
    group.add(pinger);

    // 5. Hinged Access Lid (Top)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.29, -0.28); // Pivot axis at rear top edge
    const lidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.06, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x1a1e22, metalness: 0.7, roughness: 0.3 })
    );
    lidMesh.position.set(0, 0.03, 0.29);
    lidGroup.add(lidMesh);

    // Keypad / Telemetry display screen on lid
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc })
    );
    screenMesh.rotation.x = -Math.PI / 2;
    screenMesh.position.set(0, 0.065, 0.29);
    lidGroup.add(screenMesh);

    group.add(lidGroup);
    this.flightRecorderLid = lidGroup;

    // 6. High-Intensity Flashing Emergency Strobe Beacon Dome
    const strobeGeo = new THREE.SphereGeometry(0.09, 12, 10);
    this.flightRecorderStrobeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const strobeMesh = new THREE.Mesh(strobeGeo, this.flightRecorderStrobeMat);
    strobeMesh.position.set(-0.25, 0.36, 0.15);
    group.add(strobeMesh);

    // Dynamic Emergency Beacon PointLight
    this.flightRecorderLight = new THREE.PointLight(0xff4400, 2.5, 16);
    this.flightRecorderLight.position.set(-0.25, 0.6, 0.15);
    group.add(this.flightRecorderLight);

    // 7. Large Floating Holographic Waypoint Diamond (visible above rocks!)
    const beaconGeo = new THREE.OctahedronGeometry(0.32, 0);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff5500, wireframe: true });
    this.flightRecorderWaypoint = new THREE.Mesh(beaconGeo, beaconMat);
    this.flightRecorderWaypoint.position.set(0, 2.0, 0);
    group.add(this.flightRecorderWaypoint);

    return group;
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
      // 1. Suit Patch Kit
      const patchGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
      const patchMesh = new THREE.Mesh(patchGeo, new THREE.MeshStandardMaterial({ color: 0x00cc88 }));
      addInteractable('pickup', 'suit_patch', '[E] Pick up Suit Pressure Seal Kit', -14, -8, 0.2, patchMesh, () => {
        window.gameState.addItem('suit_patch');
        if (window.uiManager) window.uiManager.showBanner("🩹 SUIT PRESSURE SEAL KIT ACQUIRED! Open Inventory [Tab] to apply.");
      });

      // 2. Three Highly Detailed Cargo Pods (Oxygen, Water, Food)
      const crate1 = this.createDetailedSupplyCrate('o2', 1, 'POD A');
      addInteractable('crate', 'o2_canister', '[E] Search Cargo Pod A (Oxygen)', -23, -16, 0.38, crate1, () => {
        window.gameState.addItem('o2_canister');
        window.gameState.incrementObjective('find_supplies');
        if (window.uiManager) window.uiManager.showBanner("🫁 EMERGENCY O2 CYLINDER ACQUIRED!");
      });

      const crate2 = this.createDetailedSupplyCrate('water', 2, 'POD B');
      addInteractable('crate', 'hydration_pack', '[E] Search Cargo Pod B (Water)', -10, -18, 0.38, crate2, () => {
        window.gameState.addItem('hydration_pack');
        window.gameState.incrementObjective('find_supplies');
        if (window.uiManager) window.uiManager.showBanner("💧 ELECTROLYTE HYDRATION PACK ACQUIRED!");
      });

      const crate3 = this.createDetailedSupplyCrate('food', 3, 'POD C');
      addInteractable('crate', 'nutrient_paste', '[E] Search Cargo Pod C (Food)', -21, -6, 0.38, crate3, () => {
        window.gameState.addItem('nutrient_paste');
        window.gameState.incrementObjective('find_supplies');
        if (window.uiManager) window.uiManager.showBanner("🥫 CALORIC SURVIVAL PASTE ACQUIRED!");
      });

      // 3. Ares Rescue Flight Data Recorder ("Black Box") placed prominently at x=-13.5, z=-9.5
      const recorderMesh = this.createFlightDataRecorder();
      addInteractable('flight_recorder', 'keycard_hab', '[E] Decrypt Flight Data Recorder (Ares Black Box)', -13.5, -9.5, 0.3, recorderMesh, () => {
        if (window.gameState.hasItem('keycard_hab')) {
          if (window.uiManager) window.uiManager.showBanner("Flight data recorder already decrypted and keycard retrieved.");
        } else {
          if (window.uiManager) window.uiManager.openFlightRecorderModal();
        }
      });

      // 4. Habitat Alpha Airlock Door
      const airlockSensor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.3), new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
      addInteractable('door', null, '[E] Cycle Habitat Alpha Airlock', 0, 8.5, 1.8, airlockSensor, () => {
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

      // 3. Clean 3 Solar Panels (One-time interaction each!)
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
      // 1. Generator Hurricane Latches (One-time interaction!)
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

      // 2. Three Guidance Route Beacons (One-time activation each!)
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

    // Clear stuck keys if window loses focus
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

    // Hold-To-Sprint On-Screen Button Listeners (Touch & Mouse Support)
    const sprintBtn = document.getElementById('btn-hud-sprint');
    if (sprintBtn) {
      const startSprint = (e) => {
        if (e) e.preventDefault();
        this.onScreenSprintHeld = true;
        sprintBtn.classList.add('active');
      };

      const stopSprint = (e) => {
        if (e) e.preventDefault();
        this.onScreenSprintHeld = false;
        sprintBtn.classList.remove('active');
      };

      sprintBtn.addEventListener('pointerdown', startSprint);
      sprintBtn.addEventListener('pointerup', stopSprint);
      sprintBtn.addEventListener('pointercancel', stopSprint);
      sprintBtn.addEventListener('pointerleave', stopSprint);

      sprintBtn.addEventListener('touchstart', startSprint, { passive: false });
      sprintBtn.addEventListener('touchend', stopSprint, { passive: false });
      sprintBtn.addEventListener('touchcancel', stopSprint, { passive: false });
    }
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
    if (window.gameState.isPaused || window.gameState.inCutscene) return;

    // 1. Keep deep space celestial sphere centered with player camera
    if (this.skyGroup && this.camera) {
      this.skyGroup.position.copy(this.camera.position);
    }

    // 2. Flight Data Recorder emergency strobe flash & beacon diamond rotation
    if (this.flightRecorderWaypoint) {
      this.flightRecorderWaypoint.rotation.y += delta * 2.2;
      this.flightRecorderWaypoint.position.y = 2.0 + Math.sin(this.clock.getElapsedTime() * 4) * 0.12;
    }
    if (this.flightRecorderLight) {
      const flash = Math.sin(this.clock.getElapsedTime() * 8) > 0.35 ? 2.6 : 0.4;
      this.flightRecorderLight.intensity = flash;
    }

    // 3. Detailed Supply Crate waypoint markers & LED beacons
    if (this.crateMarkers) {
      const t = this.clock.getElapsedTime();
      this.crateMarkers.forEach((cm, i) => {
        if (cm.marker) {
          cm.marker.rotation.y += delta * 1.8;
          cm.marker.position.y = 1.45 + Math.sin(t * 3.5 + i * 2) * 0.08;
        }
      });
    }

    // 4. Perimeter Warning Beacons (Hazard strobes)
    if (this.perimeterStrobeMat) {
      const blink = Math.sin(this.clock.getElapsedTime() * 4) > 0.25 ? 0xff5500 : 0x441100;
      this.perimeterStrobeMat.color.setHex(blink);
    }

    // 5a. Habitat Alpha rotating beacon strobe
    if (this.habitatBeaconGroup) {
      this.habitatBeaconGroup.rotation.y += delta * 1.4;
      const t = this.clock.getElapsedTime();
      const beaconPulse = Math.sin(t * 6.5) > 0.2;
      if (this.habitatBeaconLens) {
        this.habitatBeaconLens.material.color.setHex(beaconPulse ? 0x00e5ff : 0x003344);
      }
      if (this.habitatBeaconLight) {
        this.habitatBeaconLight.intensity = beaconPulse ? 3.5 : 0.1;
      }
    }

    this.updatePlayerMovement(delta);
    this.updateViewModel(delta);
    this.updateRoverAI(delta);
    this.updateDustParticles(delta, this.isStormActive);
    this.updateRaycasting();

    // 5. Out of Playable Area Detection, Audible Alarm Siren & Hazard Warning
    const b = this.playableBounds;
    let distOut = 0;
    if (this.position.x < b.minX) distOut = Math.max(distOut, b.minX - this.position.x);
    if (this.position.x > b.maxX) distOut = Math.max(distOut, this.position.x - b.maxX);
    if (this.position.z < b.minZ) distOut = Math.max(distOut, b.minZ - this.position.z);
    if (this.position.z > b.maxZ) distOut = Math.max(distOut, this.position.z - b.maxZ);

    const isOutOfBounds = distOut > 0;
    const vignetteElem = document.getElementById('oob-alarm-vignette');
    const warningElem = document.getElementById('hud-oob-warning');
    const timerElem = document.getElementById('oob-timer-text');

    if (isOutOfBounds) {
      if (!this.isOutOfBounds) {
        this.isOutOfBounds = true;
        this.oobTimer = 10.0;
        if (window.soundSystem) window.soundSystem.playOutOfBoundsAlarm();
      } else {
        this.oobTimer -= delta;
      }

      // Audible high-urgency siren alarm pulses every 0.75 seconds
      const nowTime = this.clock.getElapsedTime();
      if (nowTime - this.lastAlarmSoundTime > 0.75) {
        this.lastAlarmSoundTime = nowTime;
        if (window.soundSystem) window.soundSystem.playOutOfBoundsAlarm();
      }

      // Show Flashing Hazard UI & Red Vignette
      if (vignetteElem) vignetteElem.classList.remove('hidden');
      if (warningElem) warningElem.classList.remove('hidden');
      if (timerElem) {
        const sec = Math.max(1, Math.ceil(this.oobTimer));
        timerElem.textContent = `EMERGENCY AUTOPILOT RECALL IN ${sec}s — RETURN TO MISSION SECTOR (${Math.round(distOut)}m OUTSIDE)`;
      }

      // Automatic safety recall if out for 10s or wandered more than 40m
      if (this.oobTimer <= 0 || distOut > 40) {
        this.position.x = Math.max(b.minX + 3, Math.min(b.maxX - 3, this.position.x));
        this.position.z = Math.max(b.minZ + 3, Math.min(b.maxZ - 3, this.position.z));
        this.position.y = this.getTerrainHeight(this.position.x, this.position.z) + this.playerHeight;
        this.velocity.set(0, 0, 0);
        this.isOutOfBounds = false;
        this.oobTimer = 10.0;
        if (vignetteElem) vignetteElem.classList.add('hidden');
        if (warningElem) warningElem.classList.add('hidden');
        if (window.soundSystem) window.soundSystem.playRadioBeep();
        if (window.uiManager) {
          window.uiManager.showBanner("🚀 EMERGENCY AUTOPILOT RECALL: Returned safely to mission sector perimeter.");
        }
      }
    } else {
      if (this.isOutOfBounds) {
        this.isOutOfBounds = false;
        this.oobTimer = 10.0;
        if (vignetteElem) vignetteElem.classList.add('hidden');
        if (warningElem) warningElem.classList.add('hidden');
        if (window.soundSystem) window.soundSystem.playRadioBeep();
        if (window.uiManager) {
          window.uiManager.showBanner("✅ RE-ENTERED MISSION AREA — Life support & telemetry stabilized.");
        }
      }
    }

    // Check if player is outdoors vs inside Habitat safe haven
    const distToHab = Math.hypot(this.position.x, this.position.z - 25);
    const isOutdoors = distToHab > 9.5;

    window.gameState.updateResources(delta, isOutdoors);
  }

  updatePlayerMovement(delta) {
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.onScreenSprintHeld;
    window.gameState.isSprinting = isSprinting;
    // Exactly double player speed when sprint is held (4.2 * 2 = 8.4)
    const speed = isSprinting ? 8.4 : 4.2;

    // Sync on-screen sprint button UI state
    const sprintBtn = document.getElementById('btn-hud-sprint');
    if (sprintBtn) {
      if (isSprinting) sprintBtn.classList.add('active');
      else sprintBtn.classList.remove('active');
    }

    const moveVector = new THREE.Vector3(0, 0, 0);
    // Support both WASD and Arrow Keys
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVector.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVector.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVector.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVector.x += 1;

    // Dynamic speed lines visual effect
    const sprintLines = document.getElementById('sprint-lines-fx');
    if (sprintLines) {
      if (isSprinting && moveVector.lengthSq() > 0) {
        sprintLines.classList.add('active');
      } else {
        sprintLines.classList.remove('active');
      }
    }

    // Dynamic FOV kick while sprinting (smooth transition)
    const targetFov = isSprinting ? 80 : 72;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * delta * 8;
      this.camera.updateProjectionMatrix();
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyEuler(new THREE.Euler(0, this.euler.y, 0));

      const targetVx = moveVector.x * speed;
      const targetVz = moveVector.z * speed;
      this.velocity.x += (targetVx - this.velocity.x) * 12 * delta;
      this.velocity.z += (targetVz - this.velocity.z) * 12 * delta;

      this.bobTimer += delta * (isSprinting ? 15 : 7.5);
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

    // Axis-independent collision detection for smooth wall-sliding & unsticking
    let canMoveX = true;
    for (const c of this.colliders) {
      if (c.type === 'sphere') {
        const d = Math.hypot(nextX - c.x, this.position.z - c.z);
        if (d < c.radius + this.playerRadius) {
          const curD = Math.hypot(this.position.x - c.x, this.position.z - c.z);
          // Allow moving away from center if already inside
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
          // Allow moving away from center if already inside
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

    // Global terrain boundary limit (prevents walking off the outer edge of the 640m landscape)
    const maxWorldRadius = 295;
    const nextDist = Math.hypot(nextX, nextZ);
    if (nextDist > maxWorldRadius) {
      const curDist = Math.hypot(this.position.x, this.position.z);
      if (nextDist >= curDist) {
        canMoveX = false;
        canMoveZ = false;
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

    // 1. Waypoint Patrol Interpolation
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

    // 2. Rotating Hazard Light
    if (this.roverBeaconMat) {
      const blink = Math.sin(this.clock.getElapsedTime() * 10) > 0;
      this.roverBeaconMat.color.setHex(blink ? 0xff2200 : 0x440000);
    }

    // 3. Player Proximity, Searchlight Cone & Occlusion Check
    const toPlayerX = this.position.x - this.rover.position.x;
    const toPlayerZ = this.position.z - this.rover.position.z;
    const distToPlayer = Math.hypot(toPlayerX, toPlayerZ);

    const forwardX = Math.sin(this.rover.rotation.y);
    const forwardZ = Math.cos(this.rover.rotation.y);
    const dot = (toPlayerX * forwardX + toPlayerZ * forwardZ) / Math.max(1, distToPlayer);

    // Line of sight occlusion check with rocks/cover
    let isCovered = false;
    for (const c of this.colliders) {
      if (c.type === 'sphere') {
        const dRoverRock = Math.hypot(c.x - this.rover.position.x, c.z - this.rover.position.z);
        const dPlayerRock = Math.hypot(this.position.x - c.x, this.position.z - c.z);
        if (dRoverRock + dPlayerRock < distToPlayer + 1.2) {
          isCovered = true; // Rock is directly between rover and player!
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

    // EMP Shock if caught in searchlight
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
