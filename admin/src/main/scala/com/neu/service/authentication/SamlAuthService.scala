package com.neu.service.authentication

import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.AuthTokenJsonProtocol.{ *, given }
import com.neu.model.*
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.server.RequestContext
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal

import scala.concurrent.Await
import scala.concurrent.ExecutionContext
import scala.concurrent.Future
import scala.concurrent.duration.*
import scala.util.Failure
import scala.util.Success

class SamlAuthService()(implicit
  system: ActorSystem,
  ec: ExecutionContext
) extends AuthService {

  val samlSloResp      = "samlslo"
  val saml             = "token_auth_server"
  val samlslo          = "token_auth_server_slo"
  private val rootPath = "/"

  override def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String],
    nonce: String
  ): Route = {
    val resourcesFuture = if (serverName.isEmpty) {
      logger.info("saml-g: servername is empty")
      RestClient.httpRequest(s"$baseUri/$saml", HttpMethods.GET)
    } else {
      logger.info(s"saml-g: $serverName")
      RestClient.httpRequest(
        s"$baseUri/$saml/saml1",
        HttpMethods.GET,
        samlRedirectUrlToJson(
          SamlRedirectURL(
            s"https://${host.getOrElse("")}/$saml",
            s"https://${host.getOrElse("")}/$saml",
            Some(nonce)
          )
        )
      )
    }

    val result = Await.result(resourcesFuture, RestClient.waitingLimit.seconds)

    complete(result)
  }

  override def validateToken(
    tokenId: Option[String],
    ip: Option[RemoteAddress],
    nonce: Option[String]
  ): Route = {
    logger.info("saml-pt: to validate authToken.")
    nonce.flatMap(AuthenticationManager.validateSsoToken) match {
      case Some(token) =>
        logger.info("saml-pt: authToken matched.")
        nonce.foreach(AuthenticationManager.invalidateSsoToken)
        complete(token)
      case None        =>
        logger.info("saml-pt: no authToken.")
        complete((StatusCodes.Unauthorized, authError))
    }
  }

  override def login(ip: RemoteAddress, host: String, ctx: RequestContext, nonce: String): Route = {
    logger.info(s"saml-p: $host")
    onComplete(processLoginRequest(ctx, ip, host, nonce)) {
      case Success(route) => route
      case Failure(ex)    =>
        logger.error("Login process failed", ex)
        complete(StatusCodes.InternalServerError)
    }
  }

  override def logout(host: Option[String], tokenId: String): Route =
    complete {
      logger.info("saml-g: slo")
      RestClient.httpRequestWithHeader(
        s"$baseUri/$saml/saml1/slo",
        HttpMethods.GET,
        samlRedirectUrlToJson(
          SamlRedirectURL(
            s"https://${host.get}/$samlSloResp",
            s"https://${host.get}/$saml"
          )
        ),
        tokenId
      )
    }

  override def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String,
    ip: RemoteAddress,
    ctx: RequestContext
  ): Route = complete((StatusCodes.MethodNotAllowed, "Method not allowed."))

  private def processLoginRequest(
    ctx: RequestContext,
    ip: RemoteAddress,
    host: String,
    nonce: String
  ): Future[Route] =
    for {
      entityString <- Unmarshal(ctx.request.entity).to[String]
      response     <- makeAuthRequest(entityString, ip.toString, host, nonce)
      route        <- handleAuthResponse(response, nonce)
    } yield route

  private def makeAuthRequest(
    entityString: String,
    ip: String,
    host: String,
    nonce: String
  ): Future[HttpResponse] =
    RestClient.passHttpRequest(
      s"$baseUri/$auth/saml1",
      HttpMethods.POST,
      samlResponseToJson(
        SamlResponse(
          client_ip = ip,
          Token = Some(
            SamlToken(
              entityString,
              None,
              Some(s"https://$host/$saml"),
              Some(nonce)
            )
          )
        )
      )
    )

  private def handleAuthResponse(response: HttpResponse, nonce: String): Future[Route] = {
    logger.info("saml-p: processing auth response.")
    response.status match {
      case StatusCodes.OK =>
        logger.info(s"saml-p: success, storing token under nonce. redirecting to $rootPath")
        Unmarshal(response.entity).to[String].map { authToken =>
          val userToken: UserTokenNew = AuthenticationManager.parseToken(authToken)
          AuthenticationManager.putSsoToken(nonce, userToken)
          redirect(rootPath, StatusCodes.Found)
        }
      case _              =>
        logger.warn(s"saml-p: ${response.status}. SAML login error. redirect to $rootPath ")
        // Clear the temp cookie so the browser does not retain a stale nonce
        Future.successful(
          deleteCookie("temp") {
            redirect(rootPath, StatusCodes.MovedPermanently)
          }
        )
    }
  }
}
