package com.neu.api.cluster

import com.neu.model.ClusterJsonProtocol.given
import com.neu.model.*
import com.neu.service.DefaultJsonFormats
import com.neu.service.Utils
import com.neu.service.cluster.ClusterService
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

class ClusterApi(resourceService: ClusterService) extends Directives with DefaultJsonFormats {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      pathPrefix("fed") {
        path("member") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getMember(tokenId)
            }
          }
        } ~
        path("switch") {
          get {
            parameter(Symbol("id").?) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getSwitch(tokenId, id)
              }
            }
          }
        } ~
        path("summary") {
          get {
            parameter(Symbol("id")) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getSummary(tokenId, id)
              }
            }
          }
        } ~
        path("promote") {
          post {
            entity(as[FedPromptRequest]) { fedPromptRequest =>
              Utils.respondWithWebServerHeaders() {
                resourceService.promote(tokenId, fedPromptRequest)
              }
            }
          }
        } ~
        path("demote") {
          post {
            Utils.respondWithWebServerHeaders() {
              resourceService.demote(tokenId)
            }
          }
        } ~
        path("join_token") {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getJoinToken(tokenId)
            }
          }
        } ~
        path("join") {
          post {
            entity(as[FedJoinRequest]) { joinRequest =>
              Utils.respondWithWebServerHeaders() {
                resourceService.join(tokenId, joinRequest)
              }
            }
          }
        } ~
        path("leave") {
          post {
            entity(as[FedLeaveRequest]) { leaveRequest =>
              Utils.respondWithWebServerHeaders() {
                resourceService.leave(tokenId, leaveRequest)
              }
            }
          }
        } ~
        path("config") {
          patch {
            entity(as[FedConfigData]) { fedConfigData =>
              Utils.respondWithWebServerHeaders() {
                resourceService.config(tokenId, fedConfigData)
              }
            }
          }
        } ~
        pathEnd {
          delete {
            parameter(Symbol("id")) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.deleteCluster(tokenId, id)
              }
            }
          }
        } ~
        path("deploy") {
          post {
            entity(as[DeployFedRulesReq]) { deployRequest =>
              Utils.respondWithWebServerHeaders() {
                resourceService.deployRules(tokenId, deployRequest)
              }
            }
          }
        }
      }
    }
}
