"""
config.py — Chronos-Twin global constants & topology definition.
All simulation parameters live here so simulate.py / predict.py stay clean.
"""

# ──────────────────────────────────────────────
# 1. Station topology (serial, 6-station line)
# ──────────────────────────────────────────────
STATION_IDS   = ["S1", "S2", "S3", "S4", "S5", "S6"]
STATION_NAMES = ["Cutting", "Milling", "Welding", "Painting", "Assembly", "Packing"]
STATION_LEVELS = [1, 2, 2, 3, 3, 4]       # process hierarchy / BOM level

# Serial edge list: S1→S2→S3→S4→S5→S6
EDGES = [("S1","S2"), ("S2","S3"), ("S3","S4"), ("S4","S5"), ("S5","S6")]

# ──────────────────────────────────────────────
# 2. Baseline cycle times (seconds per unit)
# ──────────────────────────────────────────────
BASELINE_CYCLE_TIME = {
    "S1": 10.0,
    "S2": 12.0,
    "S3": 15.0,   # Welding — the critical constraint station
    "S4": 11.0,
    "S5": 13.0,
    "S6":  9.0,
}

# Throughput units per tick (inverse of cycle time, normalised to 100 max)
BASELINE_THROUGHPUT = {sid: round(100.0 * (10.0 / BASELINE_CYCLE_TIME[sid]), 2)
                       for sid in STATION_IDS}

# ──────────────────────────────────────────────
# 3. Buffer capacities (units) between stations
# ──────────────────────────────────────────────
BUFFER_CAPACITY = {
    ("S1","S2"): 120,
    ("S2","S3"): 100,
    ("S3","S4"):  80,
    ("S4","S5"):  90,
    ("S5","S6"):  85,
}

# Starting buffer fill (60-80 % of capacity for "normal" scenario)
BUFFER_INIT_NORMAL = {
    ("S1","S2"): 84,    # 70%
    ("S2","S3"): 70,    # 70%
    ("S3","S4"): 64,    # 80%
    ("S4","S5"): 63,    # 70%
    ("S5","S6"): 60,    # 70%
}

# ──────────────────────────────────────────────
# 4. Electrical amperage baselines (Amps)
# ──────────────────────────────────────────────
BASELINE_AMPS = {
    "S1": 120.0,
    "S2": 150.0,
    "S3": 200.0,   # Welding draws highest current
    "S4": 130.0,
    "S5": 145.0,
    "S6":  95.0,
}

# Nominal RPM (reported by HMI) — used for spoof-detection
BASELINE_RPM = {
    "S1": 3000,
    "S2": 4000,
    "S3": 5000,
    "S4": 3500,
    "S5": 4200,
    "S6": 2800,
}

# ──────────────────────────────────────────────
# 5. Scenario effect constants
# ──────────────────────────────────────────────
CYBER_THROUGHPUT_DROP   = 0.25   # 25 % throughput reduction at S3
CYBER_AMPERAGE_DROP     = 0.20   # 20 % amperage drop at S3
CYBER_SPOOF_UPTIME      = 99.8   # HMI reports this uptime even during attack
CYBER_ATTACKER_IP       = "192.168.1.45"
CYBER_ATTACKER_TARGET   = "PLC-S3"
CYBER_MODBUS_REG        = 40012

DEGRADATION_THROUGHPUT_DROP = 0.20   # 20 % mechanical wear
DEGRADATION_AMPERAGE_DROP   = 0.18   # 18 % proportional drop (no spoofing)

# ──────────────────────────────────────────────
# 6. Financial model
# ──────────────────────────────────────────────
REVENUE_PER_UNIT_PER_HR = 71.0   # $/unit/hr (drives financial_loss_per_hr)
UNITS_PER_HR_BASELINE   = 240    # at 100 % throughput on critical path

# ──────────────────────────────────────────────
# 7. API server defaults
# ──────────────────────────────────────────────
API_HOST = "0.0.0.0"
API_PORT = 8000
TICK_INTERVAL_SEC = 1   # simulation advances 1 tick per GET /api/state call
