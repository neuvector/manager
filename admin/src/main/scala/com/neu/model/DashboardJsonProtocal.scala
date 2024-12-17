package com.neu.model

import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import spray.json.*

/**
 * Created by xzhang on 4/11/18.
 */
case class Error(
  message: String
)

case class ViolationEndpoint(
  level: String,
  reported_timestamp: Long,
  reported_at: DateTime,
  cluster_name: String,
  client_id: String,
  client_name: String,
  client_domain: Option[String],
  client_image: Option[String],
  server_id: String,
  server_name: String,
  server_domain: Option[String],
  server_image: Option[String],
  server_port: Int,
  ip_proto: Int,
  applications: Option[Array[String]],
  servers: Option[Array[String]],
  sessions: Int,
  policy_action: String,
  policy_id: Int,
  client_ip: String,
  server_ip: String
)

case class ViolationEndpointData(
  violations: Array[ViolationEndpoint],
  error: Option[Error]
)

case class ThreatEndpoint(
  id: String,
  // threat_id: Int,
  name: String,
  // level: String,
  reported_timestamp: Long,
  reported_at: DateTime,
  // cluster_name: String,
  // host_id: String,
  // host_name: String,
  // enforcer_id: String,
  count: Int,
  client_workload_id: String,
  client_workload_name: String,
  client_workload_domain: Option[String],
  // client_workload_image: String,
  server_workload_id: String,
  server_workload_name: String,
  server_workload_domain: Option[String],
  // server_workload_image: String,
  severity: String,
  action: String,
  // count: Int,
  // ether_type: Int,
  client_port: Int,
  server_port: Int,
  server_conn_port: Int,
  // icmp_code: Int,
  // icmp_type: Int,
  // ip_proto: Int,
  client_ip: String,
  server_ip: String,
  application: String,
  target: String,
  // monitor: Boolean,
  cap_len: Option[Int],
  message: String
)

case class ThreatEndpointData(
  threats: Array[ThreatEndpoint],
  error: Option[Error]
)

case class IncidentEndpoint(
  name: String,
  reported_at: String
)

case class IncidentEndpointData(
  incidents: Array[IncidentEndpoint],
  error: Option[Error]
)

case class TopViolation(
  client: Array[Array[ViolationEndpoint]],
  server: Array[Array[ViolationEndpoint]]
)

case class Domain(
  source: Option[String],
  destination: Option[String]
)

case class ConvertedThreat(
  id: String,
  name: String,
  reported_timestamp: Long,
  reported_at: DateTime,
  count: Int,
  source_workload_id: String,
  source_workload_name: String,
  destination_workload_id: String,
  destination_workload_name: String,
  domain: Domain,
  severity: String,
  action: String,
  source_port: Int,
  destination_port: Int,
  source_conn_port: Option[Int],
  destination_conn_port: Option[Int],
  source_ip: String,
  destination_ip: String,
  application: String,
  target: String,
  cap_len: Option[Int],
  message: String
)

case class TopThreat(
  source: Array[Array[ConvertedThreat]],
  destination: Array[Array[ConvertedThreat]]
)

case class CriticalSecurityEventDTO(
  top_violations: Either[Error, TopViolation],
  top_threats: Either[Error, TopThreat],
  summary: Either[Error, Map[String, Seq[(String, Int)]]],
  alertedContainers: Either[Error, List[String]]
)

case class WorkloadsChildren(
  id: String,
  name: String,
  display_name: String,
  // image: String,
  domain: String,
  high: Int,
  medium: Int,
  state: String,
  privileged: Boolean
  // base_os: String,
  // host: String,
  // status: String,
  // scanned_timestamp: Long,
  // scanned_at: String
)

case class Workloads(
  id: String,
  name: String,
  display_name: String,
  // base_os: String,
  // host: String,
  // image: String,
  domain: String,
  high: Int,
  medium: Int,
  state: String,
  service: String,
  platform_role: String,
  // status: String,
  // scanned_timestamp: Long,
  // scanned_at: String,
  children: Option[Array[WorkloadsChildren]]
)

case class WorkloadsStatus(
  scanned: Int,
  scheduled: Int,
  scanning: Int,
  failed: Int,
  cvedb_version: String,
  cvedb_create_time: String
)

case class VulnerableContainerEndpoint(
  workloads: Array[Workloads],
  status: WorkloadsStatus,
  error: Option[Error]
)

case class ScanSummary4Dashboard(
  status: String,
  high: Int,
  medium: Int
)

case class Nodes(
  id: String,
  name: String,
  os: String,
  scan_summary: Option[ScanSummary4Dashboard]
)

case class Platform(
  platform: String,
  high: Int,
  medium: Int,
  scanned_timestamp: Long,
  scanned_at: String
)

case class VulnerableNodeEndpoint(
  hosts: Array[Nodes],
  error: Option[Error]
)

case class VulnerablePlatforms(
  platforms: Array[Platform],
  error: Option[Error]
)

case class VulnerableContainers(
  top5Containers: Array[Workload],
  vulnerabilitiesTotal: Int,
  total: Int
)

case class VulnerableNodes(
  top5Nodes: Array[Nodes],
  vulnerabilitiesTotal: Int
)

case class VulnerabilitiesDTO(
  containers: Either[Error, VulnerableContainers],
  nodes: Either[Error, VulnerableNodes]
)

case class Incidents(
  name: String,
  proc_cmd: Option[String],
  proc_effective_user: Option[String],
  workload_name: Option[String],
  remote_workload_name: Option[String],
  host_name: Option[String],
  client_ip: Option[String],
  server_ip: Option[String],
  reported_at: DateTime,
  reported_timestamp: Long
)

case class IncidentsEndpoint(
  incidents: Array[Incidents],
  error: Option[Error]
)

