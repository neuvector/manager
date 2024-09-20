package com.neu.service.cluster

import com.neu.client.RestClient
import com.neu.client.RestClient.{ baseClusterUri, fedUri }
import com.neu.model.*
import com.neu.model.ClusterJsonProtocol.*
import com.neu.service.{ BaseService, DefaultJsonFormats }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods
import org.apache.pekko.http.scaladsl.model.HttpMethods.GET
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext }
import scala.util.control.NonFatal

class ClusterService extends BaseService with DefaultJsonFormats with LazyLogging {

  def getMember(tokenId: String): Route = complete {
    logger.info(s"Getting cluster..")
    try {
      val result =
        RestClient.requestWithHeaderDecode(
          s"$fedUri/member",
          HttpMethods.GET,
          "",
          tokenId
        )

      toClusters(
        jsonToFedMembershipData(Await.result(result, RestClient.waitingLimit.seconds))
      )
    } catch {
      case NonFatal(e) =>
        onNonFatal(e)
    }
  }

  def getSwitch(tokenId: String, id: Option[String]): Route = complete {
    RestClient.switchCluster(tokenId, id)
    logger.info(s"Switched to: $id")
    ClusterSwitched(id)
  }

  def getSummary(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      RestClient.getClusterSummaryUrl(id),
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def promote(tokenId: String, fedPromptRequest: FedPromptRequest): Route = complete {
    RestClient.httpRequestWithHeader(
      s"$fedUri/promote",
      HttpMethods.POST,
      promptToJson(fedPromptRequest),
      tokenId
    )
  }

  def demote(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"$fedUri/demote",
      HttpMethods.POST,
      "",
      tokenId
    )
  }

  def getJoinToken(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"$fedUri/join_token",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def join(tokenId: String, joinRequest: FedJoinRequest): Route = {
    logger.info(s"Joining cluster: ${joinRequest.server}")
    complete {
      RestClient.httpRequestWithHeader(
        s"$fedUri/join",
        HttpMethods.POST,
        joinToJson(joinRequest),
        tokenId
      )
    }
  }

  def leave(tokenId: String, leaveRequest: FedLeaveRequest): Route = {
    logger.info(s"Leaving cluster: $leaveRequest")
    complete {
      RestClient.httpRequestWithHeader(
        s"$fedUri/leave",
        HttpMethods.POST,
        leaveToJson(leaveRequest),
        tokenId
      )
    }
  }

  def config(tokenId: String, fedConfigData: FedConfigData): Route = {
    logger.info(s"Updating cluster: ${fedConfigData.rest_info}")
    complete {
      RestClient.httpRequestWithHeader(
        s"$fedUri/config",
        HttpMethods.PATCH,
        fedConfigToJson(fedConfigData),
        tokenId
      )
    }
  }

  def deleteCluster(tokenId: String, id: String): Route = complete {
    logger.info("Deleting cluster: {}", id)
    RestClient.httpRequestWithHeader(
      s"$fedUri/cluster/$id",
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def deployRules(tokenId: String, deployFedRulesReq: DeployFedRulesReq): Route = {
    logger.info(s"Deploy fed rules: ${deployFedRulesReq.ids}")
    complete {
      RestClient.httpRequestWithHeader(
        s"$fedUri/deploy",
        HttpMethods.POST,
        deployReqToJson(deployFedRulesReq),
        tokenId
      )
    }
  }

  private lazy val toClusters: FedMembershipData => FedMemberData =
    (fedMembershipData: FedMembershipData) =>
      fedMembershipData.fed_role match {
        case "" =>
          FedMemberData(fedMembershipData.fed_role)
        case _  =>
          val clusters =
            fedMembershipData.master_cluster.fold {
              val joints = fedMembershipData.joint_clusters
                .getOrElse(Seq.empty[FedJointCluster])
                .map(jointToClusterServer)
              joints
            } { cluster =>
              val masterCluster = masterToClusterServer(cluster)
              val joints        = fedMembershipData.joint_clusters
                .getOrElse(Seq.empty[FedJointCluster])
                .map(jointToClusterServer)
              masterCluster +: joints
            }

          FedMemberData(
            fedMembershipData.fed_role,
            fedMembershipData.local_rest_info,
            Some(clusters),
            Some(fedMembershipData.use_proxy.fold("") { use_proxy =>
              use_proxy
            }),
            fedMembershipData.deploy_repo_scan_data
          )

      }

  private val masterToClusterServer: FedMasterCluster => ClusterServer =
    (master: FedMasterCluster) =>
      ClusterServer(
        master.disabled,
        master.name,
        master.id,
        master.secret,
        master.rest_info.server,
        Some(master.rest_info.port),
        master.status,
        master.user,
        master.rest_version,
        "master",
        Some(false)
      )

  private val jointToClusterServer: FedJointCluster => ClusterServer = (joint: FedJointCluster) =>
    ClusterServer(
      joint.disabled,
      joint.name,
      joint.id,
      joint.secret,
      joint.rest_info.server,
      Some(joint.rest_info.port),
      joint.status,
      joint.user,
      joint.rest_version,
      "joint",
      joint.proxy_required
    )
}
