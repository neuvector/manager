package com.neu.service.policy

import com.google.common.net.UrlEscapers
import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.AdmissionJsonProtocol.*
import com.neu.model.GroupJsonProtocol.*
import com.neu.model.JsonProtocol.given
import com.neu.model.PolicyJsonProtocol.{ *, given }
import com.neu.model.RegistryConfigJsonProtocol.*
import com.neu.model.*
import com.neu.service.BaseService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.{ ContentTypes, HttpEntity, StatusCodes }
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.server.Route
import org.json4s.*
import org.json4s.native.JsonMethods.*

import scala.concurrent.Await
import scala.concurrent.TimeoutException
import scala.concurrent.duration.*
import scala.util.control.NonFatal

class PolicyService() extends BaseService with DefaultJsonFormats with LazyLogging {

  private final val policyPath                 = "policy/rule"
  private final val responseRulePath           = "response/rule"
  private final val scanConfigPath             = "scan/config"
  private final val scanRegistryPath           = "scan/registry"
  private final val admissionControlPath       = "admission/rules"
  private final val admissionControlSinglePath = "admission/rule"
  private final val admissionControlOption     = "admission/options"
  private final val admissionControlState      = "admission/state"
  private final val admissionExport            = "file/admission"
  private final val admissionImport            = "file/admission/config"
  private final val admissionControlTest       = "debug/admission/test"
  private final val fedDeploy                  = "fed/deploy"

  final val serverErrorStatus = "Status: 503"

  def deployFedRules(tokenId: String, deployFedRulesConfig: DeployFedRulesConfig): Route =
    complete {
      logger.info("Inform rule deployment")
      RestClient.httpRequestWithHeader(
        s"$baseUri/$fedDeploy",
        POST,
        deployFedRulesConfigToJson(deployFedRulesConfig),
        tokenId
      )
    }

  def getConditionOptions(tokenId: String, scope: Option[String]): Route = complete {
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

  def unquarantine(tokenId: String, request: Request): Route = complete {
    logger.info("Unquarantine response policy: {}")
    logger.info("Unquarantine response rules: {}", requestToJson(request))
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/request",
      POST,
      requestToJson(request),
      tokenId
    )
  }

  def getResponseRuleById(tokenId: String, id: String): Route = complete {
    logger.info("Response rule id: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$responseRulePath/$id",
      GET,
      "",
      tokenId
    )
  }

