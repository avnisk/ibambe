"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  Layers,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Move3d,
} from "lucide-react";

interface StationConfig {
  id: number;
  code: string;
  name: string;
  shortName: string;
  type: string;
  description: string;
  status: string;
  speed: string;
  cycleTime: string;
  completed: number;
  pos: { x: number; y: number; z: number };
  hudOffset: { x: number; y: number; z: number };
}

const INITIAL_STATIONS: StationConfig[] = [
  {
    id: 1,
    code: "ST-01",
    name: "Cutting Machine",
    shortName: "Cutting",
    type: "LSR-4020",
    description: "Cuts raw metal sheets into required precision dimensions using a high-power fiber laser.",
    status: "Running",
    speed: "120 mm/s",
    cycleTime: "3.5s",
    completed: 15,
    pos: { x: -13.5, y: 0, z: -4.5 },
    hudOffset: { x: 0, y: 4.3, z: 0 },
  },
  {
    id: 2,
    code: "ST-02",
    name: "Milling Machine",
    shortName: "Milling",
    type: "CNC-VMC85",
    description: "Shapes and machines the cut components with high-RPM multi-axis CNC tooling.",
    status: "Running",
    speed: "8500 RPM",
    cycleTime: "4.0s",
    completed: 15,
    pos: { x: -4.5, y: 0, z: -4.5 },
    hudOffset: { x: 0, y: 4.5, z: 0 },
  },
  {
    id: 3,
    code: "ST-03",
    name: "Welding Station",
    shortName: "Welding",
    type: "ER8-1450",
    description: "Articulated 6-axis industrial robot arm joins the individual machined components.",
    status: "Running",
    speed: "45 mm/s",
    cycleTime: "4.2s",
    completed: 15,
    pos: { x: 5.0, y: 0, z: -4.5 },
    hudOffset: { x: 0, y: 4.6, z: 0 },
  },
  {
    id: 4,
    code: "ST-04",
    name: "Painting Station",
    shortName: "Painting",
    type: "COAT-PRO7",
    description: "Automated electrostatic spray booth applies protective and decorative industrial coating.",
    status: "Running",
    speed: "2.4 bar",
    cycleTime: "3.8s",
    completed: 15,
    pos: { x: 5.0, y: 0, z: 4.5 },
    hudOffset: { x: 0, y: 4.5, z: 0 },
  },
  {
    id: 5,
    code: "ST-05",
    name: "Assembly Station",
    shortName: "Assembly",
    type: "ER35B-1810",
    description: "Precision robotic arm combines internal sub-components into the final product.",
    status: "Running",
    speed: "1.8 m/s",
    cycleTime: "3.6s",
    completed: 15,
    pos: { x: -4.5, y: 0, z: 4.5 },
    hudOffset: { x: 0, y: 4.5, z: 0 },
  },
  {
    id: 6,
    code: "ST-06",
    name: "Packaging Station",
    shortName: "Packaging",
    type: "PKG-AUTO9",
    description: "Automated boxing, sealing, and palletizing station packages the finished product.",
    status: "Running",
    speed: "18 box/m",
    cycleTime: "3.2s",
    completed: 15,
    pos: { x: -13.5, y: 0, z: 4.5 },
    hudOffset: { x: 0, y: 4.3, z: 0 },
  },
];

interface WorkOrder {
  id: string;
  product: string;
  drawing: string;
  target: number;
  produced: number;
  status: "In Progress" | "Completed";
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  { id: "WO2026111705", product: "ServoDrive-X200", drawing: "TH-06-204", target: 20, produced: 15, status: "In Progress" },
  { id: "WO2026111704", product: "ServoDrive-X200", drawing: "TH-06-204", target: 25, produced: 25, status: "Completed" },
  { id: "WO2026111703", product: "Actuator-M90", drawing: "TH-04-112", target: 30, produced: 30, status: "Completed" },
  { id: "WO2026111702", product: "GearBox-H40", drawing: "TH-02-089", target: 20, produced: 20, status: "Completed" },
  { id: "WO2026111701", product: "ServoDrive-X200", drawing: "TH-06-204", target: 15, produced: 15, status: "Completed" },
];

const CAMERA_PRESETS = [
  { pos: new THREE.Vector3(0, 21, 24), target: new THREE.Vector3(0, 1.0, 0), label: "Overview" },
  { pos: new THREE.Vector3(-4.5, 12.5, 8.5), target: new THREE.Vector3(-4.5, 1.2, -4.5), label: "Machining & Welding" },
  { pos: new THREE.Vector3(-4.5, 12.5, 17.5), target: new THREE.Vector3(-4.5, 1.2, 4.5), label: "Finishing & Packaging" },
];

const PATH_POINTS = [
  new THREE.Vector3(-17.5, 1.25, -4.5), // Raw material entry
  new THREE.Vector3(-13.5, 1.25, -4.5), // Station 1: Cutting
  new THREE.Vector3(-4.5, 1.25, -4.5),  // Station 2: Milling
  new THREE.Vector3(5.0, 1.25, -4.5),   // Station 3: Welding
  new THREE.Vector3(11.5, 1.25, -4.5),  // Transfer corner 1
  new THREE.Vector3(11.5, 1.25, 4.5),   // Transfer corner 2
  new THREE.Vector3(5.0, 1.25, 4.5),    // Station 4: Painting
  new THREE.Vector3(-4.5, 1.25, 4.5),   // Station 5: Assembly
  new THREE.Vector3(-13.5, 1.25, 4.5),  // Station 6: Packaging
  new THREE.Vector3(-17.5, 1.25, 4.5),  // Pallet outfeed
];

interface PathSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  len: number;
  startDist: number;
}

interface WorkpieceInstance {
  mesh: THREE.Group;
  dist: number;
  stage: number;
  passedStations: Set<number>;
}

