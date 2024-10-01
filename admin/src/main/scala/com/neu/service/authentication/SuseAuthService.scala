package com.neu.service.authentication

import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.AuthTokenJsonProtocol.{ *, given }
import com.neu.model.*
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal
import spray.json.*

import scala.concurrent.duration.*
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.control.NonFatal
import scala.util.{ Failure, Success }

class SuseAuthService()(implicit
  system: ActorSystem,
  ec: ExecutionContext
) extends AuthService {

  override def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Route = complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  override def validateToken(tokenId: Option[String], ip: Option[RemoteAddress]): Route =
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId.get)}/$auth",
        HttpMethods.PATCH,
        "",
        tokenId.get
      )
    }

  override def login(ip: RemoteAddress, host: String, ctx: RequestContext): Route = {
    val suseCookieOpt              = ctx.request.cookies.find(_.name == "session")
    val bodyFuture: Future[String] = ctx.request.entity match {
      case HttpEntity.Strict(_, data) =>
        Future.successful(data.utf8String)
      case _                          =>
        Unmarshal(ctx.request.entity).to[String]
    }

    onComplete(bodyFuture) {
      case Success(body) =>
        try {
          val password = body.parseJson.convertTo[Password]
          suseCookieOpt match {
            case Some(suseCookie) =>
              performLogin(ip, password, suseCookie.value)
            case None             =>
              performLogin(ip, password, "")
          }
        } catch {
          case ex: DeserializationException =>
            complete((StatusCodes.BadRequest, s"Invalid request body: ${ex.getMessage}"))
        }

      case Failure(ex) =>
        complete((StatusCodes.InternalServerError, s"Error processing request: ${ex.getMessage}"))
    }
  }

  private def performLogin(ip: RemoteAddress, userPwd: Password, suseCookieValue: String): Route =
    try {
      logger.info(s"post path auth")
      processSuseLoginRequest(ip, userPwd, suseCookieValue)
    } catch {
      case NonFatal(e)         =>
        logger.warn(e.getMessage)
        if (
          e.getMessage
            .contains("Status: 400") || e.getMessage.contains("Status: 401") || e.getMessage
            .contains("Status: 403")
        ) {
          onUnauthorized(e)
        } else if (e.getMessage.contains("Status: 410")) {
          complete((StatusCodes.Gone, "Please logout and then login from Rancher again!"))
        } else {
          logger.warn(e.getClass.toString)
          reloadCtrlIp()
          try
            processSuseLoginRequest(ip, userPwd, suseCookieValue)
          catch {
            case NonFatal(`e`)       =>
              logger.warn(e.getMessage)
              if (
                e.getMessage
                  .contains("Status: 400") || e.getMessage.contains("Status: 401") || e.getMessage
                  .contains(
                    "Status: 403"
                  )
              ) {
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

  override def logout(host: Option[String], tokenId: String): Route =
    complete {
      val cacheKey = tokenId.substring(0, 20)
      paginationCacheManager[List[org.json4s.JsonAST.JValue]]
        .removePagedData(s"$cacheKey-audit")
      paginationCacheManager[Array[ScannedWorkloads2]]
        .removePagedData(s"$cacheKey-workload")
      paginationCacheManager[Array[GroupDTO]].removePagedData(s"$cacheKey-group")
      paginationCacheManager[List[org.json4s.JsonAST.JValue]]
        .removePagedData(s"$cacheKey-network-rule")
      AuthenticationManager.invalidate(tokenId)
      RestClient.httpRequestWithHeader(s"$baseUri/$auth", HttpMethods.DELETE, "", tokenId)
    }

  override def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String
  ): Route =
    complete {
      try {
        logger.info("Getting self ..")
        val suseCookie =
          if (isRancherSSOUrl.isDefined && isRancherSSOUrl.get == "true") suseCookieValue else ""
        val result     =
          RestClient.requestWithHeaderDecode(
            s"$baseUri/selfuser",
            HttpMethods.GET,
            "",
            tokenId
          )
        val selfWrap   =
          jsonToSelfWrap(Await.result(result, RestClient.waitingLimit.seconds))
        val user       = selfWrap.user
        logger.info("user: {}", user)
        val token1     = TokenWrap(
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
        val authToken  =
          AuthenticationManager.parseToken(tokenWrapToJson(token1), suseCookie.nonEmpty)
        authToken
      } catch {
        case NonFatal(e) =>
          onExpiredOrInternalError(e)
      }
    }

  private def processSuseLoginRequest(
    ip: RemoteAddress,
    userPwd: Password,
    suseCookieValue: String
  ): Route = {
    val suseCookie = if (userPwd.isRancherSSOUrl) suseCookieValue else ""
    val result     =
      RestClient.httpRequestWithTokenHeader(
        s"$baseUri/$auth",
        HttpMethods.POST,
        authRequestToJson(
          AuthRequest(userPwd, ip.toOption.map(_.getHostAddress).getOrElse(""))
        ),
        suseCookie
      )
    val response   = Await.result(result, RestClient.waitingLimit.seconds)
    var authToken  = AuthenticationManager.parseToken(response)
    authToken = UserTokenNew(
      authToken.token,
      authToken.emailHash,
      authToken.roles,
      authToken.login_timestamp,
      authToken.need_to_reset_password,
      suseCookie.nonEmpty
    )
    authToken.token match {
      case Some(token) =>
        AuthenticationManager.suseTokenMap += (token.token -> suseCookie)
        logger.info("login with SUSE cookie")
      case None        =>
    }

    complete(authToken)
  }
}
