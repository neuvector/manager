package com.neu.service.device

import com.google.common.net.UrlEscapers
import com.neu.cache.SupportLogAuthCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.SystemConfigJsonProtocol.*
import com.neu.model.ContainerConfigJsonProtocol.*
import com.neu.model.*
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.model.headers.*
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

import java.io.File
import java.net.URL
import java.nio.file.Files
import java.nio.file.Paths
import java.util.Date
import scala.concurrent.Await
import scala.concurrent.duration.*
import scala.sys.process.*
import scala.util.control.NonFatal

class DeviceService extends Directives with DefaultJsonFormats with LazyLogging {

  final val timeOutStatus              = "Status: 408"
  final val authenticationFailedStatus = "Status: 401"
  final val serverErrorStatus          = "Status: 503"
  private final val benchHostPath      = "bench/host"
  private var logFile                  = "/tmp/debug.gz"

  def getEnforcers(tokenId: String, id: Option[String]): Route = complete {
    if (id.isEmpty) {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/enforcer",
        HttpMethods.GET,
        "",
        tokenId
      )
    } else {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/enforcer/${id.get}/stats",
        HttpMethods.GET,
        "",
        tokenId
      )
    }
  }

  def getEnforcer(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/enforcer/$id",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getController(tokenId: String, id: Option[String]): Route = complete {
    if (id.isEmpty) {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/controller",
        HttpMethods.GET,
        "",
        tokenId
      )
    } else {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/controller/${id.get}/stats",
        HttpMethods.GET,
        "",
        tokenId
      )
    }
  }

  def getScanner(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/scanner",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getSummary(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/summary",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getIbmSaSetup(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"$baseUri/partner/ibm_sa_ep",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getUsage(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"$baseUri/system/usage",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def createWebhook(tokenId: String, webhook: Webhook): Route = complete {
    val payload = webhookConfigWrapToJson(WebhookConfigWrap(webhook))
    logger.info("Create config: {}", payload)
    RestClient.httpRequestWithHeader(
      if (webhook.cfg_type.equals("federal")) s"$baseUri/system/config/webhook"
      else s"${baseClusterUri(tokenId)}/system/config/webhook",
      HttpMethods.POST,
      payload,
      tokenId
    )
  }

  def updateWebhook(tokenId: String, webhook: Webhook, scope: Option[String]): Route = complete {
    val payload = webhookConfigWrapToJson(WebhookConfigWrap(webhook))
    logger.info("Update config: {}", payload)

    RestClient.httpRequestWithHeader(
      scope.fold(
        s"${baseClusterUri(tokenId)}/system/config/webhook/${webhook.name}"
      ) { scope =>
        if (scope.equals("fed"))
          s"$baseUri/system/config/webhook/${webhook.name}?scope=$scope"
        else
          s"${baseClusterUri(tokenId)}/system/config/webhook/${webhook.name}?scope=$scope"
      },
      HttpMethods.PATCH,
      payload,
      tokenId
    )
  }

  def deleteWebhook(tokenId: String, name: String, scope: Option[String]): Route = complete {
    logger.info("Delete config: {}", name)

    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/system/config/webhook/$name") { scope =>
        if (scope.equals("fed")) s"$baseUri/system/config/webhook/$name?scope=$scope"
        else s"${baseClusterUri(tokenId)}/system/config/webhook/$name?scope=$scope"
      },
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def getConfig(tokenId: String, scope: Option[String]): Route = complete {
    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/system/config") { scope =>
        if (scope.equals("fed")) s"$baseUri/system/config?scope=$scope"
        else s"${baseClusterUri(tokenId)}/system/config?scope=$scope"
      },
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def updateConfig(tokenId: String, systemConfig: SystemConfig, scope: Option[String]): Route =
    complete {
      scope.fold {
        val payload =
          systemConfigWrapToJson(
            SystemConfigWrap(Some(systemConfig), None, None, None, None)
          )
        logger.info("Updating config")
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/system/config",
          HttpMethods.PATCH,
          payload,
          tokenId
        )
      } { scope =>
        val fedPayload =
          systemConfigWrapToJson(
            SystemConfigWrap(None, None, Some(systemConfig), None, None)
          )
        logger.info("Updating fed config")
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/system/config?scope=$scope",
          HttpMethods.PATCH,
          fedPayload,
          tokenId
        )
      }
    }

  def getConfigV2(tokenId: String, scope: Option[String], source: Option[String]): Route =
    complete {
      val _source = source.fold("") { source =>
        source
      }
      scope.fold {
        logger.info("Get config {}", _source)
        RestClient.httpRequestWithHeader(
          s"${baseClusterUriV2(tokenId)}/system/config",
          HttpMethods.GET,
          "",
          tokenId,
          None,
          None,
          Some(_source)
        )
      } { scope =>
        logger.info("Get fed config {}", _source)
        RestClient.httpRequestWithHeader(
          s"${baseClusterUriV2(tokenId)}/system/config?scope=$scope",
          HttpMethods.GET,
          "",
          tokenId,
          None,
          None,
          Some(_source)
        )
      }
    }

  def updateConfigV2(
    tokenId: String,
    scope: Option[String],
    systemConfigWrap: SystemConfigWrap
  ): Route = complete {
    scope.fold {
      val payload =
        systemConfigWrapToJson(systemConfigWrap)
      logger.info("Updating config")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUriV2(tokenId)}/system/config",
        HttpMethods.PATCH,
        payload,
        tokenId
      )
    } { scope =>
      val fedPayload =
        systemConfigWrapToJson(systemConfigWrap)
      logger.info("Updating fed config")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUriV2(tokenId)}/system/config?scope=$scope",
        HttpMethods.PATCH,
        fedPayload,
        tokenId
      )
    }
  }

  def createRemoteRepository(tokenId: String, remoteRepository: RemoteRepository): Route =
    complete {
      val payload = remoteRepositoryToJson(
        remoteRepository
      )
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/config/remote_repository",
        HttpMethods.POST,
        payload,
        tokenId
      )
    }

  def updateRemoteRepository(tokenId: String, remoteRepositoryWrap: RemoteRepositoryWrap): Route =
    complete {
      val payload = remoteRepositoryWrapToJson(
        remoteRepositoryWrap
      )
      val name    = remoteRepositoryWrap.config.nickname
      logger.info("Update remote repository")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/config/remote_repository/${UrlEscapers.urlFragmentEscaper().escape(name)}",
        HttpMethods.PATCH,
        payload,
        tokenId
      )
    }

  def deleteRemoteRepository(tokenId: String, name: String): Route = complete {
    logger.info("Delete remote repository: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/config/remote_repository/${UrlEscapers.urlFragmentEscaper().escape(name)}",
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def getHost(tokenId: String, id: Option[String]): Route = complete {
    if (id.isEmpty) {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/host",
        HttpMethods.GET,
        "",
        tokenId
      )
    } else {
      logger.info("Getting host details...")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/host/${id.get}",
        HttpMethods.GET,
        "",
        tokenId
      )
    }
  }

  def getWorkload(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload?view=pod&f_host_id=$id",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getCompliance(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/host/$id/compliance",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getFileConfig(tokenId: String, id: String): Route = complete {
    if (id.equals("all")) {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/config?raw=true",
        HttpMethods.GET,
        "",
        tokenId
      )
    } else {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/config?section=policy&raw=true",
        HttpMethods.GET,
        "",
        tokenId
      )
    }
  }

  def exportFedSystemConfig(
    tokenId: String,
    exportedFedSystemConfig: ExportedFedSystemConfig
  ): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file/fed_config",
      HttpMethods.POST,
      exportedFedSystemConfigToJson(exportedFedSystemConfig),
      tokenId
    )
  }

  def createFileConfig(
    tokenId: String,
    tempToken: String,
    transactionId: String,
    asStandalone: String,
    scope: String = "local"
  ): Route = complete {
    try {
      setBaseUrl(tokenId, transactionId)
      Thread.sleep(1000)
      val importResFuture = RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/config",
        HttpMethods.POST,
        "",
        tokenId,
        Some(transactionId),
        Some(asStandalone)
      )
      val importRes       =
        Await.result(importResFuture, RestClient.waitingLimit.seconds)
      if (importRes.toString.contains("408 Request Timeout")) {

        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/file/config",
          HttpMethods.POST,
          "",
          tempToken,
          Some(transactionId),
          Some(asStandalone)
        )
      } else {
        importRes
      }
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

  def createMultiPartFileConfig(
    tokenId: String,
    asStandalone: String,
    formData: Multipart.FormData,
    scope: String = "local"
  ): Route = complete {
    try {
      val baseUrl = baseClusterUri(tokenId)
      logger.info("testing baseUrl")
      logger.info("No Transaction ID(Post),{}", asStandalone.getClass.toString)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      Thread.sleep(1000)
      RestClient.binaryWithHeader(
        s"${baseClusterUri(tokenId)}/file/config",
        HttpMethods.POST,
        formData,
        tokenId,
        None,
        Some(asStandalone)
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

  def importFedSystemConfig(
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
        s"$baseUrl/file/config?scope=fed",
        HttpMethods.POST,
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

  def importFedSystemConfigByFormData(
    tokenId: String,
    formData: String
  ): Route = complete {
    try {
      val baseUrl              = baseClusterUri(tokenId)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("No Transaction ID(Post)")
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/config?scope=fed",
        HttpMethods.POST,
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

  def getDebugLog(tokenId: String): Route = complete {
    logger.info("Getting debug log: {}", logFile)
    try {
      val authRes = RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$auth",
        HttpMethods.PATCH,
        "",
        tokenId
      )
      Await.result(authRes, RestClient.waitingLimit.seconds)
      if (SupportLogAuthCacheManager.getSupportLogAuth(tokenId).isDefined) {
        val byteArray = Files.readAllBytes(Paths.get(logFile))
        purgeDebugFiles(new File("/tmp"))
        HttpResponse(
          StatusCodes.OK,
          entity = HttpEntity(ContentType(MediaTypes.`application/x-gzip`), byteArray)
        ).withHeaders(
          headers.`Content-Disposition`(
            ContentDispositionTypes.inline,
            Map("filename" -> "debug.gz")
          )
        )
      } else {
        (StatusCodes.Forbidden, "File can not be accessed.")
      }
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

  def createDebugLog(tokenId: String, debuggedEnforcer: String): Route = complete {
    try
      verifyToken(tokenId) match {
        case Right(true)  =>
          logFile = "/tmp/debug" + new Date().getTime + ".gz"
          purgeDebugFiles(new File("/tmp"))

          val id       = AuthenticationManager.getCluster(tokenId).getOrElse("")
          val ctrlHost = new URL(baseUri).getHost
          SupportLogAuthCacheManager.saveSupportLogAuth(tokenId, logFile)
          if (debuggedEnforcer.nonEmpty) {
            logger.info("With enforcer debug log.")
            logger.info(
              "Process is running {}",
              "/usr/local/bin/support" +
              " -s " + ctrlHost +
              " -t " + tokenId +
              " -r " + AuthenticationManager.suseTokenMap.getOrElse(tokenId, "") +
              " -j " + id +
              " -e " + debuggedEnforcer +
              " -o " + logFile
            )
            Seq(
              "/usr/local/bin/support",
              "-s",
              ctrlHost,
              "-t",
              tokenId,
              "-r",
              AuthenticationManager.suseTokenMap.getOrElse(tokenId, ""),
              "-j",
              id,
              "-e",
              debuggedEnforcer,
              "-o",
              logFile
            ).run
            HttpResponse(
              StatusCodes.Accepted,
              entity = "Started to collect debug log."
            )
          } else {
            logger.info("Without enforcer debug log")
            logger.info(
              "Process is running {}",
              "/usr/local/bin/support" +
              " -s " + ctrlHost +
              " -t " + tokenId +
              " -r " + AuthenticationManager.suseTokenMap.getOrElse(tokenId, "") +
              " -j " + id +
              " -o " + logFile
            )
            Seq(
              "/usr/local/bin/support",
              "-s",
              ctrlHost,
              "-t",
              tokenId,
              "-r",
              AuthenticationManager.suseTokenMap.getOrElse(tokenId, ""),
              "-j",
              id,
              "-o",
              logFile
            ).run
            HttpResponse(
              StatusCodes.Accepted,
              entity = "Started to collect debug log."
            )
          }
        case Right(false) =>
          RestClient.handleError(
            timeOutStatus,
            authenticationFailedStatus,
            serverErrorStatus,
            new RuntimeException("Status: 401")
          )
        case Left(error)  =>
          RestClient.handleError(
            timeOutStatus,
            authenticationFailedStatus,
            serverErrorStatus,
            error
          )
      }
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

  def checkDebugLog(): Route = complete {
    val isFileReady = Files.exists(Paths.get(logFile)) && Files.isReadable(
      Paths.get(logFile)
    )
    logger.info(s"Log file $logFile  is ready: $isFileReady")
    if (isFileReady) {
      HttpResponse(StatusCodes.OK, entity = "Ready")
    } else {
      HttpResponse(StatusCodes.PartialContent, entity = "In progress")
    }
  }

  def getDockerBench(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def createDockerBench(tokenId: String, id: String): Route = complete {
    logger.info("Starting cis scan on docker: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
      HttpMethods.POST,
      "",
      tokenId
    )
  }

  def getKubernetesBench(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def createKubernetesBench(tokenId: String, id: String): Route = complete {
    logger.info("Starting scan registry: {}", id)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
      HttpMethods.POST,
      "",
      tokenId
    )
  }

  def downloadCspSupportFile(tokenId: String): Route = complete {
    logger.info("Downloading CSP support file: {}")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/csp/file/support",
      HttpMethods.POST,
      "",
      tokenId
    )
  }

  def getScanReport(tokenId: String, request: ScanReportRequest): Route = complete {
    val payload = scanReportRequestToJson(request)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/hosts/scan_report",
      HttpMethods.POST,
      payload,
      tokenId
    )
  }

  private val purgeDebugFiles = (dir: File) => {
    val tempFiles: List[File] = dir.listFiles.filter(_.isFile).toList.filter { file =>
      file.getName.startsWith("debug") && file.getName.endsWith(".gz")
    }
    if (tempFiles.lengthCompare(2) > 0) {
      val toRemovedFiles = tempFiles.sortBy(_.getName).take(tempFiles.size - 2)
      toRemovedFiles.foreach(_.delete)
    }
  }

  private def verifyToken(tokenId: String): Either[Throwable, Boolean] =
    try {
      val resultPromise        = RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$auth",
        HttpMethods.PATCH,
        "",
        tokenId
      )
      val result: HttpResponse = Await.result(resultPromise, RestClient.waitingLimit.seconds)
      result match {
        case HttpResponse(StatusCodes.OK, _, _, _)             => Right(true)
        case HttpResponse(status, _, _, _) if status.isFailure => Right(false)
        case _                                                 => Right(false)
      }
    } catch {
      case NonFatal(e) =>
        Left(e)
    }

  private def setBaseUrl(tokenId: String, transactionId: String): Unit = {
    val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
    val baseUrl       = cachedBaseUrl.getOrElse(
      baseClusterUri(tokenId)
    )
    AuthenticationManager.setBaseUrl(tokenId, baseUrl)
    logger.info("test base Url: {}", baseUrl)
    logger.info("Transaction ID(Post): {}", transactionId)
  }
}
