package com.neu.api

import com.neu.client.RestClient.{ arrayFormat, baseClusterUri, StringJsonFormat }
import com.neu.core.AuthenticationManager
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.{ HttpEntity, StatusCodes }
import org.apache.pekko.http.scaladsl.server.{ Directives, StandardRoute }
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshaller
import spray.json._

import java.io.{ PrintWriter, StringWriter }

class BaseService extends Directives with LazyLogging {
  implicit val arrayStringUnmarshaller: Unmarshaller[HttpEntity, Array[String]] =
    Unmarshaller.stringUnmarshaller
      .map(JsonParser(_).convertTo[Array[String]])

  val authError                  = "Authentication failed!"
  val timeOutStatus              = "Status: 408"
  val authenticationFailedStatus = "Status: 401"

  private val blocked              = "Temporarily blocked because of too many login failures"
  private val authSSODisabledError =
    "Authentication using OpenShift's or Rancher's RBAC was disabled!"
  private val passwordExpired      = "Password expired"

  protected def onExpiredOrInternalError(e: Throwable) = {
    logger.warn(e.getMessage)
    if (e.getMessage.contains(timeOutStatus)) {
      (StatusCodes.RequestTimeout, "Session expired!")
    } else if (e.getMessage.contains(authenticationFailedStatus)) {
      (StatusCodes.Unauthorized, authError)
    } else {
      (StatusCodes.InternalServerError, "Internal server error")
    }
  }

  protected def onNonFatal(e: Throwable) = {
    val sw = new StringWriter
    e.printStackTrace(new PrintWriter(sw))
    logger.warn(sw.toString)
    if (
      e.getMessage.contains(timeOutStatus) || e.getMessage.contains(
        authenticationFailedStatus
      )
    ) {
      (StatusCodes.RequestTimeout, "Session expired!")
    } else {
      (StatusCodes.InternalServerError, "Internal server error")
    }
  }

  protected def onUnauthorized(e: Throwable): StandardRoute =
    if (e.getMessage.contains("\"code\":14")) {
      complete((StatusCodes.BadRequest, e.getMessage))
    } else if (e.getMessage.contains("\"code\":47")) {
      complete((StatusCodes.Unauthorized, blocked))
    } else if (e.getMessage.contains("\"code\":48")) {
      complete((StatusCodes.Unauthorized, passwordExpired))
    } else if (e.getMessage.contains("\"code\":50")) {
      complete(StatusCodes.Unauthorized, authSSODisabledError)
    } else {
      complete((StatusCodes.Unauthorized, authError))
    }

  protected def setBaseUrl(tokenId: String, transactionId: String): Unit = {
    val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
    val baseUrl       = cachedBaseUrl.fold(
      baseClusterUri(tokenId)
    )(cachedBaseUrl => cachedBaseUrl)
    AuthenticationManager.setBaseUrl(tokenId, baseUrl)
    logger.info("test baseUrl: {}", baseUrl)
    logger.info("Transaction ID(Post): {}", transactionId)
  }
}
