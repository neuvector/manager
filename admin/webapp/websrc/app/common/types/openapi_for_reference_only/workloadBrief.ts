import { ScanBrief } from "./scanBrief";

export interface WorkloadBrief {
  id: string;
  name: string;
  display_name: string;
  pod_name: string;
  image: string;
  image_id: string;
  platform_role: string;
  domain: string;
  state: string;
  service: string;
  author: string;
  service_group: string;
  share_ns_with?: string;
  cap_sniff: boolean;
  cap_quarantine: boolean;
  cap_change_mode: boolean;
  policy_mode: string;
  profile_mode: string;
  scan_summary: ScanBrief;
  children: WorkloadBrief[];
  quarantine_reason?: string;
  service_mesh: boolean;
  service_mesh_sidecar: boolean;
  privileged: boolean;
  run_as_root: boolean;
}
