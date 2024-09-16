package com.neu.api.authentication

import com.neu.api._
import com.neu.client.RestClient._
import com.neu.service.authentication.AuthService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.server.Route

import java.nio.charset.StandardCharsets
import java.util.Base64

//noinspection UnstableApiUsage
class SamlAuthApi(
  authProcessor: AuthService
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
          parameter(Symbol("serverName").?) { serverName =>
            Utils.respondWithWebServerHeaders() {
              authProcessor.getResources(None, None, "", host, serverName)
            }
          }
        }
      } ~
      (patch & path(saml)) {
        extractClientIP { _ =>
          logger.info(s"saml-pt: to validate authToken.")
          Utils.respondWithWebServerHeaders() {
            authProcessor.validateToken(None)
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
                  authProcessor.login(ip, host, ctx)
                }
              }
            case None       =>
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
        (get & path(samlslo)) {
          extractClientIP { _ =>
            optionalHeaderValueByName("Host") { host =>
              Utils.respondWithWebServerHeaders() {
                authProcessor.logout(host, tokenId)
              }
            }
          }
        }
      }
    }
}
