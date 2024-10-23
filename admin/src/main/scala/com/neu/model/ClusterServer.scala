package com.neu.model

import com.typesafe.scalalogging.LazyLogging
import spray.json.*

case class ClusterServer(
  disabled: Option[Boolean],
  name: String,
  id: String,
  secret: String,
  api_server: String,
  api_port: Option[Int],
  status: Option[String],
  username: Option[String],
  rest_version: Option[String],
  clusterType: String = "", // "" for normal cluster, "master", "joint"
  proxy_required: Option[Boolean]
)

case class FedMemberData(
  fed_role: String,
  local_rest_info: Option[ClusterServerInfo] = None,
  clusters: Option[Seq[ClusterServer]] = None,
  use_proxy: Option[String] = None,
  deploy_repo_scan_data: Option[Boolean] = Some(false)
)

case class ClusterServerInfo(
  server: String,
  port: Int
)

case class FedMasterCluster(
  disabled: Option[Boolean],
  name: String,
  id: String,
  secret: String,
  user: Option[String],
  status: Option[String],
  rest_version: Option[String],
  rest_info: ClusterServerInfo
)
case class FedJointCluster(
  disabled: Option[Boolean],
  name: String,
  id: String,
  secret: String,
  user: Option[String],
  status: Option[String],
  rest_version: Option[String],
  rest_info: ClusterServerInfo,
  proxy_required: Option[Boolean]
)

case class ClusterConfig(config: ClusterServer)

case class FedMembershipData(
  fed_role: String,                                  // "", "master" or "joint"
  local_rest_info: Option[ClusterServerInfo] = None, // only meaningful while fed_role is ""
  master_cluster: Option[FedMasterCluster] = None,
  joint_clusters: Option[Seq[FedJointCluster]] = None,
  use_proxy: Option[String] = None,
  deploy_repo_scan_data: Option[Boolean]
)

case class FedPromptRequest(
  name: String,
  master_rest_info: Option[ClusterServerInfo],
  use_proxy: Option[String],
  deploy_repo_scan_data: Option[Boolean]
)

case class FedConfigData(
  poll_interval: Int,
  name: Option[String],
  use_proxy: Option[String],
  rest_info: Option[ClusterServerInfo],
  deploy_repo_scan_data: Option[Boolean]
)

case class FedJoinRequest(
  name: String,
  server: String,
  port: Int,
  join_token: String,
  joint_rest_info: Option[ClusterServerInfo],
  use_proxy: Option[String]
)

case class FedLeaveRequest(force: Boolean = true)

case class DeployFedRulesReq(ids: Option[Seq[String]])

case class ClusterSwitched(id: Option[String])

object ClusterJsonProtocol extends DefaultJsonProtocol with LazyLogging {

  given clusterServerFmt: RootJsonFormat[ClusterServer]         = jsonFormat11(ClusterServer.apply)
  given clusterConfigFmt: RootJsonFormat[ClusterConfig]         = jsonFormat1(ClusterConfig.apply)
  given clusterServerInfo: RootJsonFormat[ClusterServerInfo]    = jsonFormat2(ClusterServerInfo.apply)
  given fedMasterClusterFmt: RootJsonFormat[FedMasterCluster]   = jsonFormat8(FedMasterCluster.apply)
  given fedJointClusterFmt: RootJsonFormat[FedJointCluster]     = jsonFormat9(FedJointCluster.apply)
  given fedMemberDataFmt: RootJsonFormat[FedMemberData]         = jsonFormat5(FedMemberData.apply)
  given fedMembershipDataFmt: RootJsonFormat[FedMembershipData] = jsonFormat6(
    FedMembershipData.apply
  )
  given fedPromptRequestFmt: RootJsonFormat[FedPromptRequest]   = jsonFormat4(FedPromptRequest.apply)
  given fedConfigDataFmt: RootJsonFormat[FedConfigData]         = jsonFormat5(FedConfigData.apply)
  given fedJoinRequestFmt: RootJsonFormat[FedJoinRequest]       = jsonFormat6(FedJoinRequest.apply)
  given fedLeaveRequestFmt: RootJsonFormat[FedLeaveRequest]     = jsonFormat1(FedLeaveRequest.apply)
  given deployFedRulesReqFmt: RootJsonFormat[DeployFedRulesReq] = jsonFormat1(
    DeployFedRulesReq.apply
  )
  given clusterSwitchedFmt: RootJsonFormat[ClusterSwitched]     = jsonFormat1(ClusterSwitched.apply)

  def clusterConfigToJson(clusterConfig: ClusterConfig): String    = clusterConfig.toJson.compactPrint
  def promptToJson(fedPromptRequest: FedPromptRequest): String     =
    fedPromptRequest.toJson.compactPrint
  def joinToJson(fedJoinRequest: FedJoinRequest): String           = fedJoinRequest.toJson.compactPrint
  def leaveToJson(leaveRequest: FedLeaveRequest): String           = leaveRequest.toJson.compactPrint
  def fedConfigToJson(config: FedConfigData): String               = config.toJson.compactPrint
  def deployReqToJson(deployReq: DeployFedRulesReq): String        = deployReq.toJson.compactPrint
  def jsonToFedMembershipData(response: String): FedMembershipData =
    response.parseJson.convertTo[FedMembershipData]
}
