package com.neu.service.authentication

import com.neu.core.AuthenticationManager
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.model._
import com.neu.model.AuthTokenJsonProtocol._

import org.apache.pekko.stream.Materializer
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal

import spray.json._

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future }

class OpenIdAuthService()(
  implicit mat: Materializer,
  ec: ExecutionContext
) extends AuthService {

  private val AUTH_SERVER = "token_auth_server"
  private val OPEN_ID     = "openId_auth"
  private val ROOT_PATH   = "/"
  private val KEY         = "samlSso"

  override def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Route =
    if (state.isEmpty) {
      val result =
        Await.result(handleEmptyResources(host, serverName), RestClient.waitingLimit.seconds)
      complete(result)
    } else {
      Await
        .result(handleExistingResoureces(code, state, ip, host), RestClient.waitingLimit.seconds)
    }

  override def validateToken(tokenId: Option[String]): Route = {
    val authToken = AuthenticationManager.validate(KEY)
    authToken match {
      case Some(x) =>
        logger.info("openId-pt: authToken is matched and valid.")
        AuthenticationManager.invalidate(KEY)
        complete(x)
      case _ =>
        logger.info("openId-pt: no authToken")
        complete((StatusCodes.Unauthorized, authError))
    }
  }

  override def login(ip: RemoteAddress, host: String, ctx: RequestContext): Route =
    complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  override def logout(host: Option[String], tokenId: String): Route =
    complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  override def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String
  ): Route = complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  private def handleEmptyResources(
    host: Option[String],
    serverName: Option[String]
  ): Future[JsValue] =
    if (serverName.isEmpty) {
      logger.info(s"openId-g: no server name.")
      RestClient.httpRequest(s"$baseUri/$AUTH_SERVER", HttpMethods.GET)
    } else {
      if (host.isEmpty) {
        logger.info(s"openId-g: no host.")
        RestClient.httpRequest(s"$baseUri/$AUTH_SERVER/openId1", HttpMethods.GET)
      } else {
        logger.info(s"openId-g: to get redirect url")
        RestClient.httpRequest(
          s"$baseUri/$AUTH_SERVER/openId1",
          HttpMethods.POST,
          redirectUrlToJson(RedirectURL(s"https://${host.get}/$OPEN_ID"))
        )
      }
    }

  private def handleExistingResoureces(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String]
  ): Future[Route] = Future {
    logger.info(s"openId-g: state is ${state.get}.")
    logger.info(s"openId-g: code is ${code.getOrElse("no code")}")
    logger.info(s"openId-g: host is ${host.getOrElse("no host")}")

    val text   = Base64.getEncoder.encodeToString(KEY.getBytes(StandardCharsets.UTF_8))
    val cookie = HttpCookie("temp", text)

    setCookie(cookie) { ctx =>
      val result = RestClient.passHttpRequest(
        s"$baseUri/$auth/openId1",
        HttpMethods.POST,
        samlResponseToJson(
          SamlResponse(
            client_ip = ip,
            Token = Some(
              SamlToken(
                code.getOrElse(""),
                state,
                host.map(h => s"https://$h/$OPEN_ID")
              )
            )
          )
        )
      )
      val response = Await.result(result, RestClient.waitingLimit.seconds)
      logger.info("openId-g: OpenId Login. ")

      response.status match {
        case StatusCodes.OK =>
          val authTokenFuture: Future[String] = Unmarshal(response.entity).to[String]
          val authToken                       = Await.result(authTokenFuture, RestClient.waitingLimit.seconds)
          val userToken: UserTokenNew         = AuthenticationManager.parseToken(authToken)
          logger.info(s"openId-g: added authToken")
          AuthenticationManager.putToken(KEY, userToken)
          ctx.redirect(ROOT_PATH, StatusCodes.Found)
        case _ =>
          logger.warn(s"openId-g: invalid response. redirect /")
          ctx.redirect(ROOT_PATH, StatusCodes.MovedPermanently)
      }
    }
  }
}
