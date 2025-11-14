package com.neu.model

/**
 * Created by bxu on 4/28/16.
 */
case class RegistyHttpProxy(url: String, username: String, password: Option[String])
case class RegistyHttpsProxy(url: String, username: String, password: Option[String])
case class RegistyHttpProxyCfg(
  url: Option[String],
  username: Option[String],
  password: Option[String]
)
case class RegistyHttpsProxyCfg(
  url: Option[String],
  username: Option[String],
  password: Option[String]
)
case class Webhook(
  name: String,
  url: String,
  enable: Boolean,
  use_proxy: Boolean,
  `type`: String,
  cfg_type: String
)
case class RemoteRepository(
  nickname: String,
  provider: String,
  comment: Option[String] = None,
  enable: Boolean,
  github_configuration: Option[GithubConfiguration],
  azure_devops_configuration: Option[AzureDevopsConfiguration]
)

case class RemoteRepositoryWrap(
  config: RemoteRepository
)

case class GithubConfiguration(
  repository_owner_username: Option[String] = None,
  repository_name: Option[String] = None,
  repository_branch_name: Option[String] = None,
  personal_access_token: Option[String] = None,
  personal_access_token_committer_name: Option[String] = None,
  personal_access_token_email: Option[String] = None
)

case class AzureDevopsConfiguration(
  organization_name: Option[String] = None,
  project_name: Option[String] = None,
  repo_name: Option[String] = None,
  branch_name: Option[String] = None,
  personal_access_token: Option[String] = None
)

case class SystemConfig(
  unused_group_aging: Option[Int] = None,
  syslog_ip: Option[String] = None,
  syslog_ip_proto: Option[Int] = None,
  syslog_port: Option[Int] = None,
  syslog_level: Option[String] = None,
  syslog_status: Option[Boolean] = None,
  syslog_in_json: Option[Boolean] = None,
  new_service_policy_mode: Option[String] = None,
  new_service_profile_baseline: Option[String] = None,
  // auth_order: Option[Array[String]] = None,
  syslog_categories: Option[Array[String]] = None,
  single_cve_per_syslog: Option[Boolean] = None,
  // webhook_status: Option[Boolean] = None,
  // webhook_url: Option[String] = None,
  webhooks: Option[Array[Webhook]] = None,
  cluster_name: Option[String] = None,
  auth_by_platform: Option[Boolean] = None,
  registry_http_proxy: Option[RegistyHttpProxy] = None,
  registry_https_proxy: Option[RegistyHttpsProxy] = None,
  registry_http_proxy_status: Option[Boolean] = None,
  registry_https_proxy_status: Option[Boolean] = None,
  xff_enabled: Option[Boolean] = None,
  ibmsa_ep_dashboard_url: Option[String] = None,
  ibmsa_ep_enabled: Option[Boolean] = None,
  controller_debug: Option[Array[String]] = None
)

case class SystemNetConfig(
  net_service_status: Option[Boolean],
  net_service_policy_mode: Option[String],
  disable_net_policy: Option[Boolean],
  strict_group_mode: Option[Boolean]
)

case class SystemAtmoConfig(
  mode_auto_d2m: Boolean,
  mode_auto_d2m_duration: Long,
  mode_auto_m2p: Boolean,
  mode_auto_m2p_duration: Long
)

case class SystemConfig4Dashboard(
  new_service_policy_mode: Option[String] = None
)

case class SystemConfigSvcCfgV2(
  new_service_policy_mode: Option[String] = None,
  new_service_profile_mode: Option[String] = None,
  new_service_profile_baseline: Option[String] = None
)

case class SystemConfigSyslogCfgV2(
  syslog_ip: Option[String] = None,
  syslog_ip_proto: Option[Int] = None,
  syslog_port: Option[Long] = None,
  syslog_level: Option[String] = None,
  syslog_status: Option[Boolean] = None,
  syslog_categories: Option[Array[String]] = None,
  syslog_in_json: Option[Boolean] = None,
  single_cve_per_syslog: Boolean,
  syslog_cve_in_layers: Option[Boolean] = None,
  syslog_server_cert: Option[String] = None,
  output_event_to_logs: Option[Boolean] = None
)

