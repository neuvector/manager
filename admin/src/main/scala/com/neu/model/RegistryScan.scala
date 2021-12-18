package com.neu.model

import spray.json.DefaultJsonProtocol
import spray.json._

case class AWSAccount(
  id: String,
  access_key_id: Option[String],
  secret_access_key: Option[String],
  region: String
)
case class MaskedAWSAccount(id: String, region: String)

case class JfrogXray(url: String, enable: Boolean, username: String, password: Option[String])
case class MaskedJfrogXray(url: String, enable: Boolean, username: String)

case class ScanSchedule(schedule: String, interval: Int)

case class GcrKey(
  json_key: Option[String]
)

case class RegistryConfig(
  name: String,
  registry_type: String,
  registry: Option[String] = None,
  filters: Option[Array[String]],
  username: Option[String] = None,
  password: Option[String] = None,
  auth_with_token: Boolean,
  auth_token: Option[String],
  rescan_after_db_update: Option[Boolean] = None,
  repo_limit: Option[Int] = None,
  tag_limit: Option[Int] = None,
  aws_key: Option[AWSAccount] = None,
  jfrog_xray: Option[JfrogXray] = None,
  schedule: Option[ScanSchedule] = None,
  gcr_key: Option[GcrKey] = None,
  jfrog_mode: Option[String] = None,
  scan_layers: Option[Boolean] = None,
  gitlab_external_url: Option[String] = None,
  gitlab_private_token: Option[String] = None,
  ibm_cloud_account: Option[String] = None,
  jfrog_aql: Option[Boolean] = None
)

case class MaskedRegistryConfig(
  name: String,
  registry_type: String,
  registry: Option[String] = None,
  filters: Option[Array[String]],
  username: Option[String] = None,
  auth_with_token: Boolean,
  rescan_after_db_update: Option[Boolean] = None,
  repo_limit: Option[Int] = None,
  tag_limit: Option[Int] = None,
  aws_key: Option[MaskedAWSAccount] = None,
  jfrog_xray: Option[MaskedJfrogXray] = None,
  schedule: Option[ScanSchedule] = None,
  jfrog_mode: Option[String] = None,
  scan_layers: Option[Boolean] = None,
  gitlab_external_url: Option[String] = None,
  gitlab_private_token: Option[String] = None,
  ibm_cloud_account: Option[String] = None,
  jfrog_aql: Option[Boolean] = None
)

case class RegistryConfigDTO(wrap: RegistryConfigWrap, name: String)

case class RegistryConfigWrap(config: RegistryConfig)

object RegistryConfigJsonProtocol extends DefaultJsonProtocol {
  implicit val aWSAccountFormat: RootJsonFormat[AWSAccount] = jsonFormat4(AWSAccount)
  implicit val jfrogXrayFormat: RootJsonFormat[JfrogXray]   = jsonFormat4(JfrogXray)
  implicit val maskedAWSAccountFormat: RootJsonFormat[MaskedAWSAccount] = jsonFormat2(
    MaskedAWSAccount
  )
  implicit val maskedJfrogXrayFormat: RootJsonFormat[MaskedJfrogXray] = jsonFormat3(MaskedJfrogXray)
  implicit val ScanScheduleFormat: RootJsonFormat[ScanSchedule]       = jsonFormat2(ScanSchedule)
  implicit val GcrKeyFormat: RootJsonFormat[GcrKey]                   = jsonFormat1(GcrKey)
  implicit val registryConfigFormat: RootJsonFormat[RegistryConfig]   = jsonFormat21(RegistryConfig)
  implicit val maskesRegistryConfigFormat: RootJsonFormat[MaskedRegistryConfig] = jsonFormat18(
    MaskedRegistryConfig
  )
  implicit val registryConfigWrapFormat: RootJsonFormat[RegistryConfigWrap] = jsonFormat1(
    RegistryConfigWrap
  )
  implicit val registryConfigDTOFormat: RootJsonFormat[RegistryConfigDTO] = jsonFormat2(
    RegistryConfigDTO
  )

  def registryConfigWrapToJson(registryConfigWrap: RegistryConfigWrap): String =
    registryConfigWrap.toJson.compactPrint

  def registryConfigToJson(registryConfig: RegistryConfig): String =
    registryConfig.toJson.compactPrint

  def jsonToMaskedRegistryConfig(registryConfigStr: String): MaskedRegistryConfig =
    registryConfigStr.parseJson.convertTo[MaskedRegistryConfig]
}
