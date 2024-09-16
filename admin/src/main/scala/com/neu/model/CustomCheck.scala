package com.neu.model

import spray.json.{ DefaultJsonProtocol, RootJsonFormat }
import spray.json._

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
  implicit val customCheckFormat: RootJsonFormat[CustomCheck]                     = jsonFormat2(CustomCheck)
  implicit val customChecksFormats: RootJsonFormat[CustomChecks]                  = jsonFormat1(CustomChecks)
  implicit val customCheckConfigFormat: RootJsonFormat[CustomCheckConfig]         = jsonFormat3(
    CustomCheckConfig
  )
  implicit val customCheckConfigDataFormat: RootJsonFormat[CustomCheckConfigData] = jsonFormat1(
    CustomCheckConfigData
  )
  implicit val customCheckConfigDTOFormat: RootJsonFormat[CustomCheckConfigDTO]   = jsonFormat2(
    CustomCheckConfigDTO
  )
  implicit val customConfigFormat: RootJsonFormat[CustomCheckData]                = jsonFormat1(CustomCheckData)

  def customConfigToJson(configWrap: CustomCheckConfigData): String = configWrap.toJson.compactPrint
}
