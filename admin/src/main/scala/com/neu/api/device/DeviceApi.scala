package com.neu.api.device

import com.neu.api.BaseApi
import com.neu.client.RestClient.*
import com.neu.model.*
import com.neu.model.SystemConfigJsonProtocol.given
import com.neu.model.ContainerConfigJsonProtocol.given
import com.neu.service.Utils
import com.neu.service.device.DeviceService
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshaller

class DeviceApi(resourceService: DeviceService) extends BaseApi {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("enforcer") {
          get {
            parameter(Symbol("id").?) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getEnforcers(tokenId, id)
              }
            }
          }
        } ~
        pathPrefix("single-enforcer") {
          get {
            parameter(Symbol("id")) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getEnforcer(tokenId, id)
              }
            }
          }
        } ~
        pathPrefix("controller") {
          get {
            parameter(Symbol("id").?) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getController(tokenId, id)
              }
            }
          }
        } ~
        pathPrefix("scanner") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getScanner(tokenId)
            }
          }
        } ~
        path("summary") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getSummary(tokenId)
            }
          }
        } ~
        path("ibmsa_setup") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getIbmSaSetup(tokenId)
            }
          }
        } ~
        path("usage") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getUsage(tokenId)
            }
          }
        } ~
        path("webhook") {
          post {
            Utils.respondWithWebServerHeaders() {
              entity(as[Webhook]) { webhook =>
                resourceService.createWebhook(tokenId, webhook)
              }
            }
          } ~
          patch {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("scope").?) { scope =>
                entity(as[Webhook]) { webhook =>
                  resourceService.updateWebhook(tokenId, webhook, scope)
                }
              }
            }
          } ~
          delete {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("name"), Symbol("scope").?) { (name, scope) =>
                resourceService.deleteWebhook(tokenId, name, scope)
              }
            }
          }
        } ~
        path("config") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("scope").?) { scope =>
                resourceService.getConfig(tokenId, scope)
              }
            }
          } ~
          patch {
            entity(as[SystemConfig]) { systemConfig =>
              parameter(Symbol("scope").?) { scope =>
                resourceService.updateConfig(tokenId, systemConfig, scope)
              }
            }
          }
        } ~
        path("config-v2") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("scope").?, Symbol("source").?) { (scope, source) =>
                resourceService.getConfigV2(tokenId, scope, source)

              }
            }
          } ~
          patch {
            entity(as[SystemConfigWrap]) { systemConfigWrap =>
              parameter(Symbol("scope").?) { scope =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateConfigV2(tokenId, scope, systemConfigWrap)
                }
              }
            }
          }
        } ~
        path("remote_repository") {
          post {
            Utils.respondWithWebServerHeaders() {
              entity(as[RemoteRepository]) { remoteRepository =>
                resourceService.createRemoteRepository(tokenId, remoteRepository)
              }
            }
          } ~
          patch {
            Utils.respondWithWebServerHeaders() {
              entity(as[RemoteRepositoryWrap]) { remoteRepositoryWrap =>
                resourceService.updateRemoteRepository(tokenId, remoteRepositoryWrap)
              }
            }
          } ~
          delete {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("name")) { name =>
                resourceService.deleteRemoteRepository(tokenId, name)
              }
            }
          }
        } ~
        pathPrefix("host") {
          pathEnd {
            get {
              parameter(Symbol("id").?) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getHost(tokenId, id)
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
          path("workload") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getWorkload(tokenId, id)
                }
              }
            }
          } ~
          path("compliance") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getCompliance(tokenId, id)
                }
              }
            }
          }
        } ~
        pathPrefix("file") {
          path("config") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getFileConfig(tokenId, id)
                }
              }
            } ~
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  entity(as[String]) { tempToken =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.createFileConfig(
                        tokenId,
                        tempToken,
                        transactionId,
                        asStandalone
                      )
                    }
                  }
                }
              } ~
              entity(as[Multipart.FormData]) { formData =>
                headerValueByName("X-As-Standalone") { asStandalone =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.createMultiPartFileConfig(tokenId, asStandalone, formData)
                  }
                }
              }
            }
          } ~
          path("export-config-fed") {
            post {
              post {
                entity(as[ExportedFedSystemConfig]) { exportedFedSystemConfig =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.exportFedSystemConfig(tokenId, exportedFedSystemConfig)
                  }
                }
              }
            }
          } ~
          path("config-fed") {
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importFedSystemConfig(
                    tokenId,
                    transactionId
                  )
                }
              } ~
              entity(as[String]) { formData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importFedSystemConfigByFormData(
                    tokenId,
                    formData
                  )
                }
              }
            }
          } ~
          pathPrefix("debug") {
            pathEnd {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.getDebugLog(tokenId)
                }
              } ~
              post {
                Utils.respondWithWebServerHeaders() {
                  entity(as[String]) { debuggedEnforcer =>
                    resourceService.createDebugLog(tokenId, debuggedEnforcer)
                  }
                }
              }
            } ~
            path("check") {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.checkDebugLog()
                }
              }
            }
          }
        } ~
        pathPrefix("bench") {
          path("docker") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getDockerBench(tokenId, id)
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.createDockerBench(tokenId, id)
                }
              }
            }
          } ~
          path("kubernetes") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getKubernetesBench(tokenId, id)
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.createKubernetesBench(tokenId, id)
                }
              }
            }
          }
        } ~
        path("csp-support") {
          post {
            Utils.respondWithWebServerHeaders() {
              resourceService.downloadCspSupportFile(tokenId)
            }
          }
        }
      }
    }
}
