package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.AuthenticationManager
import com.neu.model.AdmissionJsonProtocol._
import com.neu.model.GroupJsonProtocol._
import com.neu.model.JsonProtocol._
import com.neu.model.PolicyJsonProtocol._
import com.neu.model.RegistryConfigJsonProtocol._
import com.neu.model._
import com.typesafe.scalalogging.LazyLogging
import org.json4s._
import org.json4s.native.JsonMethods._
import spray.can.Http.ConnectionAttemptFailedException
import spray.http.HttpMethods._
import spray.http.StatusCodes
import spray.routing.Route

import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, TimeoutException }
import scala.util.control.NonFatal

//noinspection UnstableApiUsage
class PolicyService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  final val policyPath                 = "policy/rule"
  final val responseRulePath           = "response/rule"
  final val scanConfigPath             = "scan/config"
  final val scanRegistryPath           = "scan/registry"
  final val admissionControlPath       = "admission/rules"
  final val admissionControlSinglePath = "admission/rule"
  final val admissionControlOption     = "admission/options"
  final val admissionControlState      = "admission/state"
  final val admissionExport            = "file/admission"
  final val admissionImport            = "file/admission/config"
  final val admissionControlTest       = "debug/admission/test"
  final val fedDeploy                  = "fed/deploy"

  final val serverErrorStatus = "Status: 503"

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("fed-deploy") {
          entity(as[DeployFedRulesConfig]) { deployFedRulesConfig =>
            post {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Inform rule deployment")
                  RestClient.httpRequestWithHeader(
                    s"$baseUri/$fedDeploy",
                    POST,
                    deployFedRulesConfigToJson(deployFedRulesConfig),
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        path("conditionOption") {
          get {
            Utils.respondWithNoCacheControl() {
              parameter('scope.?) { scope =>
                complete {
                  logger.info("Response rule condition options: {}")
                  RestClient.httpRequestWithHeader(
                    scope.fold(s"${baseClusterUri(tokenId)}/response/options") { scope =>
                      if (scope.equals("fed")) s"$baseUri/response/options?scope=$scope"
                      else s"${baseClusterUri(tokenId)}/response/options?scope=$scope"
                    },
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        path("unquarantine") {
          post {
            entity(as[Request]) { request =>
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Unquarantine response policy: {}")
                  logger.info("Unquarantine response rules: {}", requestToJson(request))
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/system/request",
                    POST,
                    requestToJson(request),
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        path("responseRule") {
          get {
            parameter('id) { id =>
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Response rule id: {}", id)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/$responseRulePath/$id",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        path("responsePolicy") {
          get {
            parameter('scope.?) { scope =>
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    scope.fold(s"${baseClusterUri(tokenId)}/$responseRulePath") { scope =>
                      if (scope.equals("fed")) s"$baseUri/$responseRulePath?scope=$scope"
                      else s"${baseClusterUri(tokenId)}/$responseRulePath?scope=$scope"
                    },
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          post {
            entity(as[ResponseRulesWrap]) { responseRulesWrap =>
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Inserting response policy: {}")
                  logger.info(
                    "Inserting response rules: {}",
                    responseRulesWrapToJson(responseRulesWrap)
                  )
                  RestClient.httpRequestWithHeader(
                    if (responseRulesWrap.insert.rules(0).cfg_type.getOrElse("").equals("federal"))
                      s"$baseUri/$responseRulePath"
                    else s"${baseClusterUri(tokenId)}/$responseRulePath",
                    PATCH,
                    responseRulesWrapToJson(responseRulesWrap),
                    tokenId
                  )
                }
              }
            }
          } ~
          patch {
            entity(as[ResponseRuleConfig]) { responseRuleConfig =>
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Updating response policy: {}")
                  logger.info("Updating response rules ID: {}", responseRuleConfig.config.id.get)
                  logger.info(
                    "Updating response rules: {}",
                    responseRuleConfigToJson(responseRuleConfig)
                  )
                  RestClient.httpRequestWithHeader(
                    if (responseRuleConfig.config.cfg_type.getOrElse("").equals("federal"))
                      s"$baseUri/$responseRulePath/${responseRuleConfig.config.id.get}"
                    else
                      s"${baseClusterUri(tokenId)}/$responseRulePath/${responseRuleConfig.config.id.get}",
                    PATCH,
                    responseRuleConfigToJson(responseRuleConfig),
                    tokenId
                  )
                }
              }
            }
          } ~
          delete {
            parameter('scope.?, 'id.?) { (scope, id) =>
              Utils.respondWithNoCacheControl() {
                complete {
                  var url = s"${baseClusterUri(tokenId)}/$responseRulePath"
                  if (id.nonEmpty) {
                    logger.info("Deleting rule: {}", id.get)
                    url += s"/${id.get}"
                  }
                  if (scope.nonEmpty) {
                    logger.info("Deleting rule: {}", scope.get)
                    url += s"?scope=${scope.get}"
                  }
                  logger.info("URL: {}", url)
                  RestClient.httpRequestWithHeader(
                    scope.fold {
                      id.fold(s"${baseClusterUri(tokenId)}/$responseRulePath") { id =>
                        s"${baseClusterUri(tokenId)}/$responseRulePath/$id"
                      }
                    } { scope =>
                      if (scope.equals("fed")) {
                        id.fold(s"$baseUri/$responseRulePath?scope=$scope") { id =>
                          s"$baseUri/$responseRulePath/$id?scope=$scope"
                        }
                      } else {
                        id.fold(s"${baseClusterUri(tokenId)}/$responseRulePath?scope=$scope") {
                          id =>
                            s"${baseClusterUri(tokenId)}/$responseRulePath/$id?scope=$scope"
                        }
                      }
                    },
                    DELETE,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("policy") {
          pathEnd {
            get {
              parameters('scope.?, 'start.?, 'limit.?) { (scope, start, limit) =>
                var url = s"${baseClusterUri(tokenId)}/$policyPath"
                if (scope.isDefined) {
                  url = s"$baseUri/$policyPath?scope=${scope.get}"
                }
                Utils.respondWithNoCacheControl() {
                  complete {
                    val cacheKey = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
                    try {
                      var elements: List[org.json4s.JsonAST.JValue] = null
                      var ruleStr: String                           = null
                      if (start.isEmpty || start.get.toInt == 0) {
                        logger.info("Getting policy")
                        val ruleRes = RestClient.requestWithHeaderDecode(url, GET, "", tokenId)
                        ruleStr = Await.result(ruleRes, RestClient.waitingLimit.seconds)
                        val json = parse(ruleStr)
                        elements = (json \ "rules").children
                        if (start.isDefined && start.get.toInt == 0) {
                          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .savePagedData(s"$cacheKey-network-rule", elements)
                        }
                      }

                      if (start.isDefined && limit.isDefined) {
                        if (elements == null) {
                          elements = paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .getPagedData(s"$cacheKey-network-rule")
                            .getOrElse(List[org.json4s.JsonAST.JValue]())
                        }
                        val output =
                          elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
                        if (output.length < limit.get.toInt) {
                          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                            .removePagedData(s"$cacheKey-network-rule")
                        }
                        val pagedRes = compact(render(JArray(output)))
                        val cachedData = paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .getPagedData(s"$cacheKey-network-rule")
                          .getOrElse(List[org.json4s.JsonAST.JValue]())
                        logger.info("Cached data size: {}", cachedData.size)
                        logger.info(
                          "Paged response size: {}",
                          compact(render(JArray(output))).length
                        )
                        pagedRes
                      } else {
                        ruleStr
                      }
                    } catch {
                      case NonFatal(e) =>
                        logger.warn(e.getMessage)
                        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .removePagedData(s"$cacheKey-network-rule")
                        if (e.getMessage.contains("Status: 401") || e.getMessage.contains(
                              "Status: 403"
                            )) {
                          (StatusCodes.Unauthorized, "Authentication failed!")
                        } else {
                          (StatusCodes.InternalServerError, "Controller unavailable!")
                        }
                      case e: TimeoutException =>
                        logger.warn(e.getMessage)
                        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .removePagedData(s"$cacheKey-network-rule")
                        (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                      case e: ConnectionAttemptFailedException =>
                        logger.warn(e.getMessage)
                        paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                          .removePagedData(s"$cacheKey-network-rule")
                        (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                    }
                  }
                }
              }
            } ~
            patch {
              parameters('scope) { scope =>
                decompressRequest() {
                  entity(as[Policy2]) { policy =>
                    Utils.respondWithNoCacheControl() {
                      complete {
                        logger.debug("Updating policy: {}", policy2ToJson(policy))
                        RestClient.httpRequestWithHeader(
                          if (scope.equals("fed")) s"$baseUri/$policyPath?scope=$scope"
                          else s"${baseClusterUri(tokenId)}/$policyPath?scope=$scope",
                          PATCH,
                          policy2ToJson(policy),
                          tokenId
                        )
                      }
                    }
                  }
                }
              }
            } ~
            delete {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    if (id.nonEmpty) {
                      logger.info("Deleting rule: {}", id.get)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$policyPath/${id.get}",
                        DELETE,
                        "",
                        tokenId
                      )
                    } else {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$policyPath",
                        DELETE,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          path("application") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Getting policy applications")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/list/application",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          path("rule") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Getting rule: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/policy/rule/$id",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[Rule]) { rule =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Adding rule: {}", rule.id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$policyPath",
                      PATCH,
                      policyRuleInsertToJson(PolicyRuleInsert(RuleInsert(0, Array(rule)))),
                      tokenId
                    )
                  }
                }
              }
            } ~
            patch {
              entity(as[RuleConfig]) { rule =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Updating rule: {}", rule.id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$policyPath/${rule.id}",
                      PATCH,
                      ruleConfigDataToJson(RuleConfigData(rule, Some(true))),
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("graph") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  try {
                    logger.info("Getting policy for graph")
                    val result =
                      RestClient.requestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/group",
                        GET,
                        "",
                        tokenId
                      )
                    val groups =
                      jsonToGroups(Await.result(result, RestClient.waitingLimit.seconds)).groups
                    val nodes = groups.map(groupToNode)

                    val policyStr =
                      RestClient.requestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/$policyPath",
                        GET,
                        "",
                        tokenId
                      )
                    val rules =
                      jsonToPolicy(Await.result(policyStr, RestClient.waitingLimit.seconds)).rules
                    val edges = rules.zipWithIndex.map { case (rule, i) => ruleToEdge(rule, i) }

                    logger.info("Policy graph nodes size {}", nodes.length)
                    NetworkGraph(nodes, edges)
                  } catch {
                    case NonFatal(e) =>
                      onNonFatal(e)
                  }
                }
              }
            }
          } ~
          path("promote") {
            post {
              entity(as[PromoteConfig]) { promoteConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/policy/rules/promote",
                      POST,
                      promoteConfigToJson(promoteConfig),
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("scan") {
          path("status") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Getting scan status")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/status",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          path("workload") {
            get {
              parameter('id.?, 'show.?) { (id, show) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    if (id.isEmpty) {
                      logger.info("Getting scan summary")
                      val scannedWorkloads = RestClient.requestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/scan/workload?view=pod&start=0&limit=0",
                        GET,
                        "",
                        tokenId
                      )
                      convertScannedWorkloads(
                        jsonToScannedWorkloadsWrap(
                          Await.result(scannedWorkloads, RestClient.waitingLimit.seconds)
                        )
                      )
                    } else {
                      val url =
                        s"${baseClusterUri(tokenId)}/scan/workload/${id.get}${if (show.isDefined)
                          s"?show=${show.get}"
                        else ""}"
                      logger.info("Getting scan workload details, URL: {}", url)
                      RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                    }
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Scan on container: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/scan/workload/$id",
                      POST,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("host") {
            get {
              parameter('id.?, 'show.?) { (id, show) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    if (id.isEmpty) {
                      logger.info("Getting nodes scan summary")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/scan/host?start=0&limit=0",
                        GET,
                        "",
                        tokenId
                      )
                    } else {
                      val url =
                        s"${baseClusterUri(tokenId)}/scan/host/${id.get}${if (show.isDefined)
                          s"?show=${show.get}"
                        else ""}"
                      logger.info("Getting single node scan summary, URL: {}", url)
                      RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                    }
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Scan on node: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/scan/host/$id",
                      POST,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("platform") {
            get {
              parameter('platform.?, 'show.?) { (platform, show) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    platform match {
                      case None =>
                        logger.info("Getting platform scan summary")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/scan/platform",
                          GET,
                          "",
                          tokenId
                        )
                      case Some(_) =>
                        val url =
                          s"${baseClusterUri(tokenId)}/scan/platform/platform${if (show.isDefined)
                            s"?show=${show.get}"
                          else ""}"
                        logger.info("Getting platform scan result, URL: {}", url)
                        RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                    }
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Scan on node: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/scan/platform/platform",
                      POST,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          pathPrefix("config") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Getting scan config")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/$scanConfigPath",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            post {
              entity(as[ScanConfigWrap]) { scanConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Set auto scan : {}", scanConfig.config.auto_scan)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$scanConfigPath",
                      PATCH,
                      scanConfigWrapToJson(scanConfig),
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          pathPrefix("registry") {
            pathEnd {
              get {
                parameter('name.?) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      if (name.isEmpty) {
                        logger.info("Getting scan registries")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/$scanRegistryPath",
                          GET,
                          "",
                          tokenId
                        )
                      } else {
                        logger.info("Getting scan registry summary for: {}", name.get)
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name.get)}",
                          GET,
                          "",
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              post {
                entity(as[RegistryConfigWrap]) { registryConfig =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath",
                        POST,
                        registryConfigWrapToJson(registryConfig),
                        tokenId
                      )
                    }
                  }
                }
              } ~
              patch {
                entity(as[RegistryConfigDTO]) { registryConfig =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfig.name)}",
                        PATCH,
                        registryConfigWrapToJson(registryConfig.wrap),
                        tokenId
                      )
                    }
                  }
                }
              } ~
              delete {
                parameter('name) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Deleting registry: {}", name)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                        DELETE,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            path("test") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  entity(as[RegistryConfigWrap]) { registryConfig =>
                    Utils.respondWithNoCacheControl() {
                      complete {
                        try {
                          val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
                          val baseUrl = cachedBaseUrl.getOrElse(
                            baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                          )
                          AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                          logger.info("test baseUrl: {}", baseUrl)
                          logger.info("Transaction ID(Post): {}", transactionId)
                          logger.info("Registry name(Post): {}", registryConfig.config.name)
                          RestClient.httpRequestWithHeader(
                            s"$baseUrl/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfig.config.name)}/test",
                            POST,
                            registryConfigWrapToJson(registryConfig),
                            tokenId,
                            Some(transactionId)
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
                    }
                  }
                } ~
                entity(as[RegistryConfigWrap]) { registryConfig =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                        logger.info("test baseUrl: {}", baseUrl)
                        logger.info("No Transaction ID(Post)")
                        logger.info("Registry name(Post): {}", registryConfig.config.name)
                        RestClient.httpRequestWithHeader(
                          s"$baseUrl/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfig.config.name)}/test",
                          POST,
                          registryConfigWrapToJson(registryConfig),
                          tokenId
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
                  }
                }
              } ~
              delete {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  parameter('name) { name =>
                    Utils.respondWithNoCacheControl() {
                      complete {
                        try {
                          logger.info("Stop registry test: {}", name)
                          logger.info("Transaction ID(Delete): {}", transactionId)
                          logger.info("Registry name(Post): {}", name)
                          val baseUrl = AuthenticationManager.getBaseUrl(tokenId).get
                          AuthenticationManager.removeBaseUrl(tokenId)
                          RestClient.httpRequestWithHeader(
                            s"$baseUrl/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/test",
                            DELETE,
                            "",
                            tokenId,
                            Some(transactionId)
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
                    }
                  }
                }
              }
            } ~
            path("repo") {
              get {
                parameter('name) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Getting scan registry summary")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/images",
                        GET,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              } ~
              post {
                entity(as[String]) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Starting scan registry: {}", name)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/scan",
                        POST,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              } ~
              delete {
                parameter('name) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Stopping scan registry: {}", name)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/scan",
                        DELETE,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            path("image") {
              get {
                parameter('name, 'imageId, 'show.?) { (name, imageId, show) =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val url =
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/$name/image/$imageId${if (show.isDefined)
                          s"?show=${show.get}"
                        else ""}"
                      logger.info(
                        "Getting scan report for {} on {}, with URL {}",
                        name,
                        imageId,
                        url
                      )
                      RestClient.httpRequestWithHeader(
                        url,
                        GET,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            path("type") {
              get {
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Getting registry types")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/list/registry_type",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            path("layer") {
              get {
                parameter('name, 'imageId, 'show.?) { (name, imageId, show) =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val url =
                        s"${baseClusterUri(tokenId)}/$scanRegistryPath/$name/layers/$imageId${if (show.isDefined)
                          s"?show=$show"
                        else ""}"
                      logger.info(
                        "Getting layer scan report for {} on {}, URL: {}",
                        name,
                        imageId,
                        url
                      )
                      RestClient.httpRequestWithHeader(
                        url,
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
          path("top") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Getting top vulnerable images")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/image?s_severity=desc&start=0&limit=5",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("admission") {
          path("rules") {
            get {
              parameters('scope.?) { scope =>
                if (scope.isEmpty) {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Getting admission rules, {}", baseClusterUri(tokenId))
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$admissionControlPath",
                        GET,
                        "",
                        tokenId
                      )
                    }
                  }
                } else {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Getting Fed admission rules")
                      RestClient.httpRequestWithHeader(
                        s"$baseUri/$admissionControlPath?scope=${scope.get}",
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
          path("rule") {
            post {
              entity(as[AdmRuleConfig]) { admissionRuleConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Adding addmission rule: {}", admissionRuleConfig)
                    logger.info(
                      "config in json: {}",
                      admissionRuleConfigToJson(admissionRuleConfig)
                    )
                    RestClient.httpRequestWithHeader(
                      if (admissionRuleConfig.config.cfg_type.getOrElse("").equals("federal"))
                        s"$baseUri/$admissionControlSinglePath"
                      else s"${baseClusterUri(tokenId)}/$admissionControlSinglePath",
                      POST,
                      admissionRuleConfigToJson(admissionRuleConfig),
                      tokenId
                    )
                  }
                }
              }
            } ~
            patch {
              entity(as[AdmRuleConfig]) { admissionRuleConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Updating addmission rule: {}", admissionRuleConfig)
                    logger.info(
                      "config in json: {}",
                      admissionRuleConfigToJson(admissionRuleConfig)
                    )
                    RestClient.httpRequestWithHeader(
                      if (admissionRuleConfig.config.cfg_type.getOrElse("").equals("federal"))
                        s"$baseUri/$admissionControlSinglePath"
                      else s"${baseClusterUri(tokenId)}/$admissionControlSinglePath",
                      PATCH,
                      admissionRuleConfigToJson(admissionRuleConfig),
                      tokenId
                    )
                  }
                }
              }
            } ~
            delete {
              parameter('scope.?, 'ruleType, 'id) { (scope, _, id) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Removing admission deny rules {}", id)
                    RestClient.httpRequestWithHeader(
                      scope.fold(s"${baseClusterUri(tokenId)}/$admissionControlSinglePath/$id") { scope =>
                        if (scope.equals("fed"))
                          s"$baseUri/$admissionControlSinglePath/$id?scope=$scope"
                        else
                          s"${baseClusterUri(tokenId)}/$admissionControlSinglePath/$id?scope=$scope"
                      },
                      DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("options") {
            get {
              parameter('scope.?) { scope =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Getting admission deny rule options")
                    RestClient.httpRequestWithHeader(
                      scope.fold(s"${baseClusterUri(tokenId)}/$admissionControlOption") { scope =>
                        if (scope.equals("fed"))
                          s"$baseUri/$admissionControlOption?scope=$scope"
                        else s"${baseClusterUri(tokenId)}/$admissionControlOption?scope=$scope"
                      },
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("state") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Getting admission state")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/$admissionControlState",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            patch {
              entity(as[AdmConfig]) { admConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Updating admission state")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$admissionControlState",
                      PATCH,
                      admConfigToJson(admConfig),
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("test") {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  logger.info("Testing admission control on K8s")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/$admissionControlTest",
                    POST,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          path("matching-test") {
            post {
              entity(as[String]) { formData =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val lines: Array[String] = formData.split("\n")
                      val contentLines         = lines.slice(4, lines.length - 1)
                      val bodyData             = contentLines.mkString("\n").substring(3)
                      logger.info("Matching test")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/assess/admission/rule",
                        POST,
                        bodyData,
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          path("export") {
            post {
              entity(as[AdmExport]) { admExport =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Admission export")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$admissionExport",
                      POST,
                      admExportToJson(admExport),
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("import") {
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    try {
                      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
                      val baseUrl = cachedBaseUrl.fold {
                        baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                      }(
                        cachedBaseUrl => cachedBaseUrl
                      )
                      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                      logger.info("test baseUrl: {}", baseUrl)
                      logger.info("Transaction ID(Post): {}", transactionId)
                      RestClient.httpRequestWithHeader(
                        s"$baseUrl/$admissionImport",
                        POST,
                        "",
                        tokenId,
                        Some(transactionId)
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
                }
              } ~
              entity(as[String]) { formData =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    try {
                      val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                      logger.info("test baseUrl: {}", baseUrl)
                      logger.info("No Transaction ID(Post)")
                      val lines: Array[String] = formData.split("\n")
                      val contentLines         = lines.slice(4, lines.length - 1)
                      val bodyData             = contentLines.mkString("\n").substring(3)
                      RestClient.httpRequestWithHeader(
                        s"$baseUrl/$admissionImport",
                        POST,
                        bodyData,
                        tokenId
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
                }
              }
            }
          } ~
          path("promote") {
            post {
              entity(as[PromoteConfig]) { promoteConfig =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/admission/rule/promote",
                      POST,
                      promoteConfigToJson(promoteConfig),
                      tokenId
                    )
                  }
                }
              }
            }
          }
        }
      }
    }
}
