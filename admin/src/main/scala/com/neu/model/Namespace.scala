package com.neu.model

case class Namespace(
  name: String,
  workloads: Int,
  running_workloads: Int,
  running_pods: Int,
  services: Int,
  tags: Array[String]
)

case class NamespacesData(domains: Array[Namespace], tag_per_domain: Option[Boolean])

case class NamespaceConfig(name: String, tags: Option[Array[String]] = None)

case class NamespaceConfigData(config: NamespaceConfig)

case class NamespaceEntryConfig(name: String, tags: Option[Array[String]])

case class NamespaceEntryConfigData(config: NamespaceConfig)

case class DomainConfig(tag_per_domain: Option[Boolean])

case class DomainConfigData(config: DomainConfig)
