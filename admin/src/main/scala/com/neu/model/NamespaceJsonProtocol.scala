package com.neu.model

import spray.json.*

object NamespaceJsonProtocol extends DefaultJsonProtocol {
  given domainFormat: RootJsonFormat[Namespace] =
    jsonFormat8(Namespace.apply)

  given domainsDataFormat: RootJsonFormat[NamespacesData] = jsonFormat2(NamespacesData.apply)

  given namespaceConfigFormat: RootJsonFormat[NamespaceConfig] = jsonFormat2(NamespaceConfig.apply)

  given namespaceConfigDataFormat: RootJsonFormat[NamespaceConfigData] = jsonFormat1(
    NamespaceConfigData.apply
  )

  given namespaceEntryConfigFormat: RootJsonFormat[NamespaceEntryConfig] = jsonFormat2(
    NamespaceEntryConfig.apply
  )

  given namespaceEntryConfigDataFormat: RootJsonFormat[NamespaceEntryConfigData] =
    jsonFormat1(NamespaceEntryConfigData.apply)

  given domainConfigFormat: RootJsonFormat[DomainConfig] = jsonFormat1(DomainConfig.apply)

  given domainConfigDataFormat: RootJsonFormat[DomainConfigData] = jsonFormat1(
    DomainConfigData.apply
  )

  def configWrapToJson(config: NamespaceConfigData): String =
    config.toJson.compactPrint

  def domainConfigWrapToJson(config: DomainConfigData): String =
    config.toJson.compactPrint
}
