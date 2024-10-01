package com.neu.api.group

import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.*
import com.neu.model.CustomCheckConfigJsonProtocol.{ *, given }
import com.neu.model.DlpJsonProtocol.{ *, given }
import com.neu.model.FileProfileJsonProtocol.{ *, given }
import com.neu.model.GroupJsonProtocol.{ *, given }
import com.neu.model.ProcessProfileJsonProtocol.{ *, given }
import com.neu.model.SystemConfigJsonProtocol.{ *, given }
import com.neu.model.WafJsonProtocol.{ *, given }
import com.neu.service.Utils
import com.neu.service.group.GroupService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext }
import scala.util.control.NonFatal

/**
 * Created by bxu on 4/25/16.
 */
class GroupApi(resourceService: GroupService)(implicit executionContext: ExecutionContext)
    extends Directives {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("group-list") {
          get {
            parameters(Symbol("scope").?, Symbol("f_kind").?) { (scope, f_kind) =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getGroupList(tokenId, scope, f_kind)
              }
            }
          }
        } ~
        pathPrefix("group") {
          path("custom_check") {
            get {
              parameter(Symbol("name")) { name =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.checkGroupByName(tokenId, name)
                }
              }
            } ~
            patch {
              entity(as[CustomCheckConfigDTO]) { customCheckDTO =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateCheckGroupScripts(tokenId, customCheckDTO)
                }
              }
            }
          } ~
          path("export") {
            post {
              entity(as[Groups4Export]) { groups4Export =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.exportGroups(tokenId, groups4Export)
                }
              }
            }
          } ~
          path("import") {
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importGroupConfig(tokenId, transactionId)
                }
              } ~
              entity(as[String]) { formData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importGroupConfigByFormData(tokenId, formData)
                }
              }
            }
          } ~
          pathEnd {
            post {
              entity(as[GroupConfigDTO]) { groupConfigDTO =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.createGroup(tokenId, groupConfigDTO)
                }
              }
            } ~
            get {
              parameter(
                Symbol("name").?,
                Symbol("scope").?,
                Symbol("start").?,
                Symbol("limit").?,
                Symbol("with_cap").?
              ) { (name, scope, start, limit, with_cap) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getGroup(tokenId, name, scope, start, limit, with_cap)
                }
              }
            } ~
            patch {
              entity(as[GroupConfigDTO]) { groupConfigDTO =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateGroup(tokenId, groupConfigDTO)
                }
              }
            } ~
            delete {
              parameter(Symbol("name"), Symbol("scope").?) { (name, scope) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.deleteGroup(tokenId, name, scope)
                }
              }
            }
          }
        } ~
        pathPrefix("service") {
          get {
            parameter(Symbol("name").?, Symbol("with_cap").?) { (name, with_cap) =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getService(tokenId, name, with_cap)
              }
            }
          } ~
          patch {
            decodeRequest {
              entity(as[ServiceConfig]) { serviceConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateService(tokenId, serviceConfig)
                }
              }
            }
          } ~
          post {
            entity(as[ServiceConfigParam]) { serviceConfigParam =>
              Utils.respondWithWebServerHeaders() {
                resourceService.createService(tokenId, serviceConfigParam)
              }
            }
          } ~
          path("all") {
            patch {
              entity(as[SystemRequestContent]) { systemRequestContent =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateSystemRequest(tokenId, systemRequestContent)
                }
              }
            }
          }
        } ~
        pathPrefix("processProfile") {
          get {
            parameter(Symbol("name")) { name =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getProcessProfileByName(tokenId, name)
              }
            }
          } ~
          get {
            parameter(Symbol("scope").?) { scope =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getProcessProfileByScope(tokenId, scope)
              }
            }
          } ~
          patch {
            parameter(Symbol("scope").?) { scope =>
              entity(as[ProcessProfileConfigData]) { profile =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateProcessProfile(tokenId, scope, profile)
                }
              }
            }
          }
        } ~
        pathPrefix("fileProfile") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("name")) { name =>
                resourceService.getFileProfileByName(tokenId, name)
              }
            }
          } ~
          get {
            parameter(Symbol("scope").?) { scope =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getFileProfileByScope(tokenId, scope)
              }
            }
          } ~
          patch {
            parameter(Symbol("scope").?) { scope =>
              entity(as[FileMonitorConfigDTO]) { profile =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateFileProfile(tokenId, scope, profile)
                }
              }
            }
          }
        } ~
        pathPrefix("filePreProfile") {
          get {
            parameter(Symbol("name")) { name =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getFilePreProfile(tokenId, name)
              }
            }
          }
        } ~
        pathPrefix("dlp") {
          pathPrefix("sensor") {
            pathEnd {
              post {
                entity(as[DlpSensorConfigData]) { dlpSensorConfigData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.createDlpSensor(tokenId, dlpSensorConfigData)
                  }
                }
              } ~
              get {
                parameter(Symbol("name").?) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getDlpSensor(tokenId, name)
                  }
                }
              } ~
              patch {
                entity(as[DlpSensorConfigData]) { dlpSensorConfigData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.updatePldSensor(tokenId, dlpSensorConfigData)
                  }
                }
              } ~
              delete {
                parameter(Symbol("name")) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.deletePldSensor(tokenId, name)
                  }
                }
              }
            } ~
            path("export") {
              post {
                entity(as[ExportedDlpSensorList]) { exportedDlpSensorList =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.exportDlpSensorConfig(tokenId, exportedDlpSensorList)
                  }
                }
              }
            } ~
            path("import") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.importDlpSensorConfig(tokenId, transactionId)
                  }
                } ~
                entity(as[String]) { formData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.importDlpSensorConfigByFormData(tokenId, formData)
                  }
                }
              }
            }
          } ~
          path("group") {
            get {
              parameter(Symbol("name")) { name =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getDlpGroupRulesByName(tokenId, name)
                }
              }
            } ~
            patch {
              entity(as[DlpGroupConfigData]) { dlpGroupConfigData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateDlpGroupConfig(tokenId, dlpGroupConfigData)
                }
              }
            }
          }
        } ~
        pathPrefix("waf") {
          pathPrefix("sensor") {
            pathEnd {
              post {
                entity(as[WafSensorConfigData]) { wafSensorConfigData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.createWafSensor(tokenId, wafSensorConfigData)
                  }
                }
              } ~
              get {
                parameter(Symbol("name").?) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getWafSensor(tokenId, name)
                  }
                }
              } ~
              patch {
                entity(as[WafSensorConfigData]) { wafSensorConfigData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.updateWafSensor(tokenId, wafSensorConfigData)
                  }
                }
              } ~
              delete {
                parameter(Symbol("name")) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.deleteWafSensor(tokenId, name)
                  }
                }
              }
            } ~
            path("export") {
              post {
                entity(as[ExportedWafSensorList]) { exportedWafSensorList =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.exportWafSensors(tokenId, exportedWafSensorList)
                  }
                }
              }
            } ~
            path("import") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.importWafSensorConfig(tokenId, transactionId)
                  }
                } ~
                entity(as[String]) { formData =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.importWafSensorConfigByFormData(tokenId, formData)
                  }
                }
              }
            }
          } ~
          path("group") {
            get {
              parameter(Symbol("name")) { name =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getWafGroupRulesByName(tokenId, name)
                }
              }
            } ~
            patch {
              entity(as[WafGroupConfigData]) { wafGroupConfigData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateWafGroupConfig(tokenId, wafGroupConfigData)
                }
              }
            }
          }
        }
      }
    }
}
