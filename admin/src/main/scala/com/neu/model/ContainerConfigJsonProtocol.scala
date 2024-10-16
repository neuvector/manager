package com.neu.model

import spray.json.*

/**
 * Created by bxu on 3/8/17.
 */
case class ContainerQuarantineRequest(id: String, quarantine: Boolean)

case class QuarantineConfig(quarantine: Boolean)

case class QuarantineConfigWarp(config: QuarantineConfig)

object ContainerConfigJsonProtocol extends DefaultJsonProtocol {
  given ContainerQuarantineRequestFormat: RootJsonFormat[ContainerQuarantineRequest] =
    jsonFormat2(ContainerQuarantineRequest.apply)
  given quarantineConfigFormat: RootJsonFormat[QuarantineConfig]                     = jsonFormat1(
    QuarantineConfig.apply
  )
  given quarantineConfigWarpFormat: RootJsonFormat[QuarantineConfigWarp]             = jsonFormat1(
    QuarantineConfigWarp.apply
  )
  given snifferParamFormat: RootJsonFormat[SnifferParam]                             = jsonFormat3(SnifferParam.apply)
  given snifferParamWrapFormat: RootJsonFormat[SnifferParamWarp]                     = jsonFormat1(
    SnifferParamWarp.apply
  )
  given snifferDataFormat: RootJsonFormat[SnifferData]                               = jsonFormat2(SnifferData.apply)

  def quarantineConfigWarpToJson(config: QuarantineConfigWarp): String = config.toJson.compactPrint
  def snifferParamWarpToJson(paramWarp: SnifferParamWarp): String      = paramWarp.toJson.compactPrint
}