case class TopIncidentsDTO(
  top5Containers: Array[Array[Incidents]],
  top5Nodes: Array[Array[Incidents]],
  hostTotal: Int,
  containerTotal: Int
)

/*=========================================
  For new notifications API
=========================================*/

case class ThreatMajor(
  name: String,
  reported_timestamp: Long,
  reported_at: DateTime,
  level: String,
  client_workload_id: String,
  client_workload_name: String,
  client_workload_domain: String,
  server_workload_id: String,
  server_workload_name: String,
  server_workload_domain: String,
  client_port: Int,
  server_port: Int,
  server_conn_port: Int,
  client_ip: String,
  server_ip: String,
  target: String,
  application: String
)

case class ThreatDetails(
  id: String,
  host_name: String,
  cluster_name: String,
  count: Int,
  severity: String,
  action: String,
  cap_len: Option[Int],
  message: String
)

case class ThreatMajorData(threats: Array[ThreatMajor])
case class ThreatDetailsData(threats: Array[ThreatDetails])

case class ViolationMajor(
  policy_id: Int,
  reported_timestamp: Long,
  reported_at: DateTime,
  level: String,
  client_id: String,
  client_name: String,
  client_domain: String,
  server_id: String,
  server_name: String,
  server_domain: String,
  client_ip: String,
  server_ip: String,
  server_port: Int,
  applications: Array[String]
)

case class ViolationDetails(
  cluster_name: String,
  client_image: String,
  server_image: String,
  server_port: Int,
  ip_proto: Int,
  servers: Option[Array[String]],
  sessions: Int,
  policy_action: String
)

case class ViolationMajorData(violations: Array[ViolationMajor])
case class ViolationDetailsData(violations: Array[ViolationDetails])

case class IncidentMajor(
  name: String,
  level: String,
  host_name: Option[String],
  workload_id: Option[String],
  workload_name: Option[String],
  workload_domain: Option[String],
  remote_workload_id: Option[String],
  remote_workload_name: Option[String],
  remote_workload_domain: Option[String],
  client_ip: Option[String],
  server_ip: Option[String],
  client_port: Option[Int],
  server_port: Option[Int],
  server_conn_port: Option[Int],
  conn_ingress: Option[Boolean],
  proc_path: Option[String],
  reported_timestamp: Long,
  reported_at: DateTime
)

case class IncidentDetails(
  host_name: String,
  cluster_name: String,
  ether_type: Int,
  ip_proto: Int,
  proc_name: Option[String],
  proc_path: Option[String],
  proc_cmd: Option[String],
  proc_real_uid: Option[Int],
  proc_effective_uid: Option[Int],
  proc_real_user: Option[String],
  proc_effective_user: Option[String],
  file_path: Option[String],
  file_name: Option[Array[String]],
  message: String
)

case class IncidentMajorData(incidents: Array[IncidentMajor])
case class IncidentDetailsData(incidents: Array[IncidentDetails])

case class Endpoint(
  domain_name: Option[String],
  workload_id: Option[String],
  workload_name: Option[String],
  ip: Option[String],
  port: Option[Int],
  server_conn_port: Option[Int]
)

case class SecurityEvent(
  name: String,
  security_event_type: String,
  level: String,
  source: Endpoint,
  destination: Endpoint,
  host_name: Option[String],
  applications: Array[String],
  details: String,
  reported_timestamp: Long,
  reported_at: DateTime
)

case class SecurityEventDTO(
  securityEvents: Array[SecurityEvent]
)

case class Pod(
  id: String,
  name: String,
  display_name: String,
  domain: String,
  policy_mode: Option[String],
  image: String,
  state: String
)

case class ServiceStateIn(
  domain: String,
  name: String,
  policy_mode: Option[String],
  platform_role: String,
  members: Array[Pod],
  not_scored: Boolean,
  kind: String
)

case class ServiceStatesIn(
  groups: Array[ServiceStateIn],
  error: Option[Error]
)

case class ApplicationsInPolicy(
  id: Long,
  from: String,
  to: String,
  applications: Array[String]
)

case class ApplicationsInPolicyWrap(
  rules: Array[ApplicationsInPolicy],
  error: Option[Error]
)

case class PolicyCoverage(
  learnt: Array[ServiceStateIn],
  others: Array[ServiceStateIn]
)

case class ExposedConversations(
  ingress: Array[ServiceLevelConversationWrap],
  egress: Array[ServiceLevelConversationWrap]
)

case class ServiceLevelConversation(
  workload_id: String,
  peerEndpoint: String,
  service: String,
  policy_mode: String,
  workload: String,
  bytes: Long,
  sessions: Int,
  severity: Option[String],
  policy_action: String,
  event_type: Option[Seq[String]],
  protocols: Option[Array[String]],
  applications: Option[Array[String]],
  ports: Option[Array[String]]
)

case class ServiceLevelConversationWrap(
  workload_id: String,
  peerEndpoint: String,
  service: String,
  policy_mode: String,
  workload: String,
  bytes: Long,
  sessions: Int,
  severity: Option[String],
  policy_action: String,
  event_type: Option[String],
  protocols: Option[Array[String]],
  applications: Option[Array[String]],
  ports: Option[Array[String]],
  children: Array[ServiceLevelConversation]
)

case class WorkloadBrief2(
  display_name: String,
  service: String
)

case class ApplicationAnalysis(
  count: Int,
  totalBytes: BigInt
)

case class AutoScan(
  auto_scan: Boolean
)

case class AutoScanConfig(
  config: AutoScan,
  error: Option[Error]
)

case class AdmissionRule(
  id: Int,
  critical: Boolean,
  disable: Boolean
)

