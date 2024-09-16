package com.neu.api

import com.neu.api.authentication.AuthenticationApi
import com.neu.core.{ Core, CoreActors }
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext.Implicits.global

/**
 * The REST API layer. It exposes the REST services, but does not provide any web server
 * interface.<br/> Notice that it requires to be mixed in with ``core.CoreActors``, which provides
 * access to the top-level actors that make up the system.
 */
trait Api extends Directives with CoreActors with Core {

  private val authenticationApi = new AuthenticationApi()
  private val dashboardApi      = new DashboardApi()
  private val clusterApi        = new ClusterApi()
  private val deviceApi         = new DeviceApi()
  private val groupApi          = new GroupApi()
  private val notificationApi   = new NotificationApi()
  private val policyApi         = new PolicyApi()
  private val riskApi           = new RiskApi()
  private val sigstoreApi       = new SigstoreApi()
  private val workloadApi       = new WorkloadApi()

  val routes: Route =
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