export default function Simulation() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // React State
  const [stations, setStations] = useState<StationConfig[]>(INITIAL_STATIONS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [activeWoIndex, setActiveWoIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [showHudTags, setShowHudTags] = useState<boolean>(true);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clockString, setClockString] = useState<string>("");

  // Refs for animation loop & three state
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const simSpeedRef = useRef(simSpeed);
  simSpeedRef.current = simSpeed;
  const showHudTagsRef = useRef(showHudTags);
  showHudTagsRef.current = showHudTags;
  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  const workOrdersRef = useRef(workOrders);
  workOrdersRef.current = workOrders;
  const activeWoIndexRef = useRef(activeWoIndex);
  activeWoIndexRef.current = activeWoIndex;

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const camPresetRef = useRef<number>(0);
  const desiredCamPos = useRef(CAMERA_PRESETS[0].pos.clone());
  const desiredCamTarget = useRef(CAMERA_PRESETS[0].target.clone());
  const camTarget = useRef(new THREE.Vector3(0, 1.0, 0));
  const isCameraTransitioning = useRef(false);
  const camSpherical = useRef({ radius: 31.5, theta: 0.0, phi: 0.85 });
  const animatableParts = useRef<Record<string, any>>({});
  const workpiecesRef = useRef<WorkpieceInstance[]>([]);
  const stationMeshesRef = useRef<THREE.Mesh[]>([]);
  const palletBoxesRef = useRef<THREE.Group[]>([]);
  const pathSegmentsRef = useRef<PathSegment[]>([]);
  const totalPathLengthRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // Toast trigger helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  }, []);

  // Dispatch new work order
  const triggerNewWorkOrder = useCallback((auto = false) => {
    const products = [
      { name: "ServoDrive-X200", drawing: "TH-06-204", target: 20 },
      { name: "Actuator-M90", drawing: "TH-04-112", target: 25 },
      { name: "GearBox-H40", drawing: "TH-02-089", target: 15 },
    ];
    const rand = Math.floor(Math.random() * products.length);
    const pick = products[rand];
    const newId = `WO${Date.now().toString().slice(-8)}`;

    setWorkOrders((prev) => {
      const updated = prev.map((wo, i) =>
        i === activeWoIndexRef.current && wo.status === "In Progress"
          ? { ...wo, status: "Completed" as const }
          : wo
      );
      const newOrders: WorkOrder[] = [
        {
          id: newId,
          product: pick.name,
          drawing: pick.drawing,
          target: pick.target,
          produced: 0,
          status: "In Progress",
        },
        ...updated,
      ];
      if (newOrders.length > 6) newOrders.pop();
      return newOrders;
    });
    setActiveWoIndex(0);

    if (!auto) {
      showToast(`Dispatched new batch: ${newId} (${pick.name})`);
    }
  }, [showToast]);

  // Reset simulation
  const resetSimulation = useCallback(() => {
    if (!sceneRef.current) return;
    workpiecesRef.current.forEach((wp) => sceneRef.current?.remove(wp.mesh));
    workpiecesRef.current = [];

    setStations((prev) => prev.map((st) => ({ ...st, completed: 0 })));
    setWorkOrders((prev) =>
      prev.map((wo, i) =>
        i === activeWoIndexRef.current
          ? { ...wo, produced: 0, status: "In Progress" as const }
          : wo
      )
    );

    // Re-seed pieces
    const totalLen = totalPathLengthRef.current;
    [0.08, 0.25, 0.42, 0.60, 0.78].forEach((p) => {
      spawnWorkpiece(p * totalLen);
    });

    showToast("Production telemetry, workpieces, and counters reset.");
  }, [showToast]);

  // Set camera view preset
  const setCameraPreset = useCallback((idx: number) => {
    const p = CAMERA_PRESETS[idx];
    if (!p) return;
    desiredCamPos.current.copy(p.pos);
    desiredCamTarget.current.copy(p.target);
    isCameraTransitioning.current = true;
    camPresetRef.current = idx;
    setActiveCamPreset(idx);
  }, []);

  // Compute Path Metrics
  function computePathMetrics() {
    const segments: PathSegment[] = [];
    let totalLen = 0;
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const start = PATH_POINTS[i];
      const end = PATH_POINTS[i + 1];
      const len = start.distanceTo(end);
      segments.push({ start, end, len, startDist: totalLen });
      totalLen += len;
    }
    pathSegmentsRef.current = segments;
    totalPathLengthRef.current = totalLen;
  }

  function getPointAtDistance(dist: number): THREE.Vector3 {
    const total = totalPathLengthRef.current;
    const clamped = Math.max(0, Math.min(total, dist));
    const segments = pathSegmentsRef.current;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (clamped <= seg.startDist + seg.len || i === segments.length - 1) {
        const t = seg.len > 0 ? (clamped - seg.startDist) / seg.len : 0;
        return new THREE.Vector3().lerpVectors(seg.start, seg.end, t);
      }
    }
    return PATH_POINTS[0].clone();
  }

  // Workpiece Lifecycle
  function spawnWorkpiece(initialDist = 0) {
    if (!sceneRef.current) return;
    const group = new THREE.Group();

    // Stage 0 & 1: Raw metallic sheet
    const sheetMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.12, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 })
    );
    sheetMesh.castShadow = true;
    group.add(sheetMesh);

    // Stage 2: Milled machined block
    const milledGroup = new THREE.Group();
    const milledBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.22, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.65, roughness: 0.2 })
    );
    const milledBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.8, roughness: 0.15 })
    );
    milledBoss.position.y = 0.15;
    milledGroup.add(milledBase, milledBoss);
    milledGroup.visible = false;
    group.add(milledGroup);

    // Stage 3: Welded Frame
    const weldedGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.5, roughness: 0.35 });
    const wBase = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 0.85), frameMat);
    const wTower = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.45), frameMat);
    wTower.position.y = 0.26;
    weldedGroup.add(wBase, wTower);
    weldedGroup.visible = false;
    group.add(weldedGroup);

    // Stage 4: Painted Blue Housing
    const paintedGroup = new THREE.Group();
    const paintMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.3, roughness: 0.18 });
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.24, 0.86), paintMat);
    const pTower = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.48), paintMat);
    pTower.position.y = 0.27;
    paintedGroup.add(pBase, pTower);
    paintedGroup.visible = false;
    group.add(paintedGroup);

    // Stage 5: Assembled Servo Unit
    const assembledGroup = new THREE.Group();
    const aBase = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.24, 0.86), paintMat);
    const aTower = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.48), paintMat);
    aTower.position.y = 0.27;
    const aCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4, roughness: 0.2 })
    );
    aCap.position.y = 0.54;
    assembledGroup.add(aBase, aTower, aCap);
    assembledGroup.visible = false;
    group.add(assembledGroup);

    // Stage 6: Sealed Cardboard Carton
    const boxedGroup = new THREE.Group();
    const carton = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.72, 0.95),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.72 })
    );
    carton.position.y = 0.25;
    carton.castShadow = true;
    const sealTape = new THREE.Mesh(
      new THREE.BoxGeometry(0.97, 0.05, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xfde68a })
    );
    sealTape.position.y = 0.62;
    boxedGroup.add(carton, sealTape);
    boxedGroup.visible = false;
    group.add(boxedGroup);

    const wp: WorkpieceInstance = {
      mesh: group,
      dist: initialDist,
      stage: 0,
      passedStations: new Set(),
    };

    updateWorkpieceVisualStage(wp);
    group.position.copy(getPointAtDistance(initialDist));
    sceneRef.current.add(group);
    workpiecesRef.current.push(wp);
  }

  function updateWorkpieceVisualStage(wp: WorkpieceInstance) {
    wp.mesh.children.forEach((c, idx) => {
      c.visible = idx === wp.stage;
    });
  }

  // Animation helper for robot arms
  function createArticulatedRobot(
    primaryMat: THREE.Material,
    baseMat: THREE.Material,
    tipColorHex: number
  ) {
    const root = new THREE.Group();

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.65, 16), baseMat);
    pedestal.position.y = 0.32;
    pedestal.castShadow = true;
    root.add(pedestal);

    const waist = new THREE.Group();
    waist.position.y = 0.65;
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.55, 16), primaryMat);
    turret.position.y = 0.25;
    turret.castShadow = true;
    waist.add(turret);

    const lowerArmGroup = new THREE.Group();
    lowerArmGroup.position.set(0, 0.45, 0);
    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.45, 0.38), primaryMat);
    lowerArm.position.y = 0.65;
    lowerArm.castShadow = true;
    lowerArmGroup.add(lowerArm);

    const upperArmGroup = new THREE.Group();
    upperArmGroup.position.set(0, 1.35, 0);
    const elbowJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.48, 14), baseMat);
    elbowJoint.rotation.z = Math.PI / 2;
    upperArmGroup.add(elbowJoint);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 1.35), primaryMat);
    upperArm.position.set(0, 0.08, 0.62);
    upperArm.castShadow = true;
    upperArmGroup.add(upperArm);

    const toolTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.42, 10),
      new THREE.MeshBasicMaterial({ color: tipColorHex })
    );
    toolTip.rotation.x = Math.PI * 0.78;
    toolTip.position.set(0, -0.08, 1.35);
    upperArmGroup.add(toolTip);

    lowerArmGroup.add(upperArmGroup);
    waist.add(lowerArmGroup);
    root.add(waist);

    return { root, waist, lowerArmGroup, upperArmGroup };
  }

  // Build Environment
  function buildSceneEnvironment(scene: THREE.Scene) {
    // Floor
    const outerFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    outerFloor.rotation.x = -Math.PI / 2;
    outerFloor.position.y = -0.05;
    scene.add(outerFloor);

    // Concrete Platform
    const baseGeo = new THREE.BoxGeometry(40, 0.3, 21);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8, metalness: 0.1 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(-1.5, 0.0, 0);
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // Grid
    const gridHelper = new THREE.GridHelper(38, 19, 0x52525b, 0x18181b);
    gridHelper.position.set(-1.5, 0.16, 0);
    scene.add(gridHelper);

    // Hazard Stripes
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const stripeFront = new THREE.Mesh(new THREE.PlaneGeometry(36, 0.18), stripeMat);
    stripeFront.rotation.x = -Math.PI / 2;
    stripeFront.position.set(-1.5, 0.17, 8.2);
    scene.add(stripeFront);

    const stripeBack = new THREE.Mesh(new THREE.PlaneGeometry(36, 0.18), stripeMat);
    stripeBack.rotation.x = -Math.PI / 2;
    stripeBack.position.set(-1.5, 0.17, -8.2);
    scene.add(stripeBack);

    // Safety fence perimeter
    const fenceGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.4 });
    const panelMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.5, roughness: 0.5 });

    function addFence(x1: number, z1: number, x2: number, z2: number) {
      const start = new THREE.Vector3(x1, 0.15, z1);
      const end = new THREE.Vector3(x2, 0.15, z2);
      const len = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const angle = Math.atan2(end.x - start.x, end.z - start.z);

      const seg = new THREE.Group();
      seg.position.copy(mid);
      seg.rotation.y = angle;

      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.3, 0.24), postMat);
      post.position.set(0, 1.15, -len / 2);
      post.castShadow = true;
      seg.add(post);

      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.85, len - 0.24), panelMat);
      panel.position.set(0, 1.1, 0);
      seg.add(panel);

      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, len), frameMat);
      topRail.position.set(0, 2.05, 0);
      seg.add(topRail);

      const botRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, len), frameMat);
      botRail.position.set(0, 0.2, 0);
      seg.add(botRail);

      fenceGroup.add(seg);
    }

    const minX = -20.5, maxX = 17.5, minZ = -9.8, maxZ = 9.8;
    for (let x = minX; x < maxX; x += 3.8) addFence(x, minZ, Math.min(x + 3.8, maxX), minZ);
    for (let x = minX; x < maxX; x += 3.8) addFence(x, maxZ, Math.min(x + 3.8, maxX), maxZ);
    for (let z = minZ; z < maxZ; z += 3.92) addFence(maxX, z, maxX, Math.min(z + 3.92, maxZ));
    addFence(minX, -9.8, minX, -6.2);
    addFence(minX, -2.8, minX, 2.8);
    addFence(minX, 6.2, minX, 9.8);
    scene.add(fenceGroup);
  }

  // Build Conveyors
  function buildConveyors(scene: THREE.Scene) {
    const conveyorGroup = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7, roughness: 0.35 });
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.6, roughness: 0.4 });
    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.25 });

    function createConveyorRun(x1: number, z1: number, x2: number, z2: number) {
      const start = new THREE.Vector3(x1, 0, z1);
      const end = new THREE.Vector3(x2, 0, z2);
      const len = start.distanceTo(end);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const angle = Math.atan2(end.x - start.x, end.z - start.z);

      const run = new THREE.Group();
      run.position.set(mid.x, 0.95, mid.z);
      run.rotation.y = angle;

      const belt = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, len), beltMat);
      belt.receiveShadow = true;
      run.add(belt);

      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, len), railMat);
      leftRail.position.set(-0.75, 0.06, 0);
      leftRail.castShadow = true;
      run.add(leftRail);

      const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, len), railMat);
      rightRail.position.set(0.75, 0.06, 0);
      rightRail.castShadow = true;
      run.add(rightRail);

      const rollerCount = Math.floor(len / 0.65);
      for (let i = 0; i <= rollerCount; i++) {
        const rz = -len / 2 + (i / rollerCount) * len;
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.36, 8), rollerMat);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(0, 0.09, rz);
        run.add(roller);
      }

      const legCount = Math.max(2, Math.floor(len / 3.5) + 1);
      for (let i = 0; i < legCount; i++) {
        const lz = -len / 2 + 0.3 + (i / (legCount - 1)) * (len - 0.6);
        const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), legMat);
        legL.position.set(-0.68, -0.45, lz);
        run.add(legL);

        const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), legMat);
        legR.position.set(0.68, -0.45, lz);
        run.add(legR);
      }

      conveyorGroup.add(run);
    }

    createConveyorRun(-18.2, -4.5, 12.2, -4.5);
    createConveyorRun(11.5, -4.5, 11.5, 4.5);
    createConveyorRun(12.2, 4.5, -18.2, 4.5);

    // Pallets
    function createPallet() {
      const p = new THREE.Group();
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      for (let x = -0.8; x <= 0.8; x += 0.8) {
        const runner = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 1.8), woodMat);
        runner.position.set(x, 0.08, 0);
        p.add(runner);
      }
      for (let z = -0.75; z <= 0.75; z += 0.375) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.25), woodMat);
        plank.position.set(0, 0.18, z);
        p.add(plank);
      }
      return p;
    }

    const inPallet = createPallet();
    inPallet.position.set(-18.5, 0.15, -4.5);
    conveyorGroup.add(inPallet);

    const sheetMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.1), sheetMat);
      sheet.position.set(-18.5, 0.36 + i * 0.1, -4.5);
      conveyorGroup.add(sheet);
    }

    const outPallet = createPallet();
    outPallet.position.set(-18.5, 0.15, 4.5);
    conveyorGroup.add(outPallet);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const tapeMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
    palletBoxesRef.current = [];
    for (let i = 0; i < 6; i++) {
      const boxGroup = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.85), boxMat);
      box.castShadow = true;
      boxGroup.add(box);
      const tape = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.06, 0.14), tapeMat);
      tape.position.y = 0.33;
      boxGroup.add(tape);

      const col = i % 2;
      const row = Math.floor(i / 2);
      boxGroup.position.set(-18.85 + col * 0.9, 0.65 + row * 0.68, 4.5);
      conveyorGroup.add(boxGroup);
      palletBoxesRef.current.push(boxGroup);
    }

    scene.add(conveyorGroup);
  }

  // Build Stations
  function buildStations(scene: THREE.Scene) {
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.6, roughness: 0.4 });
    const steelLight = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.5, roughness: 0.35 });
    const estunYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.35 });
    const blueAccent = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.4 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });

    function registerBase(stGroup: THREE.Group, stData: StationConfig, w = 3.6, d = 3.6) {
      stGroup.position.set(stData.pos.x, 0.15, stData.pos.z);

      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.08, d),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 })
      );
      pad.position.y = 0.04;
      pad.receiveShadow = true;
      stGroup.add(pad);

      // Hitbox
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(w, 3.8, d),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 1.9;
      hitBox.userData = { stationId: stData.id };
      stGroup.add(hitBox);
      stationMeshesRef.current.push(hitBox);

      // Cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 0.65), steelLight);
      cabinet.position.set(-w / 2 - 0.65, 0.9, stData.pos.z < 0 ? -1.1 : 1.1);
      stGroup.add(cabinet);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(-w / 2 - 0.65, 1.9, stData.pos.z < 0 ? -1.1 : 1.1);
      stGroup.add(led);

      scene.add(stGroup);
    }

    // ST-01 Cutting
    const st1 = new THREE.Group();
    registerBase(st1, INITIAL_STATIONS[0], 3.8, 3.6);
    const p1L = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.7, 2.8), steelDark);
    p1L.position.set(-1.3, 1.35, 0);
    st1.add(p1L);
    const p1R = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.7, 2.8), steelDark);
    p1R.position.set(1.3, 1.35, 0);
    st1.add(p1R);
    const bridge1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.7), blueAccent);
    bridge1.position.set(0, 2.55, 0);
    st1.add(bridge1);

    const laserCarriage = new THREE.Group();
    laserCarriage.position.set(0, 2.15, 0);
    laserCarriage.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), steelLight));
    const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 12), estunYellow);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = -0.5;
    laserCarriage.add(nozzle);

    const laserBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.95, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    laserBeam.position.y = -0.95;
    laserCarriage.add(laserBeam);

    const laserSpark = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
    );
    laserSpark.position.y = -1.35;
    laserCarriage.add(laserSpark);
    st1.add(laserCarriage);

    animatableParts.current.laserCarriage = laserCarriage;
    animatableParts.current.laserSpark = laserSpark;

    // ST-02 Milling
    const st2 = new THREE.Group();
    registerBase(st2, INITIAL_STATIONS[1], 3.8, 3.8);
    const cncBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.1, 0.5), steelDark);
    cncBack.position.set(0, 1.55, -1.4);
    st2.add(cncBack);
    const cncTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 2.8), steelDark);
    cncTop.position.set(0, 3.05, -0.2);
    st2.add(cncTop);
    const cncSideL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.1, 2.6), steelLight);
    cncSideL.position.set(-1.45, 1.55, -0.2);
    st2.add(cncSideL);
    const cncSideR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.1, 2.6), steelLight);
    cncSideR.position.set(1.45, 1.55, -0.2);
    st2.add(cncSideR);
    const cncWindow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), glassMat);
    cncWindow.position.set(0, 2.1, 1.1);
    st2.add(cncWindow);

    const spindleGroup = new THREE.Group();
    spindleGroup.position.set(0, 2.2, 0);
    spindleGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), blueAccent));
    const cutterBit = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.65, 10), steelLight);
    cutterBit.position.y = -0.7;
    spindleGroup.add(cutterBit);
    st2.add(spindleGroup);
    animatableParts.current.spindleGroup = spindleGroup;
    animatableParts.current.cutterBit = cutterBit;

    // ST-03 Welding
    const st3 = new THREE.Group();
    registerBase(st3, INITIAL_STATIONS[2], 3.8, 3.8);
    const weldRobot = createArticulatedRobot(estunYellow, steelDark, 0x38bdf8);
    weldRobot.root.position.set(0, 0.1, -1.65);
    st3.add(weldRobot.root);
    animatableParts.current.weldRobot = weldRobot;

    const weldFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    weldFlash.position.set(0, 1.35, 0);
    st3.add(weldFlash);
    animatableParts.current.weldFlash = weldFlash;

    // ST-04 Painting
    const st4 = new THREE.Group();
    registerBase(st4, INITIAL_STATIONS[3], 3.8, 3.8);
    const bBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.0, 0.35), steelLight);
    bBack.position.set(0, 1.5, 1.45);
    st4.add(bBack);
    const bRoof = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.35, 2.8), blueAccent);
    bRoof.position.set(0, 2.95, 0.1);
    st4.add(bRoof);
    const bWallL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.9, 2.6), glassMat);
    bWallL.position.set(-1.55, 1.45, 0.1);
    st4.add(bWallL);
    const bWallR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.9, 2.6), glassMat);
    bWallR.position.set(1.55, 1.45, 0.1);
    st4.add(bWallR);

    const paintHead = new THREE.Group();
    paintHead.position.set(0, 2.4, 0);
    paintHead.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.45, 12), estunYellow));
    const sprayMist = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.15, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    sprayMist.position.y = -0.75;
    paintHead.add(sprayMist);
    st4.add(paintHead);
    animatableParts.current.paintHead = paintHead;
    animatableParts.current.sprayMist = sprayMist;

    // ST-05 Assembly
    const st5 = new THREE.Group();
    registerBase(st5, INITIAL_STATIONS[4], 3.8, 3.8);
    const asmRobot = createArticulatedRobot(estunYellow, steelDark, 0x10b981);
    asmRobot.root.position.set(0, 0.1, 1.65);
    asmRobot.root.rotation.y = Math.PI;
    st5.add(asmRobot.root);
    animatableParts.current.assemblyRobot = asmRobot;

    const feederTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.05, 0.9), steelDark);
    feederTable.position.set(1.35, 0.55, 1.3);
    st5.add(feederTable);

    // ST-06 Packaging
    const st6 = new THREE.Group();
    registerBase(st6, INITIAL_STATIONS[5], 3.8, 3.6);
    const pkgArchL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 2.4), steelDark);
    pkgArchL.position.set(-1.2, 1.3, 0);
    st6.add(pkgArchL);
    const pkgArchR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 2.4), steelDark);
    pkgArchR.position.set(1.2, 1.3, 0);
    st6.add(pkgArchR);
    const pkgTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 1.4), estunYellow);
    pkgTop.position.set(0, 2.55, 0);
    st6.add(pkgTop);

    const pkgPress = new THREE.Group();
    pkgPress.position.set(0, 2.05, 0);
    pkgPress.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 10), steelLight));
    const pressPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.1), blueAccent);
    pressPlate.position.y = -0.4;
    pkgPress.add(pressPlate);
    st6.add(pkgPress);
    animatableParts.current.pkgPress = pkgPress;
  }

  // Animation of machines
  function animateMachines(t: number) {
    const parts = animatableParts.current;

    // Laser
    if (parts.laserCarriage) {
      parts.laserCarriage.position.x = Math.sin(t * 4.5) * 0.65;
      parts.laserCarriage.position.z = Math.cos(t * 3.2) * 0.35;
      const sparkScale = 0.7 + Math.abs(Math.sin(t * 25)) * 0.8;
      if (parts.laserSpark) parts.laserSpark.scale.set(sparkScale, sparkScale, sparkScale);
    }
    // Milling
    if (parts.spindleGroup) {
      parts.spindleGroup.position.y = 2.15 + Math.sin(t * 3.5) * 0.22;
      parts.spindleGroup.position.x = Math.cos(t * 2.5) * 0.35;
      if (parts.cutterBit) parts.cutterBit.rotation.y += 0.35;
    }
    // Welding
    if (parts.weldRobot) {
      const r = parts.weldRobot;
      r.waist.rotation.y = Math.sin(t * 2.2) * 0.35;
      r.lowerArmGroup.rotation.x = 0.25 + Math.sin(t * 3.0) * 0.14;
      r.upperArmGroup.rotation.x = 0.35 + Math.cos(t * 3.0) * 0.15;
      if (parts.weldFlash) {
        parts.weldFlash.visible = Math.sin(t * 28) > 0.15;
        parts.weldFlash.position.x = Math.sin(t * 2.2) * 0.45;
      }
    }
    // Paint
    if (parts.paintHead) {
      parts.paintHead.position.x = Math.sin(t * 3.8) * 0.55;
      if (parts.sprayMist) {
        parts.sprayMist.material.opacity = 0.22 + Math.abs(Math.sin(t * 8)) * 0.22;
      }
    }
    // Assembly
    if (parts.assemblyRobot) {
      const a = parts.assemblyRobot;
      a.waist.rotation.y = Math.sin(t * 2.6) * 0.55;
      a.lowerArmGroup.rotation.x = 0.22 + Math.abs(Math.sin(t * 2.6)) * 0.2;
      a.upperArmGroup.rotation.x = 0.3 + Math.cos(t * 2.6) * 0.18;
    }
    // Packaging
    if (parts.pkgPress) {
      parts.pkgPress.position.y = 2.1 + Math.sin(t * 3.2) * 0.25;
    }
  }

  // Workpiece station milestones trigger
  function handleStationCompleted(stationId: number) {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, completed: s.completed + 1 } : s))
    );

    if (stationId === 6) {
      const activeIdx = activeWoIndexRef.current;
      const activeWO = workOrdersRef.current[activeIdx];
      if (activeWO && activeWO.status === "In Progress") {
        const nextProduced = activeWO.produced + 1;
        const isComplete = nextProduced >= activeWO.target;

        setWorkOrders((prev) =>
          prev.map((wo, i) =>
            i === activeIdx
              ? {
                  ...wo,
                  produced: nextProduced,
                  status: isComplete ? "Completed" : "In Progress",
                }
              : wo
          )
        );

        if (isComplete) {
          showToast(`Work Order ${activeWO.id} completed! Queuing next batch...`);
          setTimeout(() => {
            triggerNewWorkOrder(true);
          }, 1500);
        }
      }
    }
  }

  // Camera spherical sync helper
  function updateCameraFromSpherical(camera: THREE.Camera) {
    const s = camSpherical.current;
    const sinPhi = Math.sin(s.phi);
    camera.position.x = camTarget.current.x + s.radius * sinPhi * Math.sin(s.theta);
    camera.position.y = camTarget.current.y + s.radius * Math.cos(s.phi);
    camera.position.z = camTarget.current.z + s.radius * sinPhi * Math.cos(s.theta);
    camera.lookAt(camTarget.current);
  }

  // 3D HUD Tags Projection State
  const [hudTagPositions, setHudTagPositions] = useState<{ id: number; left: number; top: number; visible: boolean }[]>([]);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClockString(
        now.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Main Three.js Init & Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.copy(CAMERA_PRESETS[0].pos);
    camera.lookAt(CAMERA_PRESETS[0].target);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(16, 28, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.4);
    rimLight.position.set(-20, 15, -18);
    scene.add(rimLight);

    // 5. Environment & Conveyor
    buildSceneEnvironment(scene);
    buildConveyors(scene);
    buildStations(scene);
    computePathMetrics();

    // 6. Seed Workpieces
    const initialProgresses = [0.06, 0.22, 0.38, 0.56, 0.72, 0.88];
    initialProgresses.forEach((p) => spawnWorkpiece(p * totalPathLengthRef.current));

    // 7. Mouse / Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let downPos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      isCameraTransitioning.current = false;
      prevMouse = { x: e.clientX, y: e.clientY };
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      const s = camSpherical.current;
      s.theta -= dx * 0.0065;
      s.phi = Math.max(0.22, Math.min(1.42, s.phi - dy * 0.0065));
      updateCameraFromSpherical(camera);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      const distMoved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (distMoved < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(stationMeshesRef.current);
        if (hits.length > 0 && hits[0].object.userData.stationId) {
          setSelectedStationId(hits[0].object.userData.stationId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      isCameraTransitioning.current = false;
      camSpherical.current.radius = Math.max(10, Math.min(48, camSpherical.current.radius + e.deltaY * 0.02));
      updateCameraFromSpherical(camera);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // 8. Resize Listener
    const onResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // 9. Render Loop
    let lastTime = performance.now();
    let hudAccumulator = 0;

    const animate = (now: number) => {
      animationFrameId.current = requestAnimationFrame(animate);

      const rawDt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth camera interpolation
      if (isCameraTransitioning.current) {
        camera.position.lerp(desiredCamPos.current, 0.08);
        camTarget.current.lerp(desiredCamTarget.current, 0.08);
        camera.lookAt(camTarget.current);
        if (camera.position.distanceTo(desiredCamPos.current) < 0.05) {
          isCameraTransitioning.current = false;
          const offset = new THREE.Vector3().subVectors(camera.position, camTarget.current);
          camSpherical.current.radius = offset.length();
          camSpherical.current.theta = Math.atan2(offset.x, offset.z);
          camSpherical.current.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / camSpherical.current.radius)));
        }
      }

      if (isRunningRef.current) {
        const dt = rawDt * simSpeedRef.current;
        const timeSec = (now * 0.001) * simSpeedRef.current;

        // Spawn periodic workpiece
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current >= 3.6) {
          spawnTimerRef.current = 0;
          spawnWorkpiece(0);
        }

        // Animate robot tools & carriages
        animateMachines(timeSec);

        // Advance workpieces
        const conveyorSpeed = 2.4;
        const workpieces = workpiecesRef.current;
        const milestones = [
          { id: 1, dist: 4.0, stage: 1 },
          { id: 2, dist: 13.0, stage: 2 },
          { id: 3, dist: 22.5, stage: 3 },
          { id: 4, dist: 38.0, stage: 4 },
          { id: 5, dist: 47.5, stage: 5 },
          { id: 6, dist: 56.5, stage: 6 },
        ];

        for (let i = workpieces.length - 1; i >= 0; i--) {
          const wp = workpieces[i];
          wp.dist += conveyorSpeed * dt;
          wp.mesh.position.copy(getPointAtDistance(wp.dist));

          for (const m of milestones) {
            if (wp.dist >= m.dist && !wp.passedStations.has(m.id)) {
              wp.passedStations.add(m.id);
              wp.stage = m.stage;
              updateWorkpieceVisualStage(wp);
              handleStationCompleted(m.id);
            }
          }

          if (wp.dist >= totalPathLengthRef.current) {
            scene.remove(wp.mesh);
            workpieces.splice(i, 1);
            if (palletBoxesRef.current.length > 0) {
              const top = palletBoxesRef.current[palletBoxesRef.current.length - 1];
              top.scale.set(1.12, 1.12, 1.12);
              setTimeout(() => top.scale.set(1, 1, 1), 220);
            }
          }
        }
      }

      // Project HUD Tags
      hudAccumulator += rawDt;
      if (hudAccumulator >= 0.04) {
        hudAccumulator = 0;
        if (showHudTagsRef.current && container) {
          const w = container.clientWidth;
          const h = container.clientHeight;
          const tags = stationsRef.current.map((st) => {
            const worldPos = new THREE.Vector3(
              st.pos.x + st.hudOffset.x,
              st.pos.y + st.hudOffset.y,
              st.pos.z + st.hudOffset.z
            );
            worldPos.project(camera);
            const isBehind = worldPos.z > 1;
            const left = (worldPos.x * 0.5 + 0.5) * w;
            const top = (-(worldPos.y * 0.5) + 0.5) * h;
            return {
              id: st.id,
              left,
              top,
              visible: !isBehind && left >= 0 && left <= w && top >= 0 && top <= h,
            };
          });
          setHudTagPositions(tags);
        }
      }

      renderer.render(scene, camera);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("wheel", onWheel);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const activeWO = workOrders[activeWoIndex] || workOrders[0];
  const activePct = activeWO ? Math.min(100, Math.round((activeWO.produced / activeWO.target) * 100)) : 0;
  const donutCircumference = 238.76;
  const donutOffset = donutCircumference - (activePct / 100) * donutCircumference;
  const selectedStation = stations.find((s) => s.id === selectedStationId);

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      {/* Simulation Top Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Move3d className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider text-cyan-400 uppercase font-mono">DIGITAL TWIN 3D</div>
              <div className="text-[10px] text-zinc-400 font-semibold tracking-wider">SMART FACTORY CELL</div>
            </div>
          </div>
          <span className="hidden sm:inline-block h-5 w-[1px] bg-zinc-700/60 mx-1" />
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700/50 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPC-UA Live Stream</span>
          </span>
        </div>

        {/* Center: Title */}
        <div className="hidden lg:block text-center">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-200">
            Automated Continuous 6-Station Production Workstation
          </h2>
        </div>

        {/* Right: Controls & Speed */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-950/80 rounded-lg p-0.5 border border-zinc-800 text-xs">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                  simSpeed === s
                    ? "bg-blue-600 text-white shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Play / Pause Toggle */}
          <button
            onClick={() => setIsRunning((r) => !r)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow transition ${
              isRunning ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? "Pause" : "Resume"}</span>
          </button>

          {/* Reset */}
          <button
            onClick={resetSimulation}
            title="Reset Production Line"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{clockString || "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (70% 3D Viewport / 30% SCADA MES Sidebar) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[580px] lg:min-h-[640px] overflow-hidden">
        {/* Left/Center 3D Viewport */}
        <div className="relative w-full lg:w-[70%] h-[420px] sm:h-[480px] lg:h-auto bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden">
          {/* Three.js Canvas Mount */}
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Camera Preset Switcher */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
            {CAMERA_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => setCameraPreset(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition border ${
                  activeCamPreset === idx
                    ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30"
                    : "bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                }`}
              >
                Cam {idx + 1}: {preset.label}
              </button>
            ))}
          </div>

          {/* HUD Tags Toggle */}
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() => setShowHudTags((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition shadow"
            >
              {showHudTags ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
              <span>HUD Tags: {showHudTags ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* 3D Projected HUD Tags Overlay */}
          {showHudTags && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {stations.map((st) => {
                const pos = hudTagPositions.find((p) => p.id === st.id);
                if (!pos || !pos.visible) return null;
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    style={{
                      left: `${pos.left}px`,
                      top: `${pos.top}px`,
                      transform: "translate(-50%, -100%)",
                    }}
                    className="absolute pointer-events-auto rounded-lg border border-emerald-500/40 bg-zinc-900/85 backdrop-blur-md overflow-hidden cursor-pointer shadow-xl min-w-[150px] transition-transform hover:scale-105 hover:border-cyan-400 z-10"
                  >
                    <div
                      className={`px-2 py-0.5 flex items-center justify-between text-[10px] font-bold text-white ${
                        isRunning ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-zinc-700"
                      }`}
                    >
                      <span>Telemetry</span>
                      <span className="font-mono opacity-90">{st.code}</span>
                    </div>
                    <div className="p-2 text-[10px] space-y-0.5 font-mono text-zinc-300 leading-tight">
                      <div className="truncate text-zinc-400">
                        Type: <span className="text-zinc-100 font-semibold">{st.type}</span>
                      </div>
                      <div className="truncate text-zinc-400">
                        Station: <span className="text-zinc-200">{st.shortName}</span>
                      </div>
                      <div className="text-zinc-400">
                        Speed: <span className="text-cyan-300">{st.speed}</span>
                      </div>
                      <div className="text-zinc-400">
                        Status:{" "}
                        <span className={isRunning ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                          {isRunning ? "Running" : "Paused"}
                        </span>
                      </div>
                      <div className="text-zinc-400">
                        Done: <span className="text-amber-300 font-bold">{st.completed}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Material Flow Pipeline Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-1.5 shadow-xl pointer-events-auto max-w-full overflow-x-auto text-[11px]">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Material Flow:</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-zinc-400 inline-block" /> 1. Cut Sheet
                </span>
                <span className="text-zinc-600">→</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-300 inline-block" /> 2. Milled
                </span>
                <span className="text-zinc-600">→</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 3. Welded
                </span>
                <span className="text-zinc-600">→</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> 4. Painted
                </span>
                <span className="text-zinc-600">→</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> 5. Assembled
                </span>
                <span className="text-zinc-600">→</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-700 inline-block" /> 6. Boxed Pallet
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-400 pointer-events-auto">
              <span>Drag to orbit • Scroll to zoom • Click station to inspect</span>
            </div>
          </div>

          {/* Selected Station Inspector Modal */}
          {selectedStation && (
            <div className="absolute bottom-14 left-3 z-30 w-80 bg-zinc-900/95 backdrop-blur-md border border-blue-500/50 rounded-xl p-3.5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-600 text-white">
                    {selectedStation.code}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{selectedStation.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedStationId(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{selectedStation.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">MODEL / TYPE</div>
                  <div className="text-cyan-400 font-semibold mt-0.5">{selectedStation.type}</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">STATE</div>
                  <div className={`font-semibold mt-0.5 ${isRunning ? "text-emerald-400" : "text-amber-400"}`}>
                    {isRunning ? "Running" : "Paused"}
                  </div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">CYCLE TIME</div>
                  <div className="text-zinc-200 font-semibold mt-0.5">{selectedStation.cycleTime}</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">PROCESSED</div>
                  <div className="text-amber-400 font-semibold mt-0.5">{selectedStation.completed} units</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right SCADA Sidebar (30%) */}
        <div className="w-full lg:w-[30%] bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 p-3.5 flex flex-col gap-3 overflow-y-auto max-h-[750px]">
          {/* Card 1: Workstation Info & 6 Station Badges */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Workstation Status</h3>
              </div>
              <span className={`text-xs font-bold font-mono ${isRunning ? "text-emerald-400" : "text-amber-400"}`}>
                {isRunning ? "● Active Production" : "⏸ Line Standby"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-3 font-mono text-zinc-400">
              <div>
                Workshop: <span className="text-zinc-200">WS-001</span>
              </div>
              <div>
                Line: <span className="text-zinc-200">6 Stations</span>
              </div>
              <div className="col-span-2">
                Cell: <span className="text-zinc-200 font-sans">Automated U-Cell 1</span>
              </div>
            </div>

            {/* 6 Stations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {stations.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className="bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/50 rounded-lg overflow-hidden cursor-pointer transition p-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-zinc-200 truncate">{st.shortName}</span>
                    <span className="text-[9px] font-mono font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50 px-1 rounded">
                      {st.id}
                    </span>
                  </div>
                  <div className="text-[10px] space-y-0.5 font-mono text-zinc-400 leading-tight">
                    <div className="truncate">Type: {st.type}</div>
                    <div className={isRunning ? "text-emerald-400" : "text-amber-400"}>
                      {isRunning ? "Running" : "Paused"}
                    </div>
                    <div className="text-cyan-300">{st.speed}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Active Work Order with SVG Donut Progress */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Active Work Order</h3>
              </div>
              <button
                onClick={() => triggerNewWorkOrder(false)}
                className="flex items-center gap-1 text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-medium transition"
              >
                <Plus className="w-3 h-3" />
                <span>Next Order</span>
              </button>
            </div>

            {activeWO && (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1 text-xs flex-1 min-w-0 font-mono">
                  <div className="text-zinc-400 truncate">
                    WO: <span className="text-zinc-100 font-semibold">{activeWO.id}</span>
                  </div>
                  <div className="text-zinc-400">
                    Status:{" "}
                    <span className={activeWO.status === "Completed" ? "text-cyan-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {activeWO.status}
                    </span>
                  </div>
                  <div className="text-zinc-400 truncate font-sans">
                    Product: <span className="text-zinc-200">{activeWO.product}</span>
                  </div>
                  <div className="text-zinc-400">
                    Drawing: <span className="text-zinc-300">{activeWO.drawing}</span>
                  </div>
                  <div className="text-zinc-400">
                    Produced: <span className="text-cyan-300 font-bold">{activeWO.produced} / {activeWO.target} pcs</span>
                  </div>
                </div>

                {/* Donut progress ring */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="simDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                      <circle cx="50" cy="50" r="38" stroke="#18181b" strokeWidth="9" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        stroke="url(#simDonutGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={donutCircumference}
                        strokeDashoffset={donutOffset}
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-bold font-mono text-white">{activePct}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 font-mono">Completion</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Production Batch Planning Queue */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 shadow-md flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Production Queue</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Real-time MES</span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] font-mono text-zinc-500 border-b border-zinc-800">
                    <th className="pb-1.5 font-medium">Work Order</th>
                    <th className="pb-1.5 font-medium">Product</th>
                    <th className="pb-1.5 font-medium text-right pr-2">Units</th>
                    <th className="pb-1.5 font-medium w-20">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {workOrders.map((wo, idx) => {
                    const pct = Math.min(100, Math.round((wo.produced / wo.target) * 100));
                    const isDone = pct === 100;
                    return (
                      <tr
                        key={wo.id}
                        className={`hover:bg-zinc-800/40 transition ${
                          idx === activeWoIndex ? "bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="py-2 text-zinc-300 font-medium">{wo.id}</td>
                        <td className="py-2 text-zinc-400 font-sans truncate max-w-[85px]">{wo.product}</td>
                        <td className="py-2 text-right pr-2 text-zinc-300">
                          {wo.produced}/{wo.target}
                        </td>
                        <td className="py-2">
                          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden relative flex items-center">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isDone ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/60 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
