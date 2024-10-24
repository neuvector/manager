export * from './remote-grid-api';

export type PolicyMode = 'Discover' | 'Monitor' | 'Protect' | '';

export type ProfileBaseline = 'basic' | 'zero-drift';

export type ScannerAutoscaleStrategy =
  | 'immediate'
  | 'delayed'
  | 'disabled'
  | 'n/a'
  | '';

export type VulnerabilityView =
  | 'all'
  | 'containers'
  | 'infrastructure'
  | 'registry';

export type DataOps = 'add' | 'edit' | 'delete';

export type VulQueryPublishedTimeOption = 'all' | 'before' | 'after';

export type VulQueryPackageTypeOption = 'all' | 'withfix' | 'withoutfix';

export type VulQuerySeverityTypeOption = 'all' | 'high' | 'medium' | 'low';

export type VulQueryScoreTypeOption = 'v2' | 'v3';

export type MatchTypeOption = 'contains' | 'equals';

export type VulQueryOrderByColumnOption =
  | 'name'
  | 'score'
  | 'score_v3'
  | 'published_timestamp'
  | 'impact';

export type ImageQueryOrderByColumnOption =
  | 'repository'
  | 'imageid'
  | 'createdat'
  | 'os'
  | 'size'
  | 'scannedat';

export type OrderByOption = 'desc' | 'asc';

export type LastModifiedDateOption =
  | 'all'
  | 'twoweeks'
  | 'onemonth'
  | 'threemonths'
  | 'custom';

export type CfgType = 'ground' | 'user_created' | '';

export interface ErrorResponse {
  code: number;
  error: string;
  message: string;
}

export function isErrorResponse(err: ErrorResponse): err is ErrorResponse {
  return 'code' in err && 'error' in err && 'message' in err;
}

export enum GlobalNotificationType {
  SYSTEM_ALERT_NOTIFICATION = 'SYSTEM_ALERT_NOTIFICATION',
  MANAGER_NOTIFICATION = 'MANAGER_NOTIFICATION',
  USER_NOTIFICATION = 'USER_NOTIFICATION',
}

export interface GlobalNotification {
  type: GlobalNotificationType;
  name: string;
  key: string;
  message: string;
  link: string;
  labelClass: string;
  accepted?: boolean;
  unClamped: boolean;
}

export interface GlobalNotificationPayLoad {
  manager_alerts?: string[];
  controller_alerts?: string[];
  user_alerts?: string[];
}

export interface ScanConfig {
  auto_scan: boolean;
}

export interface ChartDataUpdate {
  data1: string | number;
  postfix1: string;
  data2: string | number;
  postfix2: string;
  read_at: string;
}

export interface ComponentChartData {
  labels: string[];
  y: number[];
  y1: number[];
}

export interface ContainerChartUpdate {
  cpu: ChartDataUpdate;
  byte: ChartDataUpdate;
  session: ChartDataUpdate;
}

export interface SystemSummaryDetails {
  hosts: number;
  controllers: number;
  enforcers: number;
  disconnected_enforcers: number;
  domains: number;
  workloads: number;
  running_workloads: number;
  running_pods: number;
  services: number;
  policy_rules: number;
  scanners: number;
  platform: string;
  kube_version: string;
  openshift_version: string;
  cvedb_version: string;
  cvedb_create_time: string;
  component_versions: Array<string>;
}

export interface SystemSummary {
  summary: SystemSummaryDetails;
}

export interface Rebrand {
  customLoginLogo: string;
  customPolicy: string;
  customPageHeaderContent: string;
  customPageHeaderColor: string;
  customPageFooterContent: string;
  customPageFooterColor: string;
}

export interface SsoServer {
  redirect_url: string;
  server_name: string;
  server_type: string;
}
