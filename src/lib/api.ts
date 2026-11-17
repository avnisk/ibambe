import {
  BACKEND_BASE_URL,
  DEFAULT_MOCK_STATE,
  getDigitalTwinState as fetchDigitalTwinState,
  triggerScenario as postScenario,
  toggleHoneypot as postHoneypot,
} from "@/services/api";
import { useLiveTwinState } from "@/services/useLiveTwinState";
import { DigitalTwinState, FeatureItem, ApiResponse } from "@/types";

export const API_BASE_URL = BACKEND_BASE_URL;
export const MOCK_DIGITAL_TWIN_STATE = DEFAULT_MOCK_STATE;
export const getDigitalTwinState = fetchDigitalTwinState;
export const triggerScenario = postScenario;
export const toggleHoneypot = postHoneypot;
export { useLiveTwinState };

export const MOCK_FEATURES: FeatureItem[] = [
  {
    id: "flow-conservation",
    title: "Cross-Node Flow Conservation",
    description:
      "Tracks mass balance across interconnected buffers in real time. Predicts downstream line starvation minutes before isolated station dashboards notice a drop.",
    category: "physics",
    status: "active",
    metric: "0.02s latency",
  },
  {
    id: "side-channel-audit",
    title: "Side-Channel Current Verification",
    description:
      "Audits physical current-clamp amperage against software Modbus registers. Exposes Stuxnet-style register spoofing where reported RPM claims 99% uptime while motors idle.",
    category: "security",
    status: "active",
    metric: "100% detection",
  },
  {
    id: "active-honeypot",
    title: "Autonomous Deception Sandbox",
    description:
      "Quarantines suspicious Modbus write commands to an emulated honeypot PLC at IP 10.99.0.42. Feeds synthetic telemetry back to attackers while rerouting physical line flow.",
    category: "security",
    status: "active",
    metric: "< 1.4s failover",
  },
  {
    id: "starvation-math",
    title: "Deterministic Starvation Modeling",
    description:
      "Calculates exact time-to-starvation across subsequent stages using differential buffer drainage math, replacing black-box heuristics with explainable physics.",
    category: "physics",
    status: "active",
    metric: "Exact countdown",
  },
];
