package com.neu.api.dashboard

import com.google.common.net.UrlEscapers
import com.neu.cache.JsonStringCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.*
import com.neu.model.DashboardJsonProtocol.{ *, given }
import com.neu.model.DashboardSecurityEventsProtocol.{ *, given }
import com.neu.model.ResourceJsonProtocol.{ *, given }
import com.neu.model.SystemConfigJsonProtocol.{ *, given }
import com.neu.service.dashboard.DashboardService
import com.neu.service.{ DefaultJsonFormats, Utils }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, StatusCodes }
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }
import org.joda.time.DateTime

import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext, Future }
import scala.reflect.ClassTag
import scala.util.control.NonFatal

/**
 * Rest service for dashboard
 */
class DashboardApi(resourceService: DashboardService)(implicit executionContext: ExecutionContext)
    extends Directives {

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
