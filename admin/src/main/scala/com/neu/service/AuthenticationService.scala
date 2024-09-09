package com.neu.service

import com.google.common.net.UrlEscapers
import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.CommonSettings._
import com.neu.core.{ AuthenticationManager, Md5 }
import com.neu.model.AuthTokenJsonProtocol.{ jsonToUserWrap, tokenWrapToJson, _ }
import com.neu.model.RebrandJsonProtocol._
import com.neu.model._
import com.neu.service.{ AuthenticationService }
import com.neu.api.{ BaseService, DefaultJsonFormats }
import com.neu.web.Rest.materializer
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, HttpResponse, StatusCodes }
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future, TimeoutException }
import scala.util.{ Failure, Success }

class AuthenticationService(
  implicit executionContext: ExecutionContext
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  // val auth               = "auth"
  // val samlSloResp        = "samlslo"
  // val saml               = "token_auth_server"
  // val samlslo            = "token_auth_server_slo"
  // val openId             = "openId_auth"
  // private val rootPath   = "/"
  // private val samlKey    = "samlSso"
  // private val suseCookie = "R_SESS"

  // def handleOpenIdRequest(
  //   code: Option[String],
  //   state: Option[String],
  //   ip: String,
  //   host: Option[String],
  //   serverName: Option[String]
  // ): Future[Either[Route, String]] =
  //   if (state.isEmpty) {
  //     handleOpenIdGetRequest(host, serverName).map(Right(_))
  //   } else {
  //     handleOpenIdCallback(code, state, ip, host).map(Left(_))
  //   }

  // def handleEulaGetRequest(eulaOEMAppSafe: String): Future[String] = {
  //   logger.info("Getting EULA")
  //   if ("true".equalsIgnoreCase(eulaOEMAppSafe)) {
  //     Future.successful(eulaWrapToJson(EulaWrap(Eula(true))))
  //   } else {
  //     RestClient.httpRequest(s"$baseUri/eula", HttpMethods.GET)
  //   }
  // }

  // private def eulaWrapToJson(eulaWrap: EulaWrap): String =
  //   // Implement the JSON conversion here
  //   // This is a placeholder implementation
  //   s"""{"eula":{"accepted":${eulaWrap.eula.accepted}}}"""

  // private def handleOpenIdGetRequest(
  //   host: Option[String],
  //   serverName: Option[String]
  // ): Future[String] = {
  //   logger.info(s"get openId_auth: $host")
  //   if (serverName.isEmpty) {
  //     logger.info(s"openId-g: no server name.")
  //     RestClient.httpRequest(s"$baseUri/$saml", HttpMethods.GET)
  //   } else if (host.isEmpty) {
  //     logger.info(s"openId-g: no host.")
  //     RestClient.httpRequest(s"$baseUri/$saml/openId1", HttpMethods.GET)
  //   } else {
  //     logger.info(s"openId-g: to get redirect url")
  //     RestClient.httpRequest(
  //       s"$baseUri/$saml/openId1",
  //       HttpMethods.POST,
  //       redirectUrlToJson(RedirectURL(s"https://${host.get}/$openId"))
  //     )
  //   }
  // }

  // private def handleOpenIdCallback(
  //   code: Option[String],
  //   state: Option[String],
  //   ip: String,
  //   host: Option[String]
  // ): Future[Route] = Future {
  //   logger.info(s"openId-g: state is ${state.get}.")
  //   logger.info(s"openId-g: code is ${code.getOrElse("no code")}")
  //   logger.info(s"openId-g: host is ${host.getOrElse("no host")}")

  //   val text   = Base64.getEncoder.encodeToString(samlKey.getBytes(StandardCharsets.UTF_8))
  //   val cookie = HttpCookie("temp", text)

  //   setCookie(cookie) { ctx =>
  //     val result = RestClient.passHttpRequest(
  //       s"$baseUri/$auth/openId1",
  //       HttpMethods.POST,
  //       samlResponseToJson(
  //         SamlResponse(
  //           client_ip = ip,
  //           Token = Some(
  //             SamlToken(
  //               code.getOrElse(""),
  //               state,
  //               host.map(h => s"https://$h/$openId")
  //             )
  //           )
  //         )
  //       )
  //     )
  //     val response = Await.result(result, RestClient.waitingLimit.seconds)
  //     logger.info("openId-g: OpenId Login. ")

  //     response.status match {
  //       case StatusCodes.OK =>
  //         val authTokenFuture: Future[String] = Unmarshal(response.entity).to[String]
  //         val authToken                       = Await.result(authTokenFuture, RestClient.waitingLimit.seconds)
  //         val userToken: UserTokenNew         = AuthenticationManager.parseToken(authToken)
  //         logger.info(s"openId-g: added authToken")
  //         AuthenticationManager.putToken(samlKey, userToken)
  //         ctx.redirect(rootPath, StatusCodes.Found)
  //       case _ =>
  //         logger.warn(s"openId-g: invalid response. redirect /")
  //         ctx.redirect(rootPath, StatusCodes.MovedPermanently)
  //     }
  //   }
  // }
}
