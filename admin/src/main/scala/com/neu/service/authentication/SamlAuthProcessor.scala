package com.neu.service.authentication

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
import scala.concurrent.{ Await, ExecutionContext, Future }

class SamlAuthProcessor()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) extends AuthProcessor {

  val samlSloResp      = "samlslo"
  val saml             = "token_auth_server"
  val samlslo          = "token_auth_server_slo"
  private val rootPath = "/"
  private val samlKey  = "samlSso"

  override def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Either[Route, Unit] = {
    val resourcesFuture = if (serverName.isEmpty) {
      logger.info(s"saml-g: servername is empty")
      RestClient.httpRequest(s"$baseUri/$saml", HttpMethods.GET)
    } else {
      logger.info(s"saml-g: $serverName")
      RestClient.httpRequest(
        s"$baseUri/$saml/saml1",
        HttpMethods.GET,
        samlRedirectUrlToJson(
          SamlRedirectURL(
            s"https://${host.getOrElse("")}/$saml",
            s"https://${host.getOrElse("")}/$saml"
          )
        )
      )
    }

    val result = Await.result(resourcesFuture, RestClient.waitingLimit.seconds)

    Left(complete(result))
  }

  override def validateToken(): Route = {
    val authToken = AuthenticationManager.validate(samlKey)
    authToken match {
      case Some(token) =>
        logger.info("saml-pt: authToken matched.")
        AuthenticationManager.invalidate(samlKey)
        complete(token)
      case None =>
        logger.info("saml-pt: no authToken.")
        complete((StatusCodes.Unauthorized, authError))
    }
  }

  override def login(ip: RemoteAddress, host: String, ctx: RequestContext): Either[Route, Unit] = {
    logger.info(s"saml-p: $host")
    Left(
      onComplete(processLoginRequest(ctx, ip, host)) {
        case Success(route) => route
        case Failure(ex) =>
          logger.error("Login process failed", ex)
          complete(StatusCodes.InternalServerError)
      }
    )
  }

  override def logout(host: Option[String], tokenId: String): Either[Route, Unit] =
    Left(complete {
      logger.info(s"saml-g: slo")
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
    })

  private def processLoginRequest(
    ctx: RequestContext,
    ip: RemoteAddress,
    host: String
  ): Future[Route] =
    for {
      entityString <- Unmarshal(ctx.request.entity).to[String]
      response     <- makeAuthRequest(entityString, ip.toString, host)
      route        <- handleAuthResponse(response, host)
    } yield route

  private def makeAuthRequest(
    entityString: String,
    ip: String,
    host: String
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
              Some(s"https://$host/$saml")
            )
          )
        )
      )
    )

  private def handleAuthResponse(response: HttpResponse, host: String): Future[Route] = {
    logger.info("saml-p: added temp cookie.")
    response.status match {
      case StatusCodes.OK =>
        logger.info(s"saml-p: added authToken. redirect to $rootPath")
        Unmarshal(response.entity).to[String].map { authToken =>
          val userToken: UserTokenNew = AuthenticationManager.parseToken(authToken)
          AuthenticationManager.putToken("samlSso", userToken)
          redirect(rootPath, StatusCodes.Found)
        }
      case _ =>
        logger.warn(s"saml-p: ${response.status}. SAML login error. redirect to $rootPath ")
        Future.successful(redirect(rootPath, StatusCodes.MovedPermanently))
    }
  }
}
