import { RiskType } from './enum';

export enum SystemAlertType {
  RBAC = 'RBAC',
  TLS_CERTIFICATE = 'TLS_CERTIFICATE',
}

export enum SystemAlertSeverity {
  CRITICAL = 'Critical',
  WARNING = 'Warning',
  INFO = 'Info',
}

export interface SystemAlertSummary {
  acceptable_alerts: { [name: string]: SystemAlerts };
  accepted_alerts: string[] | null;
  neuvector_upgrade_info: UpgradeInfo;
}

export interface SystemAlerts {
  type: SystemAlertType;
  data: SystemAlert[];
}

export interface SystemAlert {
  id: string;
  message: string;
}

export interface UpgradeVerion {
  release_date: Date;
  tag: string;
  version: string;
}

export interface UpgradeInfo {
  max_upgrade_version?: UpgradeVerion;
  min_upgrade_version?: UpgradeVerion;
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

export interface ConversationReportEntry {
  id: string;
  bytes: number;
  sessions: number;
  port?: string;
  application?: string;
  policy_action: string;
  client_ip?: string;
  server_ip?: string;
  fqdn: string;
  ip?: string;
  country_code?: string;
  country_name?: string;
}

export interface Exposure {
  id: string;
  name: string;
  display_name: string;
  pod_name: string;
  service: string;
  severity: string;
  high: number;
  medium: number;
  policy_mode: string;
  policy_action: string;
  protocols?: string[];
  applications?: string[];
  ports?: number[];
  entries?: ConversationReportEntry[];
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

export interface ConversationReportEntryByService {
  ip: string;
  fqdn?: string;
  protocols: string[];
  sessions: number;
  applications: string[];
  policy_action: string;
  country_code: string;
  country_name: string;
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
  high: number;
  medium: number;
  policy_action: string;
  event_type: string;
  protocols: string;
  applications: string[];
  ports: number[];
  entries: ConversationReportEntryByService[];
  children: ExposedContainer[];
}
