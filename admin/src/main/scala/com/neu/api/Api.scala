package com.neu.api

import com.neu.api.authentication.AuthenticationApi
import com.neu.api.cluster.ClusterApi
import com.neu.api.dashboard.DashboardApi
import com.neu.api.device.DeviceApi
import com.neu.api.group.GroupApi
import com.neu.api.notification.NotificationApi
import com.neu.api.policy.PolicyApi
import com.neu.api.risk.RiskApi
import com.neu.api.sigstore.SigstoreApi
import com.neu.api.workload.WorkloadApi
import com.neu.client.RestClient.handleError
import com.neu.core.{ Core, CoreActors, HttpResponseException }
import com.neu.service.*
import com.neu.service.authentication.AuthProvider
import com.neu.service.authentication.AuthService
import com.neu.service.authentication.AuthServiceFactory
import com.neu.service.authentication.ExtraAuthService
import com.neu.service.cluster.ClusterService
import com.neu.service.dashboard.DashboardService
import com.neu.service.device.DeviceService
import com.neu.service.group.GroupService
import com.neu.service.notification.NotificationService
import com.neu.service.policy.PolicyService
import com.neu.service.risk.RiskService
import com.neu.service.sigstore.SigstoreService
import com.neu.service.workload.WorkloadService
import org.apache.pekko.http.scaladsl.model.{ ContentTypes, HttpEntity, HttpResponse }
import org.apache.pekko.http.scaladsl.server.{ Directives, ExceptionHandler, Route }

import scala.concurrent.ExecutionContext.Implicits.global

/**
 * The REST API layer. It exposes the REST services, but does not provide any web server
 * interface.<br/> Notice that it requires to be mixed in with ``core.CoreActors``, which provides
 * access to the top-level actors that make up the system.
 */
trait Api extends Directives with CoreActors with Core {

  private final val timeOutStatus              = "Status: 408"
  private final val authenticationFailedStatus = "Status: 401"
  private final val serverErrorStatus          = "Status: 503"

  implicit def exceptionHandler: ExceptionHandler =
    ExceptionHandler {
      case e: HttpResponseException =>
        complete(
          HttpResponse(
            status = e.statusCode,
            entity = HttpEntity(ContentTypes.`application/json`, e.reason)
          )
        )
      case e: Exception             =>
        val (status, message) =
          handleError(timeOutStatus, authenticationFailedStatus, serverErrorStatus, e)
        complete(
          HttpResponse(
            status = status,
            entity = HttpEntity(ContentTypes.`application/json`, message)
          )
        )
    }

  private val authServiceFactory                 = new AuthServiceFactory()
  private val openIdAuthService: AuthService     =
    authServiceFactory.createService(AuthProvider.OPEN_ID)
  private val samlAuthService: AuthService       = authServiceFactory.createService(AuthProvider.SAML)
  private val suseAuthService: AuthService       = authServiceFactory.createService(AuthProvider.SUSE)
  private val extraAuthService: ExtraAuthService = authServiceFactory.createExtraAuthService()
  private val dashboardService                   = new DashboardService()
  private val clusterService                     = new ClusterService()
  private val deviceService                      = new DeviceService()
  private val groupService                       = new GroupService()
  private val notificationService                = new NotificationService()
  private val policyService                      = new PolicyService()
  private val riskService                        = new RiskService()
  private val sigstoreService                    = new SigstoreService()
  private val workloadService                    = new WorkloadService()

  private val authenticationApi =
    new AuthenticationApi(openIdAuthService, samlAuthService, suseAuthService, extraAuthService)
  private val dashboardApi      = new DashboardApi(dashboardService)
  private val clusterApi        = new ClusterApi(clusterService)
  private val deviceApi         = new DeviceApi(deviceService)
  private val groupApi          = new GroupApi(groupService)
  private val notificationApi   = new NotificationApi(notificationService)
  private val policyApi         = new PolicyApi(policyService)
  private val riskApi           = new RiskApi(riskService)
  private val sigstoreApi       = new SigstoreApi(sigstoreService)
  private val workloadApi       = new WorkloadApi(workloadService)

  val routes: Route = handleExceptions(exceptionHandler) {
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
