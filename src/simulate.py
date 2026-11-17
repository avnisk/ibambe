"""
simulate.py — Chronos-Twin stateful tick-based factory simulator.

Supports 3 scenarios:
  • normal               — baseline operations
  • cyber_espionage      — silent Modbus WRITE attack on Station 3
  • operational_degradation — mechanical wear on Station 3

Public API
----------
sim = FactoryTwinSimulator()
state = sim.tick()           # advance 1 tick, return full state dict
sim.set_scenario(name)       # switch scenario (resets buffers)
sim.deploy_honeypot(active)  # toggle Deception Honeypot PLC
"""

import math
import random
import datetime
from collections import deque

from config import (
    STATION_IDS, STATION_NAMES, STATION_LEVELS,
    EDGES, BASELINE_CYCLE_TIME, BASELINE_THROUGHPUT,
    BUFFER_CAPACITY, BUFFER_INIT_NORMAL, BASELINE_AMPS, BASELINE_RPM,
    CYBER_THROUGHPUT_DROP, CYBER_AMPERAGE_DROP, CYBER_SPOOF_UPTIME,
    CYBER_ATTACKER_IP, CYBER_ATTACKER_TARGET, CYBER_MODBUS_REG,
    DEGRADATION_THROUGHPUT_DROP, DEGRADATION_AMPERAGE_DROP,
    REVENUE_PER_UNIT_PER_HR, UNITS_PER_HR_BASELINE,
)


# ─────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────
def _jitter(value: float, pct: float = 0.02) -> float:
    """Add ±pct Gaussian noise to a value (keeps simulation lively)."""
    return value * (1 + random.gauss(0, pct))


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


class _SecurityLog:
    """Rolling ring-buffer of OT security events (max 20 entries)."""

    def __init__(self):
        self._entries: deque = deque(maxlen=20)

    def add(self, severity: str, source: str, target: str, event: str):
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        self._entries.appendleft({
            "time": ts,
            "severity": severity,
            "source": source,
            "target": target,
            "event": event,
        })

    def snapshot(self) -> list[dict]:
        return list(self._entries)


