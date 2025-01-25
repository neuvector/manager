package com.neu.model

case class Pattern(
  key: String,
  op: String,
  value: String,
  context: Option[String]
)

case class PreRuleContext(
  name: String,
  context: String
)

case class DlpRule(name: String, id: Option[Int], patterns: Seq[Pattern])

case class DlpRuleDetail(sensors: Seq[String], rules: Seq[DlpRule])

case class DlpRuleData(rule: DlpRuleDetail)

case class DlpRulesData(rules: Seq[DlpRule])

case class DlpSetting(name: String, action: String)

case class DlpGroup(name: String, status: Boolean, sensors: Seq[DlpSetting])

case class DlpGroupData(dlp_group: DlpGroup)

case class DlpGroupsData(dlp_groups: Seq[DlpGroup])

case class DlpGroupConfig(
  name: String,
  status: Option[Boolean],
  delete: Option[Seq[String]],
  sensors: Option[Seq[DlpSetting]],
  replace: Option[Seq[DlpSetting]]
)

case class DlpGroupConfigData(config: DlpGroupConfig)

case class DlpSensor(name: String, comment: String, groups: Seq[String], rules: Seq[DlpRule])

case class DlpSensorData(sensor: DlpSensor)

case class DlpSensorsData(sensors: Seq[DlpSensor])

case class DlpSensorConfig(
  name: String,
  comment: Option[String],
  cfg_type: Option[String],
  change: Option[Seq[DlpRule]],
  delete: Option[Seq[DlpRule]],
  rules: Option[Seq[DlpRule]],
  predefine: Option[Boolean],
  prerules: Option[Array[PreRuleContext]]
)

case class DlpSensorConfigData(config: DlpSensorConfig)

case class DlpRuleConfig(name: String, patterns: Seq[Pattern])

case class DlpRuleConfigData(config: DlpRuleConfig)

case class ExportedDlpSensorList(
  names: Array[String],
  remote_export_options: Option[RemoteExportOptions] = None
)
