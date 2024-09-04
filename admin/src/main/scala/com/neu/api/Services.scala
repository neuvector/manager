package com.neu.api

import com.google.common.base.Throwables
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.{ Actor, ActorLogging, ActorSystem }
import org.apache.pekko.event.LoggingAdapter
import org.apache.pekko.http.scaladsl.model.headers.RawHeader
import org.apache.pekko.http.scaladsl.model.{ HttpEntity, HttpResponse, StatusCode, StatusCodes }
import org.apache.pekko.http.scaladsl.server._
import org.apache.pekko.io.Tcp.{ Bound, CommandFailed }

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
trait FailureHandling extends Directives {
  implicit val log: LoggingAdapter

  def rejectionHandler: RejectionHandler = RejectionHandler.default

  def exceptionHandler: ExceptionHandler = ExceptionHandler {
    case e: IllegalArgumentException =>
      extractRequestContext { ctx =>
        logFailureResponse(
          ctx,
          e,
          message = "The server was asked a question that didn't make sense: " + e.getMessage,
          error = StatusCodes.NotAcceptable
        )
      }

    case e: NoSuchElementException =>
      extractRequestContext { ctx =>
        logFailureResponse(
          ctx,
          e,
          message = "The server is missing some information. Try again in a few moments.",
          error = StatusCodes.NotFound
        )
      }

    case t: Throwable =>
      extractRequestContext { ctx =>
        logFailureResponse(ctx, t)
      }
  }

  private def logFailureResponse(
    ctx: RequestContext,
    thrown: Throwable,
    message: String = "The server is having problems.",
    error: StatusCode = StatusCodes.InternalServerError
  ): Route =
    extractLog { log =>
      log.error(Throwables.getStackTraceAsString(thrown))
      complete((error, message))
    }
}

/**
 * Allows you to construct Spray ``HttpService`` from a concatenation of routes; and wires
 * in the error handler.
 * It also logs all internal server errors using ``SprayActorLogging``.
 *
 * @param route the (concatenated) route
 */
class RoutedHttpService(route: Route) extends Actor with ActorLogging with Directives {

  implicit val system: ActorSystem = context.system

  implicit val handler: ExceptionHandler = ExceptionHandler {
    case NonFatal(e) =>
      extractLog { log =>
        log.warning(s"Exception caught: ${e.getMessage}")
        complete(HttpResponse(StatusCodes.InternalServerError, entity = "Server internal error"))
      }
  }

  def receive: Receive = Actor.emptyBehavior // No need to handle messages directly

  def handleConnection: Receive = {
    case b: Bound =>
      log.info("***REST Server Started***")
    case failed: CommandFailed =>
      log.warning("***REST Server Could not be Started***" + failed.cmd.failureMessage)
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
      RawHeader("Strict-Transport-Security", "max-age=15724800; includeSubDomains; preload")
    val hdCacheCtrl          = RawHeader("Cache-Control", "private, no-cache, no-store, must-revalidate")
    val hdContentEncoding    = RawHeader("Content-Encoding", "gzip")
    val hdXSSProtection      = RawHeader("X-XSS-Protection", "1; mode=block")
    val hdContentTypeOptions = RawHeader("X-Content-Type-Options", "nosniff")
    val hdContentSecurityPolicy =
      RawHeader(
        "Content-Security-Policy",
        "default-src 'self'; font-src 'self' data: */fonts; img-src 'self' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      )

    val headerConfigMap = Map(
      1111 -> respondWithHeaders(
        hdXFrameOptions,
        hdStrictTransportSecurity,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1110 -> respondWithHeaders(
        hdXFrameOptions,
        hdStrictTransportSecurity,
        hdContentEncoding,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1101 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdStrictTransportSecurity,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1100 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdStrictTransportSecurity,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1011 -> respondWithHeaders(
        hdXFrameOptions,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1010 -> respondWithHeaders(
        hdXFrameOptions,
        hdContentEncoding,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1001 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      ),
      1000 -> respondWithHeaders(
        hdXFrameOptions,
        hdCacheCtrl,
        hdXSSProtection,
        hdContentTypeOptions,
        hdContentSecurityPolicy
      )
    )

    headerConfigMap
      .getOrElse(
        headerConfigMapKey,
        respondWithHeaders(
          hdXFrameOptions,
          hdXSSProtection,
          hdContentTypeOptions,
          hdContentSecurityPolicy
        )
      )
  }
}
