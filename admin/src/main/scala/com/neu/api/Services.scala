package com.neu.api

import akka.actor.{ Actor, ActorContext, ActorLogging }
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
    log.error(thrown.getMessage)
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
      ctx => ctx.complete((statusCode, entity))

    case e: ConnectionAttemptFailedException ⇒
      ctx ⇒ {
        log.warning("Controller is not available ..." + e.getMessage)
        ctx.complete(StatusCodes.InternalServerError, "Controller is not available ...")
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
  def respondWithNoCacheControl(isStaticResource: Boolean = false): Directive0 = {
    val isUsingSSL: Boolean = sys.env.getOrElse("MANAGER_SSL", "on") == "on"
    val acceptFrameAncestors =
      sys.env.getOrElse("FRAME_ANCESTOR_WHITELIST", "none").replaceAll(",", " ")
    if (isUsingSSL) {
      if (isStaticResource) {
        respondWithHeaders(
          RawHeader("Content-Security-Policy", s"frame-ancestors $acceptFrameAncestors"),
          RawHeader("X-Frame-Options", "DENY"),
          RawHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
        )
      } else {
        respondWithHeaders(
          RawHeader("Content-Security-Policy", s"frame-ancestors $acceptFrameAncestors"),
          RawHeader("X-Frame-Options", "DENY"),
          RawHeader("Cache-Control", "no-cache"),
          RawHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
        )
      }
    } else {
      if (isStaticResource) {
        respondWithHeaders(
          RawHeader("Content-Security-Policy", s"frame-ancestors $acceptFrameAncestors"),
          RawHeader("X-Frame-Options", "DENY")
        )
      } else {
        respondWithHeaders(
          RawHeader("Content-Security-Policy", s"frame-ancestors $acceptFrameAncestors"),
          RawHeader("X-Frame-Options", "DENY"),
          RawHeader("Cache-Control", "no-cache")
        )
      }
    }
  }
}
