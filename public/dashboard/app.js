/**
 * Chronos-Twin: Multi-Level Cyber-Physical Digital Twin Command Center
 * Frontend Engine & Fallback Simulation Controller
 */

// ============================================================================
// State Management
// ============================================================================
let currentScenario = 'normal'; // 'normal' | 'cyber_espionage' | 'operational_degradation'
let honeypotActive = false;
let selectedStationId = 'S3'; // Default focus on S3 Welding (target of spoofing)
let isLiveBackend = false;
let pollIntervalTimer = null;
let starvationCountdownSec = { S4: 135, S5: 270, S6: 465 }; // Live countdown in seconds
let chartInstance = null;
let chartHistory = {
  labels: [],
  reportedRpm: [],
  actualAmps: [],
  expectedAmps: []
};

const MAX_HISTORY_POINTS = 20;

// Initialize historical buffer with 15 initial ticks
for (let i = 15; i >= 0; i--) {
  const d = new Date(Date.now() - i * 1000);
  chartHistory.labels.push(d.toTimeString().split(' ')[0]);
  chartHistory.reportedRpm.push(2400);
  chartHistory.actualAmps.push(18.0);
  chartHistory.expectedAmps.push(18.0);
}

// ============================================================================
// Fallback Mock State Generator (Strictly conforming to backend schema)
// ============================================================================
function generateFallbackState() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  // Fluctuations for visual realism
  const noise = (Math.random() - 0.5) * 0.4;
  const rpmNoise = Math.floor((Math.random() - 0.5) * 15);

  let classification = 'NOMINAL';
  let riskScore = 4;
  let rippleLoss = 0;
  let forensicSummary = "All stations running within physics-constrained equilibrium. Conservation of mass flow balanced across all 6 production levels.";
  let recommendedActions = [
    "Continuous automated polling of Modbus TCP port 502 holding registers",
    "Monitor buffer storage levels between Level 2 Milling and Level 3 Welding",
    "Routine physical verification of CT current clamp sensor calibrations"
  ];

  let s3Status = 'NOMINAL';
  let s3ReportedUptime = 99.8;
  let s3ActualThroughput = 120;
  let s3ReportedRpm = 2400 + rpmNoise;
  let s3ActualAmps = +(18.0 + noise).toFixed(1);
  let s3ExpectedAmps = 18.0;
  let s3Constraint = 0.05;

  let s2Buf = 50;
  let s3Buf = 50;
  let s4Buf = 48;
  let s5Buf = 52;

  let s2ToS3Congested = false;
  let s3ToS4Congested = false;
  let s3FlowRate = 120;

  let s4Starve = null;
  let s5Starve = null;
  let s6Starve = null;

  if (currentScenario === 'cyber_espionage') {
    if (honeypotActive) {
      classification = 'CYBER_SUSPECTED';
      riskScore = 18; // Contained
      rippleLoss = 1200;
      s3Status = 'SHADOW-ISOLATED';
      s3ReportedUptime = 99.9; // Decoy still feeding 99.9% to hacker
      s3ActualThroughput = 110; // Rerouted through shadow fallback line
      s3ReportedRpm = 2400 + rpmNoise;
      s3ActualAmps = +(17.2 + noise).toFixed(1);
      s3Constraint = 0.15;
      forensicSummary = "ACTIVE HONEYPOT DEPLOYED: Attacker quarantined to virtualized PLC Honeypot at IP 10.99.0.42. Fake telemetry (2,400 RPM) being fed back to adversary C2 server. Physical production rerouted to secondary bypass weld array.";
      recommendedActions = [
        "Maintain deception sandbox to extract attacker zero-day exploit payload",
        "Capture full PCAP packet trace on Modbus TCP Port 502",
        "Prepare clean firmware reflash via air-gapped JTAG header once attacker disconnects"
      ];
      s2Buf = 55;
      s3Buf = 45;
      s3FlowRate = 110;
    } else {
      classification = 'CYBER_SUSPECTED';
      riskScore = 89;
      rippleLoss = 14250;
      s3Status = 'SPOOFED';
      // LIE DETECTOR DIVERGENCE:
      // Reported RPM claims nominal 2400 RPM and 99.9% uptime, but actual amps dropped to 4.2A (idle/off)!
      s3ReportedUptime = 99.9;
      s3ReportedRpm = 2400 + rpmNoise;
      s3ActualThroughput = 18; // Severely throttled!
      s3ActualAmps = +(4.2 + noise).toFixed(1); // PHYSICAL PROOF OF SABOTAGE
      s3ExpectedAmps = 18.0;
      s3Constraint = 0.94;

      s2Buf = Math.min(98, s2Buf + 35); // Buffer piling up before S3
      s3Buf = Math.max(8, s3Buf - 38); // Buffer draining after S3
      s4Buf = Math.max(12, s4Buf - 32);
      s5Buf = Math.max(15, s5Buf - 28);

      s2ToS3Congested = true;
      s3ToS4Congested = false;
      s3FlowRate = 18;

      s4Starve = starvationCountdownSec.S4;
      s5Starve = starvationCountdownSec.S5;
      s6Starve = starvationCountdownSec.S6;

      forensicSummary = "CRITICAL SIDE-CHANNEL MISMATCH: Station S3 (Welding) PLC Modbus register 40012 reports 2,400 RPM (99.9% Uptime), but physical CT current clamp reads only 4.2A (Idle baseline). Mass flow conservation violated: S2 upstream buffer congested at 98% while downstream S4 faces starvation in < 2 mins. Signature: Stuxnet-style sensor register spoofing / cyber-espionage.";
      recommendedActions = [
        "IMMEDIATE ACTION: Click 'Deploy Deception Honeypot PLC' to isolate attacker IP 192.168.1.103",
        "Engage bypass physical conveyor to route S2 buffer into Reserve Weld Bay 2",
        "Lock down OT Network Switch VLAN 12 and block unauthorized Modbus FC16 writes"
      ];
    }
  } else if (currentScenario === 'operational_degradation') {
    classification = 'OPERATIONAL_DEGRADED';
    riskScore = 54;
    rippleLoss = 6800;
    s3Status = 'DEGRADED';
    // True mechanical wear: both RPM and amps reflect physical reality (RPM down, motor strain amps up)
    s3ReportedUptime = 81.2;
    s3ReportedRpm = 1120 + rpmNoise;
    s3ActualThroughput = 45;
    s3ActualAmps = +(23.8 + noise).toFixed(1); // High motor load / bearing friction
    s3ExpectedAmps = 18.0;
    s3Constraint = 0.68;

    s2Buf = 82;
    s3Buf = 24;
    s4Buf = 28;
    s5Buf = 35;
    s2ToS3Congested = true;
    s3FlowRate = 45;

    s4Starve = starvationCountdownSec.S4 * 2;
    s5Starve = starvationCountdownSec.S5 * 2;
    s6Starve = starvationCountdownSec.S6 * 2;

    forensicSummary = "OPERATIONAL DEGRADATION: Mechanical bearing wear detected at Station S3 (Welding). Software telemetry matches physical sensor readings: RPM dropped to 1,120 while motor amperage spiked to 23.8A due to friction overload. Inflow from S2 exceeds S3 processing speed by 75 u/h.";
    recommendedActions = [
      "Schedule emergency bearing lubrication and spindle alignment during next shift window",
      "Throttle Station S1 & S2 upstream throughput to 60 u/h to prevent buffer overflow",
      "Inspect thermal camera telemetry for weld head overheating"
    ];
  }

  // Security logs
  const securityLogs = [];
  if (currentScenario === 'cyber_espionage') {
    if (honeypotActive) {
      securityLogs.push(
        { time: timeStr, severity: 'HONEYPOT', source: '10.99.0.42 (Decoy)', target: '192.168.1.103 (Attacker)', event: 'Attacker trapped in Tarpit. Emulated Modbus holding register 40012 returning synthetic 2,400 RPM.' },
        { time: timeStr, severity: 'INFO', source: 'FIREWALL-OT', target: 'VLAN-12', event: 'Physical PLC S3 isolated to quarantine network. Bypass welding line engaged.' }
      );
    } else {
      securityLogs.push(
        { time: timeStr, severity: 'CRITICAL', source: '192.168.1.103', target: 'PLC-WELD-S3', event: 'Unauthorized Modbus FC16 (Write Multiple Registers) spoofing RPM=2400 on Reg 40012' },
        { time: timeStr, severity: 'ALERT', source: 'CHRONOS-AUDIT', target: 'S3-CT-CLAMP', event: 'Side-channel power discrepancy: Software claims 2400 RPM but Amperage is 4.2A (Idle)!' },
        { time: timeStr, severity: 'WARN', source: 'FLOW-ENGINE', target: 'BUFFER-S2-S3', event: 'Upstream buffer accumulation rate +102 u/h. S4 starvation projected.' }
      );
    }
  } else if (currentScenario === 'operational_degradation') {
    securityLogs.push(
      { time: timeStr, severity: 'WARN', source: 'VIB-SENSOR-S3', target: 'SCADA-CORE', event: 'Bearing vibration harmonics exceeded ISO 10816 threshold (7.2 mm/s RMS)' },
      { time: timeStr, severity: 'WARN', source: 'CURRENT-SENSOR-S3', target: 'SCADA-CORE', event: 'Motor over-amperage draw: 23.8A vs nominal 18.0A baseline' },
      { time: timeStr, severity: 'INFO', source: 'PLC-WELD-S3', target: 'SCADA-CORE', event: 'Throughput derated to 45 u/h due to thermal protection governor' }
    );
  } else {
    securityLogs.push(
      { time: timeStr, severity: 'INFO', source: 'SCADA-MASTER', target: 'PLC-ARRAY', event: 'Periodic Modbus FC03 scan nominal. 6/6 PLCs responding within 4ms.' },
      { time: timeStr, severity: 'INFO', source: 'SIDE-CHANNEL', target: 'AMPERAGE-BUS', event: 'All 6 current clamp readings correlate with reported machine RPM (Δ < 1.8%).' }
    );
  }

  // Construct standard JSON contract
  return {
    timestamp: now.toISOString(),
    scenario: currentScenario,
    honeypot_active: honeypotActive,
    classification: classification,
    risk_score: riskScore,
    financial_loss_per_hr: rippleLoss,
    stations: [
      {
        id: "S1",
        name: "Cutting",
        level: 1,
        status: "NOMINAL",
        reported_uptime: +(99.8 + (noise * 0.2)).toFixed(1),
        actual_throughput: 120,
        reported_rpm: 2400 + rpmNoise,
        actual_amps: +(18.2 + noise).toFixed(1),
        expected_amps: 18.0,
        buffer_to_next: 45,
        buffer_capacity: 100,
        constraint_score: 0.05,
        time_to_starvation_sec: null
      },
      {
        id: "S2",
        name: "Milling",
        level: 2,
        status: (currentScenario !== 'normal' && s2Buf > 80) ? "DEGRADED" : "NOMINAL",
        reported_uptime: +(99.4 + (noise * 0.2)).toFixed(1),
        actual_throughput: (currentScenario !== 'normal' && s2Buf > 90) ? 95 : 120,
        reported_rpm: 2400 + rpmNoise,
        actual_amps: +(18.1 + noise).toFixed(1),
        expected_amps: 18.0,
        buffer_to_next: s2Buf,
        buffer_capacity: 100,
        constraint_score: (currentScenario !== 'normal') ? 0.42 : 0.08,
        time_to_starvation_sec: null
      },
      {
        id: "S3",
        name: "Welding",
        level: 3,
        status: s3Status,
        reported_uptime: s3ReportedUptime,
        actual_throughput: s3ActualThroughput,
        reported_rpm: s3ReportedRpm,
        actual_amps: s3ActualAmps,
        expected_amps: s3ExpectedAmps,
        buffer_to_next: s3Buf,
        buffer_capacity: 100,
        constraint_score: s3Constraint,
        time_to_starvation_sec: null
      },
      {
        id: "S4",
        name: "Painting",
        level: 4,
        status: (s4Starve && s4Starve < 180 && !honeypotActive) ? "STARVING" : "NOMINAL",
        reported_uptime: 99.5,
        actual_throughput: (currentScenario === 'cyber_espionage' && !honeypotActive) ? 22 : 120,
        reported_rpm: 2400 + rpmNoise,
        actual_amps: +(17.9 + noise).toFixed(1),
        expected_amps: 18.0,
        buffer_to_next: s4Buf,
        buffer_capacity: 100,
        constraint_score: (currentScenario !== 'normal') ? 0.72 : 0.06,
        time_to_starvation_sec: s4Starve
      },
      {
        id: "S5",
        name: "Assembly",
        level: 5,
        status: (s5Starve && s5Starve < 300 && !honeypotActive) ? "STARVING" : "NOMINAL",
        reported_uptime: 99.7,
        actual_throughput: (currentScenario === 'cyber_espionage' && !honeypotActive) ? 28 : 120,
        reported_rpm: 2400 + rpmNoise,
        actual_amps: +(18.0 + noise).toFixed(1),
        expected_amps: 18.0,
        buffer_to_next: s5Buf,
        buffer_capacity: 100,
        constraint_score: (currentScenario !== 'normal') ? 0.65 : 0.04,
        time_to_starvation_sec: s5Starve
      },
      {
        id: "S6",
        name: "Packing",
        level: 6,
        status: (s6Starve && s6Starve < 500 && !honeypotActive) ? "STARVING" : "NOMINAL",
        reported_uptime: 99.9,
        actual_throughput: (currentScenario === 'cyber_espionage' && !honeypotActive) ? 30 : 120,
        reported_rpm: 2400 + rpmNoise,
        actual_amps: +(18.1 + noise).toFixed(1),
        expected_amps: 18.0,
        buffer_to_next: 50,
        buffer_capacity: 100,
        constraint_score: (currentScenario !== 'normal') ? 0.58 : 0.02,
        time_to_starvation_sec: s6Starve
      }
    ],
    edges: [
      { from: "S1", to: "S2", flow_rate: 120, congested: false },
      { from: "S2", to: "S3", flow_rate: s3FlowRate, congested: s2ToS3Congested },
      { from: "S3", to: "S4", flow_rate: s3FlowRate, congested: false, starved: (currentScenario !== 'normal' && !honeypotActive) },
      { from: "S4", to: "S5", flow_rate: s3FlowRate, congested: false, starved: (currentScenario !== 'normal' && !honeypotActive) },
      { from: "S5", to: "S6", flow_rate: s3FlowRate, congested: false, starved: (currentScenario !== 'normal' && !honeypotActive) }
    ],
    security_logs: securityLogs,
    forensic_summary: forensicSummary,
    recommended_actions: recommendedActions
  };
}

