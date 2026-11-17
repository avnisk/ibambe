"""
api.py — VoltGuard FastAPI backend server.

Runs on port 8000. CORS-enabled for all origins.

Endpoints
---------
GET  /api/state        → advance 1 tick, return enriched JSON state
POST /api/scenario     → {"scenario": "normal"|"cyber_espionage"|"operational_degradation"}
POST /api/honeypot     → {"active": true | false}
GET  /api/health       → server health check
GET  /                 → redirect to /api/health

Start server
------------
    python src/api.py
or:
    uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
import os

# Allow running as `python src/api.py` from project root
# or `python api.py` from inside src/
_this_dir = os.path.dirname(os.path.abspath(__file__))
if _this_dir not in sys.path:
    sys.path.insert(0, _this_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import uvicorn

from simulate import FactoryTwinSimulator
from predict import analyze_factory_state
from config import API_HOST, API_PORT

# ─────────────────────────────────────────────────────
# App init
# ─────────────────────────────────────────────────────
app = FastAPI(
    title="VoltGuard API",
    description="VoltGuard — Physics-Informed Cyber-Physical Defense System for 6-station manufacturing line",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single global simulator instance (stateful between requests)
_sim = FactoryTwinSimulator()


# ─────────────────────────────────────────────────────
# Request / response models
# ─────────────────────────────────────────────────────

class ScenarioRequest(BaseModel):
    scenario: str   # "normal" | "cyber_espionage" | "operational_degradation"


class HoneypotRequest(BaseModel):
    active: bool = False
    deploy: bool = False


# ─────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return RedirectResponse(url="/api/health")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "VoltGuard API", "version": "1.0.0"}


@app.get("/api/state")
def get_state():
    """
    Advance the simulation by 1 tick and return the full enriched JSON state.
    Must respond in <50 ms (no ML, pure deterministic physics).
    """
    # 1. Advance simulation
    raw = _sim.tick()

    # 2. Run cyber-physical analysis (deterministic, <5 ms)
    analysis = analyze_factory_state(raw)

    # 3. Build exact JSON contract required by the frontend
    response = {
        "timestamp":           raw["timestamp"],
        "scenario":            raw["scenario"],
        "honeypot_active":     raw["honeypot_active"],
        "classification":      analysis["classification"],
        "risk_score":          analysis["risk_score"],
        "financial_loss_per_hr": analysis["financial_loss_per_hr"],
        "stations":            analysis["stations"],
        "edges":               analysis["edges"],
        "security_logs":       raw["security_logs"],
        "forensic_summary":    analysis["forensic_summary"],
        "recommended_actions": analysis["recommended_actions"],
        # extra context fields (non-breaking additions)
        "evidence_factors":    analysis["evidence_factors"],
        "buffers":             raw["buffers"],
        "tick":                raw["tick"],
    }

    return response


@app.post("/api/scenario")
def set_scenario(body: ScenarioRequest):
    """Switch / reset the active scenario."""
    valid = {"normal", "cyber_espionage", "operational_degradation", "cyber_overload"}
    if body.scenario not in valid:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid scenario. Must be one of: {sorted(valid)}",
        )
    _sim.set_scenario(body.scenario)
    return {
        "status": "ok",
        "scenario": body.scenario,
        "message": f"Scenario switched to '{body.scenario}'. Simulation reset.",
    }


@app.post("/api/honeypot")
def toggle_honeypot(body: HoneypotRequest):
    """Toggle Deception Honeypot PLC defense on Station 3."""
    is_active = body.active or body.deploy
    _sim.deploy_honeypot(is_active)
    return {
        "status": "ok",
        "honeypot_active": is_active,
        "message": (
            "Deception Honeypot PLC deployed — attacker shadow-routed to virtual decoy."
            if is_active
            else "Honeypot deactivated."
        ),
    }


# ─────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("  VoltGuard Backend Server")
    print(f"  Listening on http://{API_HOST}:{API_PORT}")
    print("  Endpoints:")
    print("    GET  http://localhost:8000/api/state")
    print("    POST http://localhost:8000/api/scenario")
    print("    POST http://localhost:8000/api/honeypot")
    print("=" * 60)
    uvicorn.run(
        "api:app",
        host=API_HOST,
        port=API_PORT,
        reload=False,
        log_level="info",
        app_dir=_this_dir,
    )
