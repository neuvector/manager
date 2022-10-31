package com.neu.api

import akka.util.Timeout
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.AuthenticationManager
import com.neu.model.SystemConfigJsonProtocol._
import com.neu.model.{ SystemConfig, SystemConfigWrap, Webhook, WebhookConfigWrap }
import com.typesafe.scalalogging.LazyLogging
import spray.http.HttpMethods._
import spray.http._
import spray.routing.{ Directives, Route }

import java.io.File
import java.net.URL
import java.nio.file.{ Files, Paths }
import java.util.Date
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext }
import scala.sys.process._
import scala.util.control.NonFatal
import com.neu.cache.SupportLogAuthCacheManager

class DeviceService()(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats
    with LazyLogging {

  var logFile                          = "/tmp/debug.gz"
  final val benchHostPath              = "bench/host"
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

  val deviceRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("enforcer") {
          get {
            parameter('id.?) { id =>
              Utils.respondWithNoCacheControl() {
                complete {
                  if (id.isEmpty) {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/enforcer",
                      GET,
                      "",
                      tokenId
                    )
                  } else {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/enforcer/${id.get}/stats",
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
        pathPrefix("single-enforcer") {
          get {
            parameter('id) { id =>
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/enforcer/$id",
                    GET,
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
              Utils.respondWithNoCacheControl() {
                complete {
                  if (id.isEmpty) {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/controller",
                      GET,
                      "",
                      tokenId
                    )
                  } else {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/controller/${id.get}/stats",
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
        pathPrefix("scanner") {
          get {
            implicit val timeout: Timeout = Timeout(RestClient.waitingLimit.seconds)
            Utils.respondWithNoCacheControl() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/scan/scanner",
                  GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("summary") {
          get {
            Utils.respondWithNoCacheControl() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/system/summary",
                  GET,
                  "",
                  tokenId
                )
              }
            }
          }
        } ~
        path("ibmsa_setup") {
          get {
            Utils.respondWithNoCacheControl() {
              complete {
                RestClient.httpRequestWithHeader(s"$baseUri/partner/ibm_sa_ep", GET, "", tokenId)
              }
            }
          }
        } ~
        path("usage") {
          get {
            Utils.respondWithNoCacheControl() {
              complete {
                RestClient.httpRequestWithHeader(s"$baseUri/system/usage", GET, "", tokenId)
              }
            }
          }
        } ~
        path("webhook") {
          post {
            Utils.respondWithNoCacheControl() {
              entity(as[Webhook]) { webhook =>
                complete {
                  val payload = webhookConfigWrapToJson(WebhookConfigWrap(webhook))
                  logger.info("Create config: {}", payload)
                  RestClient.httpRequestWithHeader(
                    if (webhook.cfg_type.equals("federal")) s"$baseUri/system/config/webhook"
                    else s"${baseClusterUri(tokenId)}/system/config/webhook",
                    POST,
                    payload,
                    tokenId
                  )
                }
              }
            }
          } ~
          patch {
            Utils.respondWithNoCacheControl() {
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
                      PATCH,
                      payload,
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          delete {
            Utils.respondWithNoCacheControl() {
              parameter('name, 'scope.?) { (name, scope) =>
                complete {
                  logger.info("Delete config: {}", name)

                  RestClient.httpRequestWithHeader(
                    scope.fold(s"${baseClusterUri(tokenId)}/system/config/webhook/$name") { scope =>
                      if (scope.equals("fed")) s"$baseUri/system/config/webhook/$name?scope=$scope"
                      else s"${baseClusterUri(tokenId)}/system/config/webhook/$name?scope=$scope"
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
        path("config") {
          get {
            Utils.respondWithNoCacheControl() {
              parameter('scope.?) { scope =>
                complete {
                  RestClient.httpRequestWithHeader(
                    scope.fold(s"${baseClusterUri(tokenId)}/system/config") { scope =>
                      if (scope.equals("fed")) s"$baseUri/system/config?scope=$scope"
                      else s"${baseClusterUri(tokenId)}/system/config?scope=$scope"
                    },
                    GET,
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
                  Utils.respondWithNoCacheControl() {
                    complete {
                      scope.fold {
                        val payload =
                          systemConfigWrapToJson(
                            SystemConfigWrap(Some(systemConfig), None, None, None, None)
                          )
                        logger.info("Updating config: {}", payload)
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/system/config",
                          PATCH,
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
                          PATCH,
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
          patch {
            entity(as[SystemConfigWrap]) { systemConfigWrap =>
              parameter('scope.?) { scope =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      scope.fold {
                        val payload =
                          systemConfigWrapToJson(systemConfigWrap)
                        logger.info("Updating config")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUriV2(tokenId)}/system/config",
                          PATCH,
                          payload,
                          tokenId
                        )
                      } { scope =>
                        val fedPayload =
                          systemConfigWrapToJson(systemConfigWrap)
                        logger.info("Updating fed config")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUriV2(tokenId)}/system/config?scope=$scope",
                          PATCH,
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
        pathPrefix("host") {
          pathEnd {
            get {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    if (id.isEmpty) {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/host",
                        GET,
                        "",
                        tokenId
                      )
                    } else {
                      logger.info("Getting host details...")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/host/${id.get}",
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
          path("workload") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload?view=pod&f_host_id=$id",
                      GET,
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
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/host/$id/compliance",
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
        pathPrefix("file") {
          path("config") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    if (id.equals("all")) {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/file/config?raw=true",
                        GET,
                        "",
                        tokenId
                      )
                    } else {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/file/config?section=policy&raw=true",
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
              headerValueByName("X-Transaction-Id") { transactionId =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  entity(as[String]) { tempToken =>
                    Utils.respondWithNoCacheControl() {
                      complete {
                        try {
                          setBaseUrl(tokenId, transactionId)
                          Thread.sleep(1000)
                          val importResFuture = RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/file/config",
                            POST,
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
                              POST,
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
              entity(as[MultipartFormData]) { formData =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        logger.info("testing baseUrl")
                        logger.info("No Transaction ID(Post),{}", asStandalone.getClass.toString)
                        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                        Thread.sleep(1000)
                        RestClient.binaryWithHeader(
                          s"${baseClusterUri(tokenId)}/file/config",
                          POST,
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
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Getting debug log: {}", logFile)
                    try {
                      val authRes = RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$auth",
                        PATCH,
                        "",
                        tokenId
                      )
                      val result = Await.result(authRes, RestClient.waitingLimit.seconds)
                      if (SupportLogAuthCacheManager.getSupportLogAuth(tokenId).isDefined) {
                        val byteArray = Files.readAllBytes(Paths.get(logFile))
                        purgeDebugFiles(new File("/tmp"))
                        HttpResponse(
                          StatusCodes.OK,
                          entity = HttpEntity(MediaTypes.`application/x-gzip`, byteArray)
                        ).withHeaders(
                          HttpHeaders.`Content-Disposition`
                            .apply("inline", Map("filename" -> "debug.gz"))
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
                Utils.respondWithNoCacheControl() {
                  entity(as[String]) { debuggedEnforcer =>
                    complete {
                      try {
                        logFile = "/tmp/debug" + new Date().getTime + ".gz"
                        purgeDebugFiles(new File("/tmp"))

                        val id       = AuthenticationManager.getCluster(tokenId).getOrElse("")
                        val ctrlHost = new URL(baseUri).getHost
                        SupportLogAuthCacheManager.saveSupportLogAuth(tokenId, logFile)
                        if (debuggedEnforcer.nonEmpty) {
                          logger.info("With enforcer debug log")
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
                          HttpResponse(StatusCodes.Accepted, "Started to collect debug log.")
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
                          HttpResponse(StatusCodes.Accepted, "Started to collect debug log.")
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
                Utils.respondWithNoCacheControl() {
                  complete {
                    val isFileReady = Files.exists(Paths.get(logFile)) && Files.isReadable(
                        Paths.get(logFile)
                      )
                    logger.info(s"Log file $logFile  is ready: $isFileReady")
                    if (isFileReady) {
                      HttpResponse(StatusCodes.OK, "Ready")
                    } else {
                      HttpResponse(StatusCodes.PartialContent, "In progress")
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
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Starting cis scan on docker: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/docker",
                      POST,
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
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info("Starting scan registry: {}", id)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$benchHostPath/$id/kubernetes",
                      POST,
                      "",
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
