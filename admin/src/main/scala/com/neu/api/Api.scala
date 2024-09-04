package com.neu.api

import com.neu.core.{ Core, CoreActors }
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext
import scala.concurrent.ExecutionContext.Implicits.global

/**
 * The REST API layer. It exposes the REST services, but does not provide any
 * web server interface.<br/>
 * Notice that it requires to be mixed in with ``core.CoreActors``, which provides access
 * to the top-level actors that make up the system.
 */
trait Api extends Directives with CoreActors with Core {

  val routes: Route = {
    new AuthenticationService().authRoute
//    pathPrefix("api") {
//      concat(
//        path("hello") {
//          get {
//            complete("Hello, World!")
//          }
//        },
//        path("users") {
//          get {
//            // Fetch users logic
//            complete("List of users")
//          } ~
//          post {
//            // Create user logic
//            complete("User created")
//          }
//        }
//        // Add more routes as needed
//      )
//    }
  }
//  val routes: Route = encodeResponse {
////    new AuthenticationService().authRoute ~
////    new ClusterService().clusterRoute ~
////    new PolicyService().route ~
////    new WorkloadService().workloadRoute ~
////    new DeviceService().deviceRoute ~
////    new NotificationService().eventRoute ~
////    new GroupService().groupRoute ~
////    new DashboardService().dashboardRoute ~
////    new ClusterService().clusterRoute ~
////    new RiskService().riskRoute ~
////    new SigstoreService().sigstoreRoute
//  }
}
