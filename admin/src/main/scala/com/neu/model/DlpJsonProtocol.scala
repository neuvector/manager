package com.neu.model

import spray.json.*

object DlpJsonProtocol extends DefaultJsonProtocol {
  given criteriaEntryFormat: RootJsonFormat[CriteriaEntry]              = jsonFormat3(CriteriaEntry.apply)
  given patternFormat: RootJsonFormat[Pattern]                          = jsonFormat4(Pattern.apply)
  given preRuleContextFormat: RootJsonFormat[PreRuleContext]            = jsonFormat2(PreRuleContext.apply)
  given dlpRuleFmt: RootJsonFormat[DlpRule]                             = jsonFormat3(DlpRule.apply)
  given dlpRuleDetailFmt: RootJsonFormat[DlpRuleDetail]                 = jsonFormat2(DlpRuleDetail.apply)
  given dlpRuleDataFmt: RootJsonFormat[DlpRuleData]                     = jsonFormat1(DlpRuleData.apply)
  given dlpRulesDataFmt: RootJsonFormat[DlpRulesData]                   = jsonFormat1(DlpRulesData.apply)
  given dlpSettingFmt: RootJsonFormat[DlpSetting]                       = jsonFormat2(DlpSetting.apply)
  given dlpGroupFmt: RootJsonFormat[DlpGroup]                           = jsonFormat3(DlpGroup.apply)
  given dlpGroupDataFmt: RootJsonFormat[DlpGroupData]                   = jsonFormat1(DlpGroupData.apply)
  given dlpGroupsDataFmt: RootJsonFormat[DlpGroupsData]                 = jsonFormat1(DlpGroupsData.apply)
  given dlpGroupConfigFmt: RootJsonFormat[DlpGroupConfig]               = jsonFormat5(DlpGroupConfig.apply)
  given dlpGroupConfigDataFmt: RootJsonFormat[DlpGroupConfigData]       = jsonFormat1(
    DlpGroupConfigData.apply
  )
  given dlpSensorFmt: RootJsonFormat[DlpSensor]                         = jsonFormat4(DlpSensor.apply)
  given dlpSensorDataFmt: RootJsonFormat[DlpSensorData]                 = jsonFormat1(DlpSensorData.apply)
  given dlpSensorsDataFmt: RootJsonFormat[DlpSensorsData]               = jsonFormat1(DlpSensorsData.apply)
  given dlpSensorConfigFmt: RootJsonFormat[DlpSensorConfig]             = jsonFormat8(DlpSensorConfig.apply)
  given dlpSensorConfigDataFmt: RootJsonFormat[DlpSensorConfigData]     = jsonFormat1(
    DlpSensorConfigData.apply
  )
  given dlpRuleConfigFmt: RootJsonFormat[DlpRuleConfig]                 = jsonFormat2(DlpRuleConfig.apply)
  given dlpRuleConfigDataFmt: RootJsonFormat[DlpRuleConfigData]         = jsonFormat1(
    DlpRuleConfigData.apply
  )
  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]  = jsonFormat3(
    RemoteExportOptions.apply
  )
  given exportedDlpSensorListFmt: RootJsonFormat[ExportedDlpSensorList] = jsonFormat2(
    ExportedDlpSensorList.apply
  )

  def dlpSensorConfigToJson(config: DlpSensorConfigData): String                  = config.toJson.compactPrint
  def dlpGroupConfigToJson(config: DlpGroupConfigData): String                    = config.toJson.compactPrint
  def exportedDlpSensorListToJson(list: ExportedDlpSensorList): String            = list.toJson.compactPrint
  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String =
    remoteExportOptions.toJson.compactPrint
}
