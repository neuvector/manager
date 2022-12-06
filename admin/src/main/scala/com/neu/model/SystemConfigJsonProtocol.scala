package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

/**
 * Created by bxu on 4/28/16.
 */
object SystemConfigJsonProtocol extends DefaultJsonProtocol {
  implicit val errorFormat: RootJsonFormat[Error] = jsonFormat1(Error)
  implicit val registyHttpsProxyFormat: RootJsonFormat[RegistyHttpsProxy] = jsonFormat3(
    RegistyHttpsProxy
  )
  implicit val registyHttpProxyFormat: RootJsonFormat[RegistyHttpProxy] = jsonFormat3(
    RegistyHttpProxy
  )
  implicit val webhookFormat: RootJsonFormat[Webhook]                 = jsonFormat5(Webhook)
  implicit val systemConfigFormat: RootJsonFormat[SystemConfig]       = jsonFormat22(SystemConfig)
  implicit val systemNetConfigFormat: RootJsonFormat[SystemNetConfig] = jsonFormat2(SystemNetConfig)
  implicit val systemAtmoConfigFormat: RootJsonFormat[SystemAtmoConfig] = jsonFormat4(
    SystemAtmoConfig
  )
  implicit val systemConfig4DashboardFormat: RootJsonFormat[SystemConfig4Dashboard] = jsonFormat1(
    SystemConfig4Dashboard
  )
  implicit val systemConfig4DashboardWrapFormat: RootJsonFormat[SystemConfig4DashboardWrap] =
    jsonFormat2(SystemConfig4DashboardWrap)
  implicit val serviceConfigParamFormat: RootJsonFormat[ServiceConfigParam] = jsonFormat4(
    ServiceConfigParam
  )
  implicit val systemRequestContentFormat: RootJsonFormat[SystemRequestContent] = jsonFormat2(
    SystemRequestContent
  )
  implicit val systemRequestFormat: RootJsonFormat[SystemRequest] = jsonFormat1(SystemRequest)
  implicit val serviceConfigFormat: RootJsonFormat[ServiceConfig] = jsonFormat1(ServiceConfig)
  implicit val webhookConfigWrapFormat: RootJsonFormat[WebhookConfigWrap] = jsonFormat1(
    WebhookConfigWrap
  )

  implicit val systemConfigSvcCfgV2Format: RootJsonFormat[SystemConfigSvcCfgV2] = jsonFormat2(
    SystemConfigSvcCfgV2
  )
  implicit val systemConfigSyslogCfgV2Format: RootJsonFormat[SystemConfigSyslogCfgV2] = jsonFormat8(
    SystemConfigSyslogCfgV2
  )
  implicit val systemConfigAuthCfgV2Format: RootJsonFormat[SystemConfigAuthCfgV2] = jsonFormat3(
    SystemConfigAuthCfgV2
  )
  implicit val systemConfigProxyCfgV2Format: RootJsonFormat[SystemConfigProxyCfgV2] = jsonFormat4(
    SystemConfigProxyCfgV2
  )
  implicit val systemConfigIBMSAVCfg2Format: RootJsonFormat[SystemConfigIBMSAVCfg2] = jsonFormat2(
    SystemConfigIBMSAVCfg2
  )
  implicit val systemConfigAutoscaleConfigFormat: RootJsonFormat[SystemConfigAutoscaleConfig] =
    jsonFormat3(SystemConfigAutoscaleConfig)
  implicit val systemConfigMiscCfgV2Format: RootJsonFormat[SystemConfigMiscCfgV2] = jsonFormat6(
    SystemConfigMiscCfgV2
  )
  implicit val systemConfigV2Format: RootJsonFormat[SystemConfigV2] = jsonFormat8(SystemConfigV2)

  implicit val systemConfigWrapFormat: RootJsonFormat[SystemConfigWrap] = jsonFormat5(
    SystemConfigWrap
  )

  def systemConfigWrapToJson(systemConfigWrap: SystemConfigWrap): String =
    systemConfigWrap.toJson.compactPrint

  def serviceConfigParamToJson(serviceConfigParam: ServiceConfigParam): String =
    serviceConfigParam.toJson.compactPrint

  def systemRequestToJson(systemRequest: SystemRequest): String = systemRequest.toJson.compactPrint

  def serviceConfigToJson(serviceConfig: ServiceConfig): String = serviceConfig.toJson.compactPrint

