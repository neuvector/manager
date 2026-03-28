import { ScanBrief } from './scanBrief';

export interface ScanSummary {
  id: string;
  name: string;
  display_name: string;
  image: string;
  platform_role: string;
  domain: string;
  state: string;
  service: string;
  service_group: string;
  share_ns_with?: string;
  cap_sniff: boolean;
  cap_quarantine: boolean;
  cap_change_mode: boolean;
  policy_mode?: string;
  scan_summary: ScanBrief;
  quarantine_reason?: string;
  service_mesh: boolean;
  service_mesh_sidecar: boolean;
  privileged: boolean;
  run_as_root: boolean;
  status: string;
  critical: number;
  high: number;
  medium: number;
  result: string;
  scanned_timestamp: number;
  scanned_at: string;
  base_os: string;
  scanner_version: string;
  host: string;
  children: ScanSummary[];
}
