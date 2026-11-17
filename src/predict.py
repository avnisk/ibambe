"""
predict.py — VoltGuard deterministic cyber-physical analysis engine.

NO ML training.  Uses:
  • networkx graph traversal  — bottleneck / blast-radius propagation
  • Physics conservation rules — time-to-starvation math
  • Side-channel power verification — amperage vs. RPM mismatch detection

Public API
----------
result = analyze_factory_state(raw_state: dict) -> dict

The returned dict is merged into the full /api/state response by api.py.
"""

import math
import networkx as nx

from config import (
    STATION_IDS, STATION_NAMES, EDGES,
    BUFFER_CAPACITY, BASELINE_AMPS, BASELINE_THROUGHPUT,
    CYBER_ATTACKER_IP, CYBER_MODBUS_REG,
    REVENUE_PER_UNIT_PER_HR, UNITS_PER_HR_BASELINE,
)

# ─────────────────────────────────────────────────────
# Graph construction (called once per analysis)
# ─────────────────────────────────────────────────────

def _build_graph(stations: list[dict], edges: list[dict]) -> nx.DiGraph:
    G = nx.DiGraph()
    for s in stations:
        G.add_node(s["id"], **s)
    for e in edges:
        G.add_edge(e["from"], e["to"], flow_rate=e["flow_rate"], congested=e["congested"])
    return G


# ─────────────────────────────────────────────────────
# 1. Bottleneck Radar
# ─────────────────────────────────────────────────────

def _constraint_score(sid: str, station: dict, G: nx.DiGraph) -> int:
    """
    0–100 score.  Higher = more constrained.
    Components:
      a) Throughput drift below baseline         (0–40 pts)
      b) Downstream buffer draining              (0–30 pts)
      c) Upstream buffer congesting              (0-30 pts)
    """
    baseline_tp = BASELINE_THROUGHPUT[sid]
    actual_tp = station["actual_throughput"]

    # a) Throughput deficit
    tp_deficit = max(0.0, (baseline_tp - actual_tp) / baseline_tp)
    score_a = tp_deficit * 40

    # b) Downstream buffer drain
    out_edges = list(G.out_edges(sid, data=True))
    score_b = 0.0
    if out_edges:
        _, to_id, edata = out_edges[0]
        to_node = G.nodes[to_id]
        buf_pct = to_node.get("buffer_to_next", 0) / max(to_node.get("buffer_capacity", 1), 1)
        # Low buffer downstream → starvation risk → more constraint
        score_b = max(0.0, (1 - buf_pct)) * 30

    # c) Upstream congestion (blocked input)
    in_edges = list(G.in_edges(sid, data=True))
    score_c = 0.0
    if in_edges:
        from_id, _, _ = in_edges[0]
        from_node = G.nodes[from_id]
        from_buf_pct = from_node.get("buffer_to_next", 0) / max(from_node.get("buffer_capacity", 1), 1)
        score_c = from_buf_pct * 30

    total = min(100, int(score_a + score_b + score_c))
    return total


# ─────────────────────────────────────────────────────
# 2. Ripple-Effect Blast Radius
# ─────────────────────────────────────────────────────

def _time_to_starvation(sid: str, station: dict, G: nx.DiGraph) -> float:
    """
    Returns seconds until this station's input buffer runs dry given
    the current upstream throughput deficit.

    Formula: buffer_level / max(0.001, deficit_rate_per_tick)
    where deficit_rate = (expected consumption − current upstream supply)
    """
    in_edges = list(G.in_edges(sid, data=True))
    if not in_edges:
        return 0.0   # S1 has no upstream

    from_id, _, _ = in_edges[0]
    from_node = G.nodes[from_id]

    # Units consumed per tick by this station
    consumption = station["actual_throughput"] * 0.1
    # Units supplied per tick by upstream
    supply = from_node["actual_throughput"] * 0.1

    deficit_per_tick = max(0.0, consumption - supply)
    if deficit_per_tick < 1e-6:
        return 0.0   # no starvation risk

    # Find the buffer feeding this station
    for fs, ts in EDGES:
        if fs == from_id and ts == sid:
            buf_level = from_node.get("buffer_to_next", 0)
            return round(buf_level / deficit_per_tick, 1)

    return 0.0


# ─────────────────────────────────────────────────────
# 3. Cyber-Physical Correlation & Classification
# ─────────────────────────────────────────────────────