  def webhookConfigWrapToJson(webhookConfigWrap: WebhookConfigWrap): String =
    webhookConfigWrap.toJson.compactPrint

  def jsonToSystemConfigWrap(systemConfigWrap: String): SystemConfigWrap =
    systemConfigWrap.parseJson.convertTo[SystemConfigWrap]

  def jsonToSystemConfig4DashboardWrap(
    systemConfig4DashboardWrap: String
  ): SystemConfig4DashboardWrap =
    systemConfig4DashboardWrap.parseJson.convertTo[SystemConfig4DashboardWrap]

//  implicit object SystemConfigFormat extends RootJsonFormat[SystemConfig] {
//    override def write(js: SystemConfig): JsValue =
//      JsObject(
//        List(
//          Some("policy_mode"                 -> js.policy_mode.toJson),
//          Some("unused_group_aging"          -> js.unused_group_aging.toJson),
//          Some("syslog_ip"                   -> js.syslog_ip.toJson),
//          Some("syslog_ip_proto"             -> js.syslog_ip_proto.toJson),
//          Some("syslog_port"                 -> js.syslog_port.toJson),
//          Some("syslog_level"                -> js.syslog_level.toJson),
//          Some("syslog_status"               -> js.syslog_status.toJson),
//          Some("syslog_in_json"              -> js.syslog_in_json.toJson),
//          Some("new_service_policy_mode"     -> js.new_service_policy_mode.toJson),
//          Some("syslog_categories"           -> js.syslog_categories.toJson),
//          Some("single_cve_per_syslog"       -> js.single_cve_per_syslog.toJson),
//          Some("webhook_status"              -> js.webhook_status.toJson),
//          Some("webhook_url"                 -> js.webhook_url.toJson),
//          Some("webhook_level"               -> js.webhook_level.toJson),
//          Some("webhook_categories"          -> js.webhook_categories.toJson),
//          Some("cluster_name"                -> js.cluster_name.toJson),
//          Some("auth_by_platform"            -> js.auth_by_platform.toJson),
//          Some("registry_http_proxy"         -> js.registry_http_proxy.toJson),
//          Some("registry_https_proxy"        -> js.registry_https_proxy.toJson),
//          Some("registry_http_proxy_status"  -> js.registry_http_proxy_status.toJson),
//          Some("registry_https_proxy_status" -> js.registry_https_proxy_status.toJson),
//          Some("ibmsa_ep_dashboard_url"      -> js.ibmsa_ep_dashboard_url.toJson),
//          Some("ibmsa_ep_enabled"            -> js.ibmsa_ep_enabled.toJson)
//        ).flatten: _*
//      )
//
//    override def read(json: JsValue): SystemConfig = {
//      val fields = json.asJsObject.fields
//      SystemConfig(
//        fields("policy_mode").convertTo[Option[String]],
//        fields("unused_group_aging").convertTo[Option[Int]],
//        fields("syslog_ip").convertTo[Option[String]],
//        fields("syslog_ip_proto").convertTo[Option[Int]],
//        fields("syslog_port").convertTo[Option[Int]],
//        fields("syslog_level").convertTo[Option[String]],
//        fields("syslog_status").convertTo[Option[Boolean]],
//        fields("syslog_in_json").convertTo[Option[Boolean]],
//        fields("new_service_policy_mode").convertTo[Option[String]],
//        fields("syslog_categories").convertTo[Option[Array[String]]],
//        fields("single_cve_per_syslog").convertTo[Option[Boolean]],
//        fields("webhook_status").convertTo[Option[Boolean]],
//        fields("webhook_url").convertTo[Option[String]],
//        fields("webhook_level").convertTo[Option[String]],
//        fields("webhook_categories").convertTo[Option[Array[String]]],
//        fields("cluster_name").convertTo[Option[String]],
//        fields("auth_by_platform").convertTo[Option[Boolean]],
//        fields("registry_http_proxy").convertTo[Option[RegistyHttpProxy]],
//        fields("registry_https_proxy").convertTo[Option[RegistyHttpsProxy]],
//        fields("registry_http_proxy_status").convertTo[Option[Boolean]],
//        fields("registry_https_proxy_status").convertTo[Option[Boolean]],
//        fields("ibmsa_ep_dashboard_url").convertTo[Option[String]],
//        fields("ibmsa_ep_enabled").convertTo[Option[Boolean]]
//      )
//    }
//  }

}
