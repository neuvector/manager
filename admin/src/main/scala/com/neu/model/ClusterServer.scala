package com.neu.model

import com.typesafe.scalalogging.LazyLogging
import spray.json.{DefaultJsonProtocol, _}

case class ClusterServer(
  name: String,
  id: String,
  api_server: String,
  api_port: Option[Int],
  status: Option[String],
  username: Option[String],
  clusterType: String = "" //"" for normal cluster, "master", "joint"
)

case class FedMemberData(
  fed_role: String,
  local_rest_info: Option[ClusterServerInfo] = None,
  clusters: Option[Seq[ClusterServer]] = None,
  user_proxy: Option[String] = None
)

case class ClusterServerInfo(
  server: String,
  port: Int
)

case class FedMasterCluster(
  name: String,
  id: String,
  secret: String,
  ca_cert_path: Option[String],
  user: Option[String],
  status: Option[String],
  rest_info: ClusterServerInfo
)
case class FedJointCluster(
  name: String,
  id: String,
  secret: String,
  client_key_path: Option[String],
  client_cert_path: Option[String],
  user: Option[String],
  status: Option[String],
  rest_info: ClusterServerInfo,
  proxy_required: Option[Boolean]
)

case class ClusterConfig(config: ClusterServer)

case class FedMembershipData(
  fed_role: String,                                  // "", "master" or "joint"
  local_rest_info: Option[ClusterServerInfo] = None, //only meaningful while fed_role is ""
  master_cluster: Option[FedMasterCluster] = None,
  joint_clusters: Option[Seq[FedJointCluster]] = None,
  use_proxy: Option[String] = None
)

case class FedPromptRequest(
  name: String,
  master_rest_info: Option[ClusterServerInfo],
  user_proxy: Option[String]
)

case class FedConfigData(poll_interval: Int, name: Option[String], user_proxy: Option[String],rest_info: Option[ClusterServerInfo])

case class FedJoinRequest(
  name: String,
  server: String,
  port: Int,
  join_token: String,
  joint_rest_info: Option[ClusterServerInfo],
  user_proxy: Option[String]
)

case class FedLeaveRequest(force: Boolean = true)

case class DeployFedRulesReq(ids: Option[Seq[String]])

case class ClusterSwitched(id: Option[String])

object ClusterJsonProtocol extends DefaultJsonProtocol with LazyLogging {

  implicit val clusterServerFmt: RootJsonFormat[ClusterServer]       = jsonFormat7(ClusterServer)
  implicit val clusterConfigFmt: RootJsonFormat[ClusterConfig]       = jsonFormat1(ClusterConfig)
  implicit val clusterServerInfo: RootJsonFormat[ClusterServerInfo]  = jsonFormat2(ClusterServerInfo)
  implicit val fedMasterClusterFmt: RootJsonFormat[FedMasterCluster] = jsonFormat7(FedMasterCluster)
  implicit val fedJointClusterFmt: RootJsonFormat[FedJointCluster]   = jsonFormat9(FedJointCluster)
  implicit val fedMemberDataFmt: RootJsonFormat[FedMemberData]       = jsonFormat4(FedMemberData)
  implicit val fedMembershipDataFmt: RootJsonFormat[FedMembershipData] = jsonFormat5(
    FedMembershipData
  )
  implicit val fedPromptRequestFmt: RootJsonFormat[FedPromptRequest] = jsonFormat3(FedPromptRequest)
  implicit val fedConfigDataFmt: RootJsonFormat[FedConfigData]       = jsonFormat4(FedConfigData)
  implicit val fedJoinRequestFmt: RootJsonFormat[FedJoinRequest]     = jsonFormat6(FedJoinRequest)
  implicit val fedLeaveRequestFmt: RootJsonFormat[FedLeaveRequest]   = jsonFormat1(FedLeaveRequest)
  implicit val deployFedRulesReqFmt: RootJsonFormat[DeployFedRulesReq] = jsonFormat1(
    DeployFedRulesReq
  )
  implicit val clusterSwitchedFmt: RootJsonFormat[ClusterSwitched] = jsonFormat1(ClusterSwitched)

  def clusterConfigToJson(clusterConfig: ClusterConfig): String = clusterConfig.toJson.compactPrint
  def promptToJson(fedPromptRequest: FedPromptRequest): String =
    fedPromptRequest.toJson.compactPrint
  def joinToJson(fedJoinRequest: FedJoinRequest): String    = fedJoinRequest.toJson.compactPrint
  def leaveToJson(leaveRequest: FedLeaveRequest): String    = leaveRequest.toJson.compactPrint
  def fedConfigToJson(config: FedConfigData): String        = config.toJson.compactPrint
  def deployReqToJson(deployReq: DeployFedRulesReq): String = deployReq.toJson.compactPrint
  def jsonToFedMembershipData(response: String): FedMembershipData =
    response.parseJson.convertTo[FedMembershipData]
}
