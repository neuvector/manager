package com.neu.model

import spray.json.DefaultJsonProtocol.*
import spray.json.*

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

case class RegistryAuth(
  username: Option[String] = None,
  password: Option[String] = None,
  auth_with_token: Boolean,
  auth_token: Option[String] = None,
  aws_key: Option[AWSAccount] = None,
  gcr_key: Option[GcrKey] = None
)

case class MaskedRegistryAuth(
  username: Option[String] = None,
  auth_with_token: Boolean,
  aws_key: Option[MaskedAWSAccount] = None
)

case class RegistryScan(
  rescan_after_db_update: Option[Boolean] = None,
  scan_layers: Option[Boolean] = None,
  repo_limit: Option[Int] = None,
  tag_limit: Option[Int] = None,
  schedule: Option[ScanSchedule] = None,
  ignore_proxy: Option[Boolean] = None
)

case class RegistryIntegrations(
  jfrog_mode: Option[String] = None,
  jfrog_aql: Option[Boolean] = None,
  gitlab_external_url: Option[String] = None,
  gitlab_private_token: Option[String] = None,
  ibm_cloud_account: Option[String] = None,
  ibm_cloud_token_url: Option[String] = None
)

case class MaskedRegistryIntegrations(
  jfrog_mode: Option[String] = None,
  jfrog_aql: Option[Boolean] = None,
  gitlab_external_url: Option[String] = None,
  ibm_cloud_account: Option[String] = None
)

case class RegistryConfigV2(
  name: String,
  registry_type: String,
  registry: Option[String] = None,
  domains: Option[Array[String]] = None,
  filters: Option[Array[String]] = None,
  cfg_type: Option[String] = None,
  auth: Option[RegistryAuth] = None,
  scan: Option[RegistryScan] = None,
  integrations: Option[RegistryIntegrations] = None
)

case class MaskedRegistryConfigV2(
  name: String,
  registry_type: String,
  registry: Option[String] = None,
  domains: Option[Array[String]] = None,
  filters: Option[Array[String]] = None,
  cfg_type: String,
  auth: Option[MaskedRegistryAuth] = None,
  scan: Option[RegistryScan] = None,
  integrations: Option[MaskedRegistryIntegrations] = None
)

case class RegistryConfigV2Wrap(config: RegistryConfigV2)
case class RegistryConfigV2DTO(wrap: RegistryConfigV2Wrap, name: String)

object RegistryConfigJsonProtocol extends DefaultJsonProtocol {
  given aWSAccountFormat: RootJsonFormat[AWSAccount]                 = jsonFormat4(AWSAccount.apply)
  given jfrogXrayFormat: RootJsonFormat[JfrogXray]                   = jsonFormat4(JfrogXray.apply)
  given maskedAWSAccountFormat: RootJsonFormat[MaskedAWSAccount]     = jsonFormat2(
    MaskedAWSAccount.apply
  )
  given maskedRegistryAuthFormat: RootJsonFormat[MaskedRegistryAuth] = jsonFormat3(
    MaskedRegistryAuth.apply
  )
  given maskedJfrogXrayFormat: RootJsonFormat[MaskedJfrogXray]       = jsonFormat3(MaskedJfrogXray.apply)
  given ScanScheduleFormat: RootJsonFormat[ScanSchedule]             = jsonFormat2(ScanSchedule.apply)
  given GcrKeyFormat: RootJsonFormat[GcrKey]                         = jsonFormat1(GcrKey.apply)

  given registryIntegrationsFormat: RootJsonFormat[RegistryIntegrations]             = jsonFormat6(
    RegistryIntegrations.apply
  )
  given maskedRegistryIntegrationsFormat: RootJsonFormat[MaskedRegistryIntegrations] =
    jsonFormat4(
      MaskedRegistryIntegrations.apply
    )
  given registryScanFormat: RootJsonFormat[RegistryScan]                             = jsonFormat6(RegistryScan.apply)
  given registryAuthFormat: RootJsonFormat[RegistryAuth]                             = jsonFormat6(RegistryAuth.apply)
  given registryConfigV2Format: RootJsonFormat[RegistryConfigV2]                     = jsonFormat9(
    RegistryConfigV2.apply
  )
  given registryConfigV2WrapFormat: RootJsonFormat[RegistryConfigV2Wrap]             = jsonFormat1(
    RegistryConfigV2Wrap.apply
  )

  given maskedRegistryConfigV2Format: RootJsonFormat[MaskedRegistryConfigV2] = jsonFormat9(
    MaskedRegistryConfigV2.apply
  )

  given registryConfigV2DTOFormat: RootJsonFormat[RegistryConfigV2DTO] = jsonFormat2(
    RegistryConfigV2DTO.apply
  )

  def registryConfigV2WrapToJson(registryConfigV2Wrap: RegistryConfigV2Wrap): String =
    registryConfigV2Wrap.toJson.compactPrint

  def registryConfigV2ToJson(registryConfigV2: RegistryConfigV2): String =
    registryConfigV2.toJson.compactPrint

  def jsonToMaskedRegistryConfigV2(registryConfigV2Str: String): MaskedRegistryConfigV2 =
    registryConfigV2Str.parseJson.convertTo[MaskedRegistryConfigV2]
}
