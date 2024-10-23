package com.neu.model

import spray.json.*

case class CustomCheck(name: String, script: String)

case class CustomChecks(scripts: Seq[CustomCheck])

case class CustomCheckConfig(
  add: Option[CustomChecks],
  delete: Option[CustomChecks],
  update: Option[CustomChecks]
)

case class CustomCheckConfigData(config: CustomCheckConfig)
case class CustomCheckConfigDTO(group: String, config: CustomCheckConfig)

case class CustomCheckData(config: CustomChecks)

object CustomCheckConfigJsonProtocol extends DefaultJsonProtocol {
  given customCheckFormat: RootJsonFormat[CustomCheck]                     = jsonFormat2(CustomCheck.apply)
  given customChecksFormats: RootJsonFormat[CustomChecks]                  = jsonFormat1(CustomChecks.apply)
  given customCheckConfigFormat: RootJsonFormat[CustomCheckConfig]         = jsonFormat3(
    CustomCheckConfig.apply
  )
  given customCheckConfigDataFormat: RootJsonFormat[CustomCheckConfigData] = jsonFormat1(
    CustomCheckConfigData.apply
  )
  given customCheckConfigDTOFormat: RootJsonFormat[CustomCheckConfigDTO]   = jsonFormat2(
    CustomCheckConfigDTO.apply
  )
  given customConfigFormat: RootJsonFormat[CustomCheckData]                = jsonFormat1(CustomCheckData.apply)

  def customConfigToJson(configWrap: CustomCheckConfigData): String = configWrap.toJson.compactPrint
}
