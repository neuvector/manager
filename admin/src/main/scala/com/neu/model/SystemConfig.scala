package com.neu.model

/**
 * Created by bxu on 4/28/16.
 */
case class RegistyHttpProxy(url: String, username: String, password: Option[String])
case class RegistyHttpsProxy(url: String, username: String, password: Option[String])
case class Webhook(
  name: String,
  url: String,
  enable: Boolean,
  `type`: String,
  cfg_type: String
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

case class SystemNetConfig (
  net_service_status: Option[Boolean],
  net_service_policy_mode: Option[String]
)

case class SystemAtmoConfig (
  mode_auto_d2m: Boolean,
  mode_auto_d2m_duration: Long,
  mode_auto_m2p: Boolean,
  mode_auto_m2p_duration: Long
)

case class SystemConfig4Dashboard(
  new_service_policy_mode: Option[String] = None
)

case class SystemConfigWrap(
  config: Option[SystemConfig],
  fed_config: Option[SystemConfig],
  net_config: Option[SystemNetConfig],
  atmo_config: Option[SystemAtmoConfig]
)

case class WebhookConfigWrap(
  config: Webhook
)

case class SystemConfig4DashboardWrap(
  config: SystemConfig4Dashboard,
  error: Option[Error]
)

case class SystemRequestContent(policy_mode: Option[String])

case class ServiceConfigParam(policy_mode: Option[String], baseline_profile: Option[String], services: Option[Array[String]], not_scored: Option[Boolean])

case class ServiceConfig(config: ServiceConfigParam)

case class SystemRequest(request: SystemRequestContent)
