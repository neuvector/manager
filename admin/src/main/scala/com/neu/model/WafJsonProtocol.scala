package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

object WafJsonProtocol extends DefaultJsonProtocol {
  implicit val criteriaEntryFormat: RootJsonFormat[CriteriaEntry] = jsonFormat3(CriteriaEntry)
  implicit val patternFormat: RootJsonFormat[Pattern]             = jsonFormat4(Pattern)
  implicit val wafRuleFmt: RootJsonFormat[WafRule]                = jsonFormat3(WafRule)
  implicit val wafRuleDetailFmt: RootJsonFormat[WafRuleDetail]    = jsonFormat2(WafRuleDetail)
  implicit val wafRuleDataFmt: RootJsonFormat[WafRuleData]        = jsonFormat1(WafRuleData)
  implicit val wafRulesDataFmt: RootJsonFormat[WafRulesData]      = jsonFormat1(WafRulesData)
  implicit val wafSettingFmt: RootJsonFormat[WafSetting]          = jsonFormat2(WafSetting)
  implicit val wafGroupFmt: RootJsonFormat[WafGroup]              = jsonFormat3(WafGroup)
  implicit val wafGroupDataFmt: RootJsonFormat[WafGroupData]      = jsonFormat1(WafGroupData)
  implicit val wafGroupsDataFmt: RootJsonFormat[WafGroupsData]    = jsonFormat1(WafGroupsData)
  implicit val wafGroupConfigFmt: RootJsonFormat[WafGroupConfig]  = jsonFormat5(WafGroupConfig)
  implicit val wafGroupConfigDataFmt: RootJsonFormat[WafGroupConfigData] = jsonFormat1(
    WafGroupConfigData
  )
  implicit val wafSensorFmt: RootJsonFormat[WafSensor]             = jsonFormat4(WafSensor)
  implicit val wafSensorDataFmt: RootJsonFormat[WafSensorData]     = jsonFormat1(WafSensorData)
  implicit val wafSensorsDataFmt: RootJsonFormat[WafSensorsData]   = jsonFormat1(WafSensorsData)
  implicit val wafSensorConfigFmt: RootJsonFormat[WafSensorConfig] = jsonFormat5(WafSensorConfig)
  implicit val wafSensorConfigDataFmt: RootJsonFormat[WafSensorConfigData] = jsonFormat1(
    WafSensorConfigData
  )
  implicit val wafRuleConfigFmt: RootJsonFormat[WafRuleConfig] = jsonFormat2(WafRuleConfig)
  implicit val wafRuleConfigDataFmt: RootJsonFormat[WafRuleConfigData] = jsonFormat1(
    WafRuleConfigData
  )
  implicit val remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions] = jsonFormat3(
    RemoteExportOptions
  )
  implicit val exportedWafSensorListFmt: RootJsonFormat[ExportedWafSensorList] = jsonFormat2(
    ExportedWafSensorList
  )

  def wafSensorConfigToJson(config: WafSensorConfigData): String       = config.toJson.compactPrint
  def wafGroupConfigToJson(config: WafGroupConfigData): String         = config.toJson.compactPrint
  def exportedWafSensorListToJson(list: ExportedWafSensorList): String = list.toJson.compactPrint
  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String =
    remoteExportOptions.toJson.compactPrint
}