case class AdmissionRulesWrap(
  rules: Array[AdmissionRule],
  error: Option[Error]
)

case class VulnerabilityCount(
  highVul: Int,
  mediumVul: Int
)

case class VulnerabilityExploitRisk(
  discover: Either[Error, VulnerabilityCount],
  monitor: Either[Error, VulnerabilityCount],
  protect: Either[Error, VulnerabilityCount],
  quarantined: Either[Error, VulnerabilityCount],
  host: Either[Error, VulnerabilityCount],
  platform: Either[Error, VulnerabilityCount],
  totalScannedHost: Either[Error, Int],
  totalScannedPods: Either[Error, Int],
  totalScannedPodsWithoutSystem: Either[Error, Int]
)

case class ServiceConnectionRisk(
  discover: Int,
  monitor: Int,
  protect: Int
)

case class IngressEgressRisk(
  discoverMode: Int,
  monitorMode: Int,
  protectMode: Int,
  threat: Int,
  violation: Int
)

case class ScoreInput(
  vulnerabilityExploitRisk: VulnerabilityExploitRisk,
  serviceConnectionRisk: Either[Error, ServiceConnectionRisk],
  ingressEgressRisk: Either[Error, IngressEgressRisk],
  hasPrivilegedContainer: Either[Error, Boolean],
  hasRunAsRoot: Either[Error, Boolean],
  hasAdmissionRules: Either[Error, Boolean],
  isNewServiceDiscover: Either[Error, Boolean],
  totalRunningPods: Either[Error, Int],
  domains: Either[Error, Array[String]]
)

case class ScoreOutput(
  newServiceModeScore: Either[Error, Int],
  serviceModeScore: Either[Error, Int],
  serviceModeScoreBy100: Either[Error, Int],
  exposureScore: Either[Error, Int],
  exposureScoreBy100: Either[Error, Int],
  privilegedContainerScore: Either[Error, Int],
  runAsRoot: Either[Error, Int],
  admissionRuleScore: Either[Error, Int],
  vulnerabilityScore: Either[Error, Int],
  vulnerabilityScoreBy100: Either[Error, Int],
  securityRiskScore: Either[Error, Int]
)

case class WorkloadChildren(
  id: String,
  privileged: Boolean,
  run_as_root: Boolean,
  state: String,
  scan_summary: Option[ScanSummary4Dashboard]
)

case class Workload(
  id: String,
  display_name: String,
  state: String,
  service: String,
  platform_role: String,
  domain: String,
  high4Dashboard: Option[Int],
  medium4Dashboard: Option[Int],
  scan_summary: Option[ScanSummary4Dashboard],
  children: Option[Array[WorkloadChildren]]
)

case class WorkloadsWrap(
  workloads: Array[Workload],
  error: Option[Error]
)

case class AdmissionState(
  enable: Boolean
)

case class AdmissionStateWrap(
  state: AdmissionState,
  error: Option[Error]
)

case class WorkloadsOutput(
  containerMap: Map[String, WorkloadBrief2],
  hasPrivilegedContainer: Boolean,
  hasRunAsRoot: Boolean
)

case class ServiceMaps(
  serviceUnderRulesMap: Map[String, ServiceStateIn],
  otherServiceMap: Map[String, ServiceStateIn],
  ipServiceMap: Map[String, ServiceStateIn],
  serviceMap: Map[String, ServiceStateIn],
  serviceModeMap: Map[String, Int],
  groups: Array[ServiceStateIn]
)

case class ConversationOutput(
  exposureModeMap: Map[String, Int],
  exposureThreat: Int,
  exposureViolation: Int,
  ingressConversations: Array[ServiceLevelConversationWrap],
  egressConversations: Array[ServiceLevelConversationWrap],
  applicationsInPolicy2: List[(String, ApplicationAnalysis)]
)

case class VulContainerOutput(
  highVulsMap: Map[String, Int],
  medVulsMap: Map[String, Int],
  totalScannedPods: Int,
  totalScannedPodsWithoutSystem: Int
)

case class VulNodeOutput(
  nodeHighVuls: Int,
  nodeMedVuls: Int,
  totalHost: Int
)

case class VulPlatformOutput(
  platformHighVuls: Int,
  platformMedVuls: Int
)

case class PolicyOutput(
  groupSet: Set[String],
  applicationsInPolicy: List[(String, Int)]
)
/*=========================================
    For new dashbaord API
  =========================================*/
case class DashboardNotificationDTO(
  criticalSecurityEvents: CriticalSecurityEventDTO,
  topIncidents: Either[Error, TopIncidentsDTO]
)

case class DashboardScoreDTO(
  highPriorityVulnerabilities: Either[Error, VulnerabilitiesDTO],
  containers: Either[Error, Array[Workload]],
  services: Either[Error, Array[ServiceStateIn]],
  applications: Either[Error, List[(String, Int)]],
  applications2: Either[Error, List[(String, ApplicationAnalysis)]],
  policyCoverage: Either[Error, PolicyCoverage],
  exposedConversations: Either[Error, ExposedConversations],
  autoScanConfig: Either[Error, Boolean],
  scoreInput: ScoreInput,
  scoreOutput: ScoreOutput
)

case class DashboardDTO(
  highPriorityVulnerabilities: VulnerabilitiesDTO,
  criticalSecurityEvents: CriticalSecurityEventDTO,
  topIncidents: Either[Error, TopIncidentsDTO],
  containers: Either[Error, Array[Workload]],
  services: Either[Error, Array[ServiceStateIn]],
  applications: Either[Error, List[(String, Int)]],
  applications2: Either[Error, List[(String, ApplicationAnalysis)]],
  policyCoverage: Either[Error, PolicyCoverage],
  exposedConversations: Either[Error, ExposedConversations],
  autoScanConfig: Either[Error, Boolean],
  scoreInput: ScoreInput,
  scoreOutput: ScoreOutput
)

