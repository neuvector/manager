export interface Group {
  name: string;
  learned: boolean;
  cfg_type: string;
  reserved: boolean;
  policy_mode?: string;
  profile_mode?: string;
  domain: string;
  creater_domains?: string[];
  kind: string;
  platform_role: string;
  cap_change_mode: boolean;
  cap_scorable: boolean;
  criteria: CriteriaItem[];
  members: Member[];
  policy_rules: number[];
  response_rules: number[];
  baseline_profile: string;
  not_scored: boolean;
}

export interface CriteriaItem {
  name: string;
}

export interface Member {
  id: string;
  name: string;
  display_name: string;
  pod_name: string;
  platform_role: string;
  domain: string;
  state: string;
  service: string;
  service_group: string;
  share_ns_with?: string;
  cap_quarantine?: boolean;
  cap_change_mode?: boolean;
  policy_mode: string;
  scan_summary: ScanBrief;
  children: Member[];
  quarantine_reason?: string;
  service_mesh: boolean;
  service_mesh_sidecar: boolean;
}

interface ScanBrief {
  status: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface Script {
  name: string;
  script: string;
}
