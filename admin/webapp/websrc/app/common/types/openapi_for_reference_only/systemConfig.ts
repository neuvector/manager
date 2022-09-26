import { Webhook } from "./webhook";
import { Proxy } from "./proxy";

export interface SystemConfig {
  new_service_policy_mode: string;
  unused_group_aging: number;
  syslog_ip: string;
  syslog_ip_proto: number;
  syslog_port: number;
  syslog_level: string;
  syslog_status: boolean;
  syslog_categories: string[];
  syslog_in_json: boolean;
  auth_order: string[];
  auth_by_platform: boolean;
  configured_internal_subnets?: string[];
  webhooks: Webhook[];
  cluster_name: string;
  controller_debug: string[];
  monitor_service_mesh: boolean;
  registry_http_proxy_status: boolean;
  registry_https_proxy_status: boolean;
  registry_http_proxy: Proxy;
  registry_https_proxy: Proxy;
  ibmsa_ep_enabled: boolean;
  ibmsa_ep_start: number;
  ibmsa_ep_dashboard_url: string;
  ibmsa_ep_connected_at: string;
  xff_enabled: boolean;
}