// ============================================================================
// Format Seconds to MM:SS
// ============================================================================
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return "Stable";
  if (seconds <= 0) return "STARVED (00:00)";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `Starvation in ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
}

// ============================================================================
// UI Render Function
// ============================================================================
function renderDashboard(data) {
  if (!data) return;

  // 1. Connection Status Badge
  const connPill = document.getElementById('connection-pill');
  const connLabel = document.getElementById('connection-label');
  if (isLiveBackend) {
    connPill.className = 'source-badge';
    connLabel.textContent = 'LIVE API (localhost:8000)';
  } else {
    connPill.className = 'source-badge fallback';
    connLabel.textContent = 'DEMO SIMULATOR (STANDALONE FALLBACK)';
  }

  // 2. Scenario buttons active state
  document.getElementById('btn-scenario-normal').classList.toggle('active', data.scenario === 'normal');
  document.getElementById('btn-scenario-cyber').classList.toggle('active', data.scenario === 'cyber_espionage');
  document.getElementById('btn-scenario-operational').classList.toggle('active', data.scenario === 'operational_degradation');

  // 3. Top KPI Strip
  const classBadge = document.getElementById('classification-badge');
  const classCard = document.getElementById('kpi-classification-card');
  const classVerdict = document.getElementById('kpi-subtext-verdict');

  classBadge.className = 'classification-badge';
  classCard.className = 'kpi-card';

  if (data.classification === 'CYBER_SUSPECTED') {
    classBadge.classList.add('badge-cyber');
    classBadge.innerHTML = `<span class="pulse-dot"></span> CYBER_SUSPECTED`;
    classCard.classList.add('kpi-critical');
    classVerdict.textContent = data.honeypot_active 
      ? 'Threat Contained: Active Honeypot isolation routing active'
      : 'ALERT: Modbus register spoofing vs power discrepancy detected!';
  } else if (data.classification === 'OPERATIONAL_DEGRADED') {
    classBadge.classList.add('badge-operational');
    classBadge.innerHTML = `<span class="pulse-dot"></span> OPERATIONAL_DEGRADED`;
    classCard.classList.add('kpi-amber');
    classVerdict.textContent = 'Mechanical constraint: Inflow > Outflow bearing friction bottleneck';
  } else {
    classBadge.classList.add('badge-nominal');
    classBadge.innerHTML = `<span class="pulse-dot"></span> NOMINAL`;
    classCard.classList.add('kpi-green');
    classVerdict.textContent = 'All 6 physical & network stages in equilibrium';
  }

  // Risk Score
  const riskScoreEl = document.getElementById('kpi-risk-score');
  const riskStatusEl = document.getElementById('kpi-risk-status');
  const riskCard = document.getElementById('kpi-risk-card');
  riskScoreEl.textContent = data.risk_score;
  riskCard.className = 'kpi-card';
  if (data.risk_score > 70) {
    riskStatusEl.textContent = 'CRITICAL (Severe Cross-Discrepancy)';
    riskStatusEl.style.color = 'var(--accent-critical)';
    riskCard.classList.add('kpi-critical');
  } else if (data.risk_score > 30) {
    riskStatusEl.textContent = 'ELEVATED (Mechanical Degradation)';
    riskStatusEl.style.color = 'var(--accent-amber)';
    riskCard.classList.add('kpi-amber');
  } else {
    riskStatusEl.textContent = 'Low Risk (Inflow = Outflow)';
    riskStatusEl.style.color = 'var(--accent-green)';
    riskCard.classList.add('kpi-green');
  }

  // Projected Ripple Loss
  const lossEl = document.getElementById('kpi-loss-val');
  const lossSubtext = document.getElementById('kpi-loss-subtext');
  const lossCard = document.getElementById('kpi-loss-card');
  lossEl.textContent = `$${Number(data.financial_loss_per_hr || 0).toLocaleString()}`;
  lossCard.className = 'kpi-card';
  if (data.financial_loss_per_hr > 10000) {
    lossEl.style.color = 'var(--accent-critical)';
    lossSubtext.textContent = 'Direct idle line starvation cost';
    lossCard.classList.add('kpi-critical');
  } else if (data.financial_loss_per_hr > 0) {
    lossEl.style.color = 'var(--accent-amber)';
    lossSubtext.textContent = 'Throttled yield & machine wear cost';
    lossCard.classList.add('kpi-amber');
  } else {
    lossEl.style.color = 'var(--accent-green)';
    lossSubtext.textContent = 'Nominal output quota met';
    lossCard.classList.add('kpi-green');
  }

  // Downstream Impact Countdown (Time-to-Starvation)
  const starvEl = document.getElementById('kpi-starvation-val');
  const starvSub = document.getElementById('kpi-starvation-subtext');
  const starvCard = document.getElementById('kpi-starvation-card');
  const minStarveStation = data.stations.find(s => s.time_to_starvation_sec !== null && s.time_to_starvation_sec > 0);
  starvCard.className = 'kpi-card';

  if (minStarveStation && minStarveStation.time_to_starvation_sec) {
    starvEl.textContent = formatTime(minStarveStation.time_to_starvation_sec);
    starvEl.style.color = 'var(--accent-critical)';
    starvSub.textContent = `Immediate starvation threat at ${minStarveStation.name} (${minStarveStation.id})`;
    starvCard.classList.add('kpi-critical');
  } else {
    starvEl.textContent = 'No Bottleneck';
    starvEl.style.color = 'var(--accent-green)';
    starvSub.textContent = 'All downstream buffers stable';
    starvCard.classList.add('kpi-green');
  }

  // Honeypot Status in KPI Strip
  const hpStatus = document.getElementById('kpi-honeypot-status');
  const hpDetail = document.getElementById('kpi-honeypot-detail');
  if (data.honeypot_active) {
    hpStatus.textContent = 'SHADOW-ISOLATED';
    hpStatus.style.color = '#e040fb';
    hpDetail.textContent = 'Feeding Fake Telemetry to Attacker (Tarpit 10.99.0.42)';
  } else if (data.classification === 'CYBER_SUSPECTED') {
    hpStatus.textContent = 'ACTION REQUIRED';
    hpStatus.style.color = 'var(--accent-critical)';
    hpDetail.textContent = 'Deploy Honeypot to trap adversary';
  } else {
    hpStatus.textContent = 'STANDBY';
    hpStatus.style.color = 'var(--text-muted)';
    hpDetail.textContent = 'Decoy PLC Ready for Quarantine';
  }

  // 4. Render 6 Stations
  data.stations.forEach(st => {
    const card = document.getElementById(`station-card-${st.id}`);
    const pill = document.getElementById(`pill-${st.id}`);
    const valUptime = document.getElementById(`val-uptime-${st.id}`);
    const valFlow = document.getElementById(`val-flow-${st.id}`);
    const valRpm = document.getElementById(`val-rpm-${st.id}`);
    const valAmps = document.getElementById(`val-amps-${st.id}`);
    const starveBox = document.getElementById(`starve-box-${st.id}`);
    const starveTimer = document.getElementById(`starve-timer-${st.id}`);
    const bufVal = document.getElementById(`buf-val-${st.id}`);

    if (!card) return;

    // Selection highlight
    card.classList.toggle('selected', st.id === selectedStationId);

    // Status classes
    card.classList.remove('status-spoofed', 'status-degraded', 'status-starving', 'status-isolated');
    pill.className = 'station-status-pill';

    if (st.status === 'SPOOFED') {
      card.classList.add('status-spoofed');
      pill.classList.add('pill-spoofed');
      pill.textContent = 'SPOOFED';
    } else if (st.status === 'SHADOW-ISOLATED') {
      card.classList.add('status-isolated');
      pill.classList.add('pill-isolated');
      pill.textContent = 'SHADOW-ISOLATED';
    } else if (st.status === 'DEGRADED') {
      card.classList.add('status-degraded');
      pill.classList.add('pill-degraded');
      pill.textContent = 'DEGRADED';
    } else if (st.status === 'STARVING') {
      card.classList.add('status-starving');
      pill.classList.add('pill-starving');
      pill.textContent = 'STARVING';
    } else {
      pill.classList.add('pill-nominal');
      pill.textContent = 'NOMINAL';
    }

    if (valUptime) valUptime.textContent = `${st.reported_uptime}%`;
    if (valFlow) {
      valFlow.textContent = `${st.actual_throughput} u/h`;
      valFlow.className = 'metric-val';
      if (st.actual_throughput < 50) valFlow.classList.add('danger');
      else if (st.actual_throughput < 90) valFlow.classList.add('warn');
      else valFlow.classList.add('success');
    }
    if (valRpm) {
      valRpm.textContent = `${st.reported_rpm.toLocaleString()} RPM`;
      if (st.status === 'DEGRADED') valRpm.className = 'metric-val warn';
      else valRpm.className = 'metric-val';
    }
    if (valAmps) {
      valAmps.textContent = `${st.actual_amps}A / ${st.expected_amps}A`;
      valAmps.className = 'metric-val';
      // Side-channel visual warning on text
      if (st.id === 'S3' && st.status === 'SPOOFED') {
        valAmps.classList.add('danger');
      } else if (st.status === 'DEGRADED') {
        valAmps.classList.add('warn');
      } else {
        valAmps.classList.add('success');
      }
    }

    if (bufVal) bufVal.textContent = st.buffer_to_next;

    if (starveBox && starveTimer) {
      if (st.time_to_starvation_sec !== null && st.time_to_starvation_sec > 0) {
        starveBox.className = 'starvation-timer-box active-timer';
        starveTimer.textContent = formatTime(st.time_to_starvation_sec);
      } else {
        starveBox.className = 'starvation-timer-box normal';
        starveTimer.textContent = (st.id === 'S6') ? 'Nominal' : 'Stable';
      }
    }
  });

  // 5. Render Buffer Pipes and Flow
  if (data.edges) {
    data.edges.forEach(edge => {
      const pipeId = `pipe-${edge.from}-${edge.to}`;
      const rateEl = document.getElementById(`rate-${edge.from}-${edge.to}`);
      const flowAnim = document.getElementById(`flow-anim-${edge.from}-${edge.to}`);
      const bufBar = document.getElementById(`buf-bar-${edge.from}-${edge.to}`);
      const bufText = document.getElementById(`buf-text-${edge.from}-${edge.to}`);

      const fromStation = data.stations.find(s => s.id === edge.from);
      const bufferLevel = fromStation ? fromStation.buffer_to_next : 50;

      if (rateEl) rateEl.textContent = `${edge.flow_rate} u/h`;

      if (flowAnim) {
        flowAnim.className = 'pipe-flow-active';
        if (edge.congested) flowAnim.classList.add('congested');
        else if (edge.starved || edge.flow_rate < 40) flowAnim.classList.add('starved');
      }

      if (bufBar) {
        bufBar.style.width = `${Math.min(100, Math.max(0, bufferLevel))}%`;
        bufBar.className = 'buffer-bar-inner';
        if (bufferLevel > 80) bufBar.classList.add('high');
        else if (bufferLevel < 20) bufBar.classList.add('low');
      }

      if (bufText) bufText.textContent = `${bufferLevel}/100`;
    });
  }

  // 6. Side-Channel Lie Detector Station Details & Divergence Callout
  const targetStation = data.stations.find(s => s.id === selectedStationId) || data.stations[2];
  document.getElementById('detector-station-name').textContent = `Target: ${targetStation.id} (${targetStation.name})`;

  const discBadge = document.getElementById('detector-discrepancy-badge');
  const calloutCard = document.getElementById('discrepancy-callout-card');
  const calloutSoft = document.getElementById('callout-software');
  const calloutPhys = document.getElementById('callout-physical');
  const calloutDelta = document.getElementById('callout-delta');

  calloutSoft.textContent = `${targetStation.reported_rpm.toLocaleString()} RPM (${targetStation.reported_uptime}% Uptime)`;
  calloutPhys.textContent = `${targetStation.actual_amps} Amps (Expected: ${targetStation.expected_amps}A)`;

  const ampDeltaPct = Math.round(Math.abs((targetStation.actual_amps - targetStation.expected_amps) / targetStation.expected_amps) * 100);

  if (targetStation.status === 'SPOOFED') {
    discBadge.className = 'detector-badge alert';
    discBadge.textContent = 'LIE DETECTED: Software Telemetry Fabricated!';
    calloutCard.className = 'discrepancy-callout';
    calloutSoft.style.color = '#ff5277';
    calloutPhys.style.color = 'var(--accent-critical)';
    calloutDelta.style.color = 'var(--accent-critical)';
    calloutDelta.textContent = `CRITICAL DIVERGENCE (-${ampDeltaPct}% Power Deficit)`;
  } else if (targetStation.status === 'SHADOW-ISOLATED') {
    discBadge.className = 'detector-badge';
    discBadge.style.background = 'rgba(213, 0, 249, 0.25)';
    discBadge.style.borderColor = 'var(--accent-purple)';
    discBadge.style.color = '#e040fb';
    discBadge.textContent = 'DECEPTION ACTIVE: Synthesizing Fake Telemetry to Attacker';
    calloutCard.className = 'discrepancy-callout nominal';
    calloutDelta.style.color = 'var(--accent-purple)';
    calloutDelta.textContent = 'TARPIT ISOLATED (Adversary trapped)';
  } else if (targetStation.status === 'DEGRADED') {
    discBadge.className = 'detector-badge alert';
    discBadge.style.background = 'rgba(255, 179, 0, 0.2)';
    discBadge.style.borderColor = 'var(--accent-amber)';
    discBadge.style.color = 'var(--accent-amber)';
    discBadge.textContent = 'PHYSICAL OVERLOAD: Motor Friction Strain';
    calloutCard.className = 'discrepancy-callout';
    calloutCard.style.borderLeftColor = 'var(--accent-amber)';
    calloutDelta.style.color = 'var(--accent-amber)';
    calloutDelta.textContent = `MOTOR STRAIN (+${ampDeltaPct}% Overcurrent)`;
  } else {
    discBadge.className = 'detector-badge normal';
    discBadge.textContent = 'Zero Discrepancy (Physical = Software)';
    calloutCard.className = 'discrepancy-callout nominal';
    calloutSoft.style.color = 'var(--accent-cyan)';
    calloutPhys.style.color = 'var(--accent-green)';
    calloutDelta.style.color = 'var(--accent-green)';
    calloutDelta.textContent = 'CONCORDANT (Δ < 2%)';
  }

  // Update chart data stream
  updateLieDetectorChart(targetStation);

  // 7. Forensic Brief & Recommendations
  const forensicText = document.getElementById('forensic-summary-text');
  const forensicCard = document.getElementById('forensic-card-box');
  forensicText.textContent = data.forensic_summary;
  forensicCard.classList.toggle('cyber-active', data.classification === 'CYBER_SUSPECTED' && !data.honeypot_active);

  const actionsList = document.getElementById('recommended-actions-list');
  actionsList.innerHTML = '';
  data.recommended_actions.forEach(action => {
    const li = document.createElement('li');
    li.textContent = action;
    actionsList.appendChild(li);
  });

  // 8. Honeypot Panel & Button
  const hpBox = document.getElementById('honeypot-box');
  const hpBtn = document.getElementById('btn-deploy-honeypot');
  const hpBtnText = document.getElementById('honeypot-btn-text');
  const hpBtnIcon = document.getElementById('honeypot-btn-icon');
  const hpBanner = document.getElementById('honeypot-banner');
  const hpBannerText = document.getElementById('honeypot-banner-text');

  if (data.honeypot_active) {
    hpBox.classList.add('deployed');
    hpBtn.className = 'honeypot-deploy-btn btn-disengage';
    hpBtnIcon.textContent = '🛡️';
    hpBtnText.textContent = 'Disengage Honeypot / Reset';
    hpBanner.className = 'honeypot-status-banner active';
    hpBannerText.innerHTML = '<strong>SHADOW-ISOLATED:</strong> Feeding Fake Telemetry to Attacker. Decoy PLC responding on 10.99.0.42.';
  } else {
    hpBox.classList.remove('deployed');
    hpBtn.className = 'honeypot-deploy-btn';
    hpBtnIcon.textContent = '⚡';
    hpBtnText.textContent = 'Deploy Deception Honeypot PLC';
    hpBanner.className = 'honeypot-status-banner';
    if (data.classification === 'CYBER_SUSPECTED') {
      hpBannerText.innerHTML = '<span style="color: #ff5277; font-weight: bold;">CRITICAL THREAT:</span> Attacker actively spoofing S3 registers. Click button to shadow-isolate!';
    } else {
      hpBannerText.textContent = 'Honeypot Standby: Ready to quarantine malicious actor upon detection of PLC firmware manipulation.';
    }
  }

  // 9. Live Security Logs Feed
  if (data.security_logs && data.security_logs.length > 0) {
    renderSecurityLogs(data.security_logs);
  }
}

// ============================================================================
// Terminal Logs Renderer
// ============================================================================
const recentLogSignatures = new Set();

function renderSecurityLogs(logs) {
  const feed = document.getElementById('terminal-feed-logs');
  if (!feed) return;

  logs.forEach(log => {
    const sig = `${log.time}_${log.severity}_${log.event.substring(0, 30)}`;
    if (recentLogSignatures.has(sig)) return;
    recentLogSignatures.add(sig);

    // Keep signature set manageable
    if (recentLogSignatures.size > 80) {
      const first = recentLogSignatures.values().next().value;
      recentLogSignatures.delete(first);
    }

    const row = document.createElement('div');
    row.className = 'log-entry';
    row.innerHTML = `
      <span class="log-time">${log.time}</span>
      <span class="log-sev sev-${log.severity}">${log.severity}</span>
      <span class="log-src">${log.source} ➔ ${log.target}:</span>
      <span class="log-msg">${log.event}</span>
    `;

    feed.appendChild(row);

    // Auto scroll down
    feed.scrollTop = feed.scrollHeight;

    // Prune old DOM elements
    while (feed.children.length > 35) {
      feed.removeChild(feed.firstChild);
    }
  });
}

// ============================================================================
// Side-Channel Dual-Line Chart Logic (Chart.js + Canvas Fallback)
// ============================================================================
function initLieDetectorChart() {
  const canvas = document.getElementById('lieDetectorChart');
  if (!canvas || !canvas.getContext) return;

  if (typeof Chart !== 'undefined') {
    // Standard Chart.js configuration
    const ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartHistory.labels,
        datasets: [
          {
            label: 'Reported PLC RPM (Software Claim)',
            data: chartHistory.reportedRpm,
            borderColor: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            borderWidth: 2,
            tension: 0.25,
            yAxisID: 'yRPM',
            pointRadius: 2,
            pointHoverRadius: 5
          },
          {
            label: 'True Electrical Amps (CT Sensor Truth)',
            data: chartHistory.actualAmps,
            borderColor: '#ff1744',
            backgroundColor: 'rgba(255, 23, 68, 0.08)',
            borderWidth: 2.5,
            tension: 0.25,
            yAxisID: 'yAmps',
            pointRadius: 2,
            pointHoverRadius: 5
          },
          {
            label: 'Expected Amps Baseline (Physics Quota)',
            data: chartHistory.expectedAmps,
            borderColor: 'rgba(0, 230, 118, 0.5)',
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            yAxisID: 'yAmps',
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              color: '#8a99b5',
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 15, 28, 0.95)',
            titleFont: { family: "'JetBrains Mono', monospace" },
            bodyFont: { family: "'JetBrains Mono', monospace" },
            borderColor: 'rgba(0, 240, 255, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#54647f', font: { family: "'JetBrains Mono', monospace", size: 9 }, maxTicksLimit: 7 }
          },
          yRPM: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 3000,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#00f0ff',
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              callback: val => `${val} RPM`
            }
          },
          yAmps: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 30,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#ff5277',
              font: { family: "'JetBrains Mono', monospace", size: 9 },
              callback: val => `${val} A`
            }
          }
        }
      }
    });
  } else {
    // Built-in offline canvas renderer (ensures zero failure even if CDN blocked)
    renderOfflineCanvasChart();
  }
}

function updateLieDetectorChart(station) {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  chartHistory.labels.push(timeStr);
  chartHistory.reportedRpm.push(station.reported_rpm);
  chartHistory.actualAmps.push(station.actual_amps);
  chartHistory.expectedAmps.push(station.expected_amps);

  if (chartHistory.labels.length > MAX_HISTORY_POINTS) {
    chartHistory.labels.shift();
    chartHistory.reportedRpm.shift();
    chartHistory.actualAmps.shift();
    chartHistory.expectedAmps.shift();
  }

  if (chartInstance) {
    // Dynamic color tuning based on discrepancy
    const ampsDataset = chartInstance.data.datasets[1];
    if (station.status === 'SPOOFED') {
      ampsDataset.borderColor = '#ff1744';
      ampsDataset.backgroundColor = 'rgba(255, 23, 68, 0.15)';
    } else if (station.status === 'DEGRADED') {
      ampsDataset.borderColor = '#ffb300';
      ampsDataset.backgroundColor = 'rgba(255, 179, 0, 0.15)';
    } else {
      ampsDataset.borderColor = '#00e676';
      ampsDataset.backgroundColor = 'rgba(0, 230, 118, 0.1)';
    }

    chartInstance.update('none');
  } else {
    renderOfflineCanvasChart();
  }
}

// Built-in Fallback 2D Canvas Chart Renderer (Air-gapped safety)
function renderOfflineCanvasChart() {
  const canvas = document.getElementById('lieDetectorChart');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.clientWidth || 600;
  const h = canvas.clientHeight || 230;
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, w, h);

  // Margins
  const ml = 55, mr = 45, mt = 25, mb = 25;
  const pw = w - ml - mr;
  const ph = h - mt - mb;

  // Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = mt + (ph / 4) * i;
    ctx.beginPath();
    ctx.moveTo(ml, y);
    ctx.lineTo(w - mr, y);
    ctx.stroke();

    // RPM label (Left)
    ctx.fillStyle = '#00f0ff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    const rpmVal = 3000 - i * 750;
    ctx.fillText(`${rpmVal} RPM`, ml - 5, y + 3);

    // Amps label (Right)
    ctx.fillStyle = '#ff5277';
    ctx.textAlign = 'left';
    const ampVal = 30 - i * 7.5;
    ctx.fillText(`${ampVal} A`, w - mr + 5, y + 3);
  }

  // Draw Reported RPM Line (Cyan)
  const pts = chartHistory.labels.length;
  if (pts > 1) {
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < pts; i++) {
      const x = ml + (pw / (pts - 1)) * i;
      const rpm = chartHistory.reportedRpm[i] || 2400;
      const y = mt + ph * (1 - rpm / 3000);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Actual Amps Line (Red/Amber)
    ctx.beginPath();
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < pts; i++) {
      const x = ml + (pw / (pts - 1)) * i;
      const amps = chartHistory.actualAmps[i] || 18;
      const y = mt + ph * (1 - amps / 30);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Expected Amps Baseline (Dotted Green)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    const yExpected = mt + ph * (1 - 18.0 / 30);
    ctx.moveTo(ml, yExpected);
    ctx.lineTo(w - mr, yExpected);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Legend
  ctx.font = '10px monospace';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText('■ Reported RPM', ml, mt - 10);
  ctx.fillStyle = '#ff1744';
  ctx.fillText('■ True Electrical Amps', ml + 140, mt - 10);
  ctx.fillStyle = '#00e676';
  ctx.fillText('-- Baseline (18A)', ml + 320, mt - 10);
}

// ============================================================================
// Dual-Mode Data Engine: Polling & HTTP API Handler
// ============================================================================
async function fetchBackendState() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    const response = await fetch('http://localhost:8000/api/state', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const liveData = await response.json();
      isLiveBackend = true;
      currentScenario = liveData.scenario || currentScenario;
      honeypotActive = liveData.honeypot_active || false;
      renderDashboard(liveData);
      return;
    }
  } catch (err) {
    // Live backend unavailable; smoothly fall back
    isLiveBackend = false;
  }

  // Run client-side simulation tick
  runSimulationTick();
}

function runSimulationTick() {
  // Update live countdown timers if in cyber disruption
  if (currentScenario === 'cyber_espionage' && !honeypotActive) {
    if (starvationCountdownSec.S4 > 0) starvationCountdownSec.S4--;
    if (starvationCountdownSec.S5 > 0) starvationCountdownSec.S5--;
    if (starvationCountdownSec.S6 > 0) starvationCountdownSec.S6--;
  } else if (currentScenario === 'operational_degradation') {
    if (starvationCountdownSec.S4 > 0) starvationCountdownSec.S4 = Math.max(10, starvationCountdownSec.S4 - 1);
  }

  const fallbackData = generateFallbackState();
  renderDashboard(fallbackData);
}

// ============================================================================
// User Interactions (Scenario Trigger & Honeypot Deploy)
// ============================================================================
async function switchScenario(newScenario) {
  currentScenario = newScenario;
  honeypotActive = false; // Reset honeypot on scenario switch

  // Reset starvation timers to fresh defaults
  starvationCountdownSec = {
    S4: newScenario === 'cyber_espionage' ? 135 : 300,
    S5: newScenario === 'cyber_espionage' ? 270 : 600,
    S6: newScenario === 'cyber_espionage' ? 465 : 900
  };

  // If live backend exists, notify via POST
  if (isLiveBackend) {
    try {
      await fetch('http://localhost:8000/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: newScenario })
      });
    } catch (e) {
      console.warn("Backend POST /api/scenario failed, keeping fallback simulation sync.", e);
    }
  }

  // Immediately re-render
  runSimulationTick();
}

async function toggleHoneypot() {
  honeypotActive = !honeypotActive;

  // If live backend exists, notify via POST
  if (isLiveBackend) {
    try {
      await fetch('http://localhost:8000/api/honeypot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploy: honeypotActive })
      });
    } catch (e) {
      console.warn("Backend POST /api/honeypot failed, keeping fallback simulation sync.", e);
    }
  }

  // Immediately re-render
  runSimulationTick();
}

function selectStation(stationId) {
  selectedStationId = stationId;
  runSimulationTick();
}

// ============================================================================
// Application Boot
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Chart
  initLieDetectorChart();

  // Run initial tick immediately
  fetchBackendState();

  // Start continuous 1000ms engine cycle
  pollIntervalTimer = setInterval(fetchBackendState, 1000);
});