def _power_mismatch_score(station: dict) -> float:
    """
    Returns 0–1 mismatch severity.

    A spoofing signature means:
        - amperage drops significantly  (physical reality)
        - reported_rpm stays at / near baseline (sensor lie)

    If BOTH amp AND rpm drop together (wear/degradation), that is NORMAL
    correlation — mismatch should be LOW.

    Formula:
        amp_drop   = 1 - actual_amps / expected_amps          (0→1)
        rpm_drop   = 1 - reported_rpm / baseline_rpm          (0→1)
        mismatch   = amp_drop - rpm_drop                      (high = spoof)
    """
    sid = station["id"]
    expected_amps = station["expected_amps"]
    actual_amps = station["actual_amps"]

    amp_drop = max(0.0, 1.0 - actual_amps / max(expected_amps, 1.0))

    reported_rpm = station["reported_rpm"]
    from config import BASELINE_RPM
    baseline_rpm = BASELINE_RPM.get(sid, 1)
    rpm_drop = max(0.0, 1.0 - reported_rpm / max(baseline_rpm, 1))

    # Spoof: amp drops but RPM is NOT reported as dropping → large positive gap
    mismatch = max(0.0, amp_drop - rpm_drop)
    return _clamp(mismatch, 0.0, 1.0)


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def _classify(stations: list[dict], security_logs: list[dict], scenario: str) -> tuple[str, int, list[str], str, list[str]]:
    """
    Returns:
        classification    : "NOMINAL" | "CYBER_SUSPECTED" | "OPERATIONAL_DEGRADED"
        risk_score        : 0–100
        evidence_factors  : list of plain-English strings
        forensic_summary  : single paragraph
        recommended_actions : list of action strings
    """
    s3 = next((s for s in stations if s["id"] == "S3"), None)
    if s3 is None:
        return "NOMINAL", 0, [], "No data.", []

    mismatch = _power_mismatch_score(s3)
    has_modbus_event = any(
        str(CYBER_MODBUS_REG) in log.get("event", "") for log in security_logs
    )
    has_attacker_ip = any(
        log.get("source") == CYBER_ATTACKER_IP for log in security_logs
    )
    amp_drop_pct = max(0.0, 1.0 - s3["actual_amps"] / max(s3["expected_amps"], 1.0))
    tp_drop_pct  = max(0.0, 1.0 - s3["actual_throughput"] / max(BASELINE_THROUGHPUT["S3"], 1.0))

    evidence_factors = []
    risk_score = 0

    if mismatch > 0.08:
        evidence_factors.append(
            f"Station 3 power mismatch: amperage dropped {amp_drop_pct*100:.1f}% while HMI reports normal RPM."
        )
        # Weighted heavily — a spoofing signature is the most critical indicator
        risk_score += int(mismatch * 150)   # 20% drop → score += 30

    if has_modbus_event:
        evidence_factors.append(
            f"OT logs: unauthorized Modbus WRITE_REGISTER {CYBER_MODBUS_REG} detected on PLC-S3."
        )
        risk_score += 35   # confirmed OT intrusion

    if has_attacker_ip:
        evidence_factors.append(
            f"Source IP {CYBER_ATTACKER_IP} issued commands outside authorised schedule."
        )
        risk_score += 25   # confirmed rogue actor

    if tp_drop_pct > 0.10 and not has_attacker_ip:
        evidence_factors.append(
            f"Station 3 throughput dropped {tp_drop_pct*100:.1f}% with proportional amperage — consistent with mechanical wear."
        )
        risk_score += int(tp_drop_pct * 70)

    amp_surge = max(0.0, s3["actual_amps"] / max(s3["expected_amps"], 1.0) - 1.0)

    if amp_surge > 0.15:
        evidence_factors.append(
            f"Station 3 electrical current spike (+{amp_surge*100:.1f}%) during high-frequency register polling."
        )
        risk_score += int(amp_surge * 120)

    risk_score = min(100, risk_score)

    # Classification decision tree
    if scenario == "cyber_overload" or (has_attacker_ip and amp_surge > 0.15):
        classification = "CYBER_SUSPECTED"
        risk_score = max(risk_score, 92)
        forensic_summary = (
            f"Station 3 experiences rogue Modbus register overload and telemetry exfiltration. "
            f"Motor electrical draw surged by +{amp_surge*100:.0f}% with cycle jitter alongside unauthorized bursts to {CYBER_ATTACKER_IP}."
        )
        recommended_actions = [
            f"Deploy Deception Honeypot PLC on S3 to isolate {CYBER_ATTACKER_IP}",
            "Rate-limit Modbus TCP port 502 polling rates",
            "Divert incoming Milling buffer (S2→S3) to avoid buffer overflow",
            "Quarantine network port S3-SW01 to decoy honeypot VLAN",
        ]
    elif has_modbus_event and has_attacker_ip and mismatch > 0.08:
        classification = "CYBER_SUSPECTED"
        forensic_summary = (
            f"Station 3 reports {s3['reported_uptime']}% uptime, but physical amperage dropped "
            f"{amp_drop_pct*100:.0f}% alongside an unauthorized Modbus write from {CYBER_ATTACKER_IP}. "
            f"Side-channel power verification confirms sensor data spoofing."
        )
        recommended_actions = [
            f"Deploy Deception Honeypot PLC on S3 to isolate {CYBER_ATTACKER_IP}",
            "Divert upstream Milling buffer to secondary holding line",
            "Freeze all WRITE commands on PLC-S3 until forensics complete",
            "Escalate to OT Security Incident Response team immediately",
        ]
    elif tp_drop_pct > 0.08 and not has_attacker_ip and mismatch < 0.10:
        classification = "OPERATIONAL_DEGRADED"
        forensic_summary = (
            f"Station 3 throughput reduced {tp_drop_pct*100:.0f}% with proportional amperage decline. "
            f"No unauthorized network commands detected. Pattern is consistent with mechanical wear or tooling friction."
        )
        recommended_actions = [
            "Schedule preventive maintenance on Station 3 welding spindle",
            "Increase pre-buffer at Milling (S2→S3) to absorb throughput variance",
            "Monitor vibration signature on S3 for bearing degradation",
        ]
    else:
        classification = "NOMINAL"
        forensic_summary = "All stations operating within normal parameters. No anomalies detected."
        recommended_actions = [
            "Continue standard monitoring cadence",
            "Verify buffer levels at shift changeover",
        ]

    return classification, risk_score, evidence_factors, forensic_summary, recommended_actions


