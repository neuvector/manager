package com.neu.api.cluster

import com.neu.client.RestClient
import com.neu.model.*
import com.neu.model.ClusterJsonProtocol.*
import com.neu.service.cluster.ClusterService
import com.neu.service.{ BaseService, DefaultJsonFormats, Utils }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext

class ClusterApi(resourceService: ClusterService)(implicit executionContext: ExecutionContext)
    extends Directives
    with DefaultJsonFormats {

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
