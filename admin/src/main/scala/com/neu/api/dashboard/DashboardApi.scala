package com.neu.api.dashboard

import com.neu.api.BaseApi
import com.neu.client.RestClient.*
import com.neu.model.*
import com.neu.model.DashboardJsonProtocol.given
import com.neu.service.Utils
import com.neu.service.dashboard.DashboardService
import org.apache.pekko.http.scaladsl.server.Route

/**
 * Rest service for dashboard
 */
class DashboardApi(resourceService: DashboardService) extends BaseApi {

  val route: Route = headerValueByName("Token") { tokenId =>
    path("multi-cluster-summary") {
      get {
        parameters(Symbol("clusterId").?) { clusterId =>
          Utils.respondWithWebServerHeaders() {
            resourceService.getMultiClusterSummary(tokenId, clusterId)
          }
        }
      }
    } ~
    pathPrefix("dashboard") {
      path("alerts") {
        get {
          Utils.respondWithWebServerHeaders() {
            resourceService.getSystemAlertInformation(tokenId)
          }
        }
      } ~
      path("scores2") {
        get {
          parameters(Symbol("isGlobalUser"), Symbol("domain").?) { (isGlobalUser, domain) =>
            Utils.respondWithWebServerHeaders() {
              resourceService.getScore2(tokenId, isGlobalUser, domain)
            }
          }
        } ~
        patch {
          parameters(Symbol("isGlobalUser"), Symbol("totalRunningPods")) {
            (isGlobalUser, totalRunningPods) =>
              entity(as[Metrics]) { metrics =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateScore2(tokenId, isGlobalUser, totalRunningPods, metrics)
                }
              }
          }
        }
      } ~
      path("details") {
        parameters(Symbol("isGlobalUser").?, Symbol("domain").?) { (_, domain) =>
          Utils.respondWithWebServerHeaders() {
            resourceService.getDetails(tokenId, domain)
          }
        }
      } ~
      path("scores") {
        patch {
          parameters(Symbol("isGlobalUser").?) { isGlobalUser =>
            entity(as[ScoreInput]) { scoreInput =>
              Utils.respondWithWebServerHeaders() {
                resourceService.queryScore(tokenId, isGlobalUser, scoreInput)
              }
            }
          }
        } ~
        get {
          parameters(Symbol("isGlobalUser").?, Symbol("domain").?) { (isGlobalUser, domain) =>
            Utils.respondWithWebServerHeaders() {
              resourceService.getScore(tokenId, isGlobalUser, domain)
            }
          }
        }
      } ~
      path("notifications") {
        get {
          parameters(Symbol("domain").?) { domain =>
            Utils.respondWithWebServerHeaders() {
              resourceService.getNotifications(tokenId, domain)
            }
          }
        }
      } ~
      path("notifications2") {
        get {
          parameters(Symbol("domain").?) { domain =>
            Utils.respondWithWebServerHeaders() {
              resourceService.getNotifications2(tokenId, domain)
            }
          }
        }
      }
    }
  }
}