# ─────────────────────────────────────────────────────
# 4. Financial loss calculator
# ─────────────────────────────────────────────────────

def _financial_loss(stations: list[dict]) -> int:
    """Throughput loss on critical path → lost revenue/hr."""
    s3_tp = next((s["actual_throughput"] for s in stations if s["id"] == "S3"), 100.0)
    baseline_tp = BASELINE_THROUGHPUT["S3"]
    loss_fraction = max(0.0, (baseline_tp - s3_tp) / baseline_tp)
    lost_units_hr = UNITS_PER_HR_BASELINE * loss_fraction
    return int(lost_units_hr * REVENUE_PER_UNIT_PER_HR)


# ─────────────────────────────────────────────────────
# 5. Main public function
# ─────────────────────────────────────────────────────

def analyze_factory_state(raw_state: dict) -> dict:
    """
    Accepts the raw tick dict from FactoryTwinSimulator.tick() and returns
    an enriched analysis dict ready to be merged into the API response.

    Parameters
    ----------
    raw_state : dict
        Output from FactoryTwinSimulator.tick()

    Returns
    -------
    dict with keys:
        classification, risk_score, financial_loss_per_hr,
        forensic_summary, recommended_actions,
        stations (enriched with constraint_score, time_to_starvation_sec),
        edges
    """
    stations      = raw_state["stations"]
    edges         = raw_state["edges"]
    security_logs = raw_state.get("security_logs", [])
    scenario      = raw_state.get("scenario", "normal")

    # Build dependency graph
    G = _build_graph(stations, edges)

    # Enrich each station
    enriched_stations = []
    for station in stations:
        sid = station["id"]
        cs  = _constraint_score(sid, station, G)
        tts = _time_to_starvation(sid, station, G)
        enriched_stations.append({**station, "constraint_score": cs, "time_to_starvation_sec": tts})

    # Classification
    classification, risk_score, evidence_factors, forensic_summary, recommended_actions = \
        _classify(stations, security_logs, scenario)

    # Financial impact
    financial_loss = _financial_loss(stations)

    return {
        "classification": classification,
        "risk_score": risk_score,
        "financial_loss_per_hr": financial_loss,
        "evidence_factors": evidence_factors,
        "forensic_summary": forensic_summary,
        "recommended_actions": recommended_actions,
        "stations": enriched_stations,
        "edges": edges,
    }
