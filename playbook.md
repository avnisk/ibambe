# Chronos-Twin: Hackathon Execution Playbook

## 1. What Are We Building? (The 30-Second Pitch)
**Problem:** Factories suffer unexpected cascading slowdowns even when individual machine dashboards claim "99% uptime." Worse, corporate spies use silent cyber-sabotage (spoofing PLC sensors while throttling physical output or stealing IP) that looks like normal wear-and-tear until downstream assembly lines starve.

**Our Solution (Chronos-Twin):** A **Physics-Informed Cyber-Physical Digital Twin** of a 6-station manufacturing facility (`Cutting -> Milling -> Welding -> Painting -> Assembly -> Packing`). Instead of trusting isolated machine dashboards, we track **cross-node conservation of flow** and **side-channel electrical amperage** against **OT Modbus network logs**—exposing hidden bottlenecks and cyber-espionage in real time, and neutralizing attackers with an automated **Deception Honeypot PLC**.

---

## 2. Why This Beats the Jury's Objections
- **No Fake/Unfinished ML:** Judges hate black-box AI demos built in a few hours. We use deterministic **Graph Dependency Physics (`networkx`) + Side-Channel Power Verification + Buffer Time-to-Starvation Math**—instant, explainable, and 100% crash-proof.
- **Visual Cascading Simulation:** Judges physically watch a subtle disruption at Station 3 (`Welding`) ripple downstream across buffers into Stations 4, 5, and 6 with live **Time-to-Starvation countdowns**.
- **Active Cyber Defense:** We don't just show an alert; clicking **"Deploy Deception Honeypot PLC"** shadow-isolates the attacker's IP to a decoy digital twin while restoring real production.

---

## 3. Team Division & Git Branch Strategy (Single-Stage Parallel Build)

| Role | Team Size | Git Branch | Owned Files (Strict Lock) |
| :--- | :--- | :--- | :--- |
| **Backend Squad** | 2 Members | `feat/backend` | `src/config.py`, `src/simulate.py`, `src/predict.py`, `src/api.py` |
| **Frontend Squad** | 2 Members | `feat/frontend` | `dashboard/digital_twin_dashboard.html`, `dashboard/styles.css`, `dashboard/app.js` |
| **Integration & Demo Lead** | 1 Member | `main` | `run_demo.py`, `README.md`, branch merging & live demo presentation |

### Git Commands for Each Device
**Before starting (Everyone):**
```bash
git clone [https://github.com/rohanovro/digital-twin-predictive-maintenance-system.git](https://github.com/rohanovro/digital-twin-predictive-maintenance-system.git)
cd digital-twin-predictive-maintenance-system
git checkout -b feat/backend   # <-- Use feat/frontend if on Frontend Squad
