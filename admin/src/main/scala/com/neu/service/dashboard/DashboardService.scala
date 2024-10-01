package com.neu.service.dashboard

import com.google.common.net.UrlEscapers
import com.neu.cache.JsonStringCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.DashboardJsonProtocol.{ *, given }
import com.neu.model.DashboardSecurityEventsProtocol.{ *, given }
import com.neu.model.ResourceJsonProtocol.{ *, given }
import com.neu.model.SystemConfigJsonProtocol.{ *, given }
import com.neu.model.*
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.joda.time.DateTime
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, StatusCodes }
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext, Future }
import scala.util.control.NonFatal
import scala.reflect.ClassTag

class DashboardService()(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats
    with LazyLogging {

  given workloadChildrenClassTag: ClassTag[WorkloadChildren] = ClassTag(classOf[WorkloadChildren])

  val topLimit                                      = 5
  private final val DISCOVER                        = "discover"
  private final val MONITOR                         = "monitor"
  private final val PROTECT                         = "protect"
  private final val QUARANTINED                     = "quarantined"
  private final val VIOLATE                         = "violate"
  private final val DENY                            = "deny"
  private final val THRESHOLD_EXPOSURE_100          = 5.0
  private final val THRESHOLD_EXPOSURE_1000         = 25.0
  private final val THRESHOLD_EXPOSURE_10000        = 62.5
  private final val RATIO_PROTECT_MONITOR_EXPOSURE  = 1
  private final val RATIO_DISCOVER_EXPOSURE         = 3
  private final val RATIO_VIOLATED_EXPOSURE         = 4
  private final val RATIO_THREATENED_EXPOSURE       = 8
  private final val RATIO_DISCOVER_VUL              = 1.0 / 15
  private final val RATIO_MONITOR_VUL               = 1.0 / 60
  private final val RATIO_PROTECT_VUL               = 1.0 / 120
  private final val RATIO_QUARANTINED_VUL           = 1.0 / 240
  private final val RATIO_HOST_VUL                  = 1.0 / 20
  private final val MAX_NEW_SERVICE_MODE_SCORE      = 2
  private final val MAX_SERVICE_MODE_SCORE          = 26
  private final val MAX_MODE_EXPOSURE               = 10
  private final val MAX_VIOLATE_EXPOSURE            = 12
  private final val MAX_THREAT_EXPOSURE             = 20
  private final val MAX_PRIVILEGED_CONTAINER_SCORE  = 4
  private final val MAX_RUN_AS_ROOT_CONTAINER_SCORE = 4
  private final val MAX_ADMISSION_RULE_SCORE        = 4
  private final val MAX_PLATFORM_VUL_SCORE          = 2
  private final val MAX_HOST_VUL_SCORE              = 6
  private final val MAX_POD_VUL_SCORE               = 8
  private final val DASHBOARD                       = "dashboard"

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
      val internalSystemRes                                = RestClient.requestWithHeaderDecode(
        s"$baseUrl/internal/system",
        HttpMethods.GET,
        "",
        tokenId
      )
      val multiClusterSummaryRes: Future[(String, String)] =
        for {
          summary        <- summaryRes.recoverWith { case _: Exception =>
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
          internalSystem <- internalSystemRes.recoverWith { case _: Exception =>
                              Future {
                                internalSystemDataToJson(
                                  InternalSystemData(
                                    Metrics(
                                      "",
                                      "",
                                      "",
                                      "",
                                      "",
                                      0,
                                      0,
                                      RiskScoreMetricsWL(0, 0, 0, 0, 0, 0, 0, 0),
                                      RiskScoreMetricsGroup(0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
                                      RiskScoreMetricsCVE(0, 0, 0, 0, 0)
                                    ),
                                    Array(),
                                    Array(),
                                    Some(true)
                                  )
                                )
                              }
                            }
        } yield (
          summary,
          internalSystem
        )

      val multiClusterSummary: (String, String) =
        Await.result(multiClusterSummaryRes, RestClient.waitingLimit.seconds)
      val summary                               = multiClusterSummary._1

      JsonStringCacheManager.saveJson(summaryOwner, summary)
      val internalSystem = jsonToInternalSystemData(multiClusterSummary._2)

      MultiClusterSummary(
        getScore2(
          internalSystem.metrics,
          None,
          internalSystem.hasError.getOrElse(false),
          true
        ),
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
    logger.info(s"Loading System Alerts information ...")
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

  def getScore2(tokenId: String, isGlobalUser: String, domain: Option[String]): Route = complete {
    try {
      val url                   = domain.fold(s"${baseClusterUri(tokenId)}/internal/system") { domain =>
        if (domain == "") s"${baseClusterUri(tokenId)}/internal/system"
        else s"${baseClusterUri(tokenId)}/internal/system?f_domain=$domain"
      }
      logger.info("Url: {}", url)
      val internalSystemDataRes = RestClient.requestWithHeaderDecode(
        url,
        HttpMethods.GET,
        "",
        tokenId
      )
      val internalSystemData    = jsonToInternalSystemData(
        Await.result(internalSystemDataRes, RestClient.waitingLimit.seconds)
      )
      logger.info("internalSystemData: {}", internalSystemData)
      ScoreOutput2(
        getScore2(internalSystemData.metrics, None, false, isGlobalUser == "true"),
        internalSystemData.metrics,
        internalSystemData.ingress,
        internalSystemData.egress
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

  def updateScore2(
    tokenId: String,
    isGlobalUser: String,
    totalRunningPods: String,
    metrics: Metrics
  ): Route = complete {
    try
      getScore2(
        metrics,
        Some(totalRunningPods.toInt),
        false,
        isGlobalUser == "true"
      )
    catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
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
        // conversationsOutput match {
        //   case Left(x) => Left(x)
        //   case Right(x) =>
        //     runningContainersOutput match {
        //       case Left(y) => Left(y)
        //       case Right(y) =>
        //         Right(
        //           ExposedConversations(
        //             x.ingressConversations,
        //             x.egressConversations
        //           )
        //         )
        //     }
        // },
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

  def queryScore(tokenId: String, isGlobalUser: Option[String], scoreInput: ScoreInput): Route =
    complete {
      try
        getScore(scoreInput, isGlobalUser.getOrElse("true") == "true")
      catch {
        case NonFatal(e) =>
          if (
            e.getMessage.contains("Status: 408") || e.getMessage.contains(
              "Status: 401"
            )
          ) {
            (StatusCodes.RequestTimeout, "Session expired!")
          } else {
            (StatusCodes.InternalServerError, "Internal server error")
          }
      }
    }

  def getScore(tokenId: String, isGlobalUser: Option[String], domain: Option[String]): Route =
    complete {
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
          s"${baseClusterUri(tokenId)}/host?Estart=0&limit=0$query4Domain2",
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
        val vulPlatformsRes   = RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/scan/platform$query4Domain1",
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
        val systemConfigRes   = RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/system/config",
          HttpMethods.GET,
          "",
          tokenId,
          DASHBOARD
        )
        val admissionRuleRes  = RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/admission/rules",
          HttpMethods.GET,
          "",
          tokenId,
          DASHBOARD
        )
        val admissionStateRes = RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/admission/state",
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
            vulPlatforms   <- vulPlatformsRes.recoverWith { case e: Exception =>
                                handleScanPlatformException(e)
                              }
            systemConfig   <- systemConfigRes.recoverWith { case e: Exception =>
                                handleSystemConfigException(e)
                              }
            containers     <- containersRes.recoverWith { case e: Exception =>
                                handleWorkloadException(e)
                              }
            admissionRule  <- admissionRuleRes.recoverWith { case e: Exception =>
                                handleAdmissionRuleException(e)
                              }
            autoScanConfig <- autoScanConfigRes.recoverWith { case e: Exception =>
                                handleAutoScanConfigException(e)
                              }
            admissionState <- admissionStateRes.recoverWith { case e: Exception =>
                                handleAdmissionStateException(e)
                              }
          } yield (
            vulNodes,
            services,
            policies,
            conversations,
            vulPlatforms,
            systemConfig,
            containers,
            admissionRule,
            autoScanConfig,
            admissionState
          )

        val dashboard: (
          String,
          String,
          String,
          String,
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
        val vulPlatforms   = jsonToVulnerablePlatforms(dashboard._5)
        val systemConfig   = jsonToSystemConfig4DashboardWrap(dashboard._6)
        val containers     = jsonToWorkloadsWrap(dashboard._7)
        val admissionRule  = jsonToAdmissionRulesWrap(dashboard._8)
        val autoScanConfig = jsonToAutoScanConfig(dashboard._9)
        val admissionState = jsonToAdmissionStateWrap(dashboard._10)
        val autoScan       =
          if (autoScanConfig.error.isDefined) {
            Left(autoScanConfig.error.get)
          } else {
            Right(getAutoScan(autoScanConfig))
          }

        val domains = if (containers.error.isDefined) {
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

        val totalRunningPods =
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

        val hasPrivilegedContainer =
          runningContainersOutput match {
            case Left(x)  => Left(x)
            case Right(x) => Right(x.hasPrivilegedContainer)
          }

        val hasRunAsRoot =
          runningContainersOutput match {
            case Left(x)  => Left(x)
            case Right(x) => Right(x.hasRunAsRoot)
          }

        val vulContainerOutput =
          if (containers.error.isDefined) {
            Left(containers.error.get)
          } else {
            serviceMaps match {
              case Left(x)  => Left(x)
              case Right(x) => Right(getVulContainerOutput(containers, domainVal, x))
            }
          }

        val vulNodeOutput = if (vulNodes.error.isDefined) {
          Left(vulNodes.error.get)
        } else {
          Right(getVulNodeOutput(vulNodes))
        }

        val vulPlatformOutput = if (vulPlatforms.error.isDefined) {
          Left(vulPlatforms.error.get)
        } else {
          Right(getVulPlatformOutput(vulPlatforms))
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

        val hasAdmissionRules =
          if (admissionRule.error.isDefined) {
            Left(admissionRule.error.get)
          } else if (admissionState.error.isDefined) {
            Left(admissionState.error.get)
          } else if (vulPlatforms.error.isDefined) {
            Left(vulPlatforms.error.get)
          } else {
            Right(getHasAdmissionRules(admissionRule, admissionState, vulPlatforms))
          }

        val isNewServiceDiscover =
          if (systemConfig.error.isDefined) {
            Left(systemConfig.error.get)
          } else {
            Right(getIsNewServiceDiscover(systemConfig))
          }

        val scoreInput = ScoreInput(
          VulnerabilityExploitRisk(
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.highVulsMap.getOrElse(DISCOVER, 0),
                    x.medVulsMap.getOrElse(DISCOVER, 0)
                  )
                )
            },
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.highVulsMap.getOrElse(MONITOR, 0),
                    x.medVulsMap.getOrElse(MONITOR, 0)
                  )
                )
            },
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.highVulsMap.getOrElse(PROTECT, 0),
                    x.medVulsMap.getOrElse(PROTECT, 0)
                  )
                )
            },
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.highVulsMap.getOrElse(QUARANTINED, 0),
                    x.medVulsMap.getOrElse(QUARANTINED, 0)
                  )
                )
            },
            vulNodeOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.nodeHighVuls,
                    x.nodeMedVuls
                  )
                )
            },
            vulPlatformOutput match {
              case Left(x)  => Left(x)
              case Right(x) =>
                Right(
                  VulnerabilityCount(
                    x.platformHighVuls,
                    x.platformMedVuls
                  )
                )
            },
            vulNodeOutput match {
              case Left(x)  => Left(x)
              case Right(x) => Right(x.totalHost)
            },
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) => Right(x.totalScannedPods)
            },
            vulContainerOutput match {
              case Left(x)  => Left(x)
              case Right(x) => Right(x.totalScannedPodsWithoutSystem)
            }
          ),
          serviceMaps match {
            case Left(x)  => Left(x)
            case Right(x) =>
              Right(
                ServiceConnectionRisk(
                  x.serviceModeMap.getOrElse(DISCOVER, 0),
                  x.serviceModeMap.getOrElse(MONITOR, 0),
                  x.serviceModeMap.getOrElse(PROTECT, 0)
                )
              )
          },
          conversationsOutput match {
            case Left(x)  => Left(x)
            case Right(x) =>
              Right(
                IngressEgressRisk(
                  x.exposureModeMap.getOrElse(DISCOVER, 0),
                  x.exposureModeMap.getOrElse(MONITOR, 0),
                  x.exposureModeMap.getOrElse(PROTECT, 0),
                  x.exposureThreat,
                  x.exposureViolation
                )
              )
          },
          hasPrivilegedContainer,
          hasRunAsRoot,
          hasAdmissionRules,
          isNewServiceDiscover,
          totalRunningPods,
          domains
        )

        val scoreOutput = getScore(
          scoreInput,
          isGlobalUser.getOrElse("true") == "true" || domainVal.nonEmpty
        )

        /*========================================================================================
           Construct dashboard API response
         ========================================================================================*/
        val dashboardScoreDTO = DashboardScoreDTO(
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
          conversationsOutput match {
            case Left(x)  => Left(x)
            case Right(x) =>
              runningContainersOutput match {
                case Left(y)  => Left(y)
                case Right(_) =>
                  Right(
                    ExposedConversations(
                      x.ingressConversations,
                      x.egressConversations
                    )
                  )
              }
          },
          autoScan,
          scoreInput,
          scoreOutput
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

      val threats          = jsonToThreatsEndpointData(dashboard._1)
      val violations       = jsonToViolationsEndpointData(dashboard._2)
      val incidents        = jsonToIncidentsEndpointData(dashboard._3)
      val incidentsDetails = jsonToIncidentsEndpoint(dashboard._3)

      /*========================================================================================
         Construct dashboard API response
       ========================================================================================*/
      val dashboardNotificationDTO = DashboardNotificationDTO(
        getCriticalSecurityEvents(threats, violations, incidents, incidentsDetails),
        getTopIncidents(incidentsDetails)
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

  def getNotifications2(tokenId: String, domain: Option[String]): Route = complete {
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

  private lazy val getHasAdmissionRules = (
    admissionRule: AdmissionRulesWrap,
    admissionState: AdmissionStateWrap,
    vulPlatforms: VulnerablePlatforms
  ) =>
    (vulPlatforms.platforms.length > 0 && !vulPlatforms
      .platforms(0)
      .platform
      .toLowerCase
      .contains("kube")) ||
    admissionRule.rules.count(rule => !rule.critical && !rule.disable) > 0 &&
    admissionState.state.enable

  private lazy val getVulPlatformOutput = (
    vulPlatforms: VulnerablePlatforms
  ) => {
    var platformHighVuls = 0
    var platformMedVuls  = 0
    vulPlatforms.platforms.foreach { vulPlatforms =>
      platformHighVuls += vulPlatforms.high
      platformMedVuls += vulPlatforms.medium
    }

    VulPlatformOutput(
      platformHighVuls,
      platformMedVuls
    )
  }

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

  private lazy val getIsNewServiceDiscover = (
    systemConfig: SystemConfig4DashboardWrap
  ) => systemConfig.config.new_service_policy_mode.getOrElse("").toLowerCase == DISCOVER

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
  ) => autoScanConfig.config.auto_scan

  private lazy val getNewServiceModeScore = (
    isNewServiceDiscover: Boolean
  ) =>
    if (isNewServiceDiscover) MAX_NEW_SERVICE_MODE_SCORE
    else 0

  private lazy val getServiceModeScore = (
    serviceConnectionRisk: ServiceConnectionRisk
  ) => {
    val totalServices =
      serviceConnectionRisk.discover + serviceConnectionRisk.monitor + serviceConnectionRisk.protect
    totalServices match {
      case 0 => 0
      case _ => (serviceConnectionRisk.discover / totalServices.toDouble * 100).toInt
    }
  }

  private lazy val getExposureDensity = (
    runningPodsCount: Int
  ) =>
    if (runningPodsCount > 10000) 1 / THRESHOLD_EXPOSURE_10000
    else if (runningPodsCount > 1000)
      1 / (THRESHOLD_EXPOSURE_1000 + (THRESHOLD_EXPOSURE_10000 - THRESHOLD_EXPOSURE_1000) * runningPodsCount / 10000.0)
    else if (runningPodsCount > 100)
      1 / (THRESHOLD_EXPOSURE_100 + (THRESHOLD_EXPOSURE_1000 - THRESHOLD_EXPOSURE_100) * runningPodsCount / 1000.0)
    else 1 / (1 + THRESHOLD_EXPOSURE_100 * runningPodsCount / 100.0)

  private lazy val getExposureScore = (
    ingressEgressRisk: IngressEgressRisk,
    totalRunningPods: Int
  ) =>
    totalRunningPods match {
      case 0 => 0
      case _ =>
        val exposureDensity = getExposureDensity(totalRunningPods)
        logger.info("Exposure density: {}", exposureDensity)
        var modeScore       =
          (ingressEgressRisk.protectMode + ingressEgressRisk.monitorMode) * exposureDensity * RATIO_PROTECT_MONITOR_EXPOSURE +
          ingressEgressRisk.discoverMode * exposureDensity * RATIO_DISCOVER_EXPOSURE
        var violationScore  = ingressEgressRisk.violation * exposureDensity * RATIO_VIOLATED_EXPOSURE
        var threatScore     = ingressEgressRisk.threat * exposureDensity * RATIO_THREATENED_EXPOSURE
        modeScore = if (modeScore > MAX_MODE_EXPOSURE) MAX_MODE_EXPOSURE else modeScore
        violationScore =
          if (violationScore > MAX_VIOLATE_EXPOSURE) MAX_VIOLATE_EXPOSURE else violationScore
        threatScore = if (threatScore > MAX_THREAT_EXPOSURE) MAX_THREAT_EXPOSURE else threatScore

        (modeScore + violationScore + threatScore).toInt
    }

  private lazy val getPrivilegedContainerScore = (
    hasPrivilegedContainer: Boolean
  ) =>
    if (hasPrivilegedContainer) MAX_PRIVILEGED_CONTAINER_SCORE
    else 0

  private lazy val getRunAsRootScore = (
    hasRunAsRoot: Boolean
  ) =>
    if (hasRunAsRoot) MAX_RUN_AS_ROOT_CONTAINER_SCORE
    else 0

  private lazy val getAdmissionRuleScore = (
    hasAdmissionRules: Boolean
  ) =>
    if (!hasAdmissionRules) MAX_ADMISSION_RULE_SCORE
    else 0

  private lazy val getVulnerabilityScore = (
    discover: VulnerabilityCount,
    monitor: VulnerabilityCount,
    protect: VulnerabilityCount,
    quarantined: VulnerabilityCount,
    host: VulnerabilityCount,
    platform: VulnerabilityCount,
    totalScannedHost: Int,
    totalScannedPodsWithoutSystem: Int
  ) => {
    var podScore: Double  = 0.0
    var hostScore: Double = 0.0
    totalScannedPodsWithoutSystem match {
      case 0 =>
      case _ =>
        podScore =
          (discover.highVul + discover.mediumVul) / totalScannedPodsWithoutSystem * RATIO_DISCOVER_VUL +
          (monitor.highVul + monitor.mediumVul) / totalScannedPodsWithoutSystem * RATIO_MONITOR_VUL +
          (protect.highVul + protect.mediumVul) / totalScannedPodsWithoutSystem * RATIO_PROTECT_VUL +
          (quarantined.highVul + quarantined.mediumVul) / totalScannedPodsWithoutSystem * RATIO_QUARANTINED_VUL
        podScore = if (podScore > MAX_POD_VUL_SCORE) MAX_POD_VUL_SCORE else podScore
    }

    totalScannedHost match {
      case 0 =>
      case _ =>
        hostScore = (host.highVul + host.mediumVul) / totalScannedHost * RATIO_HOST_VUL
        hostScore = if (hostScore > MAX_HOST_VUL_SCORE) MAX_HOST_VUL_SCORE else hostScore
    }

    val platformScore = if (platform.highVul + platform.mediumVul > 0) MAX_PLATFORM_VUL_SCORE else 0
    (podScore + hostScore + platformScore).toInt
  }

  private lazy val getScore2 = (
    metrics: Metrics,
    totalRunningPodsOption: Option[Int],
    hasError: Boolean,
    isGlobalUser: Boolean
  ) => {
    val totalRunningPods    = totalRunningPodsOption.fold(metrics.workloads.running_pods) {
      totalRunningPodsOption =>
        totalRunningPodsOption
    }
    val newServiceModeScore = getNewServiceModeScore(
      metrics.new_service_policy_mode.toLowerCase == "discover"
    ) + getNewServiceModeScore(
      metrics.new_service_profile_mode.toLowerCase == "discover"
    )

    val serviceModeScoreBy100 = metrics.groups.groups match {
      case 0 => 0
      case _ =>
        math
          .ceil(
            ((metrics.groups.discover_groups + metrics.groups.profile_discover_groups) * 0.5 - metrics.groups.discover_groups_zero_drift * 0.3) / metrics.groups.groups.toDouble * 100
          )
          .toInt
    }

    val serviceModeScore = math.ceil(serviceModeScoreBy100 / 100.0 * MAX_SERVICE_MODE_SCORE).toInt

    val exposureScore = totalRunningPods match {
      case 0 => 0
      case _ =>
        val exposureDensity = getExposureDensity(totalRunningPods)
        logger.info("Exposure density: {}", exposureDensity)
        var modeScore       =
          (metrics.workloads.protect_ext_eps + metrics.workloads.monitor_ext_eps) * exposureDensity * RATIO_PROTECT_MONITOR_EXPOSURE +
          metrics.workloads.discover_ext_eps * exposureDensity * RATIO_DISCOVER_EXPOSURE
        var violationScore  =
          metrics.workloads.violate_ext_eps * exposureDensity * RATIO_VIOLATED_EXPOSURE
        var threatScore     =
          metrics.workloads.threat_ext_eps * exposureDensity * RATIO_THREATENED_EXPOSURE
        modeScore = if (modeScore > MAX_MODE_EXPOSURE) MAX_MODE_EXPOSURE else modeScore
        violationScore =
          if (violationScore > MAX_VIOLATE_EXPOSURE) MAX_VIOLATE_EXPOSURE else violationScore
        threatScore = if (threatScore > MAX_THREAT_EXPOSURE) MAX_THREAT_EXPOSURE else threatScore
        math.ceil(modeScore + violationScore + threatScore).toInt
    }

    val exposureScoreBy100 = math
      .ceil(
        exposureScore * 100 / (MAX_MODE_EXPOSURE + MAX_VIOLATE_EXPOSURE + MAX_THREAT_EXPOSURE).toDouble
      )
      .toInt

    val privilegedContainerScore = getPrivilegedContainerScore(metrics.workloads.privileged_wls > 0)

    val runAsRootScore = getRunAsRootScore(metrics.workloads.root_wls > 0)

    val admissionRuleScore = getAdmissionRuleScore(metrics.deny_adm_ctrl_rules > 0)

    var podScore: Double   = 0.0
    var hostScore: Double  = 0.0
    totalRunningPods match {
      case 0 =>
      case _ =>
        podScore = metrics.cves.discover_cves / totalRunningPods * RATIO_DISCOVER_VUL +
          metrics.cves.discover_cves / totalRunningPods * RATIO_MONITOR_VUL +
          metrics.cves.protect_cves / totalRunningPods * RATIO_PROTECT_VUL
        podScore = if (podScore > MAX_POD_VUL_SCORE) MAX_POD_VUL_SCORE else podScore
    }
    metrics.hosts match {
      case 0 =>
      case _ =>
        hostScore = metrics.cves.host_cves / metrics.hosts * RATIO_HOST_VUL
        hostScore = if (hostScore > MAX_HOST_VUL_SCORE) MAX_HOST_VUL_SCORE else hostScore
    }
    val platformScore      = if (metrics.cves.platform_cves > 0) MAX_PLATFORM_VUL_SCORE else 0
    val vulnerabilityScore = math.ceil(podScore + hostScore + platformScore).toInt

    val vulnerabilityScoreBy100 = math
      .ceil(
        vulnerabilityScore * 100 / (MAX_POD_VUL_SCORE + MAX_HOST_VUL_SCORE + MAX_PLATFORM_VUL_SCORE).toDouble
      )
      .toInt

    val securityRiskScore = if (isGlobalUser) {
      newServiceModeScore + serviceModeScore + exposureScore + privilegedContainerScore + runAsRootScore + admissionRuleScore + vulnerabilityScore
    } else {
      math
        .ceil(
          (serviceModeScore + exposureScore + privilegedContainerScore + runAsRootScore + vulnerabilityScore) /
          (MAX_MODE_EXPOSURE + MAX_VIOLATE_EXPOSURE + MAX_THREAT_EXPOSURE + MAX_PRIVILEGED_CONTAINER_SCORE +
          MAX_RUN_AS_ROOT_CONTAINER_SCORE + MAX_POD_VUL_SCORE + MAX_HOST_VUL_SCORE + MAX_PLATFORM_VUL_SCORE).toDouble * 100
        )
        .toInt
    }

    Score(
      newServiceModeScore,
      serviceModeScore,
      serviceModeScoreBy100,
      exposureScore,
      exposureScoreBy100,
      privilegedContainerScore,
      runAsRootScore,
      admissionRuleScore,
      vulnerabilityScore,
      vulnerabilityScoreBy100,
      securityRiskScore,
      hasError
    )
  }

  private lazy val getScore = (
    scoreInput: ScoreInput,
    isGlobalUser: Boolean
  ) => {
    val newServiceModeScore                          = scoreInput.isNewServiceDiscover match {
      case Right(x) => Right(getNewServiceModeScore(x))
      case Left(x)  => Left(x)
    }
    val serviceModeScoreBy100                        = scoreInput.serviceConnectionRisk match {
      case Right(x) => Right(getServiceModeScore(x))
      case Left(x)  => Left(x)
    }
    val serviceModeScore                             = serviceModeScoreBy100 match {
      case Right(x) => Right((x / 100.0 * MAX_SERVICE_MODE_SCORE).toInt)
      case Left(x)  => Left(x)
    }
    val exposureScore: Either[Error, Int]            = scoreInput.ingressEgressRisk match {
      case Left(x)  => Left(x)
      case Right(x) =>
        scoreInput.totalRunningPods match {
          case Left(y)  => Left(y)
          case Right(y) => Right(getExposureScore(x, y))
        }
    }
    val exposureScoreBy100                           = exposureScore match {
      case Right(x) =>
        Right(
          (x * 100 / (MAX_MODE_EXPOSURE + MAX_VIOLATE_EXPOSURE + MAX_THREAT_EXPOSURE).toDouble).toInt
        )
      case Left(x)  => Left(x)
    }
    val privilegedContainerScore: Either[Error, Int] = scoreInput.hasPrivilegedContainer match {
      case Right(x) => Right(getPrivilegedContainerScore(x))
      case Left(x)  => Left(x)
    }
    val runAsRootScore                               = scoreInput.hasRunAsRoot match {
      case Right(x) => Right(getRunAsRootScore(x))
      case Left(x)  => Left(x)
    }
    val admissionRuleScore                           = scoreInput.hasAdmissionRules match {
      case Left(x)  => Left(x)
      case Right(x) => Right(getAdmissionRuleScore(x))
    }
    val vulnerabilityScore                           = scoreInput.vulnerabilityExploitRisk.discover match {
      case Left(x)  => Left(x)
      case Right(x) =>
        scoreInput.vulnerabilityExploitRisk.monitor match {
          case Left(y)  => Left(y)
          case Right(y) =>
            scoreInput.vulnerabilityExploitRisk.protect match {
              case Left(z)  => Left(z)
              case Right(z) =>
                scoreInput.vulnerabilityExploitRisk.quarantined match {
                  case Left(a)  => Left(a)
                  case Right(a) =>
                    scoreInput.vulnerabilityExploitRisk.host match {
                      case Left(b)  => Left(b)
                      case Right(b) =>
                        scoreInput.vulnerabilityExploitRisk.platform match {
                          case Left(c)  => Left(c)
                          case Right(c) =>
                            scoreInput.vulnerabilityExploitRisk.totalScannedHost match {
                              case Left(d)  => Left(d)
                              case Right(d) =>
                                scoreInput.vulnerabilityExploitRisk.totalScannedPodsWithoutSystem match {
                                  case Left(e)  => Left(e)
                                  case Right(e) =>
                                    Right(getVulnerabilityScore(x, y, z, a, b, c, d, e))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    val vulnerabilityScoreBy100                      = vulnerabilityScore match {
      case Left(x)  => Left(x)
      case Right(x) =>
        Right(
          (x * 100 / (MAX_POD_VUL_SCORE + MAX_HOST_VUL_SCORE + MAX_PLATFORM_VUL_SCORE).toDouble).toInt
        )
    }

    val securityRiskScore =
      exposureScore match {
        case Left(x)  => Left(x)
        case Right(x) =>
          privilegedContainerScore match {
            case Left(y)  => Left(y)
            case Right(y) =>
              runAsRootScore match {
                case Left(z)  => Left(z)
                case Right(z) =>
                  serviceModeScore match {
                    case Left(a)  => Left(a)
                    case Right(a) =>
                      vulnerabilityScore match {
                        case Left(b)  => Left(b)
                        case Right(b) =>
                          admissionRuleScore match {
                            case Left(c)  => Left(c)
                            case Right(c) =>
                              newServiceModeScore match {
                                case Left(d)  => Left(d)
                                case Right(d) =>
                                  if (isGlobalUser) {
                                    Right(d + a + x + y + z + c + b)
                                  } else {
                                    Right(
                                      ((a + x + y + z + b) /
                                      (MAX_MODE_EXPOSURE + MAX_VIOLATE_EXPOSURE + MAX_THREAT_EXPOSURE + MAX_PRIVILEGED_CONTAINER_SCORE +
                                      MAX_RUN_AS_ROOT_CONTAINER_SCORE + MAX_POD_VUL_SCORE + MAX_HOST_VUL_SCORE + MAX_PLATFORM_VUL_SCORE).toDouble * 100).toInt
                                    )
                                  }
                              }
                          }
                      }
                  }
              }
          }
      }

    ScoreOutput(
      newServiceModeScore,
      serviceModeScore,
      serviceModeScoreBy100,
      exposureScore,
      exposureScoreBy100,
      privilegedContainerScore,
      runAsRootScore,
      admissionRuleScore,
      vulnerabilityScore,
      vulnerabilityScoreBy100,
      securityRiskScore
    )
  }

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

  private lazy val getCriticalSecurityEvents = (
    threats: ThreatEndpointData,
    violations: ViolationEndpointData,
    incidents: IncidentEndpointData,
    incidentsDetails: IncidentsEndpoint
  ) => {
    val topThreats = if (threats.error.isDefined) {
      Left(threats.error.get)
    } else {
      val convertedThreats      = threats.threats.zipWithIndex.map { case (threat, _) =>
        threatsToConvertedThreats(threat)
      }
      val topThreateningSources = convertedThreats
        .groupBy(_.source_workload_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topThreateningSource => topThreateningSource._2)
        .toArray

      val topThreatenedDestinations = convertedThreats
        .groupBy(_.destination_workload_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topThreatenedDestination => topThreatenedDestination._2)
        .toArray

      Right(TopThreat(topThreateningSources, topThreatenedDestinations))
    }

    val topViolations = if (violations.error.isDefined) {
      Left(violations.error.get)
    } else {
      val convertedViolations = violations.violations.zipWithIndex.map { case (violation, _) =>
        violationsToConvertedviolations(violation)
      }
      val topViolatingClients = convertedViolations
        .groupBy(_.client_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topViolatingClient => topViolatingClient._2)
        .toArray

      val topViolatedServers = convertedViolations
        .groupBy(_.server_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(topViolatedServer => topViolatedServer._2)
        .toArray

      Right(TopViolation(topViolatingClients, topViolatedServers))
    }

    val alertedContainers = if (violations.error.isDefined || incidentsDetails.error.isDefined) {
      if (violations.error.isDefined) Left(violations.error.get)
      else Left(incidentsDetails.error.get)
    } else {
      var alertsSet = Set("")

      violations.violations.foreach { violation =>
        alertsSet += violation.client_name
        alertsSet += violation.server_name
      }

      incidentsDetails.incidents.foreach { incidentsDetail =>
        if (
          incidentsDetail.workload_name.isDefined
          && incidentsDetail.workload_name.get != ""
          && incidentsDetail.workload_name.get != "external"
        )
          alertsSet += incidentsDetail.workload_name.get
        if (
          incidentsDetail.remote_workload_name.isDefined
          && incidentsDetail.remote_workload_name.get != ""
          && incidentsDetail.remote_workload_name.get != "external"
        )
          alertsSet += incidentsDetail.remote_workload_name.get
      }

      Right(alertsSet.toList)
    }

    val summary =
      if (threats.error.isDefined || violations.error.isDefined || incidents.error.isDefined) {
        if (threats.error.isDefined) Left(threats.error.get)
        else if (violations.error.isDefined) Left(violations.error.get)
        else Left(incidents.error.get)
      } else {
        Right(
          Map(
            "violations" -> violations.violations
              .groupBy(violation => new DateTime(violation.reported_at).toString().split("T").head)
              .map { case (k, v) =>
                k -> v.length
              }
              .toSeq
              .sortBy(_._1),
            "threats"    -> threats.threats
              .groupBy(threat => new DateTime(threat.reported_at).toString().split("T").head)
              .map { case (k, v) =>
                (k, v.length)
              }
              .toSeq
              .sortBy(_._1),
            "incidents"  -> incidents.incidents
              .groupBy(incident => new DateTime(incident.reported_at).toString().split("T").head)
              .map { case (k, v) =>
                (k, v.length)
              }
              .toSeq
              .sortBy(_._1)
          )
        )
      }

    CriticalSecurityEventDTO(topViolations, topThreats, summary, alertedContainers)
  }

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

  private lazy val getTopIncidents = (
    incidentsDetails: IncidentsEndpoint
  ) =>
    if (incidentsDetails.error.isDefined) {
      Left(incidentsDetails.error.get)
    } else {

      val hostTotal         = incidentsDetails.incidents.length
      val containerIncident = incidentsDetails.incidents
        .filterNot(incident =>
          incident.workload_name.isEmpty
          || incident.workload_name.get == ""
          || incident.workload_name.get == "external"
        )
      val containerTotal    = containerIncident.length

      val groupByContainer = containerIncident
        .groupBy(_.workload_name.get)
        .toList
        .filterNot(_._1 == "")
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(container => container._2)
        .toArray

      val groupByNode = incidentsDetails.incidents
        .groupBy(_.host_name)
        .toList
        .sortWith(_._2.length > _._2.length)
        .take(topLimit)
        .map(node => node._2)
        .toArray

      Right(TopIncidentsDTO(groupByContainer, groupByNode, hostTotal, containerTotal))
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

  private def handleScanPlatformException(e: Exception): Future[String] =
    handleException(e, "\"platforms\": []")

  private def handleSystemConfigException(e: Exception): Future[String] =
    handleException(
      e,
      "\"config\":{\"new_service_policy_mode\":\"discover\"}",
      e =>
        e.getMessage.contains("Status: 4") ||
        e.getMessage.contains("\"code\":25")
    )

  private def handleWorkloadException(e: Exception): Future[String] =
    handleException(e, "\"workloads\": []")

  private def handleAdmissionRuleException(e: Exception): Future[String] =
    handleException(
      e,
      "\"rules\": []",
      e =>
        e.getMessage.contains("Status: 4") ||
        e.getMessage.contains("\"code\":30") ||
        e.getMessage.contains("\"code\":31") ||
        e.getMessage.contains("\"code\":32") ||
        e.getMessage.contains("\"code\":33") ||
        e.getMessage.contains("\"code\":34") ||
        e.getMessage.contains("\"code\":7")
    )

  private def handleAutoScanConfigException(e: Exception): Future[String] =
    Future {
      s"""{\"config\":{\"auto_scan\":false}, "error":{"message":"${e.getMessage
          .replace("\"", "\\\"")
          .replace("\n", ", ")}"}}"""
    }

  private def handleAdmissionStateException(e: Exception): Future[String] =
    handleException(
      e,
      "\"state\":{\"enable\":false}",
      e =>
        e.getMessage.contains("Status: 4") ||
        e.getMessage.contains("\"code\":30") ||
        e.getMessage.contains("\"code\":31") ||
        e.getMessage.contains("\"code\":32") ||
        e.getMessage.contains("\"code\":33") ||
        e.getMessage.contains("\"code\":34") ||
        e.getMessage.contains("\"code\":7")
    )
}
