package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.CommonSettings._
import com.neu.core.{ AuthenticationManager, Md5 }
import com.neu.model.AuthTokenJsonProtocol.{ jsonToUserWrap, tokenWrapToJson, _ }
import com.neu.model.RebrandJsonProtocol._
import com.neu.model._
import com.neu.service.AuthenticationService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, StatusCodes }
import org.apache.pekko.http.scaladsl.server.Route

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.concurrent.duration._
import scala.concurrent.Await
import scala.util.control.NonFatal

//noinspection UnstableApiUsage
class SamlAuthApi(
  authenticationService: AuthenticationService
) extends BaseService
    with LazyLogging {

  private val samlSloResp = "samlslo"
  private val saml        = "token_auth_server"
  private val samlslo     = "token_auth_server_slo"
  private val rootPath    = "/"
  private val samlKey     = "samlSso"

  val route: Route =
    (get & path(saml)) {
      extractClientIP { _ =>
        optionalHeaderValueByName("Host") { host =>
          parameter('serverName.?) { serverName =>
            Utils.respondWithWebServerHeaders() {
              authenticationService.getSamlresources(host, serverName)
            }
          }
        }
      }
    } ~
    (patch & path(saml)) {
      extractClientIP { _ =>
        logger.info(s"saml-pt: to validate authToken.")
        Utils.respondWithWebServerHeaders() {
          authenticationService.validateSamlToken()
        }
      }
    } ~
    (post & path(saml)) {
      extractClientIP { ip =>
        optionalHeaderValueByName("Host") {
          case Some(host) =>
            logger.info(s"saml-p: $host")
            val text = Base64.getEncoder.encodeToString(samlKey.getBytes(StandardCharsets.UTF_8))

            setCookie(HttpCookie("temp", text)) {
              extractRequestContext { ctx =>
                authenticationService.samlLogin(ip, host, ctx)
              }
            }
          case None =>
            complete(StatusCodes.BadRequest, "Host header is missing")
        }
      }
    } ~
    (post & path(samlSloResp)) {
      redirect(rootPath, StatusCodes.Found)
    } ~
    (get & path(samlSloResp)) {
      redirect(rootPath, StatusCodes.Found)
    } ~
    headerValueByName("Token") { tokenId =>
      {
        (get & path(samlslo)) {
          extractClientIP { _ =>
            optionalHeaderValueByName("Host") { host =>
              Utils.respondWithWebServerHeaders() {
                complete {
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
                }
              }
            }
          }
        }
      }
    }
}
