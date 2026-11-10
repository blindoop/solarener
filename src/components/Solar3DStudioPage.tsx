import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { computeSunTelemetry, SunTelemetry } from '../utils/solarPlanner';

export type CameraPreset = 'overview' | 'roof' | 'battery' | 'courtyard';

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  overview: {
    pos: [15.5, 10.2, 16.5],
    target: [0, 2.2, 0],
    label: 'Umumiy 3D ko‘rinish',
  },
  roof: {
    pos: [6.2, 11.8, 7.8],
    target: [0, 4.6, 0],
    label: 'Quyosh panellari qatlami',
  },
  battery: {
    pos: [8.8, 3.6, 6.2],
    target: [4.2, 1.8, 1.2],
    label: 'Aqlli kontroller va batareya',
  },
  courtyard: {
    pos: [-10.5, 4.5, 12.8],
    target: [-1.2, 1.8, 2.0],
    label: 'Oilaviy hovli va ayvon',
  },
};

function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c1f3f';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle silicon wafer grid
  ctx.strokeStyle = '#1e3f73';
  ctx.lineWidth = 3;
  const cols = 6;
  const rows = 10;
  for (let c = 0; c <= cols; c++) {
    const x = (c / cols) * 512;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const y = (r / rows) * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Silver busbars
  ctx.strokeStyle = 'rgba(180, 215, 255, 0.32)';
  ctx.lineWidth = 1.5;
  for (let c = 0; c < cols; c++) {
    const cx = ((c + 0.5) / cols) * 512;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, 512);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createCourtyardStoneTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#26303d';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#1b232e';
  ctx.lineWidth = 4;
  const step = 64;
  for (let y = 0; y < 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = (y / step) % 2 === 0 ? 0 : step / 2;
    for (let x = offset; x < 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + step);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

interface Solar3DStudioPageProps {
  onNavigateQuote: () => void;
}

export default function Solar3DStudioPage({
  onNavigateQuote,
}: Solar3DStudioPageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [hour, setHour] = useState<number>(14.5);
  const [exploded, setExploded] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [touchOrbitEnabled, setTouchOrbitEnabled] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<SunTelemetry>(() =>
    computeSunTelemetry(14.5, 13.2)
  );

  // Refs synced into the 3D render loop without re-creating the WebGL context
  const hourRef = useRef<number>(14.5);
  const explodedRef = useRef<number>(0);
  const presetRef = useRef<CameraPreset>('overview');
  const presetTransitionRef = useRef<boolean>(false);
  const autoOrbitRef = useRef<boolean>(true);

  const handleHourChange = (nextHour: number) => {
    setHour(nextHour);
    hourRef.current = nextHour;
    setTelemetry(computeSunTelemetry(nextHour, 13.2));
  };

  const handleExplodedChange = (val: number) => {
    setExploded(val);
    explodedRef.current = val;
  };

  const handlePresetSelect = (preset: CameraPreset) => {
    setCameraPreset(preset);
    presetRef.current = preset;
    presetTransitionRef.current = true;
  };

  const handleToggleAutoOrbit = () => {
    setAutoOrbit((prev) => {
      const next = !prev;
      autoOrbitRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const skyColorDay = new THREE.Color(0xdbe8f8);
    const skyColorDusk = new THREE.Color(0x0b1426);
    scene.background = skyColorDay.clone();
    scene.fog = new THREE.FogExp2(0xdbe8f8, 0.016);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const getAspectScale = () => {
      const asp = container.clientWidth / Math.max(1, container.clientHeight);
      return asp < 1 ? Math.min(1.52, 1 / Math.pow(asp, 0.45)) : 1;
    };

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    const initScale = getAspectScale();
    camera.position.set(
      CAMERA_PRESETS.overview.pos[0] * initScale,
      CAMERA_PRESETS.overview.pos[1] * initScale,
      CAMERA_PRESETS.overview.pos[2] * initScale
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 5;
    controls.maxDistance = 42;

    const onControlStart = () => {
      presetTransitionRef.current = false;
      autoOrbitRef.current = false;
      setAutoOrbit(false);
    };
    controls.addEventListener('start', onControlStart);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const solarCellTex = createSolarCellTexture(maxAniso);
    const courtyardStoneTex = createCourtyardStoneTexture(maxAniso);

    // Lighting rig: warm key sun + cool hemisphere + gentle rim light
    const hemiLight = new THREE.HemisphereLight(0xdceeff, 0x243428, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d0, 2.6);
    sunLight.position.set(12, 18, 10);
    sunLight.castShadow = !isSoftwareGl;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 55;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x7cb8ff, 0.7);
    rimLight.position.set(-14, 9, -12);
    scene.add(rimLight);

    const porchPointLight = new THREE.PointLight(0xffa94d, 0, 14, 1.6);
    porchPointLight.position.set(0.5, 2.7, 4.6);
    scene.add(porchPointLight);

    // Outdoor terrain ground (extended far beyond courtyard, no indoor walls)
    const groundGeo = new THREE.CircleGeometry(85, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x223328,
      roughness: 0.92,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Paved courtyard terrace (offset Y by 0.03 to prevent Z-fighting)
    const patioGeo = new THREE.BoxGeometry(16.5, 0.12, 13.5);
    const patioMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: courtyardStoneTex,
      roughness: 0.78,
      metalness: 0.12,
    });
    const patioMesh = new THREE.Mesh(patioGeo, patioMat);
    patioMesh.position.set(0, 0.06, 1.2);
    patioMesh.receiveShadow = true;
    scene.add(patioMesh);

    // Soft contact shadow disc under the house
    const contactGeo = new THREE.CircleGeometry(9.5, 32);
    contactGeo.rotateX(-Math.PI / 2);
    const contactMat = new THREE.MeshBasicMaterial({
      color: 0x050911,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(contactGeo, contactMat);
    contactShadow.position.set(0, 0.13, 0.2);
    scene.add(contactShadow);

    // Composite 3-12 part procedural Uzbek Solar Family House Group
    const houseRoot = new THREE.Group();
    scene.add(houseRoot);

    // 1. Primary Silhouette: Main Charcoal Timber & Travertine Walls + Foundation
    const foundationMat = new THREE.MeshStandardMaterial({
      color: 0x3b424c,
      roughness: 0.85,
      metalness: 0.1,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x242a34,
      roughness: 0.72,
      metalness: 0.18,
    });
    const timberMat = new THREE.MeshStandardMaterial({
      color: 0x8f5b34,
      roughness: 0.55,
      metalness: 0.12,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x151920,
      roughness: 0.35,
      metalness: 0.75,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x8ab4d8,
      emissive: 0xff9e3d,
      emissiveIntensity: 0.1,
      roughness: 0.15,
      metalness: 0.85,
    });

    const foundation = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 0.38, 7.4),
      foundationMat
    );
    foundation.position.set(0, 0.25, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    houseRoot.add(foundation);

    const mainWalls = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 3.3, 6.8),
      wallMat
    );
    mainWalls.position.set(0, 2.09, 0);
    mainWalls.castShadow = true;
    mainWalls.receiveShadow = true;
    houseRoot.add(mainWalls);

    // Uzbek courtyard Ayvon (Timber Pergola Porch) on the front right
    const ayvonGroup = new THREE.Group();
    ayvonGroup.position.set(1.8, 0.44, 4.1);
    const pillarGeo = new THREE.BoxGeometry(0.24, 3.0, 0.24);
    for (const px of [-2.0, 0, 2.0]) {
      const pillar = new THREE.Mesh(pillarGeo, timberMat);
      pillar.position.set(px, 1.5, 0.7);
      pillar.castShadow = true;
      ayvonGroup.add(pillar);
    }
    const beamMain = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.22, 0.28),
      timberMat
    );
    beamMain.position.set(0, 2.95, 0.7);
    ayvonGroup.add(beamMain);
    for (let rx = -2.0; rx <= 2.0; rx += 0.5) {
      const rafter = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.14, 1.8),
        timberMat
      );
      rafter.position.set(rx, 3.08, 0);
      ayvonGroup.add(rafter);
    }
    houseRoot.add(ayvonGroup);

    // Glowing family room windows along the front facade
    const windowGeo = new THREE.BoxGeometry(0.82, 1.75, 0.08);
    const windowFrameGeo = new THREE.BoxGeometry(0.94, 1.87, 0.06);
    for (const wx of [-3.6, -2.3, -1.0, 0.8, 2.6]) {
      const wFrame = new THREE.Mesh(windowFrameGeo, frameMat);
      wFrame.position.set(wx, 2.1, 3.41);
      houseRoot.add(wFrame);

      const pane = new THREE.Mesh(windowGeo, windowMat);
      pane.position.set(wx, 2.1, 3.43);
      houseRoot.add(pane);
    }

    // 2. Secondary Read: Standing-Seam Metal Roof Group (elevates in Exploded mode)
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 3.74, 0);
    houseRoot.add(roofGroup);

    const roofShape = new THREE.Shape();
    roofShape.moveTo(-3.8, 0);
    roofShape.lineTo(0, 2.25);
    roofShape.lineTo(3.8, 0);
    roofShape.closePath();

    const roofExtrude = new THREE.ExtrudeGeometry(roofShape, {
      depth: 10.8,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    roofExtrude.center();
    roofExtrude.rotateY(Math.PI / 2);

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1b2432,
      roughness: 0.38,
      metalness: 0.68,
    });
    const roofPrism = new THREE.Mesh(roofExtrude, roofMat);
    roofPrism.position.set(0, 1.12, 0);
    roofPrism.castShadow = true;
    roofPrism.receiveShadow = true;
    roofGroup.add(roofPrism);

    // Architectural Structural Trusses inside the roof (visible when roof explodes)
    const trussGroup = new THREE.Group();
    trussGroup.position.set(0, 3.78, 0);
    for (let tx = -4.2; tx <= 4.2; tx += 1.4) {
      const tieBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.16, 6.6),
        timberMat
      );
      tieBeam.position.set(tx, 0.08, 0);
      trussGroup.add(tieBeam);

      const kingPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.9, 0.14),
        timberMat
      );
      kingPost.position.set(tx, 1.0, 0);
      trussGroup.add(kingPost);
    }
    houseRoot.add(trussGroup);

    // 3. Accent Detail: 24-Panel Monocrystalline Solar Array Group (elevates higher in Exploded mode)
    const solarArrayGroup = new THREE.Group();
    solarArrayGroup.position.set(0, 4.95, 1.85);
    // Match front roof slope angle: atan2(2.25, 3.8) ≈ 0.5346 rad
    const slopeAngle = Math.atan2(2.25, 3.8);
    solarArrayGroup.rotation.x = slopeAngle;
    houseRoot.add(solarArrayGroup);

    const panelFrameGeo = new THREE.BoxGeometry(1.12, 0.06, 1.68);
    const panelCellGeo = new THREE.BoxGeometry(1.04, 0.07, 1.6);
    const panelCellMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: solarCellTex,
      roughness: 0.12,
      metalness: 0.65,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const cols = 8;
    const rows = 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = (c - (cols - 1) / 2) * 1.18;
        const pz = (r - (rows - 1) / 2) * 1.76;

        const pFrame = new THREE.Mesh(panelFrameGeo, frameMat);
        pFrame.position.set(px, 0, pz);
        pFrame.castShadow = true;
        solarArrayGroup.add(pFrame);

        const pCell = new THREE.Mesh(panelCellGeo, panelCellMat);
        pCell.position.set(px, 0.01, pz);
        solarArrayGroup.add(pCell);
      }
    }

    // Smart Controller & LFP Home Battery Pack mounted on the right side wall
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(5.22, 1.65, 1.2);
    houseRoot.add(batteryGroup);

    const batteryBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 1.65, 1.15),
      new THREE.MeshStandardMaterial({
        color: 0xeef3f9,
        roughness: 0.25,
        metalness: 0.4,
      })
    );
    batteryBody.castShadow = true;
    batteryGroup.add(batteryBody);

    const controllerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.72, 0.58),
      new THREE.MeshStandardMaterial({
        color: 0x161f2c,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    controllerBox.position.set(0, 0.45, -0.98);
    batteryGroup.add(controllerBox);

    const socBarMat = new THREE.MeshStandardMaterial({
      color: 0xc8f064,
      emissive: 0xa8e034,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const socBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.39, 1.2, 0.08),
      socBarMat
    );
    socBar.position.set(0.01, 0, 0.35);
    batteryGroup.add(socBar);

    // Conduit pipe from solar roof to Smart Controller
    const conduitCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(4.6, 4.4, 1.4),
      new THREE.Vector3(5.25, 3.8, 0.25),
      new THREE.Vector3(5.25, 2.2, 0.25),
      new THREE.Vector3(5.25, 1.65, 1.2),
      new THREE.Vector3(3.2, 1.65, 3.4),
    ]);
    const conduitGeo = new THREE.TubeGeometry(conduitCurve, 32, 0.045, 8, false);
    const conduitMesh = new THREE.Mesh(conduitGeo, frameMat);
    houseRoot.add(conduitMesh);

    // Animated Energy Flow Particles along the conduit (InstancedMesh)
    const particleCount = 24;
    const particleGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xd8ee8e });
    const energyParticles = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      particleCount
    );
    energyParticles.frustumCulled = false;
    houseRoot.add(energyParticles);

    // Surrounding Uzbek garden cypress & fruit trees (InstancedMesh > 20 instances)
    const treeCount = 26;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.3, 8);
    trunkGeo.translate(0, 0.65, 0);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5c4028,
      roughness: 0.88,
    });
    const canopyGeo = new THREE.ConeGeometry(1.15, 3.4, 10);
    canopyGeo.translate(0, 2.6, 0);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
    });

    const trunksInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const canopiesInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    trunksInst.castShadow = !isSoftwareGl;
    canopiesInst.castShadow = !isSoftwareGl;

    const dummyMat = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();
    const tintColor = new THREE.Color();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 14 + (i % 3) * 4.2 + Math.sin(i * 2.1) * 1.8;
      // Leave front camera view open
      const adjustedAngle = angle * 0.78 + Math.PI * 0.62;
      dummyPos.set(
        Math.cos(adjustedAngle) * radius,
        0,
        Math.sin(adjustedAngle) * radius - 2.0
      );
      const s = 0.85 + (i % 5) * 0.08;
      dummyScale.set(s, s * (0.9 + (i % 3) * 0.12), s);
      dummyMat.compose(dummyPos, dummyQuat, dummyScale);
      trunksInst.setMatrixAt(i, dummyMat);
      canopiesInst.setMatrixAt(i, dummyMat);

      tintColor.setHSL(0.28 + (i % 4) * 0.02, 0.42, 0.24 + (i % 3) * 0.04);
      canopiesInst.setColorAt(i, tintColor);
    }
    trunksInst.instanceMatrix.needsUpdate = true;
    canopiesInst.instanceMatrix.needsUpdate = true;
    if (canopiesInst.instanceColor) canopiesInst.instanceColor.needsUpdate = true;
    trunksInst.computeBoundingSphere();
    canopiesInst.computeBoundingSphere();
    scene.add(trunksInst);
    scene.add(canopiesInst);

    // 3D Sun Orb in the sky
    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff3b8 })
    );
    scene.add(sunOrb);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pre-allocated scratch vectors for zero-GC render loop
    const _targetCamPos = new THREE.Vector3();
    const _targetLook = new THREE.Vector3();
    const _curvePoint = new THREE.Vector3();
    const _particleScale = new THREE.Vector3(1, 1, 1);
    const _skyColor = new THREE.Color();
    const startTimeMs = performance.now();
    let lastTimeMs = startTimeMs;

    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.1);
      lastTimeMs = nowMs;
      const elapsed = (nowMs - startTimeMs) / 1000;

      // 1. Update Sun position & sky atmosphere from hourRef
      const h = hourRef.current;
      const dayNorm = Math.max(0, Math.min(1, (h - 6) / 13.5));
      const sunAngle = dayNorm * Math.PI;
      const isDay = h >= 6 && h <= 19.5;
      const sunElev = isDay ? Math.sin(sunAngle) : -0.2;
      const sunX = Math.cos(sunAngle) * -22;
      const sunY = Math.max(1.2, Math.sin(sunAngle) * 20);
      const sunZ = 9.5;

      sunLight.position.set(sunX, sunY, sunZ);
      sunOrb.position.set(sunX * 0.85, sunY * 0.85, sunZ * 0.85);
      sunOrb.visible = isDay && sunElev > 0.02;

      const dayBlend = THREE.MathUtils.clamp(sunElev * 1.4, 0, 1);
      _skyColor.lerpColors(skyColorDusk, skyColorDay, dayBlend);
      scene.background = _skyColor;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(_skyColor);
      }

      sunLight.intensity = THREE.MathUtils.lerp(0.15, 2.8, dayBlend);
      hemiLight.intensity = THREE.MathUtils.lerp(0.28, 0.9, dayBlend);
      windowMat.emissiveIntensity = THREE.MathUtils.lerp(1.6, 0.08, dayBlend);
      porchPointLight.intensity = THREE.MathUtils.lerp(2.4, 0.0, dayBlend);

      // 2. Smooth exponential damping for Exploded 3D Roof & Solar Array layers
      const expTarget = explodedRef.current;
      const targetRoofY = 3.74 + expTarget * 1.85;
      const targetSolarY = 4.95 + expTarget * 3.85;
      const targetBatteryX = 5.22 + expTarget * 1.25;

      roofGroup.position.y = THREE.MathUtils.damp(
        roofGroup.position.y,
        targetRoofY,
        6,
        dt
      );
      solarArrayGroup.position.y = THREE.MathUtils.damp(
        solarArrayGroup.position.y,
        targetSolarY,
        6,
        dt
      );
      batteryGroup.position.x = THREE.MathUtils.damp(
        batteryGroup.position.x,
        targetBatteryX,
        6,
        dt
      );

      // 3. Animate energy flow particles along conduit
      const flowSpeed = isDay ? 0.35 + dayBlend * 0.55 : -0.25;
      for (let i = 0; i < particleCount; i++) {
        let u = ((i / particleCount) + elapsed * flowSpeed) % 1;
        if (u < 0) u += 1;
        conduitCurve.getPointAt(u, _curvePoint);
        const pulse = 0.75 + 0.35 * Math.sin(elapsed * 5 + i);
        _particleScale.setScalar(pulse);
        dummyMat.compose(_curvePoint, dummyQuat, _particleScale);
        energyParticles.setMatrixAt(i, dummyMat);
      }
      energyParticles.instanceMatrix.needsUpdate = true;

      // 4. Smooth Camera Preset Transitions or subtle auto-orbit
      if (presetTransitionRef.current) {
        const preset = CAMERA_PRESETS[presetRef.current];
        const pScale = getAspectScale();
        _targetCamPos.set(
          preset.pos[0] * pScale,
          preset.pos[1] * pScale,
          preset.pos[2] * pScale
        );
        _targetLook.set(...preset.target);

        camera.position.lerp(_targetCamPos, 1 - Math.exp(-5.5 * dt));
        controls.target.lerp(_targetLook, 1 - Math.exp(-5.5 * dt));

        if (
          camera.position.distanceTo(_targetCamPos) < 0.08 &&
          controls.target.distanceTo(_targetLook) < 0.08
        ) {
          presetTransitionRef.current = false;
        }
      } else if (autoOrbitRef.current && !isSoftwareGl) {
        const orbitSpeed = 0.14 * dt;
        const offsetX = camera.position.x - controls.target.x;
        const offsetZ = camera.position.z - controls.target.z;
        const cosA = Math.cos(orbitSpeed);
        const sinA = Math.sin(orbitSpeed);
        camera.position.x = controls.target.x + offsetX * cosA - offsetZ * sinA;
        camera.position.z = controls.target.z + offsetX * sinA + offsetZ * cosA;
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      solarCellTex.dispose();
      courtyardStoneTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const formattedHour = `${String(Math.floor(hour)).padStart(2, '0')}:${
    hour % 1 >= 0.5 ? '30' : '00'
  }`;

  return (
    <section
      className="w-full bg-[#0b1426] text-white py-14 sm:py-20 px-4 sm:px-6 md:px-12 border-t border-white/10"
      data-testid="solar-3d-studio"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header & Live Telemetry Bar (Above 3D Stage — Zero Overlap on 3D Model) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 sm:pb-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#d8ee8e]">
              01. Interaktiv 3D Arxitektura · Toshkent namunaviy xonadoni
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
              3D Aqlli Quyosh Tizimi
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              Quyosh vaqtini o‘zgartiring, tom qatlamlarini 3D formatda ajratib
              ko‘ring yoki kamera burchaklarini almashtiring.
            </p>
          </div>

          {/* Live Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 sm:gap-4 rounded-xl bg-[#111c33] border border-white/10 px-3.5 py-2.5 text-xs tabular-nums shrink-0">
            <span>
              Vaqt: <strong className="text-[#d8ee8e]">{formattedHour}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>
              Quvvat:{' '}
              <strong className="text-white">
                {telemetry.solarGenerationKw} kVt
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>
              Sarf:{' '}
              <strong className="text-white">
                {telemetry.homeConsumptionKw} kVt
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>
              Batareya:{' '}
              <strong className="text-[#d8ee8e]">
                {telemetry.batteryChargePct}%
              </strong>
            </span>
          </div>
        </div>

        {/* Dedicated Unobstructed 3D WebGL Viewport Card */}
        <div className="relative w-full h-[330px] sm:h-[440px] lg:h-[540px] rounded-2xl overflow-hidden border border-white/15 bg-[#081020] shadow-2xl">
          <div
            ref={mountRef}
            className={`w-full h-full ${
              touchOrbitEnabled
                ? 'pointer-events-auto touch-none'
                : 'pointer-events-none md:pointer-events-auto'
            }`}
          />

          {/* Mobile Touch-Scroll Guard Toggle (Prevents getting stuck while scrolling on phone) */}
          <div className="absolute top-3 right-3 z-10 md:hidden">
            <button
              type="button"
              onClick={() => setTouchOrbitEnabled((prev) => !prev)}
              className={`
                min-h-[34px] px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border transition-colors
                ${
                  touchOrbitEnabled
                    ? 'bg-[#d8ee8e] text-[#0d1626] border-[#d8ee8e] font-semibold'
                    : 'bg-[#0d1626]/90 text-slate-200 border-white/20'
                }
              `}
            >
              {touchOrbitEnabled
                ? '✓ 3D Aylantirish faol (Yopish)'
                : '✋ 3D Barmoq bilan aylantirish'}
            </button>
          </div>
        </div>

        {/* Dedicated 3D Control Dock Directly Below the 3D Stage */}
        <div className="mt-4 rounded-2xl bg-[#111c33] border border-white/15 p-4 sm:p-5 text-white shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            {/* Sun Time Slider */}
            <div className="lg:col-span-4 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300 tabular-nums">
                <label htmlFor="sun-time-slider">Quyosh vaqti</label>
                <span className="font-medium text-[#d8ee8e]">
                  {formattedHour} ({telemetry.sunElevationDeg}°)
                </span>
              </div>
              <input
                id="sun-time-slider"
                type="range"
                min={5.5}
                max={21.5}
                step={0.5}
                value={hour}
                onChange={(e) => handleHourChange(parseFloat(e.target.value))}
                className="w-full h-6 accent-[#d8ee8e] cursor-pointer"
              />
            </div>

            {/* Exploded 3D Layer Slider */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-300 tabular-nums">
                <label htmlFor="exploded-slider">3D Tom qatlamlari</label>
                <span className="font-medium text-[#d8ee8e]">
                  {Math.round(exploded * 100)}%
                </span>
              </div>
              <input
                id="exploded-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={exploded}
                onChange={(e) =>
                  handleExplodedChange(parseFloat(e.target.value))
                }
                className="w-full h-6 accent-[#d8ee8e] cursor-pointer"
              />
            </div>

            {/* Camera Viewpoint Buttons */}
            <div className=" sm:col-span-2 lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-1.5">
              {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((key) => {
                const active = cameraPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`
                      flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium
                      transition-colors whitespace-nowrap text-center
                      ${
                        active
                          ? 'bg-white text-[#0d1626] font-semibold'
                          : 'bg-[#0b1426] text-slate-200 border border-white/10 hover:bg-white/15'
                      }
                    `}
                  >
                    {key === 'overview' && 'Umumiy'}
                    {key === 'roof' && 'Quyosh tomi'}
                    {key === 'battery' && 'Batareya'}
                    {key === 'courtyard' && 'Ayvon'}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleToggleAutoOrbit}
                aria-pressed={autoOrbit}
                className={`
                  flex-1 sm:flex-initial min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium
                  transition-colors whitespace-nowrap text-center
                  ${
                    autoOrbit
                      ? 'bg-[#d8ee8e]/20 text-[#d8ee8e] border border-[#d8ee8e]/40'
                      : 'bg-[#0b1426] text-slate-300 border border-white/10 hover:bg-white/15'
                  }
                `}
              >
                360° Aylanish
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
