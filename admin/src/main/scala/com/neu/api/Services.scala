package com.neu.api

import akka.actor.{ Actor, ActorContext, ActorLogging }
import akka.pattern.AskTimeoutException
import com.google.common.base.Throwables
import com.typesafe.scalalogging.LazyLogging
import spray.can.Http.{ Bound, CommandFailed, ConnectionAttemptFailedException }
import spray.http.ContentTypes._
import spray.http.HttpHeaders._
import spray.http.StatusCodes._
import spray.http._
import spray.routing._
import spray.util.LoggingContext

import scala.concurrent.Future
import scala.util.control.NonFatal

/**
 * Holds potential error response with the HTTP status and optional body
 *
 * @param responseStatus the status code
 * @param response the optional body
 */
case class ErrorResponseException(responseStatus: StatusCode, response: Option[HttpEntity])
    extends Exception

/**
 * Provides a hook to catch exceptions and rejections from routes, allowing custom
 * responses to be provided, logs to be captured, and potentially remedial actions.
 *
 */
trait FailureHandling {
  this: HttpService =>

  // For Spray > 1.1-M7 use routeRouteResponse
  // see https://groups.google.com/d/topic/spray-user/zA_KR4OBs1I/discussion
  def rejectionHandler: RejectionHandler = RejectionHandler.Default

  def exceptionHandler(implicit log: LoggingContext): ExceptionHandler = ExceptionHandler {

    case e: IllegalArgumentException =>
      ctx =>
        loggedFailureResponse(
          ctx,
          e,
          message = "The server was asked a question that didn't make sense: " + e.getMessage,
          error = NotAcceptable
        )

    case e: NoSuchElementException =>
      ctx =>
        loggedFailureResponse(
          ctx,
          e,
          message = "The server is missing some information. Try again in a few moments.",
          error = NotFound
        )

    case t: Throwable =>
      ctx =>
        // note that toString here may expose information and cause a security leak, so don't do it.
        loggedFailureResponse(ctx, t)
  }

  private def loggedFailureResponse(
    ctx: RequestContext,
    thrown: Throwable,
    message: String = "The server is having problems.",
    error: StatusCode = InternalServerError
  )(implicit log: LoggingContext): Unit = {
    log.error(Throwables.getStackTraceAsString(thrown))
    ctx.complete((error, message))
  }

}

/**
 * Allows you to construct Spray ``HttpService`` from a concatenation of routes; and wires
 * in the error handler.
 * It also logs all internal server errors using ``SprayActorLogging``.
 *
 * @param route the (concatenated) route
 */
class RoutedHttpService(route: Route) extends Actor with HttpService with ActorLogging {

  implicit def actorRefFactory: ActorContext = context

  implicit val handler: ExceptionHandler = ExceptionHandler {
    case NonFatal(ErrorResponseException(statusCode, entity)) =>
      ctx => ctx.complete((statusCode, "server internal error"))

    case e: ConnectionAttemptFailedException ⇒
      ctx ⇒ {
        log.warning("Controller is not available ..." + e.getMessage)
        ctx.complete((StatusCodes.InternalServerError, "Controller is not available ..."))
      }

    case e: AskTimeoutException ⇒
      ctx ⇒ {
        log.warning("Unable to get data from controller." + e.getMessage)
        ctx.complete(StatusCodes.InternalServerError, "Unable to get data from controller.")
      }
  }

  def receive: Receive =
    handleConnection orElse handleTimeouts orElse
    runRoute(route)(
      handler,
      RejectionHandler.Default,
      context,
      RoutingSettings.default,
      LoggingContext.fromActorRefFactory
    )

  def handleConnection: Receive = {
    case b: Bound =>
      log.info("***REST Server Started***")
      Future.successful(b)
    case failed: CommandFailed =>
      log.warning("***REST Server Could not be Started***" + failed.cmd.failureMessage)
      Future.failed(new RuntimeException("Binding failed"))
  }

  def handleTimeouts: Receive = {
    case Timedout(x: HttpRequest) =>
      sender ! HttpResponse(
        StatusCodes.RequestTimeout,
        "Time out! " + x.uri.scheme,
        List(`Content-Type`(`text/plain`))
      )
  }
}

object Utils extends LazyLogging with Directives {

  /**
   * Wrap the web API response functions to add web server side response headers
   * The function takes boolean parameters to verify and determine which headers are needed.
   *
   * @param  isStaticResource  Boolean: True if requested resource is static resource. e.g.: html, css, js files
   * @param  isJs              Boolean: True if requested resource is javascript files
   * @return Directive for wrapping API response functions
   */
  def respondWithWebServerHeaders(
    isStaticResource: Boolean = false,
    isJs: Boolean = false
  ): Directive0 = {
    val isUsingSSLBit: Byte = if (sys.env.getOrElse("MANAGER_SSL", "on") == "on") 1 else 0
    val isStaticResourceBit = if (isStaticResource) 1 else 0
    val isDevOrNotJsBit: Byte =
      if (sys.env.getOrElse("IS_DEV", "false") == "true" || !isJs) 1 else 0

    /**
       bit1                          bit2                                 bit3                         bit4
       ----------------------------------------------------------------------------------------------------------------------------
       Supplemental bit 1 ONLY       env MANAGER_SSL on: 1                Request static resources     env IS_DEV == true or NOT requset js files
                                                     off: 0               true: 1                      true: 1
                                                     (undefined): 0       false: 0                     false: 0
     */
    val headerConfigMapKey: Short =
      (1000 + isUsingSSLBit * 100 + isStaticResourceBit * 10 + isDevOrNotJsBit).toShort
    val hdXFrameOptions = RawHeader("X-Frame-Options", "SAMEORIGIN")
    val hdStrictTransportSecurity =
      RawHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    val hdCacheCtrl       = RawHeader("Cache-Control", "no-cache")
    val hdContentEncoding = RawHeader("Content-Encoding", "gzip")

    val headerConfigMap = Map(
      1111 -> respondWithHeaders(
        hdXFrameOptions,
        hdStrictTransportSecurity
      ),
      1110 -> respondWithHeaders(
        hdXFrameOptions,
        hdStrictTransportSecurity,
        hdContentEncoding
      ),
      1101 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdStrictTransportSecurity
      ),
      1100 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdStrictTransportSecurity
      ),
      1011 -> respondWithHeaders(
        hdXFrameOptions
      ),
      1010 -> respondWithHeaders(
        hdXFrameOptions,
        hdContentEncoding
      ),
      1001 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl
      ),
      1000 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl
      )
    )

    headerConfigMap.getOrElse(
      headerConfigMapKey,
      respondWithHeaders(
        hdXFrameOptions
      )
    )
  }
}
