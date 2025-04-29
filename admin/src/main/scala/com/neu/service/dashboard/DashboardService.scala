package com.neu.service.dashboard

import com.google.common.net.UrlEscapers
import com.neu.cache.JsonStringCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.DashboardJsonProtocol.{ *, given }
import com.neu.model.DashboardSecurityEventsProtocol.{ *, given }
import com.neu.model.ResourceJsonProtocol.*
import com.neu.model.SystemConfigJsonProtocol.*
import com.neu.model.*
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route
import org.joda.time.DateTime

import scala.concurrent.Await
import scala.concurrent.ExecutionContext
import scala.concurrent.Future
import scala.concurrent.duration.*
import scala.reflect.ClassTag
import scala.util.control.NonFatal

class DashboardService()(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats
    with LazyLogging {

  given workloadChildrenClassTag: ClassTag[WorkloadChildren] = ClassTag(classOf[WorkloadChildren])

  val topLimit                = 5
  private final val VIOLATE   = "violate"
  private final val DENY      = "deny"
  private final val DASHBOARD = "dashboard"

  private final val timeOutStatus              = "Status: 408"
  private final val authenticationFailedStatus = "Status: 401"
  private final val serverErrorStatus          = "Status: 503"

  def getMultiClusterSummary(tokenId: String, clusterId: Option[String]): Route = complete {
    try {
      val baseUrl                                          =
        if (clusterId.isDefined)
          s"${baseClusterUri(tokenId)}/fed/cluster/${clusterId.get}/v1"
        else s"${baseClusterUri(tokenId)}"
      val summaryOwner                                     = clusterId.fold("master") { clusterId =>
        clusterId
      }
      val summaryRes                                       = RestClient.requestWithHeaderDecode(
        s"$baseUrl/system/summary",
        HttpMethods.GET,
        "",
        tokenId
      )
      val systemScoreRes                                   = RestClient.requestWithHeaderDecode(
        s"$baseUrl/system/score/metrics",
        HttpMethods.GET,
        "",
        tokenId
      )
      val multiClusterSummaryRes: Future[(String, String)] =
        for {
          summary     <- summaryRes.recoverWith { case _: Exception =>
                           val cachedSummaryJsonStr =
                             JsonStringCacheManager.getJson(summaryOwner)
                           cachedSummaryJsonStr.fold(
                             Future {
                               "error"
                             }
                           ) { cachedSummaryJsonStr =>
                             Future {
                               cachedSummaryJsonStr
                             }
                           }
                         }
          systemScore <- systemScoreRes.recoverWith { case _: Exception =>
                           Future {
                             systemScoreDataToJson(
                               SystemScore(
                                 SecurityScores(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                                 Metrics(
                                   "",
                                   "",
                                   "",
                                   "",
                                   "",
                                   Some(""),
                                   Some(0),
                                   0,
                                   0,
                                   RiskScoreMetricsWL(0, 0, 0, 0, 0, 0, 0, 0),
                                   RiskScoreMetricsGroup(0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                                   RiskScoreMetricsCVE(0, 0, 0, 0, 0)
                                 ),
                                 Array(),
                                 Array()
                               )
                             )
                           }
                         }
        } yield (
          summary,
          systemScore
        )

      val multiClusterSummary: (String, String) =
        Await.result(multiClusterSummaryRes, RestClient.waitingLimit.seconds)
      val summary                               = multiClusterSummary._1

      JsonStringCacheManager.saveJson(summaryOwner, summary)
      val systemScore = jsonToSystemScoreDataToJson(multiClusterSummary._2)

      MultiClusterSummary(
        systemScore.security_scores,
        summary
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def getSystemAlertInformation(tokenId: String): Route = {
    logger.info("Loading System Alerts information ...")
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/alerts",
        HttpMethods.GET,
        "",
        tokenId,
        None,
        None,
        Some("globalAlerts")
      )
    }
  }

  def getDetails(tokenId: String, domain: Option[String]): Route = complete {
    try {
      val domainVal     = domain.getOrElse("")
      val query4Domain1 =
        if (domainVal.isEmpty) ""
        else s"?f_domain=${UrlEscapers.urlFragmentEscaper().escape(domainVal)}"
      val query4Domain2 =
        if (domainVal.isEmpty) ""
        else s"&f_domain=${UrlEscapers.urlFragmentEscaper().escape(domainVal)}"
      val startTime     = new DateTime()
      logger.info("dashboard scores Start: {}", startTime)

      /*========================================================================================
          Pull data from Controller's APIs
       ========================================================================================*/
      val vulNodesRes       = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/host?start=0&limit=0$query4Domain2",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val servicesRes       = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/group?view=pod&scope=local$query4Domain2",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val policiesRes       = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/policy/rule$query4Domain1",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val containersRes     = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/workload?view=pod",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val conversationsRes  = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/conversation$query4Domain1",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val autoScanConfigRes = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/scan/config",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )

      /*========================================================================================
          Asynchronously get json response from APIs
       ========================================================================================*/
      val dashboardRes: Future[
        (
          String,
          String,
          String,
          String,
          String,
          String
        )
      ] =
        for {
          vulNodes       <- vulNodesRes.recoverWith { case e: Exception =>
                              handleScanHostException(e)
                            }
          services       <- servicesRes.recoverWith { case e: Exception =>
                              handleServiceException(e)
                            }
          policies       <- policiesRes.recoverWith { case e: Exception =>
                              handlePolicyException(e)
                            }
          conversations  <- conversationsRes.recoverWith { case e: Exception =>
                              handleConversationException(e)
                            }
          containers     <- containersRes.recoverWith { case e: Exception =>
                              handleWorkloadException(e)
                            }
          autoScanConfig <- autoScanConfigRes.recoverWith { case e: Exception =>
                              handleAutoScanConfigException(e)
                            }
        } yield (
          vulNodes,
          services,
          policies,
          conversations,
          containers,
          autoScanConfig
        )

      val dashboard: (
        String,
        String,
        String,
        String,
        String,
        String
      ) =
        Await.result(dashboardRes, RestClient.waitingLimit.seconds)

      val endTimeAPI           = new DateTime()
      logger.info("Dashboard scores - Multiple API call end: {}", endTimeAPI)
      logger.info(
        "Dashboard scores - Multiple API call duration: {}",
        endTimeAPI.getMillis - startTime.getMillis
      )
      /*========================================================================================
          Parse json response into object
       ========================================================================================*/
      val calculationStartTime = new DateTime()
      logger.info("Dashboard scores - Calculation Start: {}", calculationStartTime)

      val vulNodes       = jsonToVulnerableNodeEndpoint(dashboard._1)
      val services       = jsonToServiceStatesIn(dashboard._2)
      val policies       = jsonToApplicationsInPolicyWrap(dashboard._3)
      val conversations  = jsonToGraphData(dashboard._4)
      val containers     = jsonToWorkloadsWrap(dashboard._5)
      val autoScanConfig = jsonToAutoScanConfig(dashboard._6)
      val autoScan       =
        if (autoScanConfig.error.isDefined) {
          Left(autoScanConfig.error.get)
        } else {
          Right(getAutoScan(autoScanConfig))
        }

      if (containers.error.isDefined) {
        Left(containers.error.get)
      } else {
        Right(
          getDomains(containers)
        )
      }

      val policyOutput =
        if (policies.error.isDefined) {
          Left(policies.error.get)
        } else {
          Right(getPolicyOutput(policies))
        }

      val serviceMaps =
        if (services.error.isDefined) {
          Left(services.error.get)
        } else {
          policyOutput match {
            case Left(x)  => Left(x)
            case Right(x) => Right(getServiceMaps(services, x.groupSet))
          }
        }

      val runningContainers =
        if (containers.error.isDefined) {
          Left(containers.error.get)
        } else {
          serviceMaps match {
            case Left(x)  => Left(x)
            case Right(x) =>
              Right(
                if (domainVal.isEmpty)
                  containers.workloads
                    .filter((workload: Workload) =>
                      workload.state != "exit" && x.serviceMap
                        .contains(s"nv.${workload.service}")
                    )
                else
                  containers.workloads
                    .filter((workload: Workload) =>
                      workload.state != "exit" && workload.domain == domainVal && x.serviceMap
                        .contains(s"nv.${workload.service}")
                    )
              )
          }
        }

      runningContainers match {
        case Right(x) => Right(x.length)
        case Left(x)  => Left(x)
      }

      val runningContainersOutput =
        runningContainers match {
          case Left(x)  => Left(x)
          case Right(x) =>
            serviceMaps match {
              case Left(y)  => Left(y)
              case Right(y) => Right(getRunningContainersOutput(x, y))
            }
        }

      if (containers.error.isDefined) {
        Left(containers.error.get)
      } else {
        serviceMaps match {
          case Left(_)  =>
          case Right(x) => Right(getVulContainerOutput(containers, domainVal, x))
        }
      }

      if (vulNodes.error.isDefined) {
        Left(vulNodes.error.get)
      } else {
        Right(getVulNodeOutput(vulNodes))
      }

      val servicesOutput =
        serviceMaps match {
          case Left(x)  => Left(x)
          case Right(x) => Right(x.groups)
        }

      val conversationsOutput =
        if (conversations.error.isDefined) {
          Left(conversations.error.get)
        } else {
          runningContainersOutput match {
            case Left(x)  => Left(x)
            case Right(x) =>
              serviceMaps match {
                case Left(y)  => Left(y)
                case Right(y) =>
                  Right(getConversationsOutput(conversations.conversations, x, y))
              }
          }
        }

      /*========================================================================================
         Construct dashboard API response
       ========================================================================================*/
      val dashboardScoreDTO = DashboardScoreDTO2(
        serviceMaps match {
          case Left(x)  => Left(x)
          case Right(x) =>
            Right(getHighPriorityVulnerabilities(containers, vulNodes, domainVal, x))
        },
        runningContainers,
        servicesOutput,
        policyOutput match {
          case Left(x)  => Left(x)
          case Right(x) => Right(x.applicationsInPolicy)
        },
        conversationsOutput match {
          case Left(x)  => Left(x)
          case Right(x) => Right(x.applicationsInPolicy2)
        },
        serviceMaps match {
          case Left(x)  => Left(x)
          case Right(x) =>
            Right(
              PolicyCoverage(
                x.serviceUnderRulesMap.values.toArray,
                x.otherServiceMap.values.toArray
              )
            )
        },
        autoScan
      )
      logger.debug("Got {}", dashboardScoreDTO)
      val endTime           = new DateTime()
      logger.info("Dashbaord scores - End: {}", endTime)
      logger.info(
        "Dashbaord scores - Calculation Duration: {}",
        endTime.getMillis - calculationStartTime.getMillis
      )
      logger.info(
        "Dashbaord scores - Duration: {}",
        endTime.getMillis - startTime.getMillis
      )

      dashboardScoreDTO
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def queryScore(tokenId: String, metricsData: MetricsWrap): Route =
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/score/metrics",
        HttpMethods.POST,
        metricsWrapDataToJson(metricsData),
        tokenId
      )
    }

  def getScore(tokenId: String, isGlobalUser: Option[String], domain: Option[String]): Route =
    complete {
      val domainVal       = domain.getOrElse("")
      val isGlobalUserVal = isGlobalUser.getOrElse("true") == "true"
      val query4Domain    = if (domain.isEmpty) "" else s"f_domain=$domainVal"
      val query           = s"${query4Domain}&isGlobalUser=$isGlobalUserVal"
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/score/metrics?$query",
        HttpMethods.GET,
        "",
        tokenId
      )
    }

  def getNotifications(tokenId: String, domain: Option[String]): Route = complete {
    try {
      val startTime    = new DateTime()
      logger.info("Dashboard notifications - Start: {}", startTime)
      val domainVal    = domain.getOrElse("")
      val query4Domain = if (domainVal.isEmpty) "" else s"f_domain=$domainVal"

      /*========================================================================================
          Pull data from Controller's APIs
       ========================================================================================*/
      val threatsRes    = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/log/threat$query4Domain",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val violationsRes = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/log/violation$query4Domain",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )
      val incidentsRes  = RestClient.requestWithHeaderDecode(
        s"${baseClusterUri(tokenId)}/log/incident$query4Domain",
        HttpMethods.GET,
        "",
        tokenId,
        DASHBOARD
      )

      /*========================================================================================
          Asynchronously get json response from APIs
       ========================================================================================*/
      val dashboardRes: Future[(String, String, String)] =
        for {
          threats    <- threatsRes.recoverWith { case e: Exception =>
                          handleLogThreatException(e)
                        }
          violations <- violationsRes.recoverWith { case e: Exception =>
                          handleLogViolationException(e)
                        }
          incidents  <- incidentsRes.recoverWith { case e: Exception =>
                          handleLogIncidentException(e)
                        }
        } yield (threats, violations, incidents)

      val dashboard: (String, String, String) =
        Await.result(dashboardRes, RestClient.waitingLimit.seconds)

      val endTimeAPI           = new DateTime()
      logger.info("Dashboard notifications - Multiple API call end: {}", endTimeAPI)
      logger.info(
        "Dashboard notifications - Multiple API call duration: {}",
        endTimeAPI.getMillis - startTime.getMillis
      )
      /*========================================================================================
          Parse json response into object
       ========================================================================================*/
      val calculationStartTime = new DateTime()
      logger.info(
        "Dashboard notifications - Calculation Start: {}",
        calculationStartTime
      )

      val threats    = jsonToDashboardThreatData(dashboard._1)
      val violations = jsonToDashboardViolationData(dashboard._2)
      val incidents  = jsonToDashboardIncidentData(dashboard._3)

      /*========================================================================================
         Construct dashboard API response
       ========================================================================================*/
      val dashboardNotificationDTO = DashboardNotificationDTO2(
        getCriticalSecurityEvents2(threats, violations, incidents)
      )
      logger.debug("Got {}", dashboardNotificationDTO)
      val endTime                  = new DateTime()
      logger.info("Dashboard notifications - End: {}", endTime)
      logger.info(
        "Dashboard notifications - Calculation Duration: {}",
        endTime.getMillis - calculationStartTime.getMillis
      )
      logger.info(
        "Dashboard notifications - Duration: {}",
        endTime.getMillis - startTime.getMillis
      )

      dashboardNotificationDTO
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  private lazy val getDomains = (
    containers: WorkloadsWrap
  ) =>
    containers.workloads
      .map(workload => workload.domain)
      .distinct
      .filter(domain => domain.nonEmpty)

  private lazy val getVulNodeOutput = (
    vulNodes: VulnerableNodeEndpoint
  ) => {
    var nodeHighVuls = 0
    var nodeMedVuls  = 0
    vulNodes.hosts.foreach { node =>
      nodeHighVuls += node.scan_summary.fold(0)(scan_summary => scan_summary.high)
      nodeMedVuls += node.scan_summary.fold(0)(scan_summary => scan_summary.medium)
    }

    VulNodeOutput(
      nodeHighVuls,
      nodeMedVuls,
      vulNodes.hosts.length
    )
  }

  private lazy val getVulContainerOutput = (
    vulContainers: WorkloadsWrap,
    domain: String,
    serviceMaps: ServiceMaps
  ) => {
    val highVulsMap                   = collection.mutable.Map[String, Int]()
    val medVulsMap                    = collection.mutable.Map[String, Int]()
    var totalScannedPodsWithoutSystem = 0
    logger.info("serviceMaps.serviceMap: {}", serviceMaps.serviceMap)
    logger.info("serviceMaps.serviceMap.isEmpty: {}", serviceMaps.serviceMap.isEmpty)
    val vulContainersByDomain         =
      vulContainers.workloads
        .filter((container: Workload) =>
          container.state != "exit" &&
          container.platform_role == "" &&
          (
            serviceMaps.serviceMap.isEmpty ||
            (
              serviceMaps.serviceMap.nonEmpty &&
              serviceMaps.serviceMap.contains(s"nv.${container.service}")
            )
          ) &&
          (domain.isEmpty || container.domain.equals(domain))
        )

    logger.info("vulContainersByDomain: {}", vulContainersByDomain)
    vulContainersByDomain.foreach { container =>
      highVulsMap += (
        container.state -> (
          highVulsMap.getOrElse(container.state, 0)
          + container.scan_summary.fold(0)(scan_summary => scan_summary.high)
        )
      )
      medVulsMap += (
        container.state -> (
          medVulsMap.getOrElse(container.state, 0)
          + container.scan_summary.fold(0)(scan_summary => scan_summary.medium)
        )
      )
      totalScannedPodsWithoutSystem += 1
      if (
        container.children.isDefined && container.children
          .getOrElse(Array.empty[WorkloadChildren])
          .nonEmpty
      ) {
        container.children.get.filter(child => child.state != "exit").foreach { child =>
          highVulsMap += (
            container.state -> (
              highVulsMap.getOrElse(container.state, 0)
              + child.scan_summary.fold(0)(scan_summary => scan_summary.high)
            )
          )
          medVulsMap += (
            container.state -> (
              medVulsMap.getOrElse(container.state, 0)
              + child.scan_summary.fold(0)(scan_summary => scan_summary.medium)
            )
          )
        }
      }
    }

    VulContainerOutput(
      highVulsMap.toMap,
      medVulsMap.toMap,
      vulContainersByDomain.length,
      totalScannedPodsWithoutSystem
    )
  }

  private lazy val getConversationsOutput = (
    conversations: Array[EndPointConversation],
    containersOutput: WorkloadsOutput,
    servicesMaps: ServiceMaps
  ) => {
    var ingressConversationsArray: Array[ServiceLevelConversation]           =
      Array[ServiceLevelConversation]()
    var egressConversationsArray: Array[ServiceLevelConversation]            =
      Array[ServiceLevelConversation]()
    val conversationMap: collection.mutable.Map[String, ApplicationAnalysis] =
      collection.mutable.Map[String, ApplicationAnalysis]()
    conversations.foreach { conversation =>
      // 1 -------part 1 start
      if (
        (
          conversation.from == "external" ||
          conversation.from == "Workload:ingress"
        ) && containersOutput.containerMap.contains(conversation.to)
      ) {
        val containerVal          = containersOutput.containerMap(conversation.to)
        val groupName             = "nv." + containerVal.service
        val serviceMode           =
          if (servicesMaps.serviceUnderRulesMap.contains(groupName))
            servicesMaps.serviceUnderRulesMap(groupName).policy_mode.getOrElse("")
          else if (servicesMaps.otherServiceMap.contains(groupName))
            servicesMaps.otherServiceMap(groupName).policy_mode.getOrElse("")
          else ""
        val convertedConversation = ServiceLevelConversation(
          conversation.to,
          conversation.from,
          containerVal.service,
          serviceMode,
          containerVal.display_name,
          conversation.bytes,
          conversation.sessions,
          conversation.severity,
          conversation.policy_action,
          conversation.event_type,
          conversation.protocols,
          conversation.applications,
          conversation.ports
        )
        ingressConversationsArray = ingressConversationsArray :+ convertedConversation
      }
      if (
        (
          conversation.to == "external" ||
          conversation.to == "Workload:ingress"
        ) && containersOutput.containerMap.contains(conversation.from)
      ) {
        val containerVal          = containersOutput.containerMap(conversation.from)
        val groupName             = "nv." + containerVal.service
        val serviceMode           =
          if (servicesMaps.serviceUnderRulesMap.contains(groupName))
            servicesMaps.serviceUnderRulesMap(groupName).policy_mode.getOrElse("")
          else if (servicesMaps.otherServiceMap.contains(groupName))
            servicesMaps.otherServiceMap(groupName).policy_mode.getOrElse("")
          else ""
        val convertedConversation = ServiceLevelConversation(
          conversation.from,
          conversation.to,
          containerVal.service,
          serviceMode,
          containerVal.display_name,
          conversation.bytes,
          conversation.sessions,
          conversation.severity,
          conversation.policy_action,
          conversation.event_type,
          conversation.protocols,
          conversation.applications,
          conversation.ports
        )
        egressConversationsArray = egressConversationsArray :+ convertedConversation
      }
      // 1 ------- part 1 end
      // 2 ------- part 1 start
      if (conversation.applications.isEmpty) {
        val application = "Others"
        conversationMap += (application -> accumulateApplicationAnalysisData(
          conversationMap.getOrElse(application, ApplicationAnalysis(0, 0)),
          1,
          conversation.bytes
        ))
      } else {
        conversation.applications.get.foreach { application =>
          conversationMap += (application -> accumulateApplicationAnalysisData(
            conversationMap.getOrElse(application, ApplicationAnalysis(0, 0)),
            1,
            conversation.bytes
          ))
        }
      }
      // 2 ------- part 1 end
    }
    // 1 ------- part 2 start
    val filteredIngressConversations                                         = ingressConversationsArray
    val filteredEgressConversations                                          = egressConversationsArray
    logger.info("ingressConversations: {}", filteredIngressConversations.length)
    logger.info("egressConversations: {}", filteredEgressConversations.length)

    var ingressConversations: Array[ServiceLevelConversationWrap] =
      Array[ServiceLevelConversationWrap]()

    filteredIngressConversations.groupBy(_.service).foreach { case (k, v) =>
      val serviceGroup = getExposedConversation(k, v)
      ingressConversations = ingressConversations :+ serviceGroup
    }

    var egressConversations: Array[ServiceLevelConversationWrap] =
      Array[ServiceLevelConversationWrap]()
    filteredEgressConversations.groupBy(_.service).foreach { case (k, v) =>
      val serviceGroup = getExposedConversation(k, v)
      egressConversations = egressConversations :+ serviceGroup
    }

    val exposureModeMap: collection.mutable.Map[String, Int] = collection.mutable.Map[String, Int]()
    var exposureThreat                                       = 0
    var exposureViolation                                    = 0

    ingressConversations.foreach { ingressConversation =>
      exposureModeMap += (ingressConversation.policy_mode.toLowerCase -> (exposureModeMap.getOrElse(
        ingressConversation.policy_mode.toLowerCase,
        0
      ) + ingressConversation.children.length))
      ingressConversation.children.foreach { child =>
        if (child.severity.getOrElse("") != "") {
          exposureThreat += 1
        } else if (
          child.policy_action.toLowerCase == DENY || child.policy_action.toLowerCase == VIOLATE
        ) {
          exposureViolation += 1
        }
      }
    }

    egressConversations.foreach { egressConversation =>
      exposureModeMap += (egressConversation.policy_mode.toLowerCase -> (exposureModeMap.getOrElse(
        egressConversation.policy_mode.toLowerCase,
        0
      ) + egressConversation.children.length))
      egressConversation.children.foreach { child =>
        if (child.severity.getOrElse("") != "") {
          exposureThreat += 1
        } else if (
          child.policy_action.toLowerCase == DENY || child.policy_action.toLowerCase == VIOLATE
        ) {
          exposureViolation += 1
        }
      }
    }
    // 1 ------- part 2 end

    // 2 ------- part 2 start
    val applicationsInPolicy2 = conversationMap.toList
    // 2 ------- part 2 end
    ConversationOutput(
      exposureModeMap.toMap,
      exposureThreat,
      exposureViolation,
      ingressConversations,
      egressConversations,
      applicationsInPolicy2
    )
  }

  private lazy val getServiceMaps = (
    services: ServiceStatesIn,
    groupSet: Set[String]
  ) => {
    val serviceUnderRulesMap: collection.mutable.Map[String, ServiceStateIn] =
      collection.mutable.Map[String, ServiceStateIn]()
    val otherServiceMap: collection.mutable.Map[String, ServiceStateIn]      =
      collection.mutable.Map[String, ServiceStateIn]()
    val serviceMap: collection.mutable.Map[String, ServiceStateIn]           =
      collection.mutable.Map[String, ServiceStateIn]()
    val ipServiceMap: collection.mutable.Map[String, ServiceStateIn]         =
      collection.mutable.Map[String, ServiceStateIn]()
    val serviceModeMap: collection.mutable.Map[String, Int]                  = collection.mutable.Map[String, Int]()

    services.groups
      .filter(group => !group.not_scored && group.platform_role == "" && group.kind != "node")
      .foreach { service =>
        if (service.members.length > 0) {
          serviceModeMap += (service.policy_mode.getOrElse("").toLowerCase -> (serviceModeMap
            .getOrElse(service.policy_mode.getOrElse("").toLowerCase, 0) + 1))
          if (service.members.length > 0) {
            if (groupSet.contains(service.name)) {
              serviceUnderRulesMap += (service.name -> service)
            } else {
              otherServiceMap += (service.name -> service)
            }
          }
          serviceMap += (service.name                                      -> service)
        }
        if (service.kind.equals("ip_service")) {
          ipServiceMap += (service.name -> service)
        }
      }

    ServiceMaps(
      serviceUnderRulesMap.toMap,
      otherServiceMap.toMap,
      ipServiceMap.toMap,
      serviceMap.toMap,
      serviceModeMap.toMap,
      services.groups.filter(group =>
        !group.not_scored && group.platform_role == "" && group.kind != "node"
      )
    )
  }

  private lazy val getPolicyOutput = (
    policies: ApplicationsInPolicyWrap
  ) => {
    val groupSet: collection.mutable.Set[String] = collection.mutable.Set[String]()
    policies.rules.foreach { policy =>
      if (policy.from.startsWith("nv.")) {
        groupSet += policy.from.substring(3)
      }
      if (policy.to.startsWith("nv.")) {
        groupSet += policy.to.substring(3)
      }
    }

    val applicationsInPolicy = policies.rules
      .flatMap(x => x.applications)
      .groupBy(x => x)
      .map { case (k, v) => k -> v.length }
      .toList
      .sortWith(_._2 > _._2)

    logger.info("groupSet: {}", groupSet.size)

    PolicyOutput(
      groupSet.toSet,
      applicationsInPolicy
    )
  }

  private lazy val getRunningContainersOutput = (
    runningContainers: Array[Workload],
    serviceMaps: ServiceMaps
  ) => {
    var hasPrivilegedContainer                                       = false
    var hasRunAsRoot                                                 = false
    val containerMap: collection.mutable.Map[String, WorkloadBrief2] =
      collection.mutable.Map[String, WorkloadBrief2]()
    runningContainers.foreach { workload =>
      containerMap += (workload.id -> WorkloadBrief2(workload.display_name, workload.service))
      if (
        workload.children.isDefined &&
        workload.children
          .getOrElse(Array.empty[WorkloadChildren])
          .nonEmpty &&
        serviceMaps.serviceMap.contains(s"nv.${workload.service}") &&
        workload.platform_role == ""
      ) {
        workload.children.getOrElse(Array.empty[WorkloadChildren]).foreach { child =>
          if (child.privileged) {
            hasPrivilegedContainer = true
          }
          if (child.run_as_root) {
            hasRunAsRoot = true
          }
        }
      }
    }
    WorkloadsOutput(
      containerMap.toMap,
      hasPrivilegedContainer,
      hasRunAsRoot
    )
  }

  private lazy val getAutoScan = (
    autoScanConfig: AutoScanConfig
  ) =>
    autoScanConfig.config.enable_auto_scan_host.getOrElse(
      autoScanConfig.config.auto_scan.getOrElse(false)
    ) && autoScanConfig.config.enable_auto_scan_workload.getOrElse(
      autoScanConfig.config.auto_scan.getOrElse(false)
    )

  private lazy val getExposedConversation = (
    k: String,
    v: Array[ServiceLevelConversation]
  ) => {
    var applications    = Set[String]()
    v.foreach(child =>
      applications = applications ++
        child.applications.getOrElse(Array[String]()) ++
        child.ports.getOrElse(Array[String]())
    )
    val policyActionMap = Map(
      "deny"    -> 0,
      "violate" -> 1,
      "allow"   -> 2
    )

    val serviceGroup = ServiceLevelConversationWrap(
      "",
      "",
      k,
      v.head.policy_mode,
      "",
      0,
      0,
      Option(""),
      "",
      Option(""),
      Option(Array("")),
      Option(applications.toArray),
      Option(Array()),
      v.map { child =>
        child.copy(
          service = "",
          policy_action = policyActionMap.keys.toList(
            policyActionMap.getOrElse(child.policy_action.toLowerCase, 2)
          )
        )
      }
    )
    serviceGroup
  }

  private lazy val accumulateApplicationAnalysisData = (
    data: ApplicationAnalysis,
    count: Int,
    bytes: BigInt
  ) =>
    ApplicationAnalysis(
      data.count + count,
      data.totalBytes + bytes
    )

  private lazy val getCriticalSecurityEvents2 = (
    threats: DashboardThreatData,
    violations: DashboardViolationData,
    incidents: DashboardIncidentData
  ) =>
    if (threats.error.isDefined) {
      Left(threats.error.get)
    } else if (violations.error.isDefined) {
      Left(violations.error.get)
    } else if (incidents.error.isDefined) {
      Left(incidents.error.get)
    } else {
      val convertedThreats    = threats.threats.zipWithIndex.map { case (threat, _) =>
        threatsToConvertedDashboardThreats(threat)
      }
      val convertedViolations = violations.violations.zipWithIndex.map { case (violation, _) =>
        violationsToConvertedDashboardViolations(violation)
      }
      val convertedIncidents  = incidents.incidents.zipWithIndex.map { case (incident, _) =>
        incidentsToConvertedDashboardIncidents(incident)
      }

      val convertedSecurityEvents =
        convertedThreats ++
        convertedViolations ++
        convertedIncidents

      val topSources = convertedSecurityEvents
        .groupBy(_.source_workload_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topSources => topSources._2)
        .toArray

      val topDestinations = convertedSecurityEvents
        .groupBy(_.destination_workload_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topDestinations => topDestinations._2)
        .toArray

      val summary = Map(
        "critical" -> convertedSecurityEvents
          .groupBy(securityEvent =>
            new DateTime(securityEvent.reported_at).toString().split("T").head
          )
          .map { case (k, v) =>
            k -> v.count(_.level.toLowerCase.equals("critical"))
          }
          .toSeq
          .sortBy(_._1),
        "warning"  -> convertedSecurityEvents
          .groupBy(securityEvent =>
            new DateTime(securityEvent.reported_at).toString().split("T").head
          )
          .map { case (k, v) =>
            k -> v.count(_.level.toLowerCase.equals("warning"))
          }
          .toSeq
          .sortBy(_._1)
      )

      Right(
        CriticalDashboardSecurityEventDTO(
          summary,
          TopSecurityEvent(topSources, topDestinations)
        )
      )
    }

  private lazy val getHighPriorityVulnerabilities = (
    vulContainers: WorkloadsWrap,
    vulNodes: VulnerableNodeEndpoint,
    domain: String,
    serviceMaps: ServiceMaps
  ) => {
    val vulnerableContainers = if (vulContainers.error.isDefined) {
      Left(vulContainers.error.get)
    } else {
      val vulContainersByDomain =
        vulContainers.workloads
          .filter((container: Workload) =>
            container.state != "exit" &&
            container.platform_role == "" &&
            (
              serviceMaps.serviceMap.isEmpty ||
              (
                serviceMaps.serviceMap.nonEmpty &&
                serviceMaps.serviceMap.contains(s"nv.${container.service}")
              )
            ) &&
            (domain.isEmpty || container.domain.equals(domain))
          )

      val top5Workloads = vulContainersByDomain.map { container =>
        val vulnerabilityNum = container.children.fold(
          (
            container.scan_summary.fold(0)(scan_summary => scan_summary.high),
            container.scan_summary.fold(0)(scan_summary => scan_summary.medium)
          )
        )(children =>
          children
            .filter(child => child.state != "exit")
            .foldLeft(
              container.scan_summary.fold(0)(scan_summary => scan_summary.high),
              container.scan_summary.fold(0)(scan_summary => scan_summary.medium)
            ) { (container, child) =>
              (
                container._1 + child.scan_summary
                  .fold(0)(scan_summary => scan_summary.high),
                container._2 + child.scan_summary
                  .fold(0)(scan_summary => scan_summary.medium)
              )
            }
        )

        val workload = container.copy(
          high4Dashboard = Some(vulnerabilityNum._1),
          medium4Dashboard = Some(vulnerabilityNum._2)
        )
        workload
      }
        .sortWith(
          _.medium4Dashboard.fold(0)(medium => medium) > _.medium4Dashboard
            .fold(0)(medium => medium)
        )
        .sortWith(_.high4Dashboard.fold(0)(high => high) > _.high4Dashboard.fold(0)(high => high))
        .filterNot { workloads =>
          workloads.high4Dashboard.fold(0)(high => high) == 0 &&
          workloads.medium4Dashboard.fold(0)(medium => medium) == 0
        }

      Right(
        VulnerableContainers(
          top5Workloads.take(topLimit),
          top5Workloads.length,
          vulContainersByDomain.length
        )
      )
    }

    val vulnerableNodes = if (vulNodes.error.isDefined) {
      Left(vulNodes.error.get)
    } else {
      val top5Nodes = vulNodes.hosts
        .sortWith(
          _.scan_summary.fold(0)(scan_summary => scan_summary.medium) > _.scan_summary
            .fold(0)(scan_summary => scan_summary.medium)
        )
        .sortWith(
          _.scan_summary.fold(0)(scan_summary => scan_summary.high) > _.scan_summary
            .fold(0)(scan_summary => scan_summary.high)
        )
        .filterNot { vulNodes =>
          vulNodes.scan_summary
            .fold(0)(scan_summary => scan_summary.high) == 0 && vulNodes.scan_summary
            .fold(0)(scan_summary => scan_summary.medium) == 0
        }

      Right(
        VulnerableNodes(
          top5Nodes.take(topLimit),
          top5Nodes.length
        )
      )
    }

    VulnerabilitiesDTO(
      vulnerableContainers,
      vulnerableNodes
    )
  }

  private def handleException(
    e: Exception,
    defaultResponseObj: String,
    f: Exception => Boolean = _.getMessage.contains("Status: 4")
  ): Future[String] =
    if (
      e.getMessage.contains("Status: 408") ||
      e.getMessage.contains("Status: 401") ||
      e.getMessage.contains("Status: 503")
    )
      throw e
    else {
      if (f(e)) {
        Future {
          s"""{$defaultResponseObj}"""
        }
      } else {
        Future {
          s"""{$defaultResponseObj, "error":{"message":"${e.getMessage
              .replace("\"", "\\\"")
              .replace("\n", ", ")}"}}"""
        }
      }
    }

  private def handleLogThreatException(e: Exception): Future[String] =
    handleException(e, "\"threats\": []")

  private def handleLogViolationException(e: Exception): Future[String] =
    handleException(e, "\"violations\": []")

  private def handleLogIncidentException(e: Exception): Future[String] =
    handleException(e, "\"incidents\": []")

  private def handleScanHostException(e: Exception): Future[String] =
    handleException(e, "\"hosts\": []")

  private def handleServiceException(e: Exception): Future[String] =
    handleException(e, "\"services\": []")

  private def handlePolicyException(e: Exception): Future[String] =
    handleException(e, "\"rules\": []")

  private def handleConversationException(e: Exception): Future[String] =
    handleException(e, "\"endpoints\":[], \"conversations\":[]")

  private def handleWorkloadException(e: Exception): Future[String] =
    handleException(e, "\"workloads\": []")

  private def handleAutoScanConfigException(e: Exception): Future[String] =
    Future {
      s"""{\"config\":{\"auto_scan\":false}, "error":{"message":"${e.getMessage
          .replace("\"", "\\\"")
          .replace("\n", ", ")}"}}"""
    }
}
