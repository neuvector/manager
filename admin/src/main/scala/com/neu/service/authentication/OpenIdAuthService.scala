package com.neu.service.authentication

import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.AuthTokenJsonProtocol.{ *, given }
import com.neu.model.*
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.server.RequestContext
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal
import org.apache.pekko.stream.Materializer
import spray.json.*

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.concurrent.Await
import scala.concurrent.ExecutionContext
import scala.concurrent.Future
import scala.concurrent.duration.*

class OpenIdAuthService()(implicit
  mat: Materializer,
  ec: ExecutionContext
) extends AuthService {

  private val AUTH_SERVER = "token_auth_server"
  private val OPEN_ID     = "openId_auth"
  private val ROOT_PATH   = "/"

  override def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String],
    nonce: String
  ): Route = {
    logger.info("get openId_auth: {}", host.get)
    if (state.isEmpty) {
      val result =
        Await.result(handleEmptyResources(host, serverName, nonce), RestClient.waitingLimit.seconds)
      complete(result)
    } else {
      Await
        .result(
          handleExistingResources(code, state, ip, host, nonce),
          RestClient.waitingLimit.seconds
        )
    }
  }

  override def validateToken(
    tokenId: Option[String],
    ip: Option[RemoteAddress],
    nonce: Option[String]
  ): Route = {
    logger.info("openId-pt: to validate authToken from {}", ip.get)
    nonce.flatMap(AuthenticationManager.validateSsoToken) match {
      case Some(token) =>
        logger.info("openId-pt: authToken is matched and valid.")
        nonce.foreach(AuthenticationManager.invalidateSsoToken)
        complete(token)
      case _           =>
        logger.info("openId-pt: no authToken")
        complete((StatusCodes.Unauthorized, authError))
    }
  }

  override def login(ip: RemoteAddress, host: String, ctx: RequestContext, nonce: String): Route =
    complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  override def logout(host: Option[String], tokenId: String): Route =
    complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  override def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String,
    ip: RemoteAddress,
    ctx: RequestContext
  ): Route = complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  private def handleEmptyResources(
    host: Option[String],
    serverName: Option[String],
    nonce: String
  ): Future[JsValue] =
    if (serverName.isEmpty) {
      logger.info("openId-g: no server name.")
      RestClient.httpRequest(s"$baseUri/$AUTH_SERVER", HttpMethods.GET)
    } else {
      if (host.isEmpty) {
        logger.info("openId-g: no host.")
        RestClient.httpRequest(s"$baseUri/$AUTH_SERVER/openId1", HttpMethods.GET)
      } else {
        logger.info("openId-g: to get redirect url")
        RestClient.httpRequest(
          s"$baseUri/$AUTH_SERVER/openId1",
          HttpMethods.POST,
          redirectUrlToJson(RedirectURL(s"https://${host.get}/$OPEN_ID", Some(nonce)))
        )
      }
    }

  private def handleExistingResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    nonce: String
  ): Future[Route] = Future {
    logger.info(s"openId-g: state is ${state.get}.")
    logger.info(s"openId-g: code is ${code.getOrElse("no code")}")
    logger.info(s"openId-g: host is ${host.getOrElse("no host")}")

    val result   = RestClient.passHttpRequest(
      s"$baseUri/$auth/openId1",
      HttpMethods.POST,
      samlResponseToJson(
        SamlResponse(
          client_ip = ip,
          Token = Some(
            SamlToken(
              code.getOrElse(""),
              state,
              host.map(h => s"https://$h/$OPEN_ID"),
              Some(nonce)
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
        logger.info("openId-g: added authToken")
        AuthenticationManager.putSsoToken(nonce, userToken)
        redirect(ROOT_PATH, StatusCodes.Found)
      case _              =>
        logger.warn("openId-g: invalid response. redirect /")
        deleteCookie("temp") {
          redirect(ROOT_PATH, StatusCodes.MovedPermanently)
        }
    }
  }
}
