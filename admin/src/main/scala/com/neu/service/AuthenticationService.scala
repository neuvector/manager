package com.neu.service

import com.neu.model._
import com.neu.model.AuthTokenJsonProtocol._
import com.neu.core.{ AuthenticationManager }
import com.neu.api.{ BaseService, DefaultJsonFormats }
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.web.Rest.materializer
import com.neu.service.authentication._
import com.typesafe.scalalogging.LazyLogging

import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }

import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.{ Failure, Success }
import scala.util.control.NonFatal

class AuthenticationService()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  val saml = "token_auth_server"

  private val authProcessorFactory = new AuthProcessorFactory()
  private val openIdAuthProcessor  = authProcessorFactory.createProcessor(AuthProcessorBrand.OPEN_ID)
  private val samlAuthProcessor    = authProcessorFactory.createProcessor(AuthProcessorBrand.SAML)
  private val suseAuthProcessor    = new SuseAuthProcessor()

  def getOpenIdresources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Route =
    openIdAuthProcessor.getResources(code, state, ip, host, serverName) match {
      case Left(route) => route
      case Right(_) =>
        logger.warn("Open Id get resources processing failed")
        complete(StatusCodes.InternalServerError, "Failed to process Open Id get resources")
    }

  def validateOpenIdToken(): Route = openIdAuthProcessor.validateToken()

  def getSamlresources(
    host: Option[String],
    serverName: Option[String]
  ): Route =
    samlAuthProcessor.getResources(None, None, "", host, serverName) match {
      case Left(route) => route
      case Right(_) =>
        logger.warn("SAML get resources processing failed")
        complete(StatusCodes.InternalServerError, "Failed to process SAML get resources")
    }

  def validateSamlToken(): Route = samlAuthProcessor.validateToken()

  def samlLogin(ip: RemoteAddress, host: String, ctx: RequestContext): Route =
    samlAuthProcessor.login(ip, host, ctx) match {
      case Left(route) => route
      case Right(_) =>
        logger.warn("SAML login processing failed")
        complete(StatusCodes.InternalServerError, "Failed to process SAML login")
    }

  def samlLogout(host: Option[String], tokenId: String): Route =
    samlAuthProcessor.logout(host, tokenId) match {
      case Left(route) => route
      case Right(_) =>
        logger.warn("SAML logout processing failed")
        complete(StatusCodes.InternalServerError, "Failed to process SAML logout")
    }

  def validateSuseToken(tokenId: String): Route = suseAuthProcessor.validateToken(tokenId)

  def suseLogin(ip: RemoteAddress, userPwd: Password, suseCookieValue: String): Route =
    suseAuthProcessor.login(ip, userPwd, suseCookieValue)

  def refreshSuseToken(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String
  ): Route =
    complete {
      try {
        logger.info("Getting self ..")
        val suseCookie =
          if (!isRancherSSOUrl.isEmpty && isRancherSSOUrl.get == "true") suseCookieValue else ""
        val result =
          RestClient.requestWithHeaderDecode(
            s"$baseUri/selfuser",
            HttpMethods.GET,
            "",
            tokenId
          )
        val selfWrap =
          jsonToSelfWrap(Await.result(result, RestClient.waitingLimit.seconds))
        val user = selfWrap.user
        logger.info("user: {}", user)
        val token1 = TokenWrap(
          selfWrap.password_days_until_expire,
          None,
          Some(
            Token(
              tokenId,
              user.fullname,
              user.server,
              user.username,
              user.email,
              user.role,
              user.locale,
              if (isOnNV.getOrElse("") == "true") user.timeout else Some(300),
              user.default_password,
              user.modify_password,
              user.role_domains,
              user.extra_permissions,
              selfWrap.global_permissions,
              selfWrap.remote_global_permissions,
              selfWrap.domain_permissions
            )
          )
        )
        val authToken =
          AuthenticationManager.parseToken(tokenWrapToJson(token1), suseCookie.nonEmpty)
        authToken
      } catch {
        case NonFatal(e) =>
          onExpiredOrInternalError(e)
      }
    }
}
