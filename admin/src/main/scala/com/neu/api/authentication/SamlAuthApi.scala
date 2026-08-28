package com.neu.api.authentication

import com.neu.api.*
import com.neu.client.RestClient.*
import com.neu.service.Utils
import com.neu.service.authentication.AuthService
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie
import org.apache.pekko.http.scaladsl.server.Route
import com.typesafe.scalalogging.LazyLogging

import java.nio.charset.StandardCharsets
import java.util.Base64

//noinspection UnstableApiUsage
class SamlAuthApi(
  authService: AuthService
) extends BaseApi
    with LazyLogging {

  private val samlSloResp = "samlslo"
  private val saml        = "token_auth_server"
  private val samlslo     = "token_auth_server_slo"
  private val rootPath    = "/"

  val route: Route =
    (get & path(saml)) {
      extractClientIP { _ =>
        optionalHeaderValueByName("Host") { host =>
          parameter(Symbol("serverName").?) { serverName =>
            val nonce        = java.util.UUID.randomUUID().toString
            val encodedNonce =
              Base64.getEncoder.encodeToString(nonce.getBytes(StandardCharsets.UTF_8))
            setCookie(HttpCookie("temp", encodedNonce)) {
              Utils.respondWithWebServerHeaders() {
                authService.getResources(None, None, "", host, serverName, nonce)
              }
            }
          }
        }
      }
    } ~
    (patch & path(saml)) {
      extractClientIP { _ =>
        optionalCookie("temp") { tempCookie =>
          val nonce = tempCookie.flatMap { c =>
            scala.util
              .Try(
                new String(Base64.getDecoder.decode(c.value), StandardCharsets.UTF_8)
              )
              .toOption
          }
          deleteCookie("temp") {
            Utils.respondWithWebServerHeaders() {
              authService.validateToken(None, None, nonce)
            }
          }
        }
      }
    } ~
    (post & path(saml)) {
      extractClientIP { ip =>
        optionalHeaderValueByName("Host") {
          case Some(host) =>
            optionalCookie("temp") { tempCookie =>
              val nonce = tempCookie
                .flatMap(c =>
                  scala.util
                    .Try(new String(Base64.getDecoder.decode(c.value), StandardCharsets.UTF_8))
                    .toOption
                )
                .getOrElse("")
              extractRequestContext { ctx =>
                authService.login(ip, host, ctx, nonce)
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
            logger.info("samlslo")
            Utils.respondWithWebServerHeaders() {
              authService.logout(host, tokenId)
            }
          }
        }
      }
    }
}
