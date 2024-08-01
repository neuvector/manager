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
  implicit val githubConfigurationFormat: RootJsonFormat[GithubConfiguration] = jsonFormat6(
    GithubConfiguration
  )
  implicit val webhookFormat: RootJsonFormat[Webhook]             = jsonFormat6(Webhook)
  implicit val remoteRepoFormat: RootJsonFormat[RemoteRepository] = jsonFormat5(RemoteRepository)
  implicit val remoteRepositoryWrapFormat: RootJsonFormat[RemoteRepositoryWrap] = jsonFormat1(
    RemoteRepositoryWrap
  )
  implicit val systemConfigFormat: RootJsonFormat[SystemConfig]       = jsonFormat22(SystemConfig)
  implicit val systemNetConfigFormat: RootJsonFormat[SystemNetConfig] = jsonFormat3(SystemNetConfig)
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
  implicit val systemConfigSyslogCfgV2Format: RootJsonFormat[SystemConfigSyslogCfgV2] =
    jsonFormat11(
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
  implicit val systemConfigMiscCfgV2Format: RootJsonFormat[SystemConfigMiscCfgV2] = jsonFormat7(
    SystemConfigMiscCfgV2
  )
  implicit val systemConfigTlsCfgFormat: RootJsonFormat[SystemConfigTlsCfg] = jsonFormat2(
    SystemConfigTlsCfg
  )
  implicit val systemConfigV2Format: RootJsonFormat[SystemConfigV2] = jsonFormat10(SystemConfigV2)

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

  def remoteRepositoryToJson(remoteRepository: RemoteRepository): String =
    remoteRepository.toJson.compactPrint

  def remoteRepositoryWrapToJson(remoteRepositoryWrap: RemoteRepositoryWrap): String =
    remoteRepositoryWrap.toJson.compactPrint

  def jsonToSystemConfigWrap(systemConfigWrap: String): SystemConfigWrap =
    systemConfigWrap.parseJson.convertTo[SystemConfigWrap]

  def jsonToSystemConfig4DashboardWrap(
    systemConfig4DashboardWrap: String
  ): SystemConfig4DashboardWrap =
    systemConfig4DashboardWrap.parseJson.convertTo[SystemConfig4DashboardWrap]
}
