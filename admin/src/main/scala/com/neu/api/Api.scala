package com.neu.api

import com.neu.core.{ Core, CoreActors }
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext.Implicits.global

/**
 * The REST API layer. It exposes the REST services, but does not provide any
 * web server interface.<br/>
 * Notice that it requires to be mixed in with ``core.CoreActors``, which provides access
 * to the top-level actors that make up the system.
 */
trait Api extends Directives with CoreActors with Core {

  val authenticationApi = new AuthenticationApi()
  val dashboardApi      = new DashboardApi()
  val clusterApi        = new ClusterApi()
  val deviceApi         = new DeviceApi()
  val groupApi          = new GroupApi()
  val notificationApi   = new NotificationApi()
  val policyApi         = new PolicyApi()
  val riskApi           = new RiskApi()
  val sigstoreApi       = new SigstoreApi()
  val workloadApi       = new WorkloadApi()

  val routes: Route = {
    authenticationApi.route ~
    dashboardApi.route ~
    clusterApi.route ~
    deviceApi.route ~
    groupApi.route ~
    notificationApi.route ~
    policyApi.route ~
    riskApi.route ~
    sigstoreApi.route ~
    workloadApi.route
  }
}
