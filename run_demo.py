#!/usr/bin/env python3
"""
VoltGuard // Cyber-Physical Manufacturing Digital Twin - Live Demo Runner
Serves digital_twin_manufacturing_workstation_simulator.html and provides
live backend mock endpoints for:
  - GET  /api/state
  - POST /api/scenario
  - POST /api/honeypot
"""

import http.server
import socketserver
import json
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Live in-memory twin state
twin_state = {
    "scenario": "normal",
    "honeypot_active": False,
    "classification": "NOMINAL",
    "risk_score": 4,
    "financial_loss_per_hr": 0,
    "stations": [
        {"id": "S1", "name": "Cutting", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": 45},
        {"id": "S2", "name": "Milling", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": 50},
        {"id": "S3", "name": "Welding", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": 50},
        {"id": "S4", "name": "Painting", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": 48},
        {"id": "S5", "name": "Assembly", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": 52},
        {"id": "S6", "name": "Packing", "reported_rpm": 3000, "actual_amps": 185.0, "status": "NOMINAL", "buffer_to_next": None},
    ]
}

class VoltGuardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '/simulator':
            self.path = '/digital_twin_manufacturing_workstation_simulator.html'
            return super().do_GET()

        if self.path.startswith('/api/state'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(twin_state).encode('utf-8'))
            return

        return super().do_GET()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8') if length > 0 else '{}'
        try:
            payload = json.loads(body)
        except Exception:
            payload = {}

        if self.path.startswith('/api/scenario'):
            scenario = payload.get('scenario', 'normal')
            twin_state['scenario'] = scenario
            twin_state['honeypot_active'] = False
            if scenario == 'normal':
                twin_state['classification'] = 'NOMINAL'
                twin_state['risk_score'] = 4
                twin_state['stations'][2]['reported_rpm'] = 3000
                twin_state['stations'][2]['actual_amps'] = 185.0
                twin_state['stations'][2]['status'] = 'NOMINAL'
            elif scenario == 'operational_mishap':
                twin_state['classification'] = 'OPERATIONAL MISHAP'
                twin_state['risk_score'] = 45
                twin_state['stations'][2]['reported_rpm'] = 2100
                twin_state['stations'][2]['actual_amps'] = 128.0
                twin_state['stations'][2]['status'] = 'DEGRADED'
            elif scenario == 'cyber_spoof':
                twin_state['classification'] = 'CYBERATTACK: TELEMETRY SPOOF'
                twin_state['risk_score'] = 88
                twin_state['stations'][2]['reported_rpm'] = 3002
                twin_state['stations'][2]['actual_amps'] = 122.0
                twin_state['stations'][2]['status'] = 'SPOOFED'
            elif scenario == 'cyber_exfil':
                twin_state['classification'] = 'CYBERATTACK: EXFILTRATION'
                twin_state['risk_score'] = 96
                twin_state['stations'][2]['reported_rpm'] = 2995
                twin_state['stations'][2]['actual_amps'] = 248.0
                twin_state['stations'][2]['status'] = 'OVERLOAD'

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "scenario": scenario, "state": twin_state}).encode('utf-8'))
            return

        if self.path.startswith('/api/honeypot'):
            deploy = payload.get('deploy', payload.get('active', True))
            twin_state['honeypot_active'] = bool(deploy)
            if deploy:
                twin_state['classification'] = 'SHADOW-ISOLATED'
                twin_state['stations'][2]['reported_rpm'] = 3000
                twin_state['stations'][2]['actual_amps'] = 185.0
                twin_state['stations'][2]['status'] = 'SHADOW-ISOLATED'

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "honeypot_active": deploy, "state": twin_state}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

def main():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), VoltGuardHandler) as httpd:
            url = f"http://localhost:{PORT}/digital_twin_manufacturing_workstation_simulator.html"
            print(f"============================================================")
            print(f"⚡ VOLTGUARD // Cyber-Physical Production Line Twin Server")
            print(f"============================================================")
            print(f"Serving at: {url}")
            print(f"Press Ctrl+C to terminate server.\n")
            httpd.serve_forever()
    except OSError as e:
        print(f"Note on port {PORT}: {e}")

if __name__ == '__main__':
    main()
