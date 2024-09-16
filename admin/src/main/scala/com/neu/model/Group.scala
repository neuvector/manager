package com.neu.model

/**
 * Created by bxu on 4/21/16.
 */
case class Group(
  name: String,
  comment: String,
  domain: String,
  learned: Boolean = false,
  reserved: Boolean = false,
  criteria: Array[CriteriaEntry],
  members: Array[WorkloadBrief] = Array.empty[WorkloadBrief],
  policy_rules: Array[Int] = Array.emptyIntArray,
  response_rules: Option[Array[Int]] = Some(Array.emptyIntArray),
  policy_mode: Option[String],
  baseline_profile: Option[String],
  platform_role: String = "",
  cap_change_mode: Option[Boolean],
  cap_scorable: Option[Boolean],
  kind: String,
  cfg_type: Option[String] = Some("learned"),
  not_scored: Boolean,
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class Rule4Group(
  id: Option[Int],
  comment: Option[String],
  from: String,
  to: String,
  applications: Option[Array[String]],
  ports: Option[String],
  action: String,
  learned: Boolean,
  cfg_type: Option[String] = Some("user_created"),
  disable: Boolean,
  last_modified_timestamp: Option[Long] = None
)

case class CLUSEventCondition4Group(
  `type`: String,
  value: String
)
case class ResponseRule4Group(
  id: Option[Int],
  event: Option[String],
  comment: Option[String],
  group: Option[String],
  conditions: Option[Array[CLUSEventCondition4Group]],
  actions: Option[Array[String]],
  disable: Option[Boolean],
  cfg_type: Option[String] = Some("user_created")
)

case class Group4Single(
  name: String,
  comment: String,
  domain: String,
  learned: Boolean = false,
  reserved: Boolean = false,
  criteria: Array[CriteriaEntry],
  members: Array[WorkloadBrief] = Array.empty[WorkloadBrief],
  policy_rules: Array[Rule4Group],
  response_rules: Array[ResponseRule4Group],
  policy_mode: Option[String],
  baseline_profile: Option[String],
  platform_role: String = "",
  cap_change_mode: Option[Boolean],
  cap_scorable: Option[Boolean],
  kind: String,
  cfg_type: Option[String] = Some("learned"),
  not_scored: Boolean,
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class WorkloadBrief(
  id: String,
  name: String,
  display_name: String,
  platform_role: String = "",
  state: String,
  service: String,
  service_group: String,
  share_ns_with: Option[String],
  policy_mode: Option[String],
  domain: String,
  cap_quarantine: Boolean,
  scan_summary: Option[ScanBrief],
  service_mesh: Option[Boolean] = None,
  service_mesh_sidecar: Option[Boolean] = None,
  children: Option[Array[WorkloadBrief]]
)

/**
 * Criteria to define group
 * @param key
 *   the key, include {{{image, host, workload, neuvector.application}}}
 * @param value
 *   value
 * @param op
 *   operations include: "=", "contains" and "prefix"
 */
case class CriteriaEntry(key: String, value: String, op: String)

case class GroupConfig(
  name: String,
  comment: String,
  criteria: Array[CriteriaEntry],
  cfg_type: Option[String] = Some("user_created"),
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class GroupConfig4Learned(
  name: String,
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class GroupConfigWrap(config: GroupConfig)
case class GroupConfigWrap4Learned(config: GroupConfig4Learned)

case class GroupWrap(group: Group)
case class Group4SingleWrap(group: Group4Single)

case class Groups(groups: Array[Group])

case class Groups4Export(
  groups: Array[String],
  policy_mode: Option[String],
  remote_export_options: Option[RemoteExportOptions] = None
)

case class CriteriaItem(name: String)

case class ServiceAddress(ip: String, port: Int)

case class GroupDTO(
  name: String,
  comment: String,
  domain: String,
  learned: Boolean,
  reserved: Boolean,
  criteria: Array[CriteriaItem],
  members: Array[WorkloadBrief],
  policy_rules: Array[Int],
  response_rules: Array[Int],
  policy_mode: Option[String],
  baseline_profile: Option[String],
  platform_role: String,
  cap_change_mode: Option[Boolean],
  cap_scorable: Option[Boolean],
  kind: String,
  cfg_type: Option[String],
  not_scored: Boolean,
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class Group4SingleDTO(
  name: String,
  comment: String,
  domain: String,
  learned: Boolean,
  reserved: Boolean,
  criteria: Array[CriteriaItem],
  members: Array[WorkloadBrief],
  policy_rules: Array[Rule4Group],
  response_rules: Array[ResponseRule4Group],
  policy_mode: Option[String],
  baseline_profile: Option[String],
  platform_role: String,
  cap_change_mode: Option[Boolean],
  cap_scorable: Option[Boolean],
  kind: String,
  cfg_type: Option[String],
  not_scored: Boolean,
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class GroupConfigDTO(
  name: String,
  comment: String,
  criteria: Array[CriteriaItem],
  cfg_type: Option[String] = Some("user_created"),
  monitor_metric: Boolean,
  group_sess_cur: Long,
  group_sess_rate: Long,
  group_band_width: Long
)

case class GroupDTOs(groups: Array[GroupDTO])
case class GroupDTOWrap(group: GroupDTO)
case class Group4SingleDTOWrap(group: Group4SingleDTO)
