import { HostInterfaces } from '../compliance/hostInterfaces';
import { ScanBrief } from '../compliance/scanBrief';
import { WorkloadLabels } from '../compliance/workloadLabels';
import { WorkloadPorts } from '../compliance/workloadPorts';

export interface WorkloadV2 {
  brief: WorkloadBriefV2;
  children: WorkloadChildV2[];
  created_at?: string;
  enforcer_id?: string;
  enforcer_name?: string;
  exit_code?: number;
  finished_at?: string;
  platform_role: string;
  rt_attributes: WorkloadRtAttributesV2;
  running?: boolean;
  secured_at?: string;
  security: WorkloadSecurityV2;
  started_at?: string;
}

export type WorkloadChildV2 = Omit<WorkloadV2, 'children'>;

export interface WorkloadBriefV2 {
  author: string;
  display_name: string;
  domain: string;
  host_id?: string;
  host_name?: string;
  id: string;
  image: string;
  image_id: string;
  image_created_at: string;
  image_reg_scanned: boolean;
  name: string;
  service: string;
  service_group: string;
  state: string;
}

export interface WorkloadSecurityV2 {
  baseline_profile?: string;
  cap_change_mode: boolean;
  cap_quarantine: boolean;
  cap_sniff: boolean;
  policy_mode?: string;
  profile_mode?: string;
  scan_summary: ScannedWorkloadSummary;
  service_mesh: boolean;
  service_mesh_sidecar: boolean;
  quarantine_reason?: string;
}

export interface ScannedWorkloadSummary extends ScanBrief {
  hidden_high?: number;
  hidden_medium?: number;
}

export interface WorkloadRtAttributesV2 {
  applications?: string[];
  cpus?: string;
  interfaces?: HostInterfaces;
  labels?: WorkloadLabels;
  memory_limit?: number;
  network_mode?: string;
  pod_name: string;
  ports?: WorkloadPorts[];
  privileged: boolean;
  run_as_root: boolean;
  service_account?: string;
}

export interface ProcessInfo {
  name: string;
  pid: number;
  parent: number;
  group: number;
  session: number;
  cmdline: string;
  root: boolean;
  user: string;
  status: string;
  start_timestamp: number;
  action: string;
}

export interface VulnerabilitiesQuery {
  show_accepted?: boolean | null;
  max_cve_records?: number | null;
  cursor?: {
    name?: string;
    host_name?: string;
    domain?: string;
    cve_name?: string;
    cve_package?: string;
  };
  view_pod?: string;
  vul_score_filter?: {
    score_version?: string;
    score_bottom?: number;
    score_top?: number;
  };
  filters?: {
    name?: string;
    op?: string;
    value?: string[];
  }[];
}
