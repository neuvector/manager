package com.neu.model

import com.neu.model.DashboardJsonProtocol._

/**
  * Created by bxu on 4/29/16.
  */
case class Rule(id: Option[Int], comment: Option[String], from: String, to: String, applications: Option[Array[String]],
                 ports: Option[String], action: String, learned: Boolean,
                 cfg_type: Option[String] = Some("user_created"), disable: Boolean, last_modified_timestamp: Option[Long] = None)

case class Rule2(id: Option[Int], comment: Option[String], from: Option[String], to: Option[String], applications: Option[Array[String]],
                ports: Option[String], action: Option[String], learned: Option[Boolean],
                cfg_type: Option[String] = Some("user_created"), disable: Option[Boolean], last_modified_timestamp: Option[Long] = None)

case class CLUSEventCondition(
  `type`: String,
  value: String
)
case class ResponseRule(
  id: Option[Int],
  event: Option[String],
  comment: Option[String],
  group: Option[String],
  conditions: Option[Array[CLUSEventCondition]],
  actions: Option[Array[String]],
  webhooks: Option[Array[String]],
  disable: Option[Boolean],
  cfg_type: Option[String] = Some("user_created")
)
case class ResponseRuleConfig(
  config: ResponseRule
)

case class ResponseRules(
  after: Option[Int],
  rules: Array[ResponseRule]
)

case class ResponseRulesWrap(
  insert: ResponseRules
)

case class ResponseRuleID(
  response_rule: Int
)

case class Unquarantine(
  unquarantine: ResponseRuleID
)

case class Request(
  request: Unquarantine
)

case class DeployFedRulesConfig(
  force: Boolean,
  ids: Array[Int]
)

/**
  * New rules to insert into policy
  * @param after the id of the rule before new rules, use 0 to insert in
  *              front, -1 to put on the end
  * @param rules the rules
  */
case class RuleInsert(after: Int = 0, rules: Array[Rule])

case class Policy(rules: Array[Rule])

case class Policy2(rules: Option[Array[Rule2]], delete: Option[Array[Int]])

case class PolicyRuleInsert(insert: RuleInsert)

case class ApplicationList(application: Option[String])

case class ApplicationListWrap(list: ApplicationList)

case class RuleConfig(id: Int, comment: Option[String], from: Option[String], to: Option[String],
                      applications: Option[Array[String]], ports: Option[String], action: Option[String],
                      disable: Option[Boolean])

case class RuleConfigData (config: RuleConfig, replicate: Option[Boolean])

case class ScanSummary (
  status: String,
  high: Int,
  medium: Int,
  hidden_high: Option[Int],
  hidden_medium: Option[Int],
  result: String,
  scanned_timestamp: Long,
  scanned_at: String,
  base_os: String,
  scanner_version: String,
	cvedb_create_time: String
)

case class IpAddress (
  ip: String,
	ip_prefix: Int,
	gateway: String
)

case class ProtoPort (
  ip_proto: Int,
	port: Long,
  host_ip: String,
	host_port: Long
)

case class ScannedWorkloadChildren2 (
  id: String,
  name: String,
  display_name: String,
  image: String,
  domain: String,
  state: String,
  service: String,
  platform_role: String,
  scan_summary: ScanSummary,
  quarantine_reason: Option[String] = Some(""),
  privileged: Boolean,
  run_as_root: Boolean,
  host_name: String,
	enforcer_id: String,
	network_mode: String,
	started_at: String,
	finished_at: String,
	interfaces: Option[Map[String, Array[IpAddress]]] = None,
	ports: Option[Array[ProtoPort]] = Some(Array()),
	labels: Option[Map[String, String]] = None,
	applications: Option[Array[String]] = Some(Array())
)

case class ScannedWorkloads2 (
  id: String,
  name: String,
  display_name: String,
  image: String,
  domain: String,
  state: String,
  service: String,
  platform_role: String,
  scan_summary: ScanSummary,
  quarantine_reason: Option[String] = Some(""),
  privileged: Boolean,
  run_as_root: Boolean,
  host_name: String,
	enforcer_id: String,
	network_mode: String,
	started_at: String,
	finished_at: String,
	interfaces: Option[Map[String, Array[IpAddress]]] = None,
	ports: Option[Array[ProtoPort]] = Some(Array()),
	labels: Option[Map[String, String]] = None,
	applications: Option[Array[String]] = Some(Array()),
  children: Array[ScannedWorkloadChildren2]
)

