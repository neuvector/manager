import { RiskType } from './enum';

export interface RbacStatus {
  clusterrole_errors: Array<string>;
  clusterrolebinding_errors: Array<string>;
  rolebinding_errors: Array<string>;
}

export interface Score {
  newServiceModeScore: number;
  serviceModeScore: number;
  serviceModeScoreBy100: number;
  exposureScore: number;
  exposureScoreBy100: number;
  privilegedContainerScore: number;
  runAsRoot: number;
  admissionRuleScore: number;
  vulnerabilityScore: number;
  vulnerabilityScoreBy100: number;
  securityRiskScore: number;
  hasError: boolean;
}

export interface Metrics {
  deny_adm_ctrl_rules: number;
  discover_cves: number;
  discover_ext_eps: number;
  discover_groups: number;
  discover_groups_zero_drift: number;
  monitor_groups: number;
  protect_groups: number;
  running_pods: number;
  groups: number;
  host_cves: number;
  hosts: number;
  monitor_cves: number;
  monitor_ext_eps: number;
  new_service_policy_mode: string;
  platform: string;
  platform_cves: number;
  privileged_wls: number;
  protect_cves: number;
  protect_ext_eps: number;
  root_wls: number;
  threat_ext_eps: number;
  violate_ext_eps: number;
}

export interface Exposure {
  id: string;
  name: string;
  display_name: string;
  pod_name: string;
  service: string;
  severity: string;
  policy_mode: string;
  policy_action: string;
  protocols?: Array<string>;
  applications?: Array<string>;
  ports?: Array<number>;
}

export interface InternalSystemInfo {
  header_data: Metrics;
  score: Score;
  egress: Array<Exposure>;
  ingress: Array<Exposure>;
}

export interface Factor {
  title: string;
  amount: string;
  comment?: string;
}

export interface RiskFactor {
  factorTitle: string;
  factors: Array<Factor>;
  factorComment?: Array<string>;
  subScore: any;
  isFactorError: boolean;
  factorErrorMessage?: string;
}

export interface RiskInstruction {
  type: RiskType;
  title: string;
  description: string;
  active: boolean;
}

export interface ExposedContainer {
  id: string;
  display_name: string;
  name: string;
  pod_name: string;
  applications: Array<string>;
  policy_action: string;
  policy_mode: string;
  ports: Array<string>;
  protocols: Array<string>;
  service: string;
  severity: string;
}

export interface HierarchicalExposure {
  workload_id: string;
  peerEndpoint: string;
  service: string;
  policy_mode: string;
  workload: string;
  bytes: number;
  sessions: number;
  severity: string;
  policy_action: string;
  event_type: string;
  protocols: string;
  applications: Array<string>;
  ports: Array<number>;
  children: Array<ExposedContainer>;
}
