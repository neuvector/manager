package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

object NamespaceJsonProtocol extends DefaultJsonProtocol {
  implicit val domainFormat: RootJsonFormat[Namespace] = {
    jsonFormat8(Namespace)
  }

  implicit val domainsDataFormat: RootJsonFormat[NamespacesData] = jsonFormat2(NamespacesData)

  implicit val namespaceConfigFormat: RootJsonFormat[NamespaceConfig] = jsonFormat2(NamespaceConfig)

  implicit val namespaceConfigDataFormat: RootJsonFormat[NamespaceConfigData] = jsonFormat1(
    NamespaceConfigData
  )

  implicit val namespaceEntryConfigFormat: RootJsonFormat[NamespaceEntryConfig] = jsonFormat2(
    NamespaceEntryConfig
  )

  implicit val namespaceEntryConfigDataFormat: RootJsonFormat[NamespaceEntryConfigData] =
    jsonFormat1(NamespaceEntryConfigData)

  implicit val domainConfigFormat: RootJsonFormat[DomainConfig] = jsonFormat1(DomainConfig)

  implicit val domainConfigDataFormat: RootJsonFormat[DomainConfigData] = jsonFormat1(
    DomainConfigData
  )

  def configWrapToJson(config: NamespaceConfigData): String =
    config.toJson.compactPrint

  def domainConfigWrapToJson(config: DomainConfigData): String =
    config.toJson.compactPrint
}