case class ScannedWorkloadChildren (
  id: String,
  name: String,
  base_os: String,
  display_name: String,
  domain: String,
  high: Int,
  medium: Int,
  host: String,
  image: String,
  platform_role: String,
  policy_mode: Option[String],
  result: String,
  service: String,
  service_group: String,
  state: String,
  status: String,
  scanner_version: String,
  scanned_timestamp: Long,
  scanned_at: String
)

case class ScannedWorkloads (
  id: String,
  name: String,
  base_os: String,
  display_name: String,
  domain: String,
  high: Int,
  medium: Int,
  host: String,
  image: String,
  platform_role: String,
  policy_mode: Option[String],
  result: String,
  service: String,
  service_group: String,
  state: String,
  status: String,
  scanner_version: String,
  children: Option[Array[ScannedWorkloadChildren]],
  scanned_timestamp: Long,
  scanned_at: String
)

case class ScannedWorkloadsWrap2 (
  workloads: Array[ScannedWorkloads2]
)

case class ScannedWorkloadsWrap (
  workloads: Array[ScannedWorkloads],
  status: WorkloadsStatus
)

case class ConvertedScannedWorkloads (
  id: String,
  name: String,
  base_os: String,
  display_name: String,
  domain: String,
  high: Int,
  medium: Int,
  hidden_high: Int,
  hidden_medium: Int,
  host: String,
  image: String,
  platform_role: String,
  policy_mode: Option[String],
  result: String,
  service: String,
  service_group: String,
  state: String,
  status: String,
  scanner_version: String,
  children: Option[Array[ScannedWorkloadChildren]],
  scanned_timestamp: Long,
  scanned_at: String
)

case class ConvertedScannedWorkloadsWrap (
  workloads: Array[ConvertedScannedWorkloads],
  status: WorkloadsStatus
)

case class RuleIds (
  ids: Array[Int]
)

case class PromoteConfig (
  request: RuleIds
)

case class WorkloadBriefV2 (
  id: String,
  name: String,
  display_name: String,
  host_name: String,
  host_id: String,
  image: String,
  image_id: String,
  domain: String,
  state: String,
  service: String,
  author: String,
  service_group: String
)

case class WorkloadSecurityV2 (
  cap_sniff: Boolean,
  cap_quarantine: Boolean,
  cap_change_mode: Boolean,
  service_mesh: Boolean,
  service_mesh_sidecar: Boolean,
  policy_mode: String,
  profile_mode: String,
  baseline_profile: String,
  quarantine_reason: Option[String] = Some(""),
  scan_summary: ScanSummary
)

case class WorkloadRtAttribesV2 (
  pod_name: String,
  share_ns_with: Option[String] = Some(""),
  privileged: Boolean,
  run_as_root: Boolean,
  labels: Option[Map[String, String]] = None,
  memory_limit: Long,
  cpus: String,
  service_account: String,
  network_mode: String,
  interfaces: Option[Map[String, Array[IpAddress]]] = None,
  ports: Option[Array[ProtoPort]] = Some(Array()),
  applications: Option[Array[String]] = Some(Array())
)

case class WorkloadV2Child (
  brief: WorkloadBriefV2,
  security: WorkloadSecurityV2,
  rt_attributes: WorkloadRtAttribesV2,
  enforcer_id: String,
  enforcer_name: String,
  platform_role: String,
  created_at: String,
  started_at: String,
  finished_at: String,
  secured_at: String,
  running: Boolean,
  exit_code: Int
)

case class WorkloadV2 (
  brief: WorkloadBriefV2,
  security: WorkloadSecurityV2,
  rt_attributes: WorkloadRtAttribesV2,
  children: Array[WorkloadV2Child],
  enforcer_id: String,
  enforcer_name: String,
  platform_role: String,
  created_at: String,
  started_at: String,
  finished_at: String,
  secured_at: String,
  running: Boolean,
  exit_code: Int
)

case class WorkloadsWrapV2 (
  workloads: Array[WorkloadV2]
)