  def getResponsePolicy(tokenId: String, scope: Option[String]): Route = complete {
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

  def insertResponseRules(tokenId: String, responseRulesWrap: ResponseRulesWrap): Route =
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

  def updateResponsePolicy(tokenId: String, responseRuleConfig: ResponseRuleConfig): Route =
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

  def deleteResponseRule(tokenId: String, scope: Option[String], id: Option[String]): Route =
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
            id.fold(s"${baseClusterUri(tokenId)}/$responseRulePath?scope=$scope") { id =>
              s"${baseClusterUri(tokenId)}/$responseRulePath/$id?scope=$scope"
            }
          }
        },
        DELETE,
        "",
        tokenId
      )
    }

  def getPolicy(
    tokenId: String,
    scope: Option[String],
    start: Option[String],
    limit: Option[String]
  ): Route = {
    var url = s"${baseClusterUri(tokenId)}/$policyPath"
    if (scope.isDefined) {
      url = s"$baseUri/$policyPath?scope=${scope.get}"
    }
    complete {
      val cacheKey = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
      try {
        var elements: List[org.json4s.JsonAST.JValue] = null
        var ruleStr: String                           = null
        if (start.isEmpty || start.get.toInt == 0) {
          logger.info("Getting policy")
          val ruleRes = RestClient.requestWithHeaderDecode(url, GET, "", tokenId)
          ruleStr = Await.result(ruleRes, RestClient.waitingLimit.seconds)
          val json    = parse(ruleStr)
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
          val output     =
            elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
          if (output.length < limit.get.toInt) {
            paginationCacheManager[List[org.json4s.JsonAST.JValue]]
              .removePagedData(s"$cacheKey-network-rule")
          }
          val pagedRes   = compact(render(JArray(output)))
          val cachedData = paginationCacheManager[List[org.json4s.JsonAST.JValue]]
            .getPagedData(s"$cacheKey-network-rule")
            .getOrElse(List[org.json4s.JsonAST.JValue]())
          logger.info("Cached data size: {}", cachedData.size)
          logger.info(
            "Paged response size: {}",
            compact(render(JArray(output))).length
          )
          HttpEntity(ContentTypes.`application/json`, pagedRes)
        } else {
          ruleStr
        }
      } catch {
        case NonFatal(e) =>
          logger.warn(e.getMessage)
          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
            .removePagedData(s"$cacheKey-network-rule")
          if (
            e.getMessage.contains("Status: 401") || e.getMessage.contains(
              "Status: 403"
            )
          ) {
            (StatusCodes.Unauthorized, "Authentication failed!")
          } else {
            (StatusCodes.InternalServerError, "Controller unavailable!")
          }
        case e: TimeoutException =>
          logger.warn(e.getMessage)
          paginationCacheManager[List[org.json4s.JsonAST.JValue]]
            .removePagedData(s"$cacheKey-network-rule")
          (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
      }
    }
  }

  def updatePolicy(tokenId: String, scope: String, policy: Policy2): Route = complete {
    logger.debug("Updating policy: {}", policy2ToJson(policy))
    RestClient.httpRequestWithHeader(
      if (scope.equals("fed")) s"$baseUri/$policyPath?scope=$scope"
      else s"${baseClusterUri(tokenId)}/$policyPath?scope=$scope",
      PATCH,
      policy2ToJson(policy),
      tokenId
    )
  }

  def deletePolicy(tokenId: String, id: Option[String]): Route = complete {
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

  def getPolicyApplications(tokenId: String): Route = complete {
    logger.info("Getting policy applications")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/list/application",
      GET,
      "",
      tokenId
    )
  }

  def getPolicyRules(tokenId: String, id: String): Route = complete {
    logger.info("Getting rule: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/policy/rule/$id",
      GET,
      "",
      tokenId
    )
  }

  def addPolicyRule(tokenId: String, rule: Rule): Route = complete {
    logger.info("Adding rule: {}", rule.id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$policyPath",
      PATCH,
      policyRuleInsertToJson(PolicyRuleInsert(RuleInsert(0, Array(rule)))),
      tokenId
    )
  }

  def updatePolicyRule(tokenId: String, rule: RuleConfig): Route = complete {
    logger.info("Updating rule: {}", rule.id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$policyPath/${rule.id}",
      PATCH,
      ruleConfigDataToJson(RuleConfigData(rule, Some(true))),
      tokenId
    )
  }

  def getPolicyGraph(tokenId: String): Route = complete {
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
      val nodes  = groups.map(groupToNode)

      val policyStr =
        RestClient.requestWithHeaderDecode(
          s"${baseClusterUri(tokenId)}/$policyPath",
          GET,
          "",
          tokenId
        )
      val rules     =
        jsonToPolicy(Await.result(policyStr, RestClient.waitingLimit.seconds)).rules
      val edges     = rules.zipWithIndex.map { case (rule, i) => ruleToEdge(rule, i) }

      logger.info("Policy graph nodes size {}", nodes.length)
      NetworkGraph(nodes, edges)
    } catch {
      case NonFatal(e) =>
        onNonFatal(e)
    }
  }

  def promotePolicy(tokenId: String, promoteConfig: PromoteConfig): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/policy/rules/promote",
      POST,
      promoteConfigToJson(promoteConfig),
      tokenId
    )
  }

  def getScanStatus(tokenId: String): Route = complete {
    logger.info("Getting scan status")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/status",
      GET,
      "",
      tokenId
    )
  }

  def getScanWorkload(tokenId: String, id: Option[String], show: Option[String]): Route = complete {
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
        s"${baseClusterUri(tokenId)}/scan/workload/${id.get}${
            if (show.isDefined)
              s"?show=${show.get}"
            else ""
          }"
      logger.info("Getting scan workload details, URL: {}", url)
      RestClient.httpRequestWithHeader(url, GET, "", tokenId)
    }
  }

  def scanContainer(tokenId: String, id: String): Route = complete {
    logger.info("Scan on container: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/workload/$id",
      POST,
      "",
      tokenId
    )
  }

  def getHostScanSummary(tokenId: String, id: Option[String], show: Option[String]): Route =
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
          s"${baseClusterUri(tokenId)}/scan/host/${id.get}${
              if (show.isDefined)
                s"?show=${show.get}"
              else ""
            }"
        logger.info("Getting single node scan summary, URL: {}", url)
        RestClient.httpRequestWithHeader(url, GET, "", tokenId)
      }
    }

  def scanHost(tokenId: String, id: String): Route = complete {
    logger.info("Scan on node: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/host/$id",
      POST,
      "",
      tokenId
    )
  }

  def getPlatformScanSummary(
    tokenId: String,
    platform: Option[String],
    show: Option[String]
  ): Route = complete {
    platform match {
      case None    =>
        logger.info("Getting platform scan summary")
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/scan/platform",
          GET,
          "",
          tokenId
        )
      case Some(_) =>
        val url =
          s"${baseClusterUri(tokenId)}/scan/platform/platform${
              if (show.isDefined)
                s"?show=${show.get}"
              else ""
            }"
        logger.info("Getting platform scan result, URL: {}", url)
        RestClient.httpRequestWithHeader(url, GET, "", tokenId)
    }
  }

  def scanPlatform(tokenId: String, id: String): Route = complete {
    logger.info("Scan on node: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/platform/platform",
      POST,
      "",
      tokenId
    )
  }

  def getScanConfig(tokenId: String): Route = complete {
    logger.info("Getting scan config")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanConfigPath",
      GET,
      "",
      tokenId
    )
  }

  def setAutoScanConfig(tokenId: String, scanConfig: ScanConfigWrap): Route = complete {
    logger.info("Set auto scan : {}", scanConfig.config.auto_scan)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanConfigPath",
      PATCH,
      scanConfigWrapToJson(scanConfig),
      tokenId
    )
  }

  def getScanRegistries(tokenId: String, name: Option[String]): Route = complete {
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

  def addScanRegistry(tokenId: String, registryConfigV2: RegistryConfigV2Wrap): Route = complete {
    logger.info(
      "Adding scan registry: {}",
      jsonToMaskedRegistryConfigV2(
        registryConfigV2ToJson(registryConfigV2.config)
      )
    )
    logger.debug(
      "config in json: {}",
      registryConfigV2WrapToJson(registryConfigV2)
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUriV2(tokenId)}/$scanRegistryPath",
      POST,
      registryConfigV2WrapToJson(registryConfigV2),
      tokenId
    )
  }

  def updateScanRegistry(tokenId: String, registryConfigV2: RegistryConfigV2DTO): Route = complete {
    logger.info("Updating scan registry: {}", registryConfigV2.name)
    logger.debug(
      "config in json: {}",
      registryConfigV2WrapToJson(registryConfigV2.wrap)
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUriV2(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfigV2.name)}",
      PATCH,
      registryConfigV2WrapToJson(registryConfigV2.wrap),
      tokenId
    )
  }

  def deleteScanRegistry(tokenId: String, name: String): Route = complete {
    logger.info("Deleting registry: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}",
      DELETE,
      "",
      tokenId
    )
  }

  def testScanRegistry(
    tokenId: String,
    transactionId: String,
    registryConfigV2: RegistryConfigV2Wrap
  ): Route =
    complete {
      try {
        val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
        val baseUrlV2     = cachedBaseUrl.getOrElse(
          baseClusterUriV2(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
        )
        AuthenticationManager.setBaseUrl(tokenId, baseUrlV2)
        logger.info("test baseUrl: {}", baseUrlV2)
        logger.info("Transaction ID(Post): {}", transactionId)
        logger.info("Registry name(Post): {}", registryConfigV2.config.name)
        RestClient.httpRequestWithHeader(
          s"$baseUrlV2/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfigV2.config.name)}/test",
          POST,
          registryConfigV2WrapToJson(registryConfigV2),
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

  def testScanRegistry(
    tokenId: String,
    registryConfigV2: RegistryConfigV2Wrap
  ): Route = complete {
    try {
      val baseUrlV2 =
        baseClusterUriV2(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
      AuthenticationManager.setBaseUrl(tokenId, baseUrlV2)
      logger.info("test baseUrl: {}", baseUrlV2)
      logger.info("No Transaction ID(Post)")
      logger.info("Registry name(Post): {}", registryConfigV2.config.name)
      RestClient.httpRequestWithHeader(
        s"$baseUrlV2/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(registryConfigV2.config.name)}/test",
        POST,
        registryConfigV2WrapToJson(registryConfigV2),
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

  def testDeleteScanRegistry(tokenId: String, transactionId: String, name: String): Route =
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

  def getRepoScanRegistrySummary(tokenId: String, name: String): Route = complete {
    logger.info("Getting scan registry summary")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/images",
      GET,
      "",
      tokenId
    )
  }

  def startRepoScanRegistry(tokenId: String, name: String): Route = complete {
    logger.info("Starting scan registry: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/scan",
      POST,
      "",
      tokenId
    )
  }

  def stopRepoScanRegistry(tokenId: String, name: String): Route = complete {
    logger.info("Stopping scan registry: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/${UrlEscapers.urlFragmentEscaper().escape(name)}/scan",
      DELETE,
      "",
      tokenId
    )
  }

  def getImageScanReport(
    tokenId: String,
    name: String,
    imageId: String,
    show: Option[String]
  ): Route = complete {
    val url =
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/$name/image/$imageId${
          if (show.isDefined)
            s"?show=${show.get}"
          else ""
        }"
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

  def getRegistryTypes(tokenId: String): Route = complete {
    logger.info("Getting registry types")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/list/registry_type",
      GET,
      "",
      tokenId
    )
  }

  def getLayerScanReport(
    tokenId: String,
    name: String,
    imageId: String,
    show: Option[String]
  ): Route = complete {
    val url =
      s"${baseClusterUri(tokenId)}/$scanRegistryPath/$name/layers/$imageId${
          if (show.isDefined)
            s"?show=$show"
          else ""
        }"
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

  def getTopVulnerableImages(tokenId: String): Route = complete {
    logger.info("Getting top vulnerable images")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/image?s_severity=desc&start=0&limit=5",
      GET,
      "",
      tokenId
    )
  }

  def getAdmissionRules(tokenId: String, scope: Option[String]): Route = complete {
    if (scope.isEmpty) {
      logger.info("Getting admission rules, {}", baseClusterUri(tokenId))
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$admissionControlPath",
        GET,
        "",
        tokenId
      )
    } else {
      logger.info("Getting Fed admission rules")
      RestClient.httpRequestWithHeader(
        s"$baseUri/$admissionControlPath?scope=${scope.get}",
        GET,
        "",
        tokenId
      )
    }
  }

  def addAdmissionRules(tokenId: String, admissionRuleConfig: AdmRuleConfig): Route = complete {
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

  def updateAdmissionRule(tokenId: String, admissionRuleConfig: AdmRuleConfig): Route = complete {
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

  def removeAdmissionDenyRule(tokenId: String, id: String, scope: Option[String]): Route =
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

  def getAdmissionDenyRuleOptions(tokenId: String, scope: Option[String]): Route = complete {
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

  def getAdmissionState(tokenId: String): Route = complete {
    logger.info("Getting admission state")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$admissionControlState",
      GET,
      "",
      tokenId
    )
  }

  def updateAdmissionState(tokenId: String, admConfig: AdmConfig): Route = complete {
    logger.info("Updating admission state")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$admissionControlState",
      PATCH,
      admConfigToJson(admConfig),
      tokenId
    )
  }

  def testAdmissionControl(tokenId: String): Route = complete {
    logger.info("Testing admission control on K8s")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$admissionControlTest",
      POST,
      "",
      tokenId
    )
  }

  def testMatchingAdmissionRule(tokenId: String, formData: String): Route = complete {
    val lines: Array[String] = formData.split("\n")
    val contentLines         = lines.slice(4, lines.length - 1)
    val bodyData             = contentLines.mkString("\n")
    logger.info("Matching test")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/assess/admission/rule",
      POST,
      bodyData,
      tokenId
    )
  }

  def exportAdmission(tokenId: String, admExport: AdmExport): Route = complete {
    logger.info("Admission export")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$admissionExport",
      POST,
      admExportToJson(admExport),
      tokenId
    )
  }

  def importAdmission(
    tokenId: String,
    transactionId: String
  ): Route = complete {
    try {
      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
      val baseUrl       = cachedBaseUrl.fold {
        baseClusterUri(tokenId)
      }(cachedBaseUrl => cachedBaseUrl)
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

  def importAdmissionByFormData(tokenId: String, formData: String): Route = complete {
    try {
      val baseUrl              = baseClusterUri(tokenId)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("No Transaction ID(Post)")
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
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

  def promoteAdmissionRule(tokenId: String, promoteConfig: PromoteConfig): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/admission/rule/promote",
      POST,
      promoteConfigToJson(promoteConfig),
      tokenId
    )
  }
}