# ─────────────────────────────────────────────────────
# Main simulator class
# ─────────────────────────────────────────────────────
class FactoryTwinSimulator:
    """
    Tick-based digital twin of a 6-station serial manufacturing line.

    State is advanced by calling .tick() — returns a complete snapshot dict
    that the API layer can serialise directly to JSON.
    """

    VALID_SCENARIOS = {"normal", "cyber_espionage", "operational_degradation"}

    def __init__(self):
        self._scenario: str = "normal"
        self._honeypot_active: bool = False
        self._tick_count: int = 0
        self._security_log = _SecurityLog()

        # Buffer state: keyed by (from_id, to_id)
        self._buffers: dict[tuple, float] = {}
        self._reset_buffers()

        # Station uptime accumulator (pct, starts at 100)
        self._uptime: dict[str, float] = {sid: 100.0 for sid in STATION_IDS}

        # Track attack start tick for honeypot recovery
        self._attack_start_tick: int = 0
        self._honeypot_activated_tick: int | None = None

    # ── Public control methods ────────────────────────────────────────────

    def set_scenario(self, name: str):
        if name not in self.VALID_SCENARIOS:
            raise ValueError(f"Unknown scenario: {name!r}")
        self._scenario = name
        self._honeypot_active = False
        self._honeypot_activated_tick = None
        self._tick_count = 0
        self._security_log = _SecurityLog()
        self._uptime = {sid: 100.0 for sid in STATION_IDS}
        self._reset_buffers()

        if name == "cyber_espionage":
            self._attack_start_tick = 0
            # Inject initial attack event immediately
            self._security_log.add(
                "CRITICAL",
                CYBER_ATTACKER_IP,
                CYBER_ATTACKER_TARGET,
                f"UNAUTHORIZED WRITE_REG {CYBER_MODBUS_REG} + HMI REPLAY SPOOF",
            )

    def deploy_honeypot(self, active: bool):
        self._honeypot_active = active
        if active and self._scenario == "cyber_espionage":
            self._honeypot_activated_tick = self._tick_count
            self._security_log.add(
                "INFO",
                "DEFENSE-SYSTEM",
                "HONEYPOT-PLC-S3",
                f"Deception Honeypot activated — {CYBER_ATTACKER_IP} shadow-routed to virtual decoy PLC",
            )

    # ── Core tick logic ───────────────────────────────────────────────────

    def tick(self) -> dict:
        self._tick_count += 1
        stations = self._compute_stations()
        edges = self._compute_edges()
        self._evolve_buffers(stations)

        timestamp = datetime.datetime.now().strftime("%H:%M:%S")

        # Inject periodic security events for cyber_espionage
        if self._scenario == "cyber_espionage" and not self._honeypot_active:
            if self._tick_count % 5 == 0:
                self._security_log.add(
                    "CRITICAL",
                    CYBER_ATTACKER_IP,
                    CYBER_ATTACKER_TARGET,
                    f"UNAUTHORIZED WRITE_REG {CYBER_MODBUS_REG} + HMI REPLAY SPOOF",
                )
        elif self._honeypot_active and self._scenario == "cyber_espionage":
            if self._tick_count % 8 == 0:
                self._security_log.add(
                    "WARNING",
                    CYBER_ATTACKER_IP,
                    "HONEYPOT-PLC-S3",
                    "Attacker writing to DECOY PLC — real S3 isolated and recovering",
                )

        return {
            "timestamp": timestamp,
            "scenario": self._scenario,
            "honeypot_active": self._honeypot_active,
            "stations": stations,
            "edges": edges,
            "buffers": self._buffer_snapshot(),
            "security_logs": self._security_log.snapshot(),
            "tick": self._tick_count,
        }

    # ── Station state computation ─────────────────────────────────────────

    def _compute_stations(self) -> list[dict]:
        stations = []
        for i, sid in enumerate(STATION_IDS):
            name = STATION_NAMES[i]
            level = STATION_LEVELS[i]

            # --- Throughput & amperage modifiers ---
            throughput_factor = 1.0
            amp_factor = 1.0
            status = "NORMAL"
            reported_rpm = BASELINE_RPM[sid]
            spoofed_uptime = None

            if sid == "S3":
                if self._scenario == "cyber_espionage":
                    if self._honeypot_active:
                        # Attacker diverted to decoy; real S3 recovering
                        recovery_ticks = self._tick_count - (self._honeypot_activated_tick or 0)
                        recovery = min(1.0, recovery_ticks * 0.12)   # ~8 ticks to full recovery
                        throughput_factor = 1.0 - CYBER_THROUGHPUT_DROP * (1 - recovery)
                        amp_factor = 1.0 - CYBER_AMPERAGE_DROP * (1 - recovery)
                        status = "RECOVERING"
                    else:
                        throughput_factor = 1.0 - CYBER_THROUGHPUT_DROP
                        amp_factor = 1.0 - CYBER_AMPERAGE_DROP
                        status = "SPOOFED"
                        # HMI spoofed: reported RPM stays at baseline
                        reported_rpm = BASELINE_RPM[sid]
                        spoofed_uptime = CYBER_SPOOF_UPTIME

                elif self._scenario == "operational_degradation":
                    throughput_factor = 1.0 - DEGRADATION_THROUGHPUT_DROP
                    amp_factor = 1.0 - DEGRADATION_AMPERAGE_DROP
                    status = "DEGRADED"
                    # No spoofing: RPM drops proportionally
                    reported_rpm = int(BASELINE_RPM[sid] * throughput_factor)

            # Apply small noise
            actual_tp  = _clamp(_jitter(BASELINE_THROUGHPUT[sid] * throughput_factor), 0, 100)
            actual_amps = _jitter(BASELINE_AMPS[sid] * amp_factor)
            expected_amps = BASELINE_AMPS[sid]

            # Buffer to next station
            edge_key = (sid, STATION_IDS[i + 1]) if i < len(STATION_IDS) - 1 else None
            buf_level   = int(self._buffers.get(edge_key, 0)) if edge_key else 0
            buf_capacity = BUFFER_CAPACITY.get(edge_key, 0) if edge_key else 0

            # Uptime: degrades slowly during attack if not honeypotted
            if sid == "S3" and self._scenario != "normal" and not self._honeypot_active:
                self._uptime[sid] = max(70.0, self._uptime[sid] - 0.1)
            elif sid == "S3" and self._honeypot_active:
                self._uptime[sid] = min(100.0, self._uptime[sid] + 0.5)

            reported_uptime = spoofed_uptime if spoofed_uptime is not None else round(self._uptime[sid], 1)

            station = {
                "id": sid,
                "name": name,
                "level": level,
                "status": status,
                "reported_uptime": reported_uptime,
                "actual_throughput": round(actual_tp, 2),
                "reported_rpm": reported_rpm,
                "actual_amps": round(actual_amps, 2),
                "expected_amps": expected_amps,
                "buffer_to_next": buf_level,
                "buffer_capacity": buf_capacity,
            }
            stations.append(station)

        return stations

    # ── Edge / flow computation ───────────────────────────────────────────

    def _compute_edges(self) -> list[dict]:
        edges = []
        for from_id, to_id in EDGES:
            fi = STATION_IDS.index(from_id)
            # Flow rate is limited by the downstream station's ability to consume
            upstream_tp = BASELINE_THROUGHPUT[from_id]
            if from_id == "S3" and self._scenario == "cyber_espionage" and not self._honeypot_active:
                upstream_tp *= (1 - CYBER_THROUGHPUT_DROP)
            elif from_id == "S3" and self._scenario == "operational_degradation":
                upstream_tp *= (1 - DEGRADATION_THROUGHPUT_DROP)
            flow_rate = round(_jitter(upstream_tp, 0.01), 2)

            # Edge is "congested" if buffer is > 85% full
            edge_key = (from_id, to_id)
            buf_pct = self._buffers.get(edge_key, 0) / BUFFER_CAPACITY.get(edge_key, 1)
            congested = buf_pct > 0.85

            edges.append({
                "from": from_id,
                "to": to_id,
                "flow_rate": flow_rate,
                "congested": congested,
            })
        return edges

    # ── Buffer evolution ──────────────────────────────────────────────────

    def _evolve_buffers(self, stations: list[dict]):
        """
        Each tick:
        - Upstream station produces units → adds to buffer
        - Downstream station consumes units ← removes from buffer
        """
        station_map = {s["id"]: s for s in stations}

        for from_id, to_id in EDGES:
            key = (from_id, to_id)
            cap = BUFFER_CAPACITY[key]

            producer_tp = station_map[from_id]["actual_throughput"]
            consumer_tp = station_map[to_id]["actual_throughput"]

            # Normalise to units/tick (throughput is out of 100)
            produced = producer_tp * 0.1   # scale factor
            consumed = consumer_tp * 0.1

            self._buffers[key] = _clamp(
                self._buffers[key] + produced - consumed,
                0.0,
                float(cap),
            )

            # Honeypot recovery: gradually refill downstream buffers
            if self._honeypot_active and to_id in ("S4", "S5", "S6"):
                self._buffers[key] = min(float(cap), self._buffers[key] + 1.5)

    # ── Reset & snapshot helpers ──────────────────────────────────────────

    def _reset_buffers(self):
        self._buffers = {key: float(val) for key, val in BUFFER_INIT_NORMAL.items()}

    def _buffer_snapshot(self) -> dict:
        return {
            f"{k[0]}->{k[1]}": {
                "level": int(v),
                "capacity": BUFFER_CAPACITY[k],
                "pct": round(v / BUFFER_CAPACITY[k] * 100, 1),
            }
            for k, v in self._buffers.items()
        }
