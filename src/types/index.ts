/**
 * VoltGuard Core Domain & API Types
 */

export type StationStatus = 
  | 'NOMINAL'
  | 'SPOOFED'
  | 'DEGRADED'
  | 'STARVING'
  | 'SHADOW-ISOLATED';

export type SystemClassification = 
  | 'NOMINAL'
  | 'CYBER_SUSPECTED'
  | 'OPERATIONAL_DEGRADED';

export type LogSeverity = 
  | 'CRITICAL'
  | 'ALERT'
  | 'WARN'
  | 'INFO'
  | 'HONEYPOT';

export interface Station {
  id: string;
  name: string;
  level: number;
  status: StationStatus;
  reported_uptime: number;
  actual_throughput: number;
  reported_rpm: number;
  actual_amps: number;
  expected_amps: number;
  buffer_to_next: number;
  buffer_capacity: number;
  constraint_score: number;
  time_to_starvation_sec: number | null;
}

export interface Edge {
  from: string;
  to: string;
  flow_rate: number;
  congested: boolean;
  starved?: boolean;
}

export interface SecurityLog {
  time: string;
  severity: LogSeverity;
  source: string;
  target: string;
  event: string;
}

export interface DigitalTwinState {
  timestamp: string;
  scenario: 'normal' | 'cyber_espionage' | 'operational_degradation';
  honeypot_active: boolean;
  classification: SystemClassification;
  risk_score: number;
  financial_loss_per_hr: number;
  stations: Station[];
  edges: Edge[];
  security_logs: SecurityLog[];
  forensic_summary: string;
  recommended_actions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'physics' | 'security' | 'intelligence';
  status: 'active' | 'beta' | 'planned';
  metric?: string;
}
