package com.neu.api.workload

import com.neu.api.BaseApi
import com.neu.model.*
import com.neu.model.ContainerConfigJsonProtocol.given
import com.neu.model.NamespaceJsonProtocol.given
import com.neu.service.Utils
import com.neu.service.workload.WorkloadService
import org.apache.pekko.http.scaladsl.server.Route

class WorkloadApi(resourceService: WorkloadService) extends BaseApi {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("workload") {
          pathEnd {
            get {
              parameter(Symbol("id").?) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getWorkload(tokenId, id)
                }
              }
            } ~
            post {
              entity(as[ContainerQuarantineRequest]) { quarantineRequest =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateWorkload(
                    tokenId: String,
                    quarantineRequest: ContainerQuarantineRequest
                  )
                }
              }
            }
          } ~
          path("scan-report") {
            post {
              entity(as[ScanReportRequest]) { scanReportRequest =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getScanReport(
                    tokenId: String,
                    scanReportRequest: ScanReportRequest
                  )
                }
              }
            }
          } ~
          path("scanned") {
            parameter(Symbol("start").?, Symbol("limit").?) { (start, limit) =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getScannedWorkload(tokenId, start, limit)
              }
            }
          } ~
          path("workload-by-id") {
            get {
              parameter(Symbol("id").?) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getWorkloadById(tokenId, id)
                }
              }
            }
          } ~
          path("monitor") {
            get {
              parameter(Symbol("id"), Symbol("monitor")) { (id, monitor) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateWorkloadMonitor(
                    tokenId,
                    id,
                    monitor
                  )
                }
              }
            }
          } ~
          path("compliance") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getWorkloadCompliance(tokenId, id)
                }
              }
            }
          }
        } ~
        pathPrefix("container") {
          pathEnd {
            get {
              parameter(Symbol("id").?) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getContainer(tokenId, id)
                }
              }
            }
          } ~
          path("process") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getContainerProcess(tokenId, id)
                }
              }
            }
          } ~
          path("processHistory") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getContainerProcessHistory(tokenId, id)
                }
              }
            }
          }
        } ~
        pathPrefix("sniffer") {
          pathEnd {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getSniffer(tokenId, id)
                }
              }
            } ~
            post {
              entity(as[SnifferData]) { snifferData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.createSniffer(tokenId, snifferData)
                }
              }
            } ~
            patch {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.stopSniffer(tokenId, id)
                }
              }
            } ~
            delete {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.removeSniffer(tokenId, id)
                }
              }
            }
          } ~
          path("pcap") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getPcap(tokenId, id)
                }
              }
            }
          }
        } ~
        pathPrefix("domain") {
          pathEnd {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getDomain(tokenId)
              }
            } ~
            patch {
              entity(as[NamespaceConfig]) { config =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateDomain(tokenId, config)
                }
              }
            } ~
            post {
              entity(as[DomainConfig]) { config =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateDomain(tokenId, config)
                }
              }
            }
          }
        }
      }
    }
}
