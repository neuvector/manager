//package com.neu.api
//
//import com.typesafe.scalalogging.LazyLogging
//
//import scala.concurrent.ExecutionContext
//
//class ClusterService()(implicit executionContext: ExecutionContext)
//    extends BaseService
//    with DefaultJsonFormats
//    with LazyLogging {
//
////  val clusterRoute: Route =
////    headerValueByName("Token") { tokenId =>
////      {
////        pathPrefix("fed") {
////          path("member") {
////            get {
////              Utils.respondWithWebServerHeaders() {
////                complete {
////                  logger.info(s"Getting cluster..")
////                  try {
////                    val result =
////                      RestClient.requestWithHeaderDecode(s"$fedUri/member", GET, "", tokenId)
////
////                    toClusters(
////                      jsonToFedMembershipData(Await.result(result, RestClient.waitingLimit.seconds))
////                    )
////                  } catch {
////                    case NonFatal(e) =>
////                      onNonFatal(e)
////                  }
////                }
////              }
////            }
////          } ~
////          path("switch") {
////            get {
////              parameter('id.?) { id =>
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.switchCluster(tokenId, id)
////                    logger.info(s"Switched to: $id")
////                    ClusterSwitched(id)
////                  }
////                }
////              }
////            }
////          } ~
////          path("summary") {
////            get {
////              parameter('id) { id =>
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      RestClient.getClusterSummaryUrl(id),
////                      GET,
////                      "",
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          } ~
////          path("promote") {
////            post {
////              entity(as[FedPromptRequest]) { fedPromptRequest =>
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      s"$fedUri/promote",
////                      POST,
////                      promptToJson(fedPromptRequest),
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          } ~
////          path("demote") {
////            post {
////              Utils.respondWithWebServerHeaders() {
////                complete {
////                  RestClient.httpRequestWithHeader(
////                    s"$fedUri/demote",
////                    POST,
////                    "",
////                    tokenId
////                  )
////                }
////              }
////            }
////          } ~
////          path("join_token") {
////            get {
////              Utils.respondWithWebServerHeaders() {
////                complete {
////                  RestClient.httpRequestWithHeader(
////                    s"$fedUri/join_token",
////                    GET,
////                    "",
////                    tokenId
////                  )
////                }
////              }
////            }
////          } ~
////          path("join") {
////            post {
////              entity(as[FedJoinRequest]) { joinRequest =>
////                logger.info(s"Joining cluster: ${joinRequest.server}")
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      s"$fedUri/join",
////                      POST,
////                      joinToJson(joinRequest),
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          } ~
////          path("leave") {
////            post {
////              entity(as[FedLeaveRequest]) { leaveRequest =>
////                logger.info(s"Leaving cluster: $leaveRequest")
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      s"$fedUri/leave",
////                      POST,
////                      leaveToJson(leaveRequest),
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          } ~
////          path("config") {
////            patch {
////              entity(as[FedConfigData]) { fedConfigData =>
////                logger.info(s"Updating cluster: ${fedConfigData.rest_info}")
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      s"$fedUri/config",
////                      PATCH,
////                      fedConfigToJson(fedConfigData),
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          } ~
////          pathEnd {
////            delete {
////              parameter('id) { id =>
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    logger.info("Deleting cluster: {}", id)
////                    RestClient.httpRequestWithHeader(s"$fedUri/cluster/$id", DELETE, "", tokenId)
////                  }
////                }
////              }
////            }
////          } ~
////          path("deploy") {
////            post {
////              entity(as[DeployFedRulesReq]) { deployRequest =>
////                logger.info(s"Deploy fed rules: ${deployRequest.ids}")
////                Utils.respondWithWebServerHeaders() {
////                  complete {
////                    RestClient.httpRequestWithHeader(
////                      s"$fedUri/deploy",
////                      POST,
////                      deployReqToJson(deployRequest),
////                      tokenId
////                    )
////                  }
////                }
////              }
////            }
////          }
////        }
////      }
////    }
////
////  private lazy val toClusters: FedMembershipData => FedMemberData =
////    (fedMembershipData: FedMembershipData) => {
////      fedMembershipData.fed_role match {
////        case "" =>
////          FedMemberData(fedMembershipData.fed_role)
////        case _ =>
////          val clusters =
////            fedMembershipData.master_cluster.fold {
////              val joints = fedMembershipData.joint_clusters
////                .getOrElse(Seq.empty[FedJointCluster])
////                .map(jointToClusterServer)
////              joints
////            } { cluster =>
////              val masterCluster = masterToClusterServer(cluster)
////              val joints = fedMembershipData.joint_clusters
////                .getOrElse(Seq.empty[FedJointCluster])
////                .map(jointToClusterServer)
////              masterCluster +: joints
////            }
////
////          FedMemberData(
////            fedMembershipData.fed_role,
////            fedMembershipData.local_rest_info,
////            Some(clusters),
////            Some(fedMembershipData.use_proxy.fold("") { use_proxy =>
////              use_proxy
////            }),
////            fedMembershipData.deploy_repo_scan_data
////          )
////
////      }
////    }
////
////  private val masterToClusterServer: FedMasterCluster => ClusterServer =
////    (master: FedMasterCluster) => {
////      ClusterServer(
////        master.disabled,
////        master.name,
////        master.id,
////        master.secret,
////        master.rest_info.server,
////        Some(master.rest_info.port),
////        master.status,
////        master.user,
////        master.rest_version,
////        "master",
////        Some(false)
////      )
////    }
////
////  private val jointToClusterServer: FedJointCluster => ClusterServer = (joint: FedJointCluster) => {
////    ClusterServer(
////      joint.disabled,
////      joint.name,
////      joint.id,
////      joint.secret,
////      joint.rest_info.server,
////      Some(joint.rest_info.port),
////      joint.status,
////      joint.user,
////      joint.rest_version,
////      "joint",
////      joint.proxy_required
////    )
////  }
//}
