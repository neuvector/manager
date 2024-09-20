package com.neu.service.notification

import com.neu.cache.{ paginationCacheManager, BlacklistCacheManager, GraphCacheManager }
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.IpGeoManager
import com.neu.model.*
import com.neu.model.AlertJsonProtocol.*
import com.neu.model.DashboardJsonProtocol.*
import com.neu.model.EndpointConfigJsonProtocol.*
import com.neu.model.IpGeoJsonProtocol.*
import com.neu.model.JsonProtocol.*
import com.neu.model.ResourceJsonProtocol.*
import com.neu.service.BaseService
import com.neu.utils.EnumUtils
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.model.{ HttpEntity, StatusCodes }
import org.apache.pekko.http.scaladsl.server.Route
import org.joda.time.DateTime
import org.json4s.*
import org.json4s.native.JsonMethods.*

import java.io.{ PrintWriter, StringWriter }
import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.control.NonFatal

class NotificationService()(implicit
  executionContext: ExecutionContext
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  val topLimit    = 5
  val client      = "client"
  private val top = "top"

  def getIpLocations(ipList: Array[String]): Route = complete {
    logger.info("Getting ip locations")
    try
      IpGeoManager.getCountries(ipList)
    catch {
      case NonFatal(e) =>
        if (e.getMessage.contains("Status: 408")) {
          (StatusCodes.RequestTimeout, "Session expired!")
        } else {
          (StatusCodes.InternalServerError, "Internal server error")
        }
    }
  }

  def getEventLog(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/log/event",
      GET,
      "",
      tokenId
    )
  }

  def getIncidentLog(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/log/incident",
      GET,
      "",
      tokenId
    )
  }

  def getViolationLog(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/log/violation",
      GET,
      "",
      tokenId
    )
  }

  def getViolationTopWorkloadLog(tokenId: String, category: String): Route = complete {
    category match {
      case `client` =>
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/log/violation/workload?s_client=desc&start=0&limit=5",
          GET,
          "",
          tokenId
        )
      case _        =>
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/log/violation/workload?s_server=desc&start=0&limit=5",
          GET,
          "",
          tokenId
        )
    }
  }

  def trackViolationLog(tokenId: String, violationBrief: ViolationBrief): Route =
    try {
      val result     = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/log/violation",
        GET,
        "",
        tokenId
      )
      val violations =
        jsonToViolationWrap(
          Await.result(result, RestClient.waitingLimit.seconds)
        ).violations
      val track      = violations.filter(violation =>
        violation.client_id.equals(violationBrief.client_name) &&
        violation.server_id.equals(violationBrief.server_name) &&
        violation.reported_at.isAfter(violationBrief.reported_at.minusHours(2)) &&
        violation.reported_at.isBefore(violationBrief.reported_at.plusHours(2))
      )
      complete(track)
    } catch {
      case NonFatal(e) =>
        complete(onNonFatal(e))
    }

  def getAuditLog(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/log/audit",
      GET,
      "",
      tokenId
    )
  }

  def getAudit2Log(tokenId: String, start: Option[String], limit: Option[String]): Route = {
    logger.info("tokenId: {}", tokenId)
    val cacheKey = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
    try
      complete {
        var elements: List[org.json4s.JsonAST.JValue] = null
        var auditStr: String                          = null
        if (start.isEmpty || start.get.toInt == 0) {
          val url      = s"${baseClusterUri(tokenId)}/log/audit"
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
          val output     =
            elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
          if (output.length < limit.get.toInt) {
            paginationCacheManager[List[org.json4s.JsonAST.JValue]]
              .removePagedData(s"$cacheKey-audit")
          }
          val pagedRes   = compact(render(JArray(output)))
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
    catch {
      case NonFatal(e) =>
        logger.warn(e.getMessage)
        if (
          e.getMessage.contains("Status: 401") || e.getMessage.contains(
            "Status: 403"
          )
        ) {
          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
            .removePagedData(s"$cacheKey-audit")
          complete((StatusCodes.Unauthorized, "Authentication failed!"))
        } else {
          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
            .removePagedData(s"$cacheKey-audit")
          complete((StatusCodes.InternalServerError, "Controller unavailable!"))
        }
      case e @ (_: TimeoutException) =>
        logger.warn(e.getMessage)
        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
          .removePagedData(s"$cacheKey-audit")
        complete(
          (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
        )
    }
  }

  def getThreatLog(tokenId: String, id: Option[String]): Route = complete {
    id match {
      case None       =>
        try {
          val threatsRes       = RestClient.requestWithHeaderDecode(
            s"${baseClusterUri(tokenId)}/log/threat",
            GET,
            "",
            tokenId
          )
          val threats          =
            jsonToThreatsEndpointData(
              Await.result(threatsRes, RestClient.waitingLimit.seconds)
            ).threats
          val convertedThreats = threats.zipWithIndex.map { case (threat, _) =>
            threatsToConvertedThreats(threat)
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

  def trackThreatLog(tokenId: String, violationBrief: ViolationBrief): Route = try {
    val result  =
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
    val track   = threats.filter(threat =>
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
    complete(track)
  } catch {
    case NonFatal(e) =>
      complete(onNonFatal(e))
  }

  def getThreatTopLog(tokenId: String): Route = complete {
    try {
      val threatRes =
        RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/log/threat",
          GET,
          "",
          tokenId
        )
      val threats   = jsonToThreatWrap(
        Await.result(threatRes, RestClient.waitingLimit.seconds)
      ).threats
      val DTOs      = threats
        .map(brief =>
          ThreatBriefDTO(
            brief.name,
            brief.severity,
            EnumUtils.getCode(brief.severity),
            brief.application
          )
        )
        .distinct
      val size      = DTOs.length
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

  def getNetworkSessionById(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/session?f_workload=$id&limit=256",
      GET,
      "",
      tokenId
    )
  }

  def deleteNetworkConversation(tokenId: String, from: String, to: String): Route = complete {
    logger.info("Clear from {} to {}", from, to)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/conversation/$from/$to",
      DELETE,
      "",
      tokenId
    )
  }

  def updateNetworkConversationEndpoint(tokenId: String, config: EndpointConfigWrap): Route =
    complete {
      logger.info("Renaming endpoint: {}", config.config.id)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/conversation_endpoint/${config.config.id}",
        PATCH,
        endpointConfigWrapToJson(config),
        tokenId
      )
    }

  def deleteNetworkConversationEndpoint(tokenId: String, id: String): Route = complete {
    logger.info("Removing unmanaged endpoint: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/conversation_endpoint/$id",
      DELETE,
      "",
      tokenId
    )
  }

  def getNetworkConversationHistory(tokenId: String, from: String, to: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/conversation/$from/$to",
      GET,
      "",
      tokenId
    )
  }

  def getNetworkGraph(tokenId: String, user: String): Route = complete {
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

  def createNetworkGraph(graphLayout: UserGraphLayout): Route = {
    logger.info("saving positions for user: {}", graphLayout.user)
    GraphCacheManager.saveNodeLayout(graphLayout)
    logger.debug(layoutToJson(graphLayout))

    complete(HttpEntity.Empty)
  }

  def getNetworkGraphLayout(user: String): Route = complete {
    UserGraphLayout(user, GraphCacheManager.getNodeLayout(user))
  }

  def getNetworkGraphBlacklist(user: String): Route = complete {
    BlacklistCacheManager.getBlacklist(user)
  }

  def createNetworkGraphBlacklist(userBlacklist: UserBlacklist): Route = {
    logger.info("saving blacklist for user: {}", userBlacklist.user)
    BlacklistCacheManager.saveBlacklist(userBlacklist)
    complete(HttpEntity.Empty)
  }

  def getSecurityEvents(tokenId: String): Route = complete {
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

      notificationsOut ++= threatMajor.zipWithIndex.map { case (threat, i) =>
        threatsToSecurityEvents(threatDetails, threat, i)
      }
      notificationsOut ++= violationMajor.zipWithIndex.map { case (violation, i) =>
        violationsToSecurityEvents(violationDetails, violation, i)
      }
      notificationsOut ++= incidentMajor.zipWithIndex.map { case (incident, i) =>
        incidentsToSecurityEvents(incidentDetails, incident, i)
      }
      notificationsOut = notificationsOut.sortWith(_.reported_timestamp > _.reported_timestamp)
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

  def getSecurityEvents2(tokenId: String): Route = complete {
    try {
      val (_, (threats, violations, incidents)) = getNotifications(tokenId)
      List(threats, violations, incidents)
    } catch {
      case NonFatal(e) =>
        onNonFatal(e)
    }
  }

  def acceptGlobalNotification(
    tokenId: String,
    notificationRequest: GlobalNotificationRequest
  ): Route = {
    logger.info(
      "Accept the Global notification {}",
      acceptNotificationToJson(notificationRequest)
    )
    complete {
      RestClient.httpRequestWithHeader(
        s"$baseUri/internal/alert",
        POST,
        acceptNotificationToJson(notificationRequest),
        tokenId
      )
    }
  }

  private def getNotifications(tokenId: String) = {
    val startTime     = new DateTime()
    logger.info("notifications Start: {}", startTime)
    val threatsRes    = RestClient.requestWithHeaderDecode(
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
    val incidentsRes  = RestClient.requestWithHeaderDecode(
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
      .filter(x =>
        !"exit".equals(x.state) && x.share_ns_with.isEmpty && x.id.nonEmpty
        && !(x.domain.isEmpty && !x.service_group
          .exists(_.trim.nonEmpty) && x.kind == "container")
      )
      .map(endpointToNode)

    val nodeMap: Map[String, Node] = nodes.foldLeft(Map[String, Node]()) { (m, s) =>
      m + (s.id -> s)
    }

    logger.debug("Network graph nodes size: {}", nodes.length)

    val conversations = graphData.conversations
    val edges         = conversations.map(conversationToEdge(_, nodeMap))

    logger.debug("Network graph edges size: {}", edges.length)

    val markedNodes = nodes.map(node =>
      if (node.platform_role.nonEmpty) {
        node.copy(platform_role = "System")
      } else {
        node
      }
    )
    (edges, markedNodes)
  }
}
