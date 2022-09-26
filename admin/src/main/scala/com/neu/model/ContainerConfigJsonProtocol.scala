package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

/**
 * Created by bxu on 3/8/17.
 */
case class ContainerQuarantineRequest(id: String, quarantine: Boolean)

case class QuarantineConfig(quarantine: Boolean)

case class QuarantineConfigWarp(config: QuarantineConfig)

object ContainerConfigJsonProtocol extends DefaultJsonProtocol {
  implicit val ContainerQuarantineRequestFormat: RootJsonFormat[ContainerQuarantineRequest] =
    jsonFormat2(ContainerQuarantineRequest)
  implicit val quarantineConfigFormat: RootJsonFormat[QuarantineConfig] = jsonFormat1(
    QuarantineConfig
  )
  implicit val quarantineConfigWarpFormat: RootJsonFormat[QuarantineConfigWarp] = jsonFormat1(
    QuarantineConfigWarp
  )
  implicit val snifferParamFormat: RootJsonFormat[SnifferParam] = jsonFormat3(SnifferParam)
  implicit val snifferParamWrapFormat: RootJsonFormat[SnifferParamWarp] = jsonFormat1(
    SnifferParamWarp
  )
  implicit val snifferDataFormat: RootJsonFormat[SnifferData] = jsonFormat2(SnifferData)

  def quarantineConfigWarpToJson(config: QuarantineConfigWarp): String = config.toJson.compactPrint
  def snifferParamWarpToJson(paramWarp: SnifferParamWarp): String      = paramWarp.toJson.compactPrint
}
