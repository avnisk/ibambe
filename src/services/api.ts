import { DigitalTwinState, ApiResponse, Station, Edge, SecurityLog } from "@/types";

// Base URL resolution: prioritize NEXT_PUBLIC_BACKEND_URL, fallback to NEXT_PUBLIC_API_URL or default
const rawUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

export const BACKEND_BASE_URL = rawUrl.replace(/\/+$/, "");

/**
 * Deterministic fallback mock state compliant with DigitalTwinState schema.
 * Used when backend server is offline or starting up so UI never crashes.
 */
export const DEFAULT_MOCK_STATE: DigitalTwinState = {
  timestamp: new Date().toISOString(),
  scenario: "normal",
  honeypot_active: false,
  classification: "NOMINAL",
  risk_score: 4,
  financial_loss_per_hr: 0,
  stations: [
    {
      id: "S1",
      name: "Cutting",
      level: 1,
      status: "NOMINAL",
      reported_uptime: 99.8,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 18.2,
      expected_amps: 18.0,
      buffer_to_next: 45,
      buffer_capacity: 100,
      constraint_score: 0.05,
      time_to_starvation_sec: null,
    },
    {
      id: "S2",
      name: "Milling",
      level: 2,
      status: "NOMINAL",
      reported_uptime: 99.4,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 18.1,
      expected_amps: 18.0,
      buffer_to_next: 50,
      buffer_capacity: 100,
      constraint_score: 0.08,
      time_to_starvation_sec: null,
    },
    {
      id: "S3",
      name: "Welding",
      level: 3,
      status: "NOMINAL",
      reported_uptime: 99.9,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 18.0,
      expected_amps: 18.0,
      buffer_to_next: 50,
      buffer_capacity: 100,
      constraint_score: 0.05,
      time_to_starvation_sec: null,
    },
    {
      id: "S4",
      name: "Painting",
      level: 4,
      status: "NOMINAL",
      reported_uptime: 99.5,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 17.9,
      expected_amps: 18.0,
      buffer_to_next: 48,
      buffer_capacity: 100,
      constraint_score: 0.06,
      time_to_starvation_sec: null,
    },
    {
      id: "S5",
      name: "Assembly",
      level: 5,
      status: "NOMINAL",
      reported_uptime: 99.7,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 18.0,
      expected_amps: 18.0,
      buffer_to_next: 52,
      buffer_capacity: 100,
      constraint_score: 0.04,
      time_to_starvation_sec: null,
    },
    {
      id: "S6",
      name: "Packing",
      level: 6,
      status: "NOMINAL",
      reported_uptime: 99.9,
      actual_throughput: 120,
      reported_rpm: 2400,
      actual_amps: 18.1,
      expected_amps: 18.0,
      buffer_to_next: 50,
      buffer_capacity: 100,
      constraint_score: 0.02,
      time_to_starvation_sec: null,
    },
  ],
  edges: [
    { from: "S1", to: "S2", flow_rate: 120, congested: false },
    { from: "S2", to: "S3", flow_rate: 120, congested: false },
    { from: "S3", to: "S4", flow_rate: 120, congested: false },
    { from: "S4", to: "S5", flow_rate: 120, congested: false },
    { from: "S5", to: "S6", flow_rate: 120, congested: false },
  ],
  security_logs: [
    {
      time: "12:00:01",
      severity: "INFO",
      source: "SCADA-POLL",
      target: "PLC-ARRAY",
      event: "All 6 PLC holding registers verified concordant with physical line throughput.",
    },
    {
      time: "12:00:02",
      severity: "INFO",
      source: "AMPERAGE-BUS",
      target: "VOLTGUARD-CORE",
      event: "CT clamp current readings match reported RPM baseline across all stations.",
    },
  ],
  forensic_summary:
    "System running in equilibrium. Flow rates across Stations S1 through S6 conform strictly to conservation laws (Inflow = Outflow). No side-channel amperage anomalies detected.",
  recommended_actions: [
    "Continuous automated polling of Modbus TCP port 502 holding registers",
    "Monitor buffer storage levels between Level 2 Milling and Level 3 Welding",
  ],
};

/**
 * Fetch live digital twin state from backend with automatic fallback.
 * Works seamlessly in both Next.js Server Components and client-side code.
 */
export async function getDigitalTwinState(): Promise<DigitalTwinState> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${BACKEND_BASE_URL}/state`, {
      signal: controller.signal,
      next: { revalidate: 1 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }

    const data: DigitalTwinState = await res.json();
    return data;
  } catch {
    // Return structured deterministic mock state if backend is unreachable
    return {
      ...DEFAULT_MOCK_STATE,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Trigger or inject a simulated cyber/physical scenario to backend.
 */
export async function triggerScenario(
  scenario: "normal" | "cyber_espionage" | "operational_degradation"
): Promise<ApiResponse<{ status: string }>> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      success: true,
      data: { status: `Simulated switch to ${scenario} (local fallback)` },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Deploy or disengage the autonomous Deception Honeypot PLC.
 */
export async function toggleHoneypot(
  deploy: boolean
): Promise<ApiResponse<{ honeypot_active: boolean }>> {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/honeypot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deploy }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      success: true,
      data: { honeypot_active: deploy },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check if live backend server is accessible.
 */
export async function checkBackendHealth(): Promise<{ live: boolean; url: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(`${BACKEND_BASE_URL}/state`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return { live: res.ok, url: BACKEND_BASE_URL };
  } catch {
    return { live: false, url: BACKEND_BASE_URL };
  }
}