case class SystemConfigAuthCfgV2(
  auth_order: Option[Array[String]] = None,
  auth_by_platform: Option[Boolean] = None,
  rancher_ep: Option[String] = None
)

case class SystemConfigProxyCfgV2(
  registry_http_proxy_status: Option[Boolean] = None,
  registry_https_proxy_status: Option[Boolean] = None,
  registry_http_proxy: Option[RegistyHttpProxy] = None,
  registry_https_proxy: Option[RegistyHttpsProxy] = None,
  registry_http_proxy_cfg: Option[RegistyHttpProxyCfg] = None,
  registry_https_proxy_cfg: Option[RegistyHttpsProxyCfg] = None
)

case class SystemConfigIBMSAVCfg2(
  ibmsa_ep_enabled: Option[Boolean] = None,
  ibmsa_ep_dashboard_url: Option[String] = None
)

case class SystemConfigAutoscaleConfig(
  strategy: Option[String] = None,
  min_pods: Option[Int] = None,
  max_pods: Option[Int] = None
)

case class SystemConfigMiscCfgV2(
  unused_group_aging: Option[Int] = None,
  cluster_name: Option[String] = None,
  controller_debug: Option[Array[String]] = None,
  monitor_service_mesh: Option[Boolean] = None,
  xff_enabled: Option[Boolean] = None,
  no_telemetry_report: Option[Boolean] = None,
  csp_type: Option[String] = None,
  allow_ns_user_export_net_policy: Option[Boolean] = None
)

case class SystemConfigTlsCfg(
  enable_tls_verification: Boolean,
  cacerts: Option[Array[String]] = None
)

case class SystemConfigV2(
  svc_cfg: Option[SystemConfigSvcCfgV2] = None,
  syslog_cfg: Option[SystemConfigSyslogCfgV2] = None,
  auth_cfg: Option[SystemConfigAuthCfgV2] = None,
  proxy_cfg: Option[SystemConfigProxyCfgV2] = None,
  webhooks: Option[Array[Webhook]] = None,
  ibmsa_cfg: Option[SystemConfigIBMSAVCfg2] = None,
  scanner_autoscale_cfg: Option[SystemConfigAutoscaleConfig] = None,
  misc_cfg: Option[SystemConfigMiscCfgV2] = None,
  remote_repo_cfg: Option[Array[RemoteRepository]] = None,
  tls_cfg: Option[SystemConfigTlsCfg] = None
)

case class SystemConfigWrap(
  config: Option[SystemConfig] = None,
  config_v2: Option[SystemConfigV2] = None,
  fed_config: Option[SystemConfig] = None,
  net_config: Option[SystemNetConfig] = None,
  atmo_config: Option[SystemAtmoConfig] = None
)

case class WebhookConfigWrap(
  config: Webhook
)

case class SystemConfig4DashboardWrap(
  config: SystemConfig4Dashboard,
  error: Option[Error]
)

case class SystemRequestContent(
  policy_mode: Option[String],
  profile_mode: Option[String],
  baseline_profile: Option[String]
)

case class ServiceConfigParam(
  policy_mode: Option[String],
  profile_mode: Option[String],
  baseline_profile: Option[String],
  services: Option[Array[String]],
  not_scored: Option[Boolean]
)

case class RemoteExportOptions(
  remote_repository_nickname: String,
  file_path: Option[String] = None,
  comment: Option[String] = None
)

case class ServiceConfig(config: ServiceConfigParam)

case class SystemRequest(request: SystemRequestContent)

case class ExportedFedSystemConfig(
  remote_export_options: Option[RemoteExportOptions] = None
)
