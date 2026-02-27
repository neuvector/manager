package com.neu.model

import spray.json.*

/**
 * Created by bxu on 3/8/17.
 */
case class ContainerQuarantineRequest(id: String, quarantine: Boolean)

case class QuarantineConfig(quarantine: Boolean)

case class QuarantineConfigWarp(config: QuarantineConfig)

case class ScanReportRequest(
  show_accepted: Option[Boolean] = Some(false),
  max_cve_records: Option[Int] = Some(100),
  cursor: Option[Cursor] = None,
  view_pod: Option[String] = None,
  vul_score_filter: Option[VulScoreFilter] = None,
  filters: Option[Seq[Filter]] = None
)

case class Cursor(
  name: Option[String] = None,
  host_name: Option[String] = None,
  domain: Option[String] = None,
  cve_name: Option[String] = None,
  cve_package: Option[String] = None
)

case class VulScoreFilter(
  score_version: Option[String] = None,
  score_bottom: Option[Int] = None,
  score_top: Option[Int] = None
)

case class Filter(
  name: Option[String] = None,
  op: Option[String] = None,
  value: Option[Seq[String]] = None
)

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
  given scanReportRequestFormat: RootJsonFormat[ScanReportRequest]                   = jsonFormat6(
    ScanReportRequest.apply
  )
  given cursorFormat: RootJsonFormat[Cursor]                                         = jsonFormat5(Cursor.apply)
  given vulScoreFilterFormat: RootJsonFormat[VulScoreFilter]                         = jsonFormat3(VulScoreFilter.apply)
  given filterFormat: RootJsonFormat[Filter]                                         = jsonFormat3(Filter.apply)

  def quarantineConfigWarpToJson(config: QuarantineConfigWarp): String = config.toJson.compactPrint
  def snifferParamWarpToJson(paramWarp: SnifferParamWarp): String      = paramWarp.toJson.compactPrint
  def scanReportRequestToJson(request: ScanReportRequest): String      = request.toJson.compactPrint
}