case class RiskScoreMetricsWL(
  running_pods: Int,
  privileged_wls: Int,
  root_wls: Int,
  discover_ext_eps: Int,
  monitor_ext_eps: Int,
  protect_ext_eps: Int,
  threat_ext_eps: Int,
  violate_ext_eps: Int
)

case class RiskScoreMetricsGroup(
  groups: Int,
  discover_groups: Int,
  monitor_groups: Int,
  protect_groups: Int,
  profile_discover_groups: Int,
  profile_monitor_groups: Int,
  profile_protect_groups: Int,
  discover_groups_zero_drift: Int,
  monitor_groups_zero_drift: Int,
  protect_groups_zero_drift: Int
)

case class RiskScoreMetricsCVE(
  discover_cves: Int,
  monitor_cves: Int,
  protect_cves: Int,
  platform_cves: Int,
  host_cves: Int
)

case class MetricsWrap(
  metrics: Metrics
)

case class Metrics(
  platform: String,
  kube_version: String,
  openshift_version: String,
  new_service_policy_mode: String,
  new_service_profile_mode: String,
  deny_adm_ctrl_rules: Int,
  hosts: Int,
  workloads: RiskScoreMetricsWL,
  groups: RiskScoreMetricsGroup,
  cves: RiskScoreMetricsCVE
)

case class ConversationReportEntry(
  bytes: Long,
  sessions: Int,
  port: Option[String],
  application: Option[String],
  policy_action: String,
  client_ip: Option[String],
  server_ip: Option[String],
  fqdn: Option[String]
)

case class Exposure(
  id: String,
  name: String,
  display_name: String,
  pod_name: String,
  service: String,
  severity: String,
  high: Int,
  medium: Int,
  policy_mode: String,
  policy_action: String,
  protocols: Option[Array[String]],
  applications: Option[Array[String]],
  ports: Option[Array[String]],
  entries: Option[Array[ConversationReportEntry]]
)

case class InternalSystemData(
  metrics: Metrics,
  ingress: Array[Exposure],
  egress: Array[Exposure],
  hasError: Option[Boolean]
)
//Deprecated
case class Score(
  newServiceModeScore: Int,
  serviceModeScore: Int,
  serviceModeScoreBy100: Int,
  exposureScore: Int,
  exposureScoreBy100: Int,
  privilegedContainerScore: Int,
  runAsRoot: Int,
  admissionRuleScore: Int,
  vulnerabilityScore: Int,
  vulnerabilityScoreBy100: Int,
  securityRiskScore: Int,
  hasError: Boolean
)

case class SecurityScores(
  admission_rule_score: Int,
  exposure_score: Int,
  exposure_score_by_100: Int,
  new_service_mode_score: Int,
  privileged_container_score: Int,
  run_as_root_score: Int,
  security_risk_score: Int,
  service_mode_score: Int,
  service_mode_score_by_100: Int,
  vulnerability_score: Int,
  vulnerability_score_by_100: Int
)

case class SystemScore(
  security_scores: SecurityScores,
  metrics: Metrics,
  ingress: Array[Exposure],
  egress: Array[Exposure]
)

//Deprecated
case class ScoreOutput2(
  score: Score,
  header_data: Metrics,
  ingress: Array[Exposure],
  egress: Array[Exposure]
)

case class MultiClusterSummary(
  score: SecurityScores,
  summaryJson: String
)

case class DashboardScoreDTO2(
  highPriorityVulnerabilities: Either[Error, VulnerabilitiesDTO],
  containers: Either[Error, Array[Workload]],
  services: Either[Error, Array[ServiceStateIn]],
  applications: Either[Error, List[(String, Int)]],
  applications2: Either[Error, List[(String, ApplicationAnalysis)]],
  policyCoverage: Either[Error, PolicyCoverage],
  // exposedConversations: Either[Error, ExposedConversations],
  autoScanConfig: Either[Error, Boolean]
)

object DashboardJsonProtocol extends DefaultJsonProtocol with LazyLogging {
  given dateTimeFormat: DateTimeFormat.type = DateTimeFormat

  implicit object StringJsonArrayFormat extends RootJsonFormat[List[String]] {
    def write(obj: List[String]): JsValue = JsArray(obj.map(JsString(_)).toVector)
    def read(json: JsValue): List[String] = json match {
      case JsArray(elements) =>
        elements.map {
          case JsString(s) => s
          case other       => deserializationError(s"Expected JsString, but got $other")
        }.toList
      case other             => deserializationError(s"Expected JsArray, but got $other")
    }
  }

  given errorFormat: RootJsonFormat[Error]                                 = jsonFormat1(Error.apply)
  given violationEndpointFormat: RootJsonFormat[ViolationEndpoint]         = jsonFormat21(
    ViolationEndpoint.apply
  )
  given violationEndpointDataFormat: RootJsonFormat[ViolationEndpointData] =
    jsonFormat2(ViolationEndpointData.apply)

  given threatEndpointFormat: RootJsonFormat[ThreatEndpoint]         = jsonFormat22(ThreatEndpoint.apply)
  given threatEndpointDataFormat: RootJsonFormat[ThreatEndpointData] =
    jsonFormat2(ThreatEndpointData.apply)

  given incidentEndpointFormat: RootJsonFormat[IncidentEndpoint]         = jsonFormat2(
    IncidentEndpoint.apply
  )
  given incidentEndpointDataFormat: RootJsonFormat[IncidentEndpointData] =
    jsonFormat2(IncidentEndpointData.apply)

