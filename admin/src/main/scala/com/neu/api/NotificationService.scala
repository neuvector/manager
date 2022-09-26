package com.neu.api

import com.neu.cache.{ paginationCacheManager, BlacklistCacheManager, GraphCacheManager }
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.IpGeoManager
import com.neu.model.AlertJsonProtocol._
import com.neu.model.DashboardJsonProtocol._
import com.neu.model.EndpointConfigJsonProtocol._
import com.neu.model.IpGeoJsonProtocol._
import com.neu.model.JsonProtocol._
import com.neu.model.ResourceJsonProtocol._
import com.neu.model._
import com.neu.utils.EnumUtils
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import org.json4s._
import org.json4s.native.JsonMethods._
import spray.can.Http.ConnectionAttemptFailedException
import spray.http.HttpMethods._
import spray.http.StatusCodes
import spray.routing.Route

import java.io.{ PrintWriter, StringWriter }
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.control.NonFatal

/**
 * Notification rest service
 *
 */
class NotificationService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  val topLimit       = 5
  val externalId     = "external"
  val hostPrefix     = "Host:"
  val workloadPrefix = "Workload:"
  val ipGroupPrefix  = "IP-Group:"
  val top            = "top"
  val client         = "client"

  val eventRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("ip-geo") {
          pathEnd {
            patch {
              entity(as[Array[String]]) { ipList =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Getting ip locations")
                      try {
                        IpGeoManager.getCountries(ipList)
                      } catch {
                        case NonFatal(e) =>
                          if (e.getMessage.contains("Status: 408")) {
                            (StatusCodes.RequestTimeout, "Session expired!")
                          } else {
                            (StatusCodes.InternalServerError, "Internal server error")
                          }
                      }
                    }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("event") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/log/event",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("incident") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/log/incident",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("violation") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/log/violation",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          path(top) {
            get {
              parameter('category) { category =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    category match {
                      case `client` =>
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/log/violation/workload?s_client=desc&start=0&limit=5",
                          GET,
                          "",
                          tokenId
                        )
                      case _ =>
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/log/violation/workload?s_server=desc&start=0&limit=5",
                          GET,
                          "",
                          tokenId
                        )
                    }
                  }
                }
              }
            }
          } ~
          path("track") {
            post {
              entity(as[ViolationBrief]) { violationBrief =>
                {
                  try {
                    val result = RestClient.requestWithHeaderDecode(
                      s"${baseClusterUri(tokenId)}/log/violation",
                      GET,
                      "",
                      tokenId
                    )
                    val violations =
                      jsonToViolationWrap(Await.result(result, RestClient.waitingLimit.seconds)).violations
                    val track = violations.filter(
                      violation =>
                        violation.client_id.equals(violationBrief.client_name) &&
                        violation.server_id.equals(violationBrief.server_name) &&
                        violation.reported_at.isAfter(violationBrief.reported_at.minusHours(2)) &&
                        violation.reported_at.isBefore(violationBrief.reported_at.plusHours(2))
                    )
                    Utils.respondWithNoCacheControl() {
                      complete(StatusCodes.OK, track)
                    }
                  } catch {
                    case NonFatal(e) =>
                      Utils.respondWithNoCacheControl() {
                        complete(onNonFatal(e))
                      }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("audit") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/log/audit",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("audit2") {
          pathEnd {
            get {
              parameter('start.?, 'limit.?) { (start, limit) =>
                Utils.respondWithNoCacheControl() {
                  logger.info("tokenId: {}", tokenId)
                  val cacheKey = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
                  try {
                    complete {
                      var elements: List[org.json4s.JsonAST.JValue] = null
                      var auditStr: String                          = null
                      if (start.isEmpty || start.get.toInt == 0) {
                        val url = s"${baseClusterUri(tokenId)}/log/audit"
                        logger.info("Get audit log data from {}", url)
                        val auditRes = RestClient.requestWithHeaderDecode(
                          url,
                          GET,
                          "",
                          tokenId
                        )
                        auditStr = Await.result(auditRes, RestClient.waitingLimit.seconds)

                        val json = parse(auditStr)
                        elements = (json \ "audits").children
                        if (start.isDefined && start.get.toInt == 0) {
                          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .savePagedData(s"$cacheKey-audit", elements)
                        }
                      }

                      if (start.isDefined && limit.isDefined) {
                        if (elements == null) {
                          elements = paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .getPagedData(s"$cacheKey-audit")
                            .getOrElse(List[org.json4s.JsonAST.JValue]())
                        }
                        val output =
                          elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
                        if (output.length < limit.get.toInt) {
                          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .removePagedData(s"$cacheKey-audit")
                        }
                        val pagedRes = compact(render(JArray(output)))
                        val cachedData = paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .getPagedData(s"$cacheKey-audit")
                          .getOrElse(List[org.json4s.JsonAST.JValue]())
                        logger.info("Cached data size: {}", cachedData.size)
                        logger.info(
                          "Paged response size: {}",
                          compact(render(JArray(output))).length
                        )
                        pagedRes
                      } else {
                        auditStr
                      }
                    }
                  } catch {
                    case NonFatal(e) =>
                      logger.warn(e.getMessage)
                      if (e.getMessage.contains("Status: 401") || e.getMessage.contains(
                            "Status: 403"
                          )) {
                        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .removePagedData(s"$cacheKey-audit")
                        Utils.respondWithNoCacheControl() {
                          complete(StatusCodes.Unauthorized, "Authentication failed!")
                        }
                      } else {
                        Utils.respondWithNoCacheControl() {
                          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .removePagedData(s"$cacheKey-audit")
                          complete(StatusCodes.InternalServerError, "Controller unavailable!")
                        }
                      }
                    case e @ (_: TimeoutException | _: ConnectionAttemptFailedException) =>
                      logger.warn(e.getMessage)
                      Utils.respondWithNoCacheControl() {
                        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .removePagedData(s"$cacheKey-audit")
                        complete(StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                      }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("threat") {
          pathEnd {
            get {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    id match {
                      case None =>
                        try {
                          val threatsRes = RestClient.requestWithHeaderDecode(
                            s"${baseClusterUri(tokenId)}/log/threat",
                            GET,
                            "",
                            tokenId
                          )
                          val threats =
                            jsonToThreatsEndpointData(
                              Await.result(threatsRes, RestClient.waitingLimit.seconds)
                            ).threats
                          val convertedThreats = threats.zipWithIndex.map {
                            case (threat, _) => threatsToConvertedThreats(threat)
                          }
                          val newThreatDTOWrap = NewThreatDTOWrap(convertedThreats)
                          newThreatDTOWrap
                        } catch {
                          case NonFatal(e) =>
                            onNonFatal(e)
                        }
                      case Some(uuid) =>
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/log/threat/$uuid",
                          GET,
                          "",
                          tokenId
                        )
                    }
                  }
                }
              }
            }
          } ~
          path("track") {
            post {
              entity(as[ViolationBrief]) { violationBrief =>
                {
                  try {
                    val result =
                      RestClient.requestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/log/threat",
                        GET,
                        "",
                        tokenId
                      )
                    val threats = jsonToThreatDTOWrap(
                      Await.result(result, RestClient.waitingLimit.seconds)
                    ).threats
                    logger.info("Number of threats: {}", threats.length)
                    val track = threats.filter(
                      threat =>
                        if (threat.sess_ingress) {
                          threat.workload_id.equals(violationBrief.server_name) &&
                          threat.reported_at.isAfter(violationBrief.reported_at.minusHours(2)) &&
                          threat.reported_at.isBefore(violationBrief.reported_at.plusHours(2))
                        } else {
                          threat.workload_id.equals(violationBrief.client_name) &&
                          threat.reported_at.isAfter(violationBrief.reported_at.minusHours(2)) &&
                          threat.reported_at.isBefore(violationBrief.reported_at.plusHours(2))
                        }
                    )
                    Utils.respondWithNoCacheControl() {
                      complete(StatusCodes.OK, track)
                    }
                  } catch {
                    case NonFatal(e) =>
                      Utils.respondWithNoCacheControl() {
                        complete(onNonFatal(e))
                      }
                  }
                }
              }
            }
          } ~
          path(top) {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  try {
                    val threatRes =
                      RestClient.requestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/log/threat",
                        GET,
                        "",
                        tokenId
                      )
                    val threats = jsonToThreatWrap(
                      Await.result(threatRes, RestClient.waitingLimit.seconds)
                    ).threats
                    val DTOs = threats
                      .map(
                        brief =>
                          ThreatBriefDTO(
                            brief.name,
                            brief.severity,
                            EnumUtils.getCode(brief.severity),
                            brief.application
                          )
                      )
                      .distinct
                    val size = DTOs.length
                    if (size < topLimit) {
                      (DTOs ++ Array.fill(topLimit - size)(emptyThreatBriefDTO))
                        .sortBy(-_.severityId)
                    } else {
                      DTOs.sortBy(-_.severityId).take(topLimit)
                    }
                  } catch {
                    case NonFatal(e) =>
                      onNonFatal(e)
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("network") {
          path("session") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/session?f_workload=$id&limit=256",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("conversation") {
            delete {
              parameter('from, 'to) { (from, to) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Clear from {} to {}", from, to)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/conversation/$from/$to",
                      DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("endpoint") {
            patch {
              entity(as[EndpointConfigWrap]) { config =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Renaming endpoint: {}", config.config.id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/conversation_endpoint/${config.config.id}",
                      PATCH,
                      endpointConfigWrapToJson(config),
                      tokenId
                    )
                  }
                }
              }
            } ~
            delete {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Removing unmanaged endpoint: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/conversation_endpoint/$id",
                      DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("history") {
            get {
              parameter('from, 'to) { (from, to) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/conversation/$from/$to",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          pathPrefix("graph") {
            pathEnd {
              get {
                parameter('user) { user =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {

                        val dataSet =
                          RestClient.requestWithHeaderDecode(
                            s"${baseClusterUri(tokenId)}/conversation",
                            GET,
                            "",
                            tokenId
                          )

                        logger.info("getting graph data")

                        val graphData =
                          jsonToGraphData(Await.result(dataSet, RestClient.waitingLimit.seconds))

                        logger.info("Parsing graph data")

                        val (edges: Array[Edge], markedNodes: Array[Node]) = getDataSet(graphData)

                        logger.info("Sending data")
                        logger.info("blacklist:  {}", BlacklistCacheManager.getBlacklist(user))

                        NetworkGraph(
                          markedNodes,
                          edges,
                          BlacklistCacheManager.getBlacklist(user)
                        )

                      } catch {
                        case NonFatal(e) =>
                          val sw = new StringWriter
                          e.printStackTrace(new PrintWriter(sw))
                          logger.warn(sw.toString)
                          onNonFatal(e)
                      }
                    }
                  }
                }
              } ~
              post {
                entity(as[UserGraphLayout]) { graphLayout: UserGraphLayout =>
                  {
                    logger.info("saving positions for user: {}", graphLayout.user)
                    GraphCacheManager.saveNodeLayout(graphLayout)
                    logger.debug(layoutToJson(graphLayout))
                    Utils.respondWithNoCacheControl() {
                      complete(StatusCodes.OK, "Layout saved.")
                    }
                  }
                }
              }
            } ~
            path("layout") {
              get {
                parameter('user) { user =>
                  {
                    Utils.respondWithNoCacheControl() {
                      complete {
                        UserGraphLayout(user, GraphCacheManager.getNodeLayout(user))
                      }
                    }
                  }
                }
              }
            } ~
            path("blacklist") {
              get {
                parameter('user) { user =>
                  {
                    Utils.respondWithNoCacheControl() {
                      complete {
                        BlacklistCacheManager.getBlacklist(user)
                      }
                    }
                  }
                }
              } ~
              post {
                entity(as[UserBlacklist]) { userBlacklist: UserBlacklist =>
                  {
                    logger.info("saving blacklist for user: {}", userBlacklist.user)
                    BlacklistCacheManager.saveBlacklist(userBlacklist)
                    Utils.respondWithNoCacheControl() {
                      complete(StatusCodes.OK, "Blacklist saved.")
                    }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("security-events") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  try {
                    val (startTime: DateTime, notifications: (String, String, String)) =
                      getNotifications(tokenId)

                    val calculationStartTime = new DateTime()
                    logger.info("notifications Calculation Start: {}", calculationStartTime)

                    val threatMajor      = jsonToThreatMajorData(notifications._1).threats
                    val violationMajor   = jsonToViolationMajorData(notifications._2).violations
                    val incidentMajor    = jsonToIncidentMajorData(notifications._3).incidents
                    val threatDetails    = jsonToThreatDetailsData(notifications._1).threats
                    val violationDetails = jsonToViolationDetailsData(notifications._2).violations
                    val incidentDetails  = jsonToIncidentDetailsData(notifications._3).incidents
                    logger.info("Got {} threats", threatMajor.length)
                    logger.info("Got {} violations", violationMajor.length)
                    logger.info("Got {} incidents", incidentMajor.length)

                    var notificationsOut = Array[SecurityEvent]()

                    notificationsOut ++= threatMajor.zipWithIndex.map {
                      case (threat, i) => threatsToSecurityEvents(threatDetails, threat, i)
                    }
                    notificationsOut ++= violationMajor.zipWithIndex.map {
                      case (violation, i) =>
                        violationsToSecurityEvents(violationDetails, violation, i)
                    }
                    notificationsOut ++= incidentMajor.zipWithIndex.map {
                      case (incident, i) => incidentsToSecurityEvents(incidentDetails, incident, i)
                    }
                    notificationsOut =
                      notificationsOut.sortWith(_.reported_timestamp > _.reported_timestamp)
                    val endTime = new DateTime()
                    logger.info("notifications End: {}", endTime)
                    logger.info(
                      "notifications Calculation Duration: {}",
                      endTime.getMillis - calculationStartTime.getMillis
                    )
                    logger.info(
                      "notifications Duration: {}",
                      endTime.getMillis - startTime.getMillis
                    )
                    SecurityEventDTO(notificationsOut)
                  } catch {
                    case NonFatal(e) =>
                      onNonFatal(e)
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("security-events2") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  try {
                    getNotifications(tokenId)._2
                  } catch {
                    case NonFatal(e) =>
                      onNonFatal(e)
                  }
                }
              }
            }
          }
        }
      }
    }

  private def getNotifications(tokenId: String) = {
    val startTime = new DateTime()
    logger.info("notifications Start: {}", startTime)
    val threatsRes = RestClient.requestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/log/threat",
      GET,
      "",
      tokenId
    )
    val violationsRes = RestClient.requestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/log/violation",
      GET,
      "",
      tokenId
    )
    val incidentsRes = RestClient.requestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/log/incident",
      GET,
      "",
      tokenId
    )

    val notificationsData: Future[(String, String, String)] = for {
      threats    <- threatsRes
      violations <- violationsRes
      incidents  <- incidentsRes
    } yield (threats, violations, incidents)

    val notifications: (String, String, String) =
      Await.result(notificationsData, RestClient.waitingLimit.seconds)
    (startTime, notifications)
  }

  private val getDataSet = (graphData: GraphData) => {
    val nodes = graphData.endpoints
      .filter(
        x => !"exit".equals(x.state) && x.share_ns_with.isEmpty && x.id.nonEmpty
      )
      .map(endpointToNode)

    val nodeMap: Map[String, Node] = nodes.foldLeft(Map[String, Node]()) { (m, s) =>
      m + (s.id -> s)
    }

    logger.debug("Network graph nodes size: {}", nodes.length)

    val conversations = graphData.conversations
    val edges         = conversations.map(conversationToEdge(_, nodeMap))

    logger.debug("Network graph edges size: {}", edges.length)

    val markedNodes = nodes.map(
      node =>
        if (node.platform_role.nonEmpty) {
          node.copy(platform_role = "System")
        } else {
          node
        }
    )
    (edges, markedNodes)
  }
}
