package com.neu.service.authentication

import com.neu.api.{ BaseService, DefaultJsonFormats }
import com.typesafe.scalalogging.LazyLogging

import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.AuthenticationManager
import com.neu.model.AuthTokenJsonProtocol._
import com.neu.model._

import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal

import spray.json._

import scala.util.{ Failure, Success }
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.control.NonFatal

class SuseAuthProcessor()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Either[Route, Unit] =
    Right(None)

  def validateToken(tokenId: String): Route =
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$auth",
        HttpMethods.PATCH,
        "",
        tokenId
      )
    }

  def login(ip: RemoteAddress, userPwd: Password, suseCookieValue: String): Route =
    try {
      logger.info(s"post path auth")
      processSuseLoginRequest(ip, userPwd, suseCookieValue)
    } catch {
      case NonFatal(e) =>
        logger.warn(e.getMessage)
        if (e.getMessage.contains("Status: 400") || e.getMessage.contains("Status: 401") || e.getMessage
              .contains("Status: 403")) {
          onUnauthorized(e)
        } else if (e.getMessage.contains("Status: 410")) {
          complete((StatusCodes.Gone, "Please logout and then login from Rancher again!"))
        } else {
          logger.warn(e.getClass.toString)
          reloadCtrlIp()
          try {
            processSuseLoginRequest(ip, userPwd, suseCookieValue)
          } catch {
            case NonFatal(`e`) =>
              logger.warn(e.getMessage)
              if (e.getMessage.contains("Status: 400") || e.getMessage.contains("Status: 401") || e.getMessage
                    .contains(
                      "Status: 403"
                    )) {
                onUnauthorized(e)
              } else if (e.getMessage.contains("Status: 410")) {
                complete(
                  (StatusCodes.Gone, "Please logout and then login from Rancher again!")
                )
              } else {
                complete((StatusCodes.InternalServerError, "Controller unavailable!"))
              }
            case e: TimeoutException =>
              logger.warn(e.getMessage)
              complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
          }
        }
      case e: TimeoutException =>
        logger.warn(e.getMessage)

        complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
    }

  def logout(host: Option[String], tokenId: String): Either[Route, Unit] = Right(None)

  private def processSuseLoginRequest(
    ip: RemoteAddress,
    userPwd: Password,
    suseCookieValue: String
  ): Route = {
    val suseCookie = if (userPwd.isRancherSSOUrl) suseCookieValue else ""
    val result =
      RestClient.httpRequestWithTokenHeader(
        s"$baseUri/$auth",
        HttpMethods.POST,
        authRequestToJson(
          AuthRequest(userPwd, ip.toOption.map(_.getHostAddress).getOrElse(""))
        ),
        suseCookie
      )
    val response  = Await.result(result, RestClient.waitingLimit.seconds)
    var authToken = AuthenticationManager.parseToken(response)
    authToken = UserTokenNew(
      authToken.token,
      authToken.emailHash,
      authToken.roles,
      authToken.login_timestamp,
      authToken.need_to_reset_password,
      suseCookie.nonEmpty
    )
    authToken.token match {
      case Some(token) => {
        AuthenticationManager.suseTokenMap += (token.token -> suseCookie)
        logger.info("login with SUSE cookie")
      }
      case None => {}
    }

    complete(authToken)
  }
}