  given domain: RootJsonFormat[Domain]                   = jsonFormat2(Domain.apply)
  given convertedThreat: RootJsonFormat[ConvertedThreat] = jsonFormat22(ConvertedThreat.apply)
  given topThreat: RootJsonFormat[TopThreat]             = jsonFormat2(TopThreat.apply)
  given topViolation: RootJsonFormat[TopViolation]       = jsonFormat2(TopViolation.apply)

  given criticalSecurityEventDTOFormat: RootJsonFormat[CriticalSecurityEventDTO] =
    jsonFormat4(CriticalSecurityEventDTO.apply)

  given workloadsStatusFormat: RootJsonFormat[WorkloadsStatus]                         = jsonFormat6(WorkloadsStatus.apply)
  given workloadsChildrenFormat: RootJsonFormat[WorkloadsChildren]                     = jsonFormat8(
    WorkloadsChildren.apply
  )
  given workloadsFormat: RootJsonFormat[Workloads]                                     = jsonFormat10(Workloads.apply)
  given vulnerableContainerEndpointFormat: RootJsonFormat[VulnerableContainerEndpoint] =
    jsonFormat3(VulnerableContainerEndpoint.apply)
  given nodeScanSummaryFormat: RootJsonFormat[ScanSummary4Dashboard]                   = jsonFormat3(
    ScanSummary4Dashboard.apply
  )
  given NodesFormat: RootJsonFormat[Nodes]                                             = jsonFormat4(Nodes.apply)
  given platformFormat: RootJsonFormat[Platform]                                       = jsonFormat5(Platform.apply)
  given vulnerablePlatformsFormat: RootJsonFormat[VulnerablePlatforms]                 = jsonFormat2(
    VulnerablePlatforms.apply
  )
  given vulnerableNodesFormat: RootJsonFormat[VulnerableNodes]                         = jsonFormat2(VulnerableNodes.apply)
  given vulnerableNodeEndpointFormat: RootJsonFormat[VulnerableNodeEndpoint]           = jsonFormat2(
    VulnerableNodeEndpoint.apply
  )

  given IncidentsFormat: RootJsonFormat[Incidents]                 = jsonFormat10(Incidents.apply)
  given IncidentsEndpointFormat: RootJsonFormat[IncidentsEndpoint] = jsonFormat2(
    IncidentsEndpoint.apply
  )
  given TopIncidentsDTOFormat: RootJsonFormat[TopIncidentsDTO]     = jsonFormat4(TopIncidentsDTO.apply)

  /*=========================================
      For new notifications API
    =========================================*/

  given threatMajorFormat: RootJsonFormat[ThreatMajor]             = jsonFormat17(ThreatMajor.apply)
  given threatDetailsFormat: RootJsonFormat[ThreatDetails]         = jsonFormat8(ThreatDetails.apply)
  given threatMajorDataFormat: RootJsonFormat[ThreatMajorData]     = jsonFormat1(ThreatMajorData.apply)
  given threatDetailsDataFormat: RootJsonFormat[ThreatDetailsData] = jsonFormat1(
    ThreatDetailsData.apply
  )

  given violationMajorFormat: RootJsonFormat[ViolationMajor]             = jsonFormat14(ViolationMajor.apply)
  given violationDetailsFormat: RootJsonFormat[ViolationDetails]         = jsonFormat8(
    ViolationDetails.apply
  )
  given violationMajorDataFormat: RootJsonFormat[ViolationMajorData]     = jsonFormat1(
    ViolationMajorData.apply
  )
  given violationDetailsDataFormat: RootJsonFormat[ViolationDetailsData] = jsonFormat1(
    ViolationDetailsData.apply
  )

  given incidentMajorFormat: RootJsonFormat[IncidentMajor]             = jsonFormat18(IncidentMajor.apply)
  given incidentDetailsFormat: RootJsonFormat[IncidentDetails]         = jsonFormat14(
    IncidentDetails.apply
  )
  given incidentMajorDataFormat: RootJsonFormat[IncidentMajorData]     = jsonFormat1(
    IncidentMajorData.apply
  )
  given incidentDetailsDataFormat: RootJsonFormat[IncidentDetailsData] = jsonFormat1(
    IncidentDetailsData.apply
  )

  given endpointFormat: RootJsonFormat[Endpoint]                 = jsonFormat6(Endpoint.apply)
  given securityEventFormat: RootJsonFormat[SecurityEvent]       = jsonFormat10(SecurityEvent.apply)
  given securityEventDTOFormat: RootJsonFormat[SecurityEventDTO] = jsonFormat1(
    SecurityEventDTO.apply
  )

  /*=========================================
      For new dashbaord API
    =========================================*/

