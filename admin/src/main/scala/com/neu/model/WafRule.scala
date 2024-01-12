package com.neu.model

case class WafRule(name: String, id: Option[Int], patterns: Seq[Pattern])

case class WafRuleDetail(sensors: Seq[String], rules: Seq[WafRule])

case class WafRuleData(rule: WafRuleDetail)

case class WafRulesData(rules: Seq[WafRule])

case class WafSetting(name: String, action: String)

case class WafGroup(name: String, status: Boolean, sensors: Seq[WafSetting])

case class WafGroupData(waf_group: WafGroup)

case class WafGroupsData(waf_groups: Seq[WafGroup])

case class WafGroupConfig(
  name: String,
  status: Option[Boolean],
  delete: Option[Seq[String]],
  sensors: Option[Seq[WafSetting]],
  replace: Option[Seq[WafSetting]]
)

case class WafGroupConfigData(config: WafGroupConfig)

case class WafSensor(name: String, comment: String, groups: Seq[String], rules: Seq[WafRule])

case class WafSensorData(sensor: WafSensor)

case class WafSensorsData(sensors: Seq[WafSensor])

case class WafSensorConfig(
  name: String,
  comment: Option[String],
  change: Option[Seq[WafRule]],
  delete: Option[Seq[WafRule]],
  rules: Option[Seq[WafRule]]
)

case class WafSensorConfigData(config: WafSensorConfig)

case class WafRuleConfig(name: String, patterns: Seq[Pattern])

case class WafRuleConfigData(config: WafRuleConfig)

case class ExportedWafSensorList(
  names: Array[String],
  remote_export_options: Option[RemoteExportOptions] = None
)
