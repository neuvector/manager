package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

object DlpJsonProtocol extends DefaultJsonProtocol {
  implicit val criteriaEntryFormat: RootJsonFormat[CriteriaEntry] = jsonFormat3(CriteriaEntry)
  implicit val patternFormat: RootJsonFormat[Pattern] = jsonFormat4(Pattern)
  implicit val preRuleContextFormat: RootJsonFormat[PreRuleContext] = jsonFormat2(PreRuleContext)
  implicit val dlpRuleFmt: RootJsonFormat[DlpRule] = jsonFormat3(DlpRule)
  implicit val dlpRuleDetailFmt: RootJsonFormat[DlpRuleDetail] = jsonFormat2(DlpRuleDetail)
  implicit val dlpRuleDataFmt: RootJsonFormat[DlpRuleData] = jsonFormat1(DlpRuleData)
  implicit val dlpRulesDataFmt: RootJsonFormat[DlpRulesData] = jsonFormat1(DlpRulesData)
  implicit val dlpSettingFmt: RootJsonFormat[DlpSetting] = jsonFormat2(DlpSetting)
  implicit val dlpGroupFmt: RootJsonFormat[DlpGroup] = jsonFormat3(DlpGroup)
  implicit val dlpGroupDataFmt: RootJsonFormat[DlpGroupData] = jsonFormat1(DlpGroupData)
  implicit val dlpGroupsDataFmt: RootJsonFormat[DlpGroupsData] = jsonFormat1(DlpGroupsData)
  implicit val dlpGroupConfigFmt: RootJsonFormat[DlpGroupConfig] = jsonFormat5(DlpGroupConfig)
  implicit val dlpGroupConfigDataFmt: RootJsonFormat[DlpGroupConfigData] = jsonFormat1(DlpGroupConfigData)
  implicit val dlpSensorFmt: RootJsonFormat[DlpSensor] = jsonFormat4(DlpSensor)
  implicit val dlpSensorDataFmt: RootJsonFormat[DlpSensorData] = jsonFormat1(DlpSensorData)
  implicit val dlpSensorsDataFmt: RootJsonFormat[DlpSensorsData] = jsonFormat1(DlpSensorsData)
  implicit val dlpSensorConfigFmt: RootJsonFormat[DlpSensorConfig] = jsonFormat7(DlpSensorConfig)
  implicit val dlpSensorConfigDataFmt: RootJsonFormat[DlpSensorConfigData] = jsonFormat1(DlpSensorConfigData)
  implicit val dlpRuleConfigFmt: RootJsonFormat[DlpRuleConfig] = jsonFormat2(DlpRuleConfig)
  implicit val dlpRuleConfigDataFmt: RootJsonFormat[DlpRuleConfigData] = jsonFormat1(DlpRuleConfigData)
  implicit val exportedDlpSensorListFmt: RootJsonFormat[ExportedDlpSensorList] = jsonFormat1(ExportedDlpSensorList)

  def dlpSensorConfigToJson(config: DlpSensorConfigData): String = config.toJson.compactPrint
  def dlpGroupConfigToJson(config: DlpGroupConfigData): String = config.toJson.compactPrint
  def exportedDlpSensorListToJson(list: ExportedDlpSensorList): String = list.toJson.compactPrint

}