  given podFormat: RootJsonFormat[Pod]                                                   = jsonFormat7(Pod.apply)
  given serviceStateInFormat: RootJsonFormat[ServiceStateIn]                             = jsonFormat7(ServiceStateIn.apply)
  given serviceStatesInFormat: RootJsonFormat[ServiceStatesIn]                           = jsonFormat2(ServiceStatesIn.apply)
  given applicationsInPolicyFormat: RootJsonFormat[ApplicationsInPolicy]                 = jsonFormat4(
    ApplicationsInPolicy.apply
  )
  given applicationsInPolicyWrapFormat: RootJsonFormat[ApplicationsInPolicyWrap]         =
    jsonFormat2(ApplicationsInPolicyWrap.apply)
  given policyCoverageFormat: RootJsonFormat[PolicyCoverage]                             = jsonFormat2(PolicyCoverage.apply)
  given workloadBrief2Format: RootJsonFormat[WorkloadBrief2]                             = jsonFormat2(WorkloadBrief2.apply)
  given serviceLevelConversationFormat: RootJsonFormat[ServiceLevelConversation]         =
    jsonFormat13(ServiceLevelConversation.apply)
  given serviceLevelConversationWrapFormat: RootJsonFormat[ServiceLevelConversationWrap] =
    jsonFormat14(ServiceLevelConversationWrap.apply)
  given exposedConversationsFormat: RootJsonFormat[ExposedConversations]                 = jsonFormat2(
    ExposedConversations.apply
  )
  given applicationAnalysisFormat: RootJsonFormat[ApplicationAnalysis]                   = jsonFormat2(
    ApplicationAnalysis.apply
  )
  given autoScanFormat: RootJsonFormat[AutoScan]                                         = jsonFormat1(AutoScan.apply)
  given autoScanConfigFormat: RootJsonFormat[AutoScanConfig]                             = jsonFormat2(AutoScanConfig.apply)
  given admissionRuleFormat: RootJsonFormat[AdmissionRule]                               = jsonFormat3(AdmissionRule.apply)
  given admissionRulesWrapFormat: RootJsonFormat[AdmissionRulesWrap]                     = jsonFormat2(
    AdmissionRulesWrap.apply
  )
  given admissionStateFormat: RootJsonFormat[AdmissionState]                             = jsonFormat1(AdmissionState.apply)
  given admissionStateWrapFormat: RootJsonFormat[AdmissionStateWrap]                     = jsonFormat2(
    AdmissionStateWrap.apply
  )
  given workloadsOutputFormat: RootJsonFormat[WorkloadsOutput]                           = jsonFormat3(WorkloadsOutput.apply)
  given serviceMapsFormat: RootJsonFormat[ServiceMaps]                                   = jsonFormat6(ServiceMaps.apply)
  given conversationOutputFormat: RootJsonFormat[ConversationOutput]                     = jsonFormat6(
    ConversationOutput.apply
  )
  given vulContainerOutputFormat: RootJsonFormat[VulContainerOutput]                     = jsonFormat4(
    VulContainerOutput.apply
  )
  given vulNodeOutputFormat: RootJsonFormat[VulNodeOutput]                               = jsonFormat3(VulNodeOutput.apply)
  given vulPlatformOutputFormat: RootJsonFormat[VulPlatformOutput]                       = jsonFormat2(
    VulPlatformOutput.apply
  )
  given policyOutputFormat: RootJsonFormat[PolicyOutput]                                 = jsonFormat2(PolicyOutput.apply)

  // Scoring
  // =========================================
  given vulnerabilityCountFormat: RootJsonFormat[VulnerabilityCount]             = jsonFormat2(
    VulnerabilityCount.apply
  )
  given vulnerabilityExploitRiskFormat: RootJsonFormat[VulnerabilityExploitRisk] =
    jsonFormat9(VulnerabilityExploitRisk.apply)
  given serviceConnectionRiskFormat: RootJsonFormat[ServiceConnectionRisk]       = jsonFormat3(
    ServiceConnectionRisk.apply
  )
  given ingressEgressRiskFormat: RootJsonFormat[IngressEgressRisk]               = jsonFormat5(
    IngressEgressRisk.apply
  )
  given workloadChildrenFormat: RootJsonFormat[WorkloadChildren]                 = jsonFormat5(
    WorkloadChildren.apply
  )
  given workloadFormat: RootJsonFormat[Workload]                                 = jsonFormat10(Workload.apply)
  given vulnerableContainersFormat: RootJsonFormat[VulnerableContainers]         = jsonFormat3(
    VulnerableContainers.apply
  )
  given vulnerabilitiesDTOFormat: RootJsonFormat[VulnerabilitiesDTO]             = jsonFormat2(
    VulnerabilitiesDTO.apply
  )
  given workloadsWrapFormat: RootJsonFormat[WorkloadsWrap]                       = jsonFormat2(WorkloadsWrap.apply)
  given scoreInputFormat: RootJsonFormat[ScoreInput]                             = jsonFormat9(ScoreInput.apply)
  given scoreOutputFormat: RootJsonFormat[ScoreOutput]                           = jsonFormat11(ScoreOutput.apply)
  given scoreFormat: RootJsonFormat[Score]                                       = jsonFormat12(Score.apply)

  given dashboardNotificationDTOFormat: RootJsonFormat[DashboardNotificationDTO] =
    jsonFormat2(DashboardNotificationDTO.apply)
  given dashboardScoreDTOFormat: RootJsonFormat[DashboardScoreDTO]               = jsonFormat10(
    DashboardScoreDTO.apply
  )
  given dashboardDTOFormat: RootJsonFormat[DashboardDTO]                         = jsonFormat12(DashboardDTO.apply)

  given riskScoreMetricsWLFormat: RootJsonFormat[RiskScoreMetricsWL]           = jsonFormat8(
    RiskScoreMetricsWL.apply
  )
  given riskScoreMetricsGroupFormat: RootJsonFormat[RiskScoreMetricsGroup]     = jsonFormat10(
    RiskScoreMetricsGroup.apply
  )
  given riskScoreMetricsCVEFormat: RootJsonFormat[RiskScoreMetricsCVE]         = jsonFormat5(
    RiskScoreMetricsCVE.apply
  )
  given metricsFormat: RootJsonFormat[Metrics]                                 = jsonFormat10(Metrics.apply)
  given conversationReportEntryFormat: RootJsonFormat[ConversationReportEntry] = jsonFormat8(
    ConversationReportEntry.apply
  )
  given exposureFormat: RootJsonFormat[Exposure]                               = jsonFormat14(Exposure.apply)
  given scoreOutput2Format: RootJsonFormat[ScoreOutput2]                       = jsonFormat4(ScoreOutput2.apply)
  given securityScoresFormat: RootJsonFormat[SecurityScores]                   = jsonFormat11(SecurityScores.apply)
  given systemScoreFormat: RootJsonFormat[SystemScore]                         = jsonFormat4(SystemScore.apply)
  given internalSystemDataFormat: RootJsonFormat[InternalSystemData]           = jsonFormat4(
    InternalSystemData.apply
  )
  given dashboardScoreDTO2Format: RootJsonFormat[DashboardScoreDTO2]           = jsonFormat7(
    DashboardScoreDTO2.apply
  )
  given multiClusterSummaryFormat: RootJsonFormat[MultiClusterSummary]         = jsonFormat2(
    MultiClusterSummary.apply
  )
  MetricsWrap
  given metricsWrapFormat: RootJsonFormat[MetricsWrap]                         = jsonFormat1(
    MetricsWrap.apply
  )

