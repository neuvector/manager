import {
  PolicyMode,
  ProfileBaseline,
  RemoteRepository,
  ScannerAutoscaleStrategy,
} from '..';

export interface ConfigResponse
  extends
    SvcConfig,
    SyslogConfig,
    AuthConfig,
    ProxyConfig,
    IBMSAConfig,
    MiscConfig,
    AtmoConfig,
    NetConfig {
  scanner_autoscale: ScannerAutoscale;
  webhooks: Webhook[];
  duration_toggle?: boolean;
  ibmsa_setup?: IBMSetupGetResponse;
  ibmsa_ep_start?: number;
}

export interface ConfigPatch {
  atmo_config: AtmoConfig;
  config?: ConfigResponse;
  config_v2: ConfigV2;
  net_config: NetConfig;
}

export interface ConfigV2 {
  svc_cfg: SvcConfig;
  syslog_cfg: SyslogConfig;
  auth_cfg: AuthConfig;
  proxy_cfg: ProxyConfig;
  webhooks: Webhook[];
  ibmsa_cfg: IBMSAConfig;
  scanner_autoscale_cfg: ScannerAutoscale;
  misc_cfg: MiscConfig;
  tls_cfg: TlsConfig;
}

export interface ConfigV2Response {
  new_svc: SvcConfig;
  syslog: SyslogConfig;
  auth: AuthConfig;
  misc: MiscConfig;
  webhooks: Webhook[];
  remote_repositories: RemoteRepository[];
  proxy: ProxyConfig;
  ibmsa: IBMSAConfig;
  net_svc: NetConfig;
  mode_auto: AtmoConfig;
  tls_cfg: TlsConfig;
  scanner_autoscale: ScannerAutoscale;
  duration_toggle?: boolean;
  ibmsa_setup?: IBMSetupGetResponse;
  ibmsa_ep_start?: number;
}

export interface SvcConfig {
  new_service_policy_mode: PolicyMode;
  new_service_profile_mode: PolicyMode;
  new_service_profile_baseline: ProfileBaseline;
}

export interface SyslogConfig {
  syslog_ip: string;
  syslog_ip_proto: number;
  syslog_port: number;
  syslog_level: string;
  syslog_status: boolean;
  output_event_to_logs: boolean;
  syslog_categories: string[];
  syslog_in_json: boolean;
  single_cve_per_syslog: boolean;
  syslog_cve_in_layers: boolean;
  syslog_server_cert: string;
}

export interface AuthConfig {
  auth_order: string[];
  auth_by_platform: boolean;
  rancher_ep: string;
}

export interface ProxyConfig {
  registry_http_proxy: Proxy;
  registry_http_proxy_cfg: Proxy;
  registry_http_proxy_status: boolean;
  registry_https_proxy: Proxy;
  registry_https_proxy_cfg: Proxy;
  registry_https_proxy_status: boolean;
}

export interface IBMSAConfig {
  ibmsa_ep_dashboard_url: string;
  ibmsa_ep_enabled: boolean;
}

export interface MiscConfig extends ConfigDebug {
  unused_group_aging: number;
  cluster_name: string;
  monitor_service_mesh: boolean;
  xff_enabled: boolean;
  no_telemetry_report: boolean;
  csp_type?: string;
  allow_ns_user_export_net_policy: boolean;
}

export interface ConfigDebug {
  controller_debug: string[];
}

export interface AtmoConfig {
  mode_auto_d2m: boolean;
  mode_auto_d2m_duration: number;
  mode_auto_m2p: boolean;
  mode_auto_m2p_duration: number;
}

export interface NetConfig {
  net_service_policy_mode: PolicyMode;
  net_service_status: boolean;
  disable_net_policy: boolean;
  strict_group_mode: boolean;
}

export interface TlsConfig {
  enable_tls_verification: boolean;
  cacerts: string[];
}

export interface ScannerAutoscale {
  max_pods: number;
  min_pods: number;
  strategy: ScannerAutoscaleStrategy;
}

export interface Proxy {
  url: string;
  username: string;
  password: string | null;
}

export interface Webhook {
  name: string;
  url: string;
  enable: boolean;
  use_proxy: boolean;
  type: string;
  cfg_type: string;
  isEditable?: boolean;
}

export interface IBMSetupGetResponse {
  url: string;
  expiring_time?: string;
}
