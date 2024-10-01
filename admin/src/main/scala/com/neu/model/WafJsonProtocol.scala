package com.neu.model

import spray.json.*

object WafJsonProtocol extends DefaultJsonProtocol {
  given criteriaEntryFormat: RootJsonFormat[CriteriaEntry]              = jsonFormat3(CriteriaEntry.apply)
  given patternFormat: RootJsonFormat[Pattern]                          = jsonFormat4(Pattern.apply)
  given wafRuleFmt: RootJsonFormat[WafRule]                             = jsonFormat3(WafRule.apply)
  given wafRuleDetailFmt: RootJsonFormat[WafRuleDetail]                 = jsonFormat2(WafRuleDetail.apply)
  given wafRuleDataFmt: RootJsonFormat[WafRuleData]                     = jsonFormat1(WafRuleData.apply)
  given wafRulesDataFmt: RootJsonFormat[WafRulesData]                   = jsonFormat1(WafRulesData.apply)
  given wafSettingFmt: RootJsonFormat[WafSetting]                       = jsonFormat2(WafSetting.apply)
  given wafGroupFmt: RootJsonFormat[WafGroup]                           = jsonFormat3(WafGroup.apply)
  given wafGroupDataFmt: RootJsonFormat[WafGroupData]                   = jsonFormat1(WafGroupData.apply)
  given wafGroupsDataFmt: RootJsonFormat[WafGroupsData]                 = jsonFormat1(WafGroupsData.apply)
  given wafGroupConfigFmt: RootJsonFormat[WafGroupConfig]               = jsonFormat5(WafGroupConfig.apply)
  given wafGroupConfigDataFmt: RootJsonFormat[WafGroupConfigData]       = jsonFormat1(
    WafGroupConfigData.apply
  )
  given wafSensorFmt: RootJsonFormat[WafSensor]                         = jsonFormat4(WafSensor.apply)
  given wafSensorDataFmt: RootJsonFormat[WafSensorData]                 = jsonFormat1(WafSensorData.apply)
  given wafSensorsDataFmt: RootJsonFormat[WafSensorsData]               = jsonFormat1(WafSensorsData.apply)
  given wafSensorConfigFmt: RootJsonFormat[WafSensorConfig]             = jsonFormat5(WafSensorConfig.apply)
  given wafSensorConfigDataFmt: RootJsonFormat[WafSensorConfigData]     = jsonFormat1(
    WafSensorConfigData.apply
  )
  given wafRuleConfigFmt: RootJsonFormat[WafRuleConfig]                 = jsonFormat2(WafRuleConfig.apply)
  given wafRuleConfigDataFmt: RootJsonFormat[WafRuleConfigData]         = jsonFormat1(
    WafRuleConfigData.apply
  )
  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]  = jsonFormat3(
    RemoteExportOptions.apply
  )
  given exportedWafSensorListFmt: RootJsonFormat[ExportedWafSensorList] = jsonFormat2(
    ExportedWafSensorList.apply
  )

  def wafSensorConfigToJson(config: WafSensorConfigData): String                  = config.toJson.compactPrint
  def wafGroupConfigToJson(config: WafGroupConfigData): String                    = config.toJson.compactPrint
  def exportedWafSensorListToJson(list: ExportedWafSensorList): String            = list.toJson.compactPrint
  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String =
    remoteExportOptions.toJson.compactPrint
}