  def jsonToViolationsEndpointData(endpointData: String): ViolationEndpointData =
    endpointData.parseJson
      .convertTo[ViolationEndpointData]

  def jsonToThreatsEndpointData(endpointData: String): ThreatEndpointData =
    endpointData.parseJson
      .convertTo[ThreatEndpointData]

  def jsonToIncidentsEndpointData(endpointData: String): IncidentEndpointData =
    endpointData.parseJson
      .convertTo[IncidentEndpointData]

  def jsonToCriticalSecurityEventDTO(dtoData: String): CriticalSecurityEventDTO =
    dtoData.parseJson
      .convertTo[CriticalSecurityEventDTO]

  def jsonToVulnerableContainerEndpoint(endpointData: String): VulnerableContainerEndpoint =
    endpointData.parseJson
      .convertTo[VulnerableContainerEndpoint]

  def jsonToVulnerableNodeEndpoint(endpointData: String): VulnerableNodeEndpoint =
    endpointData.parseJson
      .convertTo[VulnerableNodeEndpoint]

  def jsonToVulnerablePlatforms(platformData: String): VulnerablePlatforms =
    platformData.parseJson
      .convertTo[VulnerablePlatforms]

  def jsonToIncidentsEndpoint(endpointData: String): IncidentsEndpoint =
    endpointData.parseJson
      .convertTo[IncidentsEndpoint]

  def jsonToServiceStatesIn(services: String): ServiceStatesIn =
    services.parseJson
      .convertTo[ServiceStatesIn]

  def jsonToAdmissionRulesWrap(admissionRulesWrap: String): AdmissionRulesWrap =
    admissionRulesWrap.parseJson
      .convertTo[AdmissionRulesWrap]

  def jsonToAdmissionStateWrap(admissionStateWrap: String): AdmissionStateWrap =
    admissionStateWrap.parseJson
      .convertTo[AdmissionStateWrap]

  def jsonToWorkloadsWrap(workloadsWrap: String): WorkloadsWrap =
    workloadsWrap.parseJson
      .convertTo[WorkloadsWrap]

  /*=========================================
      For new notifications API
    =========================================*/

  def jsonToThreatMajorData(endpointData: String): ThreatMajorData =
    endpointData.parseJson
      .convertTo[ThreatMajorData]

  def jsonToViolationMajorData(endpointData: String): ViolationMajorData =
    endpointData.parseJson
      .convertTo[ViolationMajorData]

  def jsonToIncidentMajorData(endpointData: String): IncidentMajorData =
    endpointData.parseJson
      .convertTo[IncidentMajorData]

  def jsonToThreatDetailsData(endpointData: String): ThreatDetailsData =
    endpointData.parseJson
      .convertTo[ThreatDetailsData]

  def jsonToViolationDetailsData(endpointData: String): ViolationDetailsData =
    endpointData.parseJson
      .convertTo[ViolationDetailsData]

  def jsonToIncidentDetailsData(endpointData: String): IncidentDetailsData =
    endpointData.parseJson
      .convertTo[IncidentDetailsData]

  def jsonToAutoScanConfig(autoScanConfig: String): AutoScanConfig =
    autoScanConfig.parseJson
      .convertTo[AutoScanConfig]

  def jsonToApplicationsInPolicyWrap(applicationsInPolicyWrap: String): ApplicationsInPolicyWrap =
    applicationsInPolicyWrap.parseJson
      .convertTo[ApplicationsInPolicyWrap]

  def jsonToInternalSystemData(internalSystemData: String): InternalSystemData =
    internalSystemData.parseJson
      .convertTo[InternalSystemData]

  def jsonToSystemScoreDataToJson(systemScore: String): SystemScore =
    systemScore.parseJson
      .convertTo[SystemScore]

  def internalSystemDataToJson(internalSystemData: InternalSystemData): String =
    internalSystemData.toJson.compactPrint

  def systemScoreDataToJson(systemScoreData: SystemScore): String =
    systemScoreData.toJson.compactPrint

  def metricsWrapDataToJson(metricsWraData: MetricsWrap): String =
    metricsWraData.toJson.compactPrint

  def threatsToSecurityEvents: (Array[ThreatDetails], ThreatMajor, Int) => SecurityEvent =
    (threatDetails: Array[ThreatDetails], threatMajor: ThreatMajor, i: Int) => {
      val clientEndpoint = Endpoint(
        Some(threatMajor.client_workload_domain),
        Some(threatMajor.client_workload_id),
        Some(threatMajor.client_workload_name),
        Some(threatMajor.client_ip),
        Some(threatMajor.client_port),
        None
      )

      val serverEndpoint = Endpoint(
        Some(threatMajor.server_workload_domain),
        Some(threatMajor.server_workload_id),
        Some(threatMajor.server_workload_name),
        Some(threatMajor.server_ip),
        Some(threatMajor.server_port),
        Some(threatMajor.server_conn_port)
      )
      SecurityEvent(
        threatMajor.name,
        "Threat",
        threatMajor.level,
        if (threatMajor.target == "client") serverEndpoint
        else clientEndpoint,
        if (threatMajor.target == "client") clientEndpoint
        else serverEndpoint,
        None,
        if (threatMajor.application.length > 0) Array(threatMajor.application)
        else Array(),
        threatDetails(i).toJson.compactPrint,
        threatMajor.reported_timestamp,
        threatMajor.reported_at
      )
    }

