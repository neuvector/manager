package com.neu.api

import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.model.ContainerConfigJsonProtocol._
import com.neu.model.NamespaceJsonProtocol._
import com.neu.model.PolicyJsonProtocol._
import com.neu.model._
import com.typesafe.scalalogging.LazyLogging
import spray.http.HttpMethods._
import spray.http.StatusCodes
import spray.routing.{ Directives, Route }

import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext }
import scala.util.control.NonFatal

class WorkloadService()(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats
    with LazyLogging {
  val monitorConfig = """{"config": {"monitor": """

  val workloadRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("workload") {
          pathEnd {
            get {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    id.fold(
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/workload?view=pod",
                        GET,
                        "",
                        tokenId
                      )
                    )(
                      someId =>
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/workload/$someId/stats",
                          GET,
                          "",
                          tokenId
                        )
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[ContainerQuarantineRequest]) { quarantineRequest =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val payload = quarantineConfigWarpToJson(
                        QuarantineConfigWarp(QuarantineConfig(quarantineRequest.quarantine))
                      )
                      logger.info("Quarantining container: {}", payload)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/workload/${quarantineRequest.id}",
                        PATCH,
                        payload,
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          path("scanned") {
            parameter('start.?, 'limit.?) { (start, limit) =>
              Utils.respondWithNoCacheControl() {
                val cacheKey                                         = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
                var convertedScannedWorkloads: ScannedWorkloadsWrap2 = null
                var elements: Array[ScannedWorkloads2]               = null
                complete {
                  try {
                    if (start.isEmpty || start.get.toInt == 0) {
                      val url = s"${baseClusterUri(tokenId)}/workload?view=pod"
                      logger.info("Get workloads data from {}", url)
                      val scannedWorkloads = RestClient.requestWithHeaderDecode(
                        url,
                        GET,
                        "",
                        tokenId
                      )
                      convertedScannedWorkloads = convertScannedWorkloads2(
                        jsonToScannedWorkloadsWrap2(
                          Await.result(scannedWorkloads, RestClient.waitingLimit.seconds)
                        )
                      )
                      if (start.isDefined && start.get.toInt == 0) {
                        paginationCacheManager[Array[ScannedWorkloads2]]
                          .savePagedData(s"$cacheKey-workload", convertedScannedWorkloads.workloads)
                      }
                    }
                    if (start.isDefined && limit.isDefined) {
                      if (elements == null) {
                        elements = paginationCacheManager[Array[ScannedWorkloads2]]
                          .getPagedData(s"$cacheKey-workload")
                          .getOrElse(Array[ScannedWorkloads2]())
                      }
                      val output =
                        elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
                      if (output.length < limit.get.toInt) {
                        paginationCacheManager[Array[ScannedWorkloads2]]
                          .removePagedData(s"$cacheKey-workload")
                      }
                      val cachedData = paginationCacheManager[Array[ScannedWorkloads2]]
                        .getPagedData(s"$cacheKey-workload")
                        .getOrElse(Array[ScannedWorkloads2]())
                      logger.info("Cached data size: {}", cachedData.length)
                      logger.info("Paged response size: {}", output.length)
                      output
                    } else {
                      convertedScannedWorkloads
                    }
                  } catch {
                    case NonFatal(e) =>
                      paginationCacheManager[Array[ScannedWorkloads2]]
                        .removePagedData(s"$cacheKey-workload")
                      if (e.getMessage.contains("Status: 408") || e.getMessage.contains(
                            "Status: 401"
                          )) {
                        (StatusCodes.RequestTimeout, "Session expired!")
                      } else {
                        logger.info("Error message: {}", e.getMessage)
                        (StatusCodes.InternalServerError, "Internal server error")
                      }
                  }
                }
              }
            }
          } ~
          path("workload-by-id") {
            get {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload/${id.get}",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("monitor") {
            get {
              parameter('id, 'monitor) { (id, monitor) =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info(id + monitor)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload/$id",
                      PATCH,
                      monitorConfig + s"$monitor}}",
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
                    logger.info(s"get compliance for $id")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload/$id/compliance",
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
        pathPrefix("container") {
          pathEnd {
            get {
              parameter('id.?) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    id.fold(
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/workload?view=pod",
                        GET,
                        "",
                        tokenId
                      )
                    )(
                      someId =>
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/workload/$someId?view=pod",
                          GET,
                          "",
                          tokenId
                        )
                    )
                  }
                }
              }
            }
          } ~
          path("process") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload/$id/process",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("processHistory") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/workload/$id/process_history",
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
        pathPrefix("sniffer") {
          pathEnd {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/sniffer?f_workload=$id",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[SnifferData]) { snifferData =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/sniffer?f_workload=${snifferData.workloadId}",
                      POST,
                      snifferParamWarpToJson(snifferData.snifferParamWarp),
                      tokenId
                    )
                  }
                }
              }
            } ~
            patch {
              entity(as[String]) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/sniffer/stop/$id",
                      PATCH,
                      "",
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
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/sniffer/$id",
                      DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          path("pcap") {
            get {
              parameter('id) { id =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/sniffer/$id/pcap?limit=104857600",
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
        pathPrefix("domain") {
          pathEnd {
            get {
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/domain",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            patch {
              entity(as[NamespaceConfig]) { config =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    val payload = configWrapToJson(
                      NamespaceConfigData(config)
                    )
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/domain/${config.name}",
                      PATCH,
                      payload,
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[DomainConfig]) { config =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    val payload = domainConfigWrapToJson(
                      DomainConfigData(config)
                    )
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/domain",
                      PATCH,
                      payload,
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
