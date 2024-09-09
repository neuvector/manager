package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.AuthenticationManager
import com.neu.model.SystemConfigJsonProtocol._
import com.neu.model.{
  RemoteRepository,
  RemoteRepositoryWrap,
  SystemConfig,
  SystemConfigWrap,
  Webhook,
  WebhookConfigWrap
}
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.util.Timeout
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.model.headers._
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

import java.io.File
import java.net.URL
import java.nio.file.{ Files, Paths }
import java.util.Date
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext }
import scala.sys.process._
import scala.util.control.NonFatal
import com.neu.cache.SupportLogAuthCacheManager

class DeviceApi()(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats
    with LazyLogging {

  private var logFile                  = "/tmp/debug.gz"
  private final val benchHostPath      = "bench/host"
  final val timeOutStatus              = "Status: 408"
  final val authenticationFailedStatus = "Status: 401"
  final val serverErrorStatus          = "Status: 503"

  private val purgeDebugFiles = (dir: File) => {
    val tempFiles: List[File] = dir.listFiles.filter(_.isFile).toList.filter { file =>
      file.getName.startsWith("debug") && file.getName.endsWith(".gz")
    }
    if (tempFiles.lengthCompare(2) > 0) {
      val toRemovedFiles = tempFiles.sortBy(_.getName).take(tempFiles.size - 2)
      toRemovedFiles.foreach(_.delete)
    }
  }

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("enforcer") {
          get {
            parameter('id.?) { id =>
              Utils.respondWithWebServerHeaders() {
                complete {
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
              }
            }
          }
        } ~
        pathPrefix("single-enforcer") {
          get {
            parameter('id) { id =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/enforcer/$id",
                    HttpMethods.GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("controller") {
          get {
            implicit val timeout: Timeout = Timeout(RestClient.waitingLimit.seconds)
            parameter('id.?) { id =>
              Utils.respondWithWebServerHeaders() {
                complete {
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
              }
            }
          }
        } ~
        pathPrefix("scanner") {
          get {
            implicit val timeout: Timeout = Timeout(RestClient.waitingLimit.seconds)
            Utils.respondWithWebServerHeaders() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/scan/scanner",
                  HttpMethods.GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("summary") {
          get {
            Utils.respondWithWebServerHeaders() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/system/summary",
                  HttpMethods.GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("ibmsa_setup") {
          get {
            Utils.respondWithWebServerHeaders() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"$baseUri/partner/ibm_sa_ep",
                  HttpMethods.GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("usage") {
          get {
            Utils.respondWithWebServerHeaders() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"$baseUri/system/usage",
                  HttpMethods.GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("webhook") {
          post {
            Utils.respondWithWebServerHeaders() {
              entity(as[Webhook]) { webhook =>
                complete {
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
              }
            }
          } ~
          patch {
            Utils.respondWithWebServerHeaders() {
              parameter('scope.?) { scope =>
                entity(as[Webhook]) { webhook =>
                  complete {
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
                }
              }
            }
          } ~
          delete {
            Utils.respondWithWebServerHeaders() {
              parameter('name, 'scope.?) { (name, scope) =>
                complete {
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
              }
            }
          }
        } ~
        path("config") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter('scope.?) { scope =>
                complete {
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
              }
            }
          } ~
          patch {
            entity(as[SystemConfig]) { systemConfig =>
              parameter('scope.?) { scope =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      scope.fold {
                        val payload =
                          systemConfigWrapToJson(
                            SystemConfigWrap(Some(systemConfig), None, None, None, None)
                          )
                        logger.info("Updating config: {}", payload)
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
                        logger.info("Updating fed config: {}", fedPayload)
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/system/config?scope=$scope",
                          HttpMethods.PATCH,
                          fedPayload,
                          tokenId
                        )
                      }
                    }
                  }
                }
              }
            }
          }
        } ~
        path("config-v2") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter('scope.?, 'source.?) { (scope, source) =>
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
              }
            }
          } ~
          patch {
            entity(as[SystemConfigWrap]) { systemConfigWrap =>
              parameter('scope.?) { scope =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
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
                  }
                }
              }
            }
          }
        } ~
        path("remote_repository") {
          post {
            Utils.respondWithWebServerHeaders() {
              entity(as[RemoteRepository]) { remoteRepository =>
                complete {
                  val payload = remoteRepositoryToJson(
                    remoteRepository
                  )
                  logger.info("Create remote repository: {}", payload)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/system/config/remote_repository",
                    HttpMethods.POST,
                    payload,
                    tokenId
                  )
                }
              }
            }
          } ~
          patch {
            Utils.respondWithWebServerHeaders() {
              entity(as[RemoteRepositoryWrap]) { remoteRepositoryWrap =>
                complete {
                  val payload = remoteRepositoryWrapToJson(
                    remoteRepositoryWrap
                  )
                  val name = remoteRepositoryWrap.config.nickname
                  logger.info("Update remote repository: {}", payload)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/system/config/remote_repository/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                    HttpMethods.PATCH,
                    payload,
                    tokenId
                  )
                }
              }
            }
          } ~
          delete {
            Utils.respondWithWebServerHeaders() {
              parameter('name) { name =>
                complete {
                  logger.info("Delete remote repository: {}", name)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/system/config/remote_repository/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                    HttpMethods.DELETE,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("host") {
          pathEnd {
            get {
              parameter('id.?) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
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
                }
              }
            }
          } ~
          path("workload") {
            get {
              parameter('id) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload?view=pod&f_host_id=$id",
                      HttpMethods.GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("compliance") {
            get {
              parameter('id) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/host/$id/compliance",
                      HttpMethods.GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("file") {
          path("config") {
            get {
              parameter('id) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
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
                }
              }
            } ~
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  entity(as[String]) { tempToken =>
                    Utils.respondWithWebServerHeaders() {
                      complete {
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
                          val importRes =
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
                    }
                  }
                }
              } ~
              entity(as[Multipart.FormData]) { formData =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      try {
                        val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
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
                  }
                }
              }
            }
          } ~
          pathPrefix("debug") {
            pathEnd {
              get {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Getting debug log: {}", logFile)
                    try {
                      val authRes = RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$auth",
                        HttpMethods.PATCH,
                        "",
                        tokenId
                      )
                      val result = Await.result(authRes, RestClient.waitingLimit.seconds)
                      if (SupportLogAuthCacheManager.getSupportLogAuth(tokenId).isDefined) {
                        val byteArray = Files.readAllBytes(Paths.get(logFile))
                        purgeDebugFiles(new File("/tmp"))
                        HttpResponse(
                          StatusCodes.OK,
                          entity =
                            HttpEntity(ContentType(MediaTypes.`application/x-gzip`), byteArray)
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
                }
              } ~
              post {
                Utils.respondWithWebServerHeaders() {
                  entity(as[String]) { debuggedEnforcer =>
                    complete {
                      try {
                        verifyToken(tokenId) match {
                          case Right(true) => {
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
                              val proc =
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
                              val proc =
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
                          }
                          case Right(false) => {
                            RestClient.handleError(
                              timeOutStatus,
                              authenticationFailedStatus,
                              serverErrorStatus,
                              new RuntimeException("Status: 401")
                            )
                          }
                          case Left(error) => {
                            RestClient.handleError(
                              timeOutStatus,
                              authenticationFailedStatus,
                              serverErrorStatus,
                              error
                            )
                          }
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
                  }
                }
              }
            } ~
            path("check") {
              get {
                Utils.respondWithWebServerHeaders() {
                  complete {
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
                }
              }
            }
          }
        } ~
        pathPrefix("bench") {
          path("docker") {
            get {
              parameter('id) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
                      HttpMethods.GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Starting cis scan on docker: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
                      HttpMethods.POST,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("kubernetes") {
            get {
              parameter('id) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
                      HttpMethods.GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Starting scan registry: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
                      HttpMethods.POST,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        path("csp-support") {
          post {
            Utils.respondWithWebServerHeaders() {
              complete {
                logger.info("Downloading CSP support file: {}")
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/csp/file/support",
                  HttpMethods.POST,
                  "",
                  tokenId
                )
              }
            }
          }
        }
      }
    }

  private def verifyToken(tokenId: String): Either[Throwable, Boolean] =
    try {
      val resultPromise = RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$auth",
        HttpMethods.PATCH,
        "",
        tokenId
      )
      val result: HttpResponse = Await.result(resultPromise, RestClient.waitingLimit.seconds)
      result match {
        case HttpResponse(StatusCodes.OK, headers, entity, _)  => Right(true)
        case HttpResponse(status, _, _, _) if status.isFailure => Right(false)
        case _                                                 => Right(false)
      }
    } catch {
      case NonFatal(e) =>
        Left(e)
    }

  private def setBaseUrl(tokenId: String, transactionId: String): Unit = {
    val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
    val baseUrl = cachedBaseUrl.getOrElse(
      baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
    )
    AuthenticationManager.setBaseUrl(tokenId, baseUrl)
    logger.info("test base Url: {}", baseUrl)
    logger.info("Transaction ID(Post): {}", transactionId)
  }
}