  def violationsToSecurityEvents: (Array[ViolationDetails], ViolationMajor, Int) => SecurityEvent =
    (violationDetails: Array[ViolationDetails], violationMajor: ViolationMajor, i: Int) => {
      val clientEndpoint = Endpoint(
        Some(violationMajor.client_domain),
        Some(violationMajor.client_id),
        Some(violationMajor.client_name),
        Some(violationMajor.client_ip),
        None,
        None
      )

      val serverEndpoint = Endpoint(
        Some(violationMajor.server_domain),
        Some(violationMajor.server_id),
        Some(violationMajor.server_name),
        Some(violationMajor.server_ip),
        Some(violationMajor.server_port),
        None
      )
      SecurityEvent(
        violationMajor.policy_id.toString,
        "Violation",
        violationMajor.level,
        clientEndpoint,
        serverEndpoint,
        None,
        violationMajor.applications,
        violationDetails(i).toJson.compactPrint,
        violationMajor.reported_timestamp,
        violationMajor.reported_at
      )
    }

  def incidentsToSecurityEvents: (Array[IncidentDetails], IncidentMajor, Int) => SecurityEvent =
    (incidentDetails: Array[IncidentDetails], incidentMajor: IncidentMajor, i: Int) => {
      val clientEndpoint = Endpoint(
        Some(incidentMajor.workload_domain.getOrElse("")),
        Some(incidentMajor.workload_id.getOrElse("")),
        Some(incidentMajor.workload_name.getOrElse("")),
        Some(incidentMajor.client_ip.getOrElse("")),
        Some(incidentMajor.client_port.getOrElse(0)),
        None
      )

      val serverEndpoint = Endpoint(
        Some(incidentMajor.remote_workload_domain.getOrElse("")),
        Some(incidentMajor.remote_workload_id.getOrElse("")),
        Some(incidentMajor.remote_workload_name.getOrElse("")),
        Some(incidentMajor.server_ip.getOrElse("")),
        Some(incidentMajor.server_port.getOrElse(0)),
        Some(incidentMajor.server_conn_port.getOrElse(0))
      )
      SecurityEvent(
        incidentMajor.name,
        "Incident",
        incidentMajor.level,
        if (incidentMajor.conn_ingress.getOrElse(false)) serverEndpoint
        else clientEndpoint,
        if (incidentMajor.conn_ingress.getOrElse(false)) clientEndpoint
        else serverEndpoint,
        Some(incidentMajor.host_name.getOrElse("")),
        if (incidentMajor.proc_path.isDefined) Array(incidentMajor.proc_path.get)
        else Array(),
        incidentDetails(i).toJson.compactPrint,
        incidentMajor.reported_timestamp,
        incidentMajor.reported_at
      )
    }

  def threatsToConvertedThreats: (ThreatEndpoint) => ConvertedThreat =
    (threat: ThreatEndpoint) =>
      ConvertedThreat(
        threat.id,
        threat.name,
        threat.reported_timestamp,
        threat.reported_at,
        threat.count,
        if (threat.target == "client") threat.server_workload_id
        else threat.client_workload_id,
        if (threat.target == "client") {
          if (!threat.server_workload_name.isEmpty()) threat.server_workload_name
          else if (!threat.server_ip.isEmpty()) threat.server_ip
          else threat.server_workload_id
        } else {
          if (!threat.client_workload_name.isEmpty()) threat.client_workload_name
          else if (!threat.client_ip.isEmpty()) threat.client_ip
          else threat.client_workload_id
        },
        if (threat.target == "client") threat.client_workload_id
        else threat.server_workload_id,
        if (threat.target == "client") {
          if (!threat.client_workload_name.isEmpty()) threat.client_workload_name
          else if (!threat.client_ip.isEmpty()) threat.client_ip
          else threat.client_workload_id
        } else {
          if (!threat.server_workload_name.isEmpty()) threat.server_workload_name
          else if (!threat.server_ip.isEmpty()) threat.server_ip
          else threat.server_workload_id
        },
        Domain(
          if (threat.target == "client") threat.server_workload_domain
          else threat.client_workload_domain,
          if (threat.target == "client") threat.client_workload_domain
          else threat.server_workload_domain
        ),
        threat.severity,
        threat.action,
        if (threat.target == "client") threat.server_port else threat.client_port,
        if (threat.target == "client") threat.client_port else threat.server_port,
        if (threat.target == "client") Some(threat.server_conn_port) else None,
        if (threat.target == "client") None else Some(threat.server_conn_port),
        if (threat.target == "client") threat.server_ip else threat.client_ip,
        if (threat.target == "client") threat.client_ip else threat.server_ip,
        threat.application,
        threat.target,
        threat.cap_len,
        threat.message
      )

  def violationsToConvertedviolations: (ViolationEndpoint) => ViolationEndpoint =
    (violation: ViolationEndpoint) =>
      violation.copy(
        client_name =
          if (!violation.client_name.isEmpty()) violation.client_name
          else if (!violation.client_ip.isEmpty()) violation.client_ip
          else violation.client_id,
        server_name =
          if (!violation.server_name.isEmpty()) violation.server_name
          else if (!violation.server_ip.isEmpty()) violation.server_ip
          else violation.server_id
      )

}
