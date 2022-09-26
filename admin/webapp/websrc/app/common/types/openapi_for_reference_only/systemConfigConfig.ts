import { Webhook } from "./webhook";
import { Proxy } from "./proxy";

export interface SystemConfigConfig {
  new_service_policy_mode?: string;
  unused_group_aging?: number;
  syslog_ip?: string;
  syslog_ip_proto?: number;
  syslog_port?: number;
  syslog_level?: string;
  syslog_status?: boolean;
  syslog_categories?: string[];
  syslog_in_json?: boolean;
  single_cve_per_syslog: boolean;
  auth_order?: string[];
  auth_by_platform?: boolean;
  webhooks?: Webhook[];
  cluster_name: string;
  controller_debug?: string[];
  monitor_service_mesh?: boolean;
  registry_http_proxy_status?: boolean;
  registry_https_proxy_status?: boolean;
  registry_http_proxy?: Proxy;
  registry_https_proxy?: Proxy;
  ibmsa_ep_enabled?: boolean;
  ibmsa_ep_dashboard_url?: string;
  xff_enabled?: boolean;
}
