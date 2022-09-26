package com.neu.api

import com.neu.core.{ Core, CoreActors }
import spray.routing.{ HttpService, Route }

import scala.concurrent.ExecutionContext
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * The REST API layer. It exposes the REST services, but does not provide any
 * web server interface.<br/>
 * Notice that it requires to be mixed in with ``core.CoreActors``, which provides access
 * to the top-level actors that make up the system.
 */
trait Api extends HttpService with CoreActors with Core {

  val routes: Route = compressResponseIfRequested() {
    new AuthenticationService().authRoute ~
    new ClusterService().clusterRoute ~
    new PolicyService().route ~
    new WorkloadService().workloadRoute ~
    new DeviceService().deviceRoute ~
    new NotificationService().eventRoute ~
    new GroupService().groupRoute ~
    new DashboardService().dashboardRoute ~
    new ClusterService().clusterRoute ~
    new RiskService().riskRoute
  }
}
