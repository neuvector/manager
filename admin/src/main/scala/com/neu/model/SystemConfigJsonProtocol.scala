package com.neu.model

import spray.json.*

/**
 * Created by bxu on 4/28/16.
 */
object SystemConfigJsonProtocol extends DefaultJsonProtocol {
  given errorFormat: RootJsonFormat[Error]                                           = jsonFormat1(Error.apply)
  given registyHttpsProxyFormat: RootJsonFormat[RegistyHttpsProxy]                   = jsonFormat3(
    RegistyHttpsProxy.apply
  )
  given registyHttpProxyFormat: RootJsonFormat[RegistyHttpProxy]                     = jsonFormat3(
    RegistyHttpProxy.apply
  )
  given registyHttpsProxyCfgFormat: RootJsonFormat[RegistyHttpsProxyCfg]             = jsonFormat3(
    RegistyHttpsProxyCfg.apply
  )
  given registyHttpProxyCfgFormat: RootJsonFormat[RegistyHttpProxyCfg]               = jsonFormat3(
    RegistyHttpProxyCfg.apply
  )
  given githubConfigurationFormat: RootJsonFormat[GithubConfiguration]               = jsonFormat6(
    GithubConfiguration.apply
  )
  given azureDevopsConfigurationFormat: RootJsonFormat[AzureDevopsConfiguration]     = jsonFormat5(
    AzureDevopsConfiguration.apply
  )
  given webhookFormat: RootJsonFormat[Webhook]                                       = jsonFormat6(Webhook.apply)
  given remoteRepoFormat: RootJsonFormat[RemoteRepository]                           = jsonFormat6(RemoteRepository.apply)
  given remoteRepositoryWrapFormat: RootJsonFormat[RemoteRepositoryWrap]             = jsonFormat1(
    RemoteRepositoryWrap.apply
  )
  given systemConfigFormat: RootJsonFormat[SystemConfig]                             = jsonFormat22(SystemConfig.apply)
  given systemNetConfigFormat: RootJsonFormat[SystemNetConfig]                       = jsonFormat4(SystemNetConfig.apply)
  given systemAtmoConfigFormat: RootJsonFormat[SystemAtmoConfig]                     = jsonFormat4(
    SystemAtmoConfig.apply
  )
  given systemConfig4DashboardFormat: RootJsonFormat[SystemConfig4Dashboard]         = jsonFormat1(
    SystemConfig4Dashboard.apply
  )
  given systemConfig4DashboardWrapFormat: RootJsonFormat[SystemConfig4DashboardWrap] =
    jsonFormat2(SystemConfig4DashboardWrap.apply)
  given serviceConfigParamFormat: RootJsonFormat[ServiceConfigParam]                 = jsonFormat5(
    ServiceConfigParam.apply
  )
  given systemRequestContentFormat: RootJsonFormat[SystemRequestContent]             = jsonFormat3(
    SystemRequestContent.apply
  )
  given systemRequestFormat: RootJsonFormat[SystemRequest]                           = jsonFormat1(SystemRequest.apply)
  given serviceConfigFormat: RootJsonFormat[ServiceConfig]                           = jsonFormat1(ServiceConfig.apply)
  given webhookConfigWrapFormat: RootJsonFormat[WebhookConfigWrap]                   = jsonFormat1(
    WebhookConfigWrap.apply
  )

  given systemConfigSvcCfgV2Format: RootJsonFormat[SystemConfigSvcCfgV2]               = jsonFormat3(
    SystemConfigSvcCfgV2.apply
  )
  given systemConfigSyslogCfgV2Format: RootJsonFormat[SystemConfigSyslogCfgV2]         =
    jsonFormat11(
      SystemConfigSyslogCfgV2.apply
    )
  given systemConfigAuthCfgV2Format: RootJsonFormat[SystemConfigAuthCfgV2]             = jsonFormat3(
    SystemConfigAuthCfgV2.apply
  )
  given systemConfigProxyCfgV2Format: RootJsonFormat[SystemConfigProxyCfgV2]           = jsonFormat6(
    SystemConfigProxyCfgV2.apply
  )
  given systemConfigIBMSAVCfg2Format: RootJsonFormat[SystemConfigIBMSAVCfg2]           = jsonFormat2(
    SystemConfigIBMSAVCfg2.apply
  )
  given systemConfigAutoscaleConfigFormat: RootJsonFormat[SystemConfigAutoscaleConfig] =
    jsonFormat3(SystemConfigAutoscaleConfig.apply)
  given systemConfigMiscCfgV2Format: RootJsonFormat[SystemConfigMiscCfgV2]             = jsonFormat8(
    SystemConfigMiscCfgV2.apply
  )
  given systemConfigTlsCfgFormat: RootJsonFormat[SystemConfigTlsCfg]                   = jsonFormat2(
    SystemConfigTlsCfg.apply
  )
  given systemConfigV2Format: RootJsonFormat[SystemConfigV2]                           = jsonFormat10(SystemConfigV2.apply)

  given systemConfigWrapFormat: RootJsonFormat[SystemConfigWrap] = jsonFormat5(
    SystemConfigWrap.apply
  )

  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions] = jsonFormat3(
    RemoteExportOptions.apply
  )

  given exportedFedSystemConfigFormat: RootJsonFormat[ExportedFedSystemConfig] =
    jsonFormat1(
      ExportedFedSystemConfig.apply
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

  def exportedFedSystemConfigToJson(exportedFedSystemConfig: ExportedFedSystemConfig): String =
    exportedFedSystemConfig.toJson.compactPrint

  def jsonToSystemConfigWrap(systemConfigWrap: String): SystemConfigWrap =
    systemConfigWrap.parseJson.convertTo[SystemConfigWrap]

  def jsonToSystemConfig4DashboardWrap(
    systemConfig4DashboardWrap: String
  ): SystemConfig4DashboardWrap =
    systemConfig4DashboardWrap.parseJson.convertTo[SystemConfig4DashboardWrap]
}
