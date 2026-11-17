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
  Shield,
  Zap,
  Radio,
  Flame,
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
  reportedRpm: number;
  actualAmps: number;
  expectedAmps: number;
  trustScore: number;
  ttsSec: number | null;
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
    reportedRpm: 3000,
    actualAmps: 185.0,
    expectedAmps: 185.0,
    trustScore: 99,
    ttsSec: null,
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
  new THREE.Vector3(-17.5, 1.25, -4.5),
  new THREE.Vector3(-13.5, 1.25, -4.5),
  new THREE.Vector3(-4.5, 1.25, -4.5),
  new THREE.Vector3(5.0, 1.25, -4.5),
  new THREE.Vector3(11.5, 1.25, -4.5),
  new THREE.Vector3(11.5, 1.25, 4.5),
  new THREE.Vector3(5.0, 1.25, 4.5),
  new THREE.Vector3(-4.5, 1.25, 4.5),
  new THREE.Vector3(-13.5, 1.25, 4.5),
  new THREE.Vector3(-17.5, 1.25, 4.5),
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

  // 4 Scenarios & Honeypot State
  const [currentScenario, setCurrentScenario] = useState<
    "normal" | "operational_mishap" | "cyber_spoof" | "cyber_exfil"
  >("normal");
  const [honeypotActive, setHoneypotActive] = useState<boolean>(false);
  const [starvationCountdowns, setStarvationCountdowns] = useState<{ [key: number]: number }>({
    4: 18,
    5: 12,
    6: 6,
  });

  const [securityLogs, setSecurityLogs] = useState<
    Array<{ time: string; sev: string; src: string; event: string }>
  >([
    {
      time: "14:30:15",
      sev: "INFO",
      src: "SCADA-POLL",
      event: "All 6 PLC holding registers verified concordant with physical line throughput.",
    },
    {
      time: "14:30:18",
      sev: "INFO",
      src: "CT-CLAMP",
      event: "Current-clamp side-channel verifies motor RPM concordance (185.0A @ 3000 RPM).",
    },
  ]);

  // Refs for animation loop
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

  const currentScenarioRef = useRef(currentScenario);
  currentScenarioRef.current = currentScenario;
  const honeypotActiveRef = useRef(honeypotActive);
  honeypotActiveRef.current = honeypotActive;

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

  // HUD tag positions in 2D screen coordinates
  const [hudTagPositions, setHudTagPositions] = useState<
    Array<{ id: number; left: number; top: number; visible: boolean }>
  >([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // --- SCENARIO SWITCHING ENGINE ---
  const switchScenario = useCallback(
    (scKey: "normal" | "operational_mishap" | "cyber_spoof" | "cyber_exfil") => {
      setCurrentScenario(scKey);
      setHoneypotActive(false);
      setStarvationCountdowns({ 4: 18, 5: 12, 6: 6 });

      const timestamp = new Date().toTimeString().split(" ")[0];

      if (scKey === "normal") {
        setStations((prev) =>
          prev.map((s) => ({
            ...s,
            reportedRpm: 3000,
            actualAmps: 185.0,
            expectedAmps: 185.0,
            status: "Running",
            trustScore: 99,
            ttsSec: null,
          }))
        );
        setSecurityLogs((prev) => [
          {
            time: timestamp,
            sev: "INFO",
            src: "SCADA-POLL",
            event: "Normal production profile restored across all 6 stations. System in equilibrium.",
          },
          ...prev.slice(0, 6),
        ]);
        showToast("🟢 Normal Production: All stations nominal (185A @ 3000 RPM)");
      } else if (scKey === "operational_mishap") {
        setStations((prev) =>
          prev.map((s) => {
            if (s.id === 3) {
              return {
                ...s,
                reportedRpm: 2100,
                actualAmps: 128.0,
                expectedAmps: 185.0,
                status: "Degraded (Bearing Friction)",
                trustScore: 98,
                ttsSec: null,
              };
            }
            if (s.id >= 4) {
              return { ...s, ttsSec: s.id === 4 ? 45 : s.id === 5 ? 52 : 60 };
            }
            return { ...s, reportedRpm: 3000, actualAmps: 185.0, status: "Running", trustScore: 99, ttsSec: null };
          })
        );
        setSecurityLogs((prev) => [
          {
            time: timestamp,
            sev: "WARN",
            src: "MOTOR-BEARING",
            event: "ST-03 mechanical friction detected. Physical Amps (128A) and RPM (2100) drop concordantly. Fault verified non-cyber.",
          },
          ...prev.slice(0, 6),
        ]);
        showToast("🟡 Operational Mishap: Mechanical bearing friction on ST-03 (Physics Honest)");
      } else if (scKey === "cyber_spoof") {
        setStations((prev) =>
          prev.map((s) => {
            if (s.id === 3) {
              return {
                ...s,
                reportedRpm: 3002,
                actualAmps: 122.0,
                expectedAmps: 185.0,
                status: "Running (Spoofed)",
                trustScore: 12,
                ttsSec: null,
              };
            }
            if (s.id >= 4) {
              return {
                ...s,
                status: "Starving",
                ttsSec: s.id === 4 ? 18 : s.id === 5 ? 12 : 6,
              };
            }
            return { ...s, reportedRpm: 3000, actualAmps: 185.0, status: "Running", trustScore: 99, ttsSec: null };
          })
        );
        setSecurityLogs((prev) => [
          {
            time: timestamp,
            sev: "CRITICAL",
            src: "MODBUS-TCP",
            event: "Unauthorized FC16 from 192.168.1.45 forged holding reg 40012=3002 RPM.",
          },
          {
            time: timestamp,
            sev: "ALERT",
            src: "CT-CLAMP",
            event: "Side-channel amperage shows TRUE draw is 122.0A (-34%). SENSOR SPOOF CONFIRMED!",
          },
          ...prev.slice(0, 5),
        ]);
        showToast("🔴 Cyberattack 1 Injected: HMI Sensor Spoofing & Silent Motor Throttling on ST-03!");
      } else if (scKey === "cyber_exfil") {
        setStations((prev) =>
          prev.map((s) => {
            if (s.id === 3) {
              return {
                ...s,
                reportedRpm: 2995,
                actualAmps: 248.0,
                expectedAmps: 185.0,
                status: "Overload (Exfiltrating)",
                trustScore: 8,
                ttsSec: null,
              };
            }
            return { ...s, reportedRpm: 3000, actualAmps: 185.0, status: "Running", trustScore: 99, ttsSec: null };
          })
        );
        setSecurityLogs((prev) => [
          {
            time: timestamp,
            sev: "CRITICAL",
            src: "EXFIL-TRAP",
            event: "Outbound encrypted tunnel detected to 10.0.4.88 (CAD G-Code exfiltration).",
          },
          {
            time: timestamp,
            sev: "EMERGENCY",
            src: "AMPERAGE-BUS",
            event: "Spindle current spike: 248.0A (+34%) on ST-03! Thermal runaway threshold imminent.",
          },
          ...prev.slice(0, 5),
        ]);
        showToast("🟣 Cyberattack 2 Injected: CAD Exfiltration & Spindle Overdrive on ST-03!");
      }

      // Non-blocking sync with backend API
      fetch("http://localhost:8000/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scKey }),
      }).catch(() => {});
    },
    [showToast]
  );

  // --- ACTIVE DECEPTION HONEYPOT TRIGGER ---
  const deployHoneypot = useCallback(() => {
    if (currentScenario === "normal" || currentScenario === "operational_mishap") {
      showToast("ℹ️ Deception Honeypot on Standby. No active cyber intrusion to quarantine.");
      return;
    }

    setHoneypotActive(true);
    const timestamp = new Date().toTimeString().split(" ")[0];

    setStations((prev) =>
      prev.map((s) => {
        if (s.id === 3) {
          return {
            ...s,
            status: "SHADOW-ISOLATED",
            actualAmps: 185.0,
            reportedRpm: 3000,
            trustScore: 95,
          };
        }
        if (s.id >= 4) {
          return {
            ...s,
            status: "Running",
            ttsSec: null,
          };
        }
        return s;
      })
    );

    setSecurityLogs((prev) => [
      {
        time: timestamp,
        sev: "DEFENSE",
        src: "DECEPTION-PLC",
        event: "Attacker rerouted to Decoy Virtual PLC (10.99.0.42) — Feeding Watermarked Fake Blueprints.",
      },
      {
        time: timestamp,
        sev: "RECOVERY",
        src: "CHRONOS-CORE",
        event: "Physical ST-03 robot restored to 185.0A baseline. Downstream buffer starvation cleared.",
      },
      ...prev.slice(0, 5),
    ]);

    showToast("🛡️ Deception Honeypot Engaged! Attacker quarantined to virtual decoy; production restored!");

    fetch("http://localhost:8000/api/honeypot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true, deploy: true }),
    }).catch(() => {});
  }, [currentScenario, showToast]);

  // Starvation countdown tick effect
  useEffect(() => {
    if (currentScenario !== "cyber_spoof" || honeypotActive || !isRunning) return;

    const timer = setInterval(() => {
      setStarvationCountdowns((prev) => {
        const next = { ...prev };
        [4, 5, 6].forEach((id) => {
          if (next[id] > 0) next[id] -= 1;
        });
        return next;
      });

      setStations((prev) =>
        prev.map((s) => {
          if (s.id >= 4 && s.id <= 6) {
            const nextSec = Math.max(0, (s.ttsSec ?? 18) - 1);
            return {
              ...s,
              ttsSec: nextSec,
              status: nextSec === 0 ? "STARVED (Depleted)" : "Starving",
            };
          }
          return s;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScenario, honeypotActive, isRunning]);

  // Clock tick
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setClockString(
        d.toLocaleString("en-US", {
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
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute Path Segments
  useEffect(() => {
    const segs: PathSegment[] = [];
    let accum = 0;
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const start = PATH_POINTS[i];
      const end = PATH_POINTS[i + 1];
      const len = start.distanceTo(end);
      segs.push({ start, end, len, startDist: accum });
      accum += len;
    }
    pathSegmentsRef.current = segs;
    totalPathLengthRef.current = accum;
  }, []);

  const getPointAtDistance = useCallback((d: number): THREE.Vector3 => {
    const total = totalPathLengthRef.current;
    const clamped = Math.max(0, Math.min(total, d));
    const segs = pathSegmentsRef.current;

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (clamped <= seg.startDist + seg.len) {
        const alpha = (clamped - seg.startDist) / seg.len;
        return new THREE.Vector3().lerpVectors(seg.start, seg.end, alpha);
      }
    }
    return PATH_POINTS[PATH_POINTS.length - 1].clone();
  }, []);

  // Three.js Mount Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x121620);
    scene.fog = new THREE.FogExp2(0x121620, 0.018);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    updateCameraFromSpherical(camera);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lights
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 0.65);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight.position.set(-15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(20, 15, -15);
    scene.add(fillLight);

    // 5. Environment & Stations
    buildFactoryEnvironment(scene);
    buildConveyorSystem(scene);
    buildAllStations(scene);

    // 6. Seed Workpieces
    const initialProgresses = [0.06, 0.22, 0.38, 0.56, 0.72, 0.88];
    initialProgresses.forEach((p) => spawnWorkpiece(p * totalPathLengthRef.current));

    // 7. Mouse Orbit Controls
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

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // 8. Render Loop
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
        const timeSec = now * 0.001 * simSpeedRef.current;

        // Periodic workpiece spawning
        spawnTimerRef.current += dt;
        if (spawnTimerRef.current >= 3.6) {
          spawnTimerRef.current = 0;
          spawnWorkpiece(0);
        }

        // Machine animation with scenario speed multipliers
        animateMachines(timeSec);

        // Conveyor Workpiece Movement
        let baseConveyorSpeed = 2.4;
        if (currentScenarioRef.current === "operational_mishap") {
          baseConveyorSpeed = 1.6;
        } else if (currentScenarioRef.current === "cyber_spoof" && !honeypotActiveRef.current) {
          baseConveyorSpeed = 1.35;
        } else if (currentScenarioRef.current === "cyber_exfil" && !honeypotActiveRef.current) {
          baseConveyorSpeed = 2.8;
        }

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
          let speed = baseConveyorSpeed;

          // Bunching before ST-03 in cyber_spoof
          if (currentScenarioRef.current === "cyber_spoof" && !honeypotActiveRef.current) {
            if (wp.dist >= 14.0 && wp.dist < 22.5) {
              speed *= 0.65;
            } else if (wp.dist >= 22.5) {
              speed *= 1.25;
            }
          }

          wp.dist += speed * dt;
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

    animate(performance.now());

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [getPointAtDistance]);

  // Factory Environment Builder
  function buildFactoryEnvironment(scene: THREE.Scene) {
    const floorGeo = new THREE.PlaneGeometry(75, 55);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x161c28,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(75, 50, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);
  }

  // Conveyor System Builder
  function buildConveyorSystem(scene: THREE.Scene) {
    const group = new THREE.Group();
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.3 });

    function createConveyorRun(x1: number, z1: number, x2: number, z2: number) {
      const start = new THREE.Vector3(x1, 0, z1);
      const end = new THREE.Vector3(x2, 0, z2);
      const len = start.distanceTo(end);
      const run = new THREE.Group();

      const belt = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 1.3), beltMat);
      belt.position.set(0, 0.95, 0);
      belt.castShadow = true;
      belt.receiveShadow = true;
      run.add(belt);

      const railF = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.08), railMat);
      railF.position.set(0, 1.05, 0.68);
      run.add(railF);

      const railB = new THREE.Mesh(new THREE.BoxGeometry(len, 0.18, 0.08), railMat);
      railB.position.set(0, 1.05, -0.68);
      run.add(railB);

      const legCount = Math.max(2, Math.floor(len / 3.2));
      for (let i = 0; i <= legCount; i++) {
        const legX = -len / 2 + (i / legCount) * len;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8), frameMat);
        leg.position.set(legX, 0.475, 0.55);
        leg.castShadow = true;
        run.add(leg);

        const legOther = leg.clone();
        legOther.position.z = -0.55;
        run.add(legOther);
      }

      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      run.position.set(mid.x, 0, mid.z);
      const angle = Math.atan2(end.z - start.z, end.x - start.x);
      run.rotation.y = -angle;

      group.add(run);
    }

    createConveyorRun(-18.2, -4.5, 12.2, -4.5);
    createConveyorRun(11.5, -4.5, 11.5, 4.5);
    createConveyorRun(12.2, 4.5, -18.2, 4.5);

    // Pallets
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
    const inPallet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.6), palletMat);
    inPallet.position.set(-17.5, 0.1, -4.5);
    group.add(inPallet);

    const outPallet = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.8), palletMat);
    outPallet.position.set(-17.5, 0.1, 4.5);
    group.add(outPallet);

    const boxMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.8 });
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        const bx = new THREE.Group();
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.7), boxMat);
        m.position.set(-17.85 + x * 0.7, 0.525, 4.15 + z * 0.7);
        m.castShadow = true;
        bx.add(m);
        palletBoxesRef.current.push(bx);
        group.add(bx);
      }
    }

    scene.add(group);
  }

  // Build All 6 Stations
  function buildAllStations(scene: THREE.Scene) {
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x242c3b, metalness: 0.6, roughness: 0.4 });
    const steelLight = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.35 });
    const robotYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.35, roughness: 0.35 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });

    function registerBase(obj: THREE.Group, st: StationConfig) {
      obj.position.set(st.pos.x, 0.15, st.pos.z);

      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 0.08, 3.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      pad.position.y = 0.04;
      pad.receiveShadow = true;
      obj.add(pad);

      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 3.8, 3.6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitBox.position.y = 1.9;
      hitBox.userData = { stationId: st.id };
      obj.add(hitBox);
      stationMeshesRef.current.push(hitBox);

      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.8, 0.65), steelLight);
      cabinet.position.set(-3.6 / 2 - 0.65, 0.9, st.pos.z < 0 ? -1.1 : 1.1);
      cabinet.castShadow = true;
      obj.add(cabinet);

      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(-3.6 / 2 - 0.65, 1.9, st.pos.z < 0 ? -1.1 : 1.1);
      obj.add(led);

      scene.add(obj);
    }

    // ST-01: Cutting Machine
    const st1 = new THREE.Group();
    registerBase(st1, INITIAL_STATIONS[0]);
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.7, 2.8), steelDark);
    pillarL.position.set(-1.3, 1.35, 0);
    st1.add(pillarL);
    const pillarR = pillarL.clone();
    pillarR.position.x = 1.3;
    st1.add(pillarR);
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.35, 0.6), steelDark);
    crossBeam.position.set(0, 2.6, 0);
    st1.add(crossBeam);

    const laserCarriage = new THREE.Group();
    const laserHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.06, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 })
    );
    laserHead.position.y = 2.1;
    laserCarriage.add(laserHead);

    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
    spark.position.y = 1.75;
    laserCarriage.add(spark);
    st1.add(laserCarriage);
    animatableParts.current.laserCarriage = laserCarriage;
    animatableParts.current.laserSpark = spark;

    // ST-02: Milling Machine
    const st2 = new THREE.Group();
    registerBase(st2, INITIAL_STATIONS[1]);
    const cncEnclosure = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.0, 3.0), steelDark);
    cncEnclosure.position.y = 1.5;
    st2.add(cncEnclosure);
    const cncWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), glassMat);
    cncWindow.position.set(0, 1.8, 1.51);
    st2.add(cncWindow);

    const spindleGroup = new THREE.Group();
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.8, 16), steelLight);
    spindle.position.y = 2.15;
    spindleGroup.add(spindle);
    const cutterBit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.02, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
    );
    cutterBit.position.y = 1.7;
    spindleGroup.add(cutterBit);
    st2.add(spindleGroup);
    animatableParts.current.spindleGroup = spindleGroup;
    animatableParts.current.cutterBit = cutterBit;

    // ST-03: Welding Station
    const st3 = new THREE.Group();
    registerBase(st3, INITIAL_STATIONS[2]);
    const rBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 16), steelDark);
    rBase.position.set(0, 0.25, 0.9);
    st3.add(rBase);

    const waist = new THREE.Group();
    waist.position.set(0, 0.5, 0.9);
    const waistMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.45, 16), robotYellow);
    waist.add(waistMesh);

    const lowerArmGroup = new THREE.Group();
    lowerArmGroup.position.set(0, 0.25, 0);
    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 0.28), robotYellow);
    lowerArm.position.set(0, 0.65, 0);
    lowerArmGroup.add(lowerArm);

    const upperArmGroup = new THREE.Group();
    upperArmGroup.position.set(0, 1.3, 0);
    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.1, 0.22), steelLight);
    upperArm.position.set(0, 0.55, 0);
    upperArmGroup.add(upperArm);

    const torch = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 })
    );
    torch.rotation.x = Math.PI;
    torch.position.set(0, 1.15, 0);
    upperArmGroup.add(torch);

    const weldFlash = new THREE.PointLight(0x38bdf8, 3.5, 5.5);
    weldFlash.position.set(0, 1.4, 0);
    upperArmGroup.add(weldFlash);

    lowerArmGroup.add(upperArmGroup);
    waist.add(lowerArmGroup);
    st3.add(waist);

    animatableParts.current.weldRobot = { waist, lowerArmGroup, upperArmGroup };
    animatableParts.current.weldFlash = weldFlash;

    // ST-04: Painting Station
    const st4 = new THREE.Group();
    registerBase(st4, INITIAL_STATIONS[3]);
    const booth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.9, 3.0), steelDark);
    booth.position.y = 1.45;
    st4.add(booth);
    const boothWin = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), glassMat);
    boothWin.position.set(0, 1.6, -1.51);
    st4.add(boothWin);

    const paintHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), steelLight);
    paintHead.position.set(0, 2.2, 0);
    st4.add(paintHead);

    const sprayMist = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.8, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 })
    );
    sprayMist.rotation.x = Math.PI;
    sprayMist.position.set(0, 1.7, 0);
    st4.add(sprayMist);
    animatableParts.current.paintHead = paintHead;
    animatableParts.current.sprayMist = sprayMist;

    // ST-05: Assembly Robot
    const st5 = new THREE.Group();
    registerBase(st5, INITIAL_STATIONS[4]);
    const aBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.5, 16), steelDark);
    aBase.position.set(0, 0.25, -0.9);
    st5.add(aBase);

    const aWaist = new THREE.Group();
    aWaist.position.set(0, 0.5, -0.9);
    const aWaistMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.45, 16), robotYellow);
    aWaist.add(aWaistMesh);

    const aLowerArm = new THREE.Group();
    aLowerArm.position.set(0, 0.25, 0);
    const aLowerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.25, 0.26), robotYellow);
    aLowerMesh.position.set(0, 0.625, 0);
    aLowerArm.add(aLowerMesh);

    const aUpperArm = new THREE.Group();
    aUpperArm.position.set(0, 1.25, 0);
    const aUpperMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.05, 0.2), steelLight);
    aUpperMesh.position.set(0, 0.525, 0);
    aUpperArm.add(aUpperMesh);

    const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.28), steelDark);
    gripper.position.set(0, 1.1, 0);
    aUpperArm.add(gripper);

    aLowerArm.add(aUpperArm);
    aWaist.add(aLowerArm);
    st5.add(aWaist);
    animatableParts.current.assemblyRobot = { waist: aWaist, lowerArmGroup: aLowerArm, upperArmGroup: aUpperArm };

    // ST-06: Packaging Press
    const st6 = new THREE.Group();
    registerBase(st6, INITIAL_STATIONS[5]);
    const pkgArch = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.7, 1.6), steelDark);
    pkgArch.position.y = 1.35;
    st6.add(pkgArch);

    const pkgPress = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.4 })
    );
    pkgPress.position.set(0, 2.1, 0);
    st6.add(pkgPress);
    animatableParts.current.pkgPress = pkgPress;
  }

  // Workpiece Spawning & Morphing
  function spawnWorkpiece(dist = 0) {
    const scene = sceneRef.current;
    if (!scene) return;

    const group = new THREE.Group();
    const wp: WorkpieceInstance = {
      mesh: group,
      dist,
      stage: 0,
      passedStations: new Set(),
    };

    const s0 = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.08, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
    );
    s0.position.y = 0.04;
    group.add(s0);

    const s1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.1, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.3 })
    );
    s1.position.y = 0.05;
    s1.visible = false;
    group.add(s1);

    const s2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.35 })
    );
    s2.position.y = 0.12;
    s2.visible = false;
    group.add(s2);

    const s3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.35, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.65, roughness: 0.3 })
    );
    s3.position.y = 0.175;
    s3.visible = false;
    group.add(s3);

    const s4 = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.38, 0.58),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.4, roughness: 0.2 })
    );
    s4.position.y = 0.19;
    s4.visible = false;
    group.add(s4);

    const s5 = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.42, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.3 })
    );
    s5.position.y = 0.21;
    s5.visible = false;
    group.add(s5);

    const s6 = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.5, 0.68),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 })
    );
    s6.position.y = 0.25;
    s6.visible = false;
    group.add(s6);

    group.position.copy(getPointAtDistance(dist));
    scene.add(group);
    workpiecesRef.current.push(wp);
  }

  function updateWorkpieceVisualStage(wp: WorkpieceInstance) {
    const children = wp.mesh.children;
    for (let i = 0; i < children.length; i++) {
      children[i].visible = i === wp.stage;
    }
  }

  function animateMachines(t: number) {
    const parts = animatableParts.current;

    // Cutting
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

    // ST-03 Welding Robot: Dynamic Speed Multiplier & Overdrive Flash
    if (parts.weldRobot) {
      const r = parts.weldRobot;

      let robotSpeedMult = 1.0;
      if (currentScenarioRef.current === "operational_mishap") {
        robotSpeedMult = 0.6;
      } else if (currentScenarioRef.current === "cyber_spoof" && !honeypotActiveRef.current) {
        robotSpeedMult = 0.55;
      } else if (currentScenarioRef.current === "cyber_exfil" && !honeypotActiveRef.current) {
        robotSpeedMult = 1.85;
      }

      const wt = t * robotSpeedMult;
      r.waist.rotation.y = Math.sin(wt * 2.2) * 0.35;
      r.lowerArmGroup.rotation.x = 0.25 + Math.sin(wt * 3.0) * 0.14;
      r.upperArmGroup.rotation.x = 0.35 + Math.cos(wt * 3.0) * 0.15;

      if (parts.weldFlash) {
        let flashOn = Math.sin(wt * 28) > 0.15;
        if (currentScenarioRef.current === "cyber_exfil" && !honeypotActiveRef.current) {
          flashOn = Math.sin(t * 85) > -0.2;
        }
        parts.weldFlash.visible = flashOn;
        parts.weldFlash.position.x = Math.sin(wt * 2.2) * 0.45;
      }
    }

    // Painting
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

  function updateCameraFromSpherical(camera: THREE.Camera) {
    const s = camSpherical.current;
    const sinPhi = Math.sin(s.phi);
    camera.position.x = camTarget.current.x + s.radius * sinPhi * Math.sin(s.theta);
    camera.position.y = camTarget.current.y + s.radius * Math.cos(s.phi);
    camera.position.z = camTarget.current.z + s.radius * sinPhi * Math.cos(s.theta);
    camera.lookAt(camTarget.current);
  }

  function setCameraPreset(index: number) {
    const p = CAMERA_PRESETS[index];
    if (!p) return;
    setActiveCamPreset(index);
    desiredCamPos.current.copy(p.pos);
    desiredCamTarget.current.copy(p.target);
    isCameraTransitioning.current = true;
  }

  function triggerNewWorkOrder(autoTriggered = false) {
    const products = [
      { name: "ServoDrive-X200", drawing: "TH-06-204", target: 20 },
      { name: "Actuator-M90", drawing: "TH-04-112", target: 25 },
      { name: "GearBox-H40", drawing: "TH-02-089", target: 15 },
    ];
    const pick = products[Math.floor(Math.random() * products.length)];
    const newId = `WO20261117${Math.floor(Math.random() * 89 + 10)}`;

    setWorkOrders((prev) => [
      {
        id: newId,
        product: pick.name,
        drawing: pick.drawing,
        target: pick.target,
        produced: 0,
        status: "In Progress",
      },
      ...prev.slice(0, 4),
    ]);
    setActiveWoIndex(0);

    if (!autoTriggered) {
      showToast(`Dispatched new Work Order ${newId} (${pick.name})`);
    }
  }

  function resetSimulation() {
    const scene = sceneRef.current;
    if (scene) {
      workpiecesRef.current.forEach((w) => scene.remove(w.mesh));
    }
    workpiecesRef.current = [];
    setStations((prev) => prev.map((s) => ({ ...s, completed: 0 })));
    setWorkOrders((prev) =>
      prev.map((wo, i) => (i === 0 ? { ...wo, produced: 0, status: "In Progress" } : wo))
    );
    switchScenario("normal");
    const progresses = [0.06, 0.22, 0.38, 0.56, 0.72, 0.88];
    progresses.forEach((p) => spawnWorkpiece(p * totalPathLengthRef.current));
    showToast("Production line telemetry & physical state reset to nominal baseline.");
  }

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const activeWO = workOrders[activeWoIndex];
  const activePct = activeWO ? Math.min(100, Math.round((activeWO.produced / activeWO.target) * 100)) : 0;
  const donutCircumference = 2 * Math.PI * 38;
  const donutOffset = donutCircumference - (activePct / 100) * donutCircumference;

  return (
    <div className="w-full flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Bar: VoltGuard Branding & 4-Scenario Switcher */}
      <div className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30">
        {/* Left Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-cyan-400 uppercase font-mono flex items-center gap-1.5">
              <span>VOLTGUARD</span>
              <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-500/40">v4.0</span>
            </div>
            <div className="text-[9px] text-zinc-400 font-semibold tracking-wider">CYBER-OT TWIN</div>
          </div>
        </div>

        {/* Center: 4-Scenario Switcher Bar */}
        <div className="order-3 lg:order-none w-full lg:w-auto flex items-center justify-center">
          <div className="flex flex-wrap items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shadow-inner">
            <button
              onClick={() => switchScenario("normal")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentScenario === "normal"
                  ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span>🟢</span> <span>Normal</span>
            </button>
            <button
              onClick={() => switchScenario("operational_mishap")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentScenario === "operational_mishap"
                  ? "bg-amber-600 text-white font-semibold shadow-md shadow-amber-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span>🟡</span> <span>Mishap</span>
            </button>
            <button
              onClick={() => switchScenario("cyber_spoof")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentScenario === "cyber_spoof"
                  ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span>🔴</span> <span>HMI Spoof</span>
            </button>
            <button
              onClick={() => switchScenario("cyber_exfil")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                currentScenario === "cyber_exfil"
                  ? "bg-purple-600 text-white font-semibold shadow-md shadow-purple-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <span>🟣</span> <span>Exfil &amp; Overload</span>
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800 text-xs">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition ${
                  simSpeed === s ? "bg-blue-600 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={() => setIsRunning((r) => !r)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white shadow transition ${
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
            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Clock */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{clockString || "Connecting..."}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace (70% 3D Viewport / 30% SCADA MES Sidebar) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-[580px] lg:min-h-[640px] overflow-hidden">
        {/* Left 3D Viewport */}
        <div className="relative w-full lg:w-[68%] h-[420px] sm:h-[480px] lg:h-auto bg-gradient-to-b from-zinc-900 to-zinc-950 overflow-hidden">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Camera Switcher */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
            {CAMERA_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => setCameraPreset(idx)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition border ${
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

                let headBg = "bg-gradient-to-r from-emerald-600 to-teal-700";
                let badgeText = "Nominal";

                if (st.id === 3) {
                  if (honeypotActive) {
                    headBg = "bg-gradient-to-r from-cyan-600 to-emerald-600 shadow-lg shadow-cyan-500/40";
                    badgeText = "SHADOW-ISOLATED";
                  } else if (currentScenario === "operational_mishap") {
                    headBg = "bg-gradient-to-r from-amber-600 to-amber-700";
                    badgeText = "Degraded";
                  } else if (currentScenario === "cyber_spoof") {
                    headBg = "bg-gradient-to-r from-rose-600 to-red-700 animate-pulse";
                    badgeText = "SPOOFED // LIE DETECTED";
                  } else if (currentScenario === "cyber_exfil") {
                    headBg = "bg-gradient-to-r from-purple-600 to-rose-700 animate-pulse";
                    badgeText = "EXFIL + OVERLOAD";
                  }
                } else if (st.ttsSec != null && st.ttsSec <= 60 && !honeypotActive) {
                  headBg = "bg-gradient-to-r from-orange-600 to-red-700 animate-pulse";
                  badgeText = "STARVED";
                }

                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    style={{
                      left: `${pos.left}px`,
                      top: `${pos.top}px`,
                      transform: "translate(-50%, -100%)",
                    }}
                    className="absolute pointer-events-auto rounded-lg border border-zinc-700/80 bg-zinc-900/90 backdrop-blur-md overflow-hidden cursor-pointer shadow-2xl min-w-[165px] transition-transform hover:scale-105 hover:border-cyan-400 z-10 font-mono text-[10px]"
                  >
                    <div className={`px-2 py-0.5 flex items-center justify-between font-bold text-white ${headBg}`}>
                      <span>{st.code}</span>
                      <span className="opacity-95 text-[9px] uppercase">{badgeText}</span>
                    </div>
                    <div className="p-2 space-y-0.5 text-zinc-300 leading-tight">
                      <div className="truncate text-zinc-400 font-sans">
                        Station: <span className="text-zinc-100 font-semibold">{st.shortName}</span>
                      </div>
                      <div className="text-zinc-400">
                        RPM (HMI): <span className="text-zinc-100 font-bold">{st.reportedRpm}</span>
                      </div>
                      <div className="text-zinc-400">
                        Amps (True):{" "}
                        <span
                          className={`font-bold ${
                            Math.abs(st.actualAmps - st.expectedAmps) > 15
                              ? "text-rose-400 animate-pulse"
                              : Math.abs(st.actualAmps - st.expectedAmps) > 5
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {st.actualAmps.toFixed(1)}A
                        </span>
                      </div>
                      {st.ttsSec != null && !honeypotActive && (
                        <div className="text-amber-400 font-bold animate-pulse">
                          Starve ETA: <span>{st.ttsSec}s</span>
                        </div>
                      )}
                      <div className="text-zinc-400">
                        Status: <span className="text-zinc-200">{st.status}</span>
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

          {/* Material Flow Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-1.5 shadow-xl pointer-events-auto max-w-full overflow-x-auto text-[11px]">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Material Flow:</span>
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-zinc-400 inline-block" /> 1. Cut
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
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-700 inline-block" /> 6. Boxed
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg px-2.5 py-1 text-[11px] text-zinc-400 pointer-events-auto">
              <span>Drag to orbit • Scroll to zoom • Click 3D station</span>
            </div>
          </div>

          {/* Selected Station Inspector Modal */}
          {selectedStation && (
            <div className="absolute bottom-14 left-3 z-30 w-80 bg-zinc-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl">
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
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{selectedStation.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">REPORTED RPM</div>
                  <div className="text-zinc-100 font-semibold mt-0.5">{selectedStation.reportedRpm} RPM</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">TRUE CURRENT</div>
                  <div className="text-emerald-400 font-semibold mt-0.5">{selectedStation.actualAmps.toFixed(1)} A</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">TRUST SCORE</div>
                  <div className="text-cyan-300 font-semibold mt-0.5">{selectedStation.trustScore}% Trust</div>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-500">PROCESSED</div>
                  <div className="text-amber-400 font-semibold mt-0.5">{selectedStation.completed} units</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Threat Radar, Telemetry & MES Queue */}
        <div className="w-full lg:w-[32%] bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 p-3 flex flex-col gap-3 overflow-y-auto max-h-[750px]">
          {/* CARD 0: CYBER-PHYSICAL THREAT RADAR */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Threat Radar</h3>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  honeypotActive
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                    : currentScenario === "normal"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : currentScenario === "operational_mishap"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : currentScenario === "cyber_spoof"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse"
                    : "bg-purple-500/20 text-purple-400 border border-purple-500/50 animate-pulse"
                }`}
              >
                {honeypotActive
                  ? "SHADOW-ISOLATED"
                  : currentScenario === "normal"
                  ? "NOMINAL"
                  : currentScenario === "operational_mishap"
                  ? "OPERATIONAL MISHAP"
                  : currentScenario === "cyber_spoof"
                  ? "TELEMETRY SPOOF"
                  : "EXFIL & OVERLOAD"}
              </span>
            </div>

            {/* Side-Channel Power Discrepancy Bar */}
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 mb-2 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                <span>ST-03 SIDE-CHANNEL CORRELATION</span>
                <span
                  className={
                    currentScenario === "normal" || honeypotActive
                      ? "text-emerald-400 font-bold"
                      : currentScenario === "operational_mishap"
                      ? "text-amber-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {honeypotActive
                    ? "100% PROTECTED"
                    : currentScenario === "normal"
                    ? "100% MATCH"
                    : currentScenario === "operational_mishap"
                    ? "PHYSICS HONEST"
                    : currentScenario === "cyber_spoof"
                    ? "LIE DETECTED (-34%)"
                    : "OVERLOAD (+34%)"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-1.5">
                <div>
                  <span className="text-zinc-500 text-[9px] block">REPORTED RPM</span>
                  <span className="text-zinc-200 font-bold">{stations[2]?.reportedRpm} RPM</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[9px] block">TRUE CURRENT</span>
                  <span
                    className={`font-bold ${
                      currentScenario === "normal" || honeypotActive
                        ? "text-emerald-400"
                        : currentScenario === "operational_mishap"
                        ? "text-amber-400"
                        : currentScenario === "cyber_spoof"
                        ? "text-rose-400"
                        : "text-purple-400"
                    }`}
                  >
                    {stations[2]?.actualAmps.toFixed(1)} A
                  </span>
                </div>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    honeypotActive
                      ? "bg-cyan-400 w-full"
                      : currentScenario === "normal"
                      ? "bg-emerald-500 w-full"
                      : currentScenario === "operational_mishap"
                      ? "bg-amber-500 w-[70%]"
                      : currentScenario === "cyber_spoof"
                      ? "bg-rose-500 w-[40%] animate-pulse"
                      : "bg-purple-500 w-full animate-pulse"
                  }`}
                />
              </div>
            </div>

            {/* Active Honeypot Trigger Button */}
            <div className="mb-2">
              <button
                onClick={deployHoneypot}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  honeypotActive
                    ? "bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-lg shadow-cyan-500/20"
                    : currentScenario === "cyber_spoof" || currentScenario === "cyber_exfil"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400 shadow-lg shadow-cyan-500/30 animate-pulse cursor-pointer"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                }`}
              >
                <span>🛡️</span>
                <span>
                  {honeypotActive
                    ? "Honeypot Active (Decoy Engaged)"
                    : currentScenario === "cyber_spoof" || currentScenario === "cyber_exfil"
                    ? "Deploy Deception Honeypot PLC"
                    : "Deception Honeypot (Standby)"}
                </span>
              </button>
            </div>

            {/* OT Modbus Telemetry Feed */}
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-2 font-mono text-[9px]">
              <div className="flex items-center justify-between text-zinc-500 uppercase tracking-wider mb-1 pb-1 border-b border-zinc-800">
                <span>OT Modbus Telemetry Feed</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                {securityLogs.map((l, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 leading-snug py-0.5 border-b border-zinc-800/40">
                    <span className="text-zinc-500 whitespace-nowrap">{l.time}</span>
                    <span
                      className={`px-1 py-0.2 rounded text-[8px] font-bold whitespace-nowrap ${
                        l.sev === "CRITICAL" || l.sev === "EMERGENCY"
                          ? "text-rose-400 bg-rose-950/60 border border-rose-800/60"
                          : l.sev === "ALERT" || l.sev === "WARN"
                          ? "text-amber-400 bg-amber-950/60 border border-amber-800/60"
                          : l.sev === "DEFENSE" || l.sev === "RECOVERY"
                          ? "text-cyan-300 bg-cyan-950/60 border border-cyan-700/60"
                          : "text-emerald-400 bg-emerald-950/40 border border-emerald-800/50"
                      }`}
                    >
                      {l.sev}
                    </span>
                    <span className="text-zinc-300 truncate">{l.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 1: WORKSTATION STATUS */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Workstation Telemetry</h3>
              </div>
              <span className={`text-xs font-bold font-mono ${isRunning ? "text-emerald-400" : "text-amber-400"}`}>
                {isRunning ? "● Working" : "⏸ Standby"}
              </span>
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
                      {st.code}
                    </span>
                  </div>
                  <div className="text-[10px] space-y-0.5 font-mono text-zinc-400 leading-tight">
                    <div className="text-zinc-400">RPM: <span className="text-zinc-200 font-bold">{st.reportedRpm}</span></div>
                    <div className="text-zinc-400">Amps: <span className="text-emerald-400 font-bold">{st.actualAmps.toFixed(1)}A</span></div>
                    <div className="truncate">
                      Trust: <span className={st.trustScore < 50 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{st.trustScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: MES WORK ORDER */}
          <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Active Work Order</h3>
              </div>
              <button
                onClick={() => triggerNewWorkOrder(false)}
                className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-medium transition"
              >
                <Plus className="w-3 h-3" />
                <span>Next Order</span>
              </button>
            </div>

            {activeWO && (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs flex-1 min-w-0 font-mono">
                  <div className="text-zinc-400 truncate text-[11px]">
                    WO: <span className="text-zinc-100 font-semibold">{activeWO.id}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Status:{" "}
                    <span className={activeWO.status === "Completed" ? "text-cyan-400 font-semibold" : "text-emerald-400 font-semibold"}>
                      {activeWO.status}
                    </span>
                  </div>
                  <div className="text-zinc-400 truncate text-[11px]">
                    Product: <span className="text-zinc-200">{activeWO.product}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Progress: <span className="text-cyan-300 font-bold">{activeWO.produced} / {activeWO.target} pcs</span>
                  </div>
                </div>

                {/* Donut progress ring */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-18 h-18 flex items-center justify-center">
                    <svg className="w-18 h-18 -rotate-90" viewBox="0 0 100 100">
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
                      <span className="text-xs font-bold font-mono text-white">{activePct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-cyan-500/60 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
