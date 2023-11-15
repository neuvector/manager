import { RiskType } from './enum';

export interface RbacAlertsSummary {
  acceptable_alerts: RbacAlertsData;
  accepted_alerts: string[] | null;
  neuvector_upgrade_info: string;
}

export interface RbacAlertsData {
  neuvector_crd_errors: Record<string, string>[] | null;
  clusterrole_errors: Record<string, string>[] | null;
  clusterrolebinding_errors: Record<string, string>[] | null;
  rolebinding_errors: Record<string, string>[] | null;
  role_errors: Record<string, string>[] | null;
  other_alerts: Record<string, string>[] | null;
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

interface RiskScoreMetricsWL {
  running_pods: number;
  privileged_wls: number;
  root_wls: number;
  discover_ext_eps: number;
  monitor_ext_eps: number;
  protect_ext_eps: number;
  threat_ext_eps: number;
  violate_ext_eps: number;
}

interface RiskScoreMetricsGroup {
  groups: number;
  discover_groups: number;
  monitor_groups: number;
  protect_groups: number;
  discover_groups_zero_drift: number;
  monitor_groups_zero_drift: number;
  protect_groups_zero_drift: number;
}

interface RiskScoreMetricsCVE {
  discover_cves: number;
  monitor_cves: number;
  protect_cves: number;
  platform_cves: number;
  host_cves: number;
}

export interface Metrics {
  platform: string;
  kube_version: string;
  openshift_version: string;
  new_service_policy_mode: string;
  deny_adm_ctrl_rules: number;
  hosts: number;
  workloads: RiskScoreMetricsWL;
  groups: RiskScoreMetricsGroup;
  cves: RiskScoreMetricsCVE;
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
  protocols?: string[];
  applications?: string[];
  ports?: number[];
}

export interface InternalSystemInfo {
  header_data: Metrics;
  score: Score;
  egress: Exposure[];
  ingress: Exposure[];
}

export interface Factor {
  title: string;
  amount: string;
  comment?: string;
}

export interface RiskFactor {
  factorTitle: string;
  factors: Factor[];
  factorComment?: string[];
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
  applications: string[];
  policy_action: string;
  policy_mode: string;
  ports: string[];
  protocols: string[];
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
  applications: string[];
  ports: number[];
  children: ExposedContainer[];
}
