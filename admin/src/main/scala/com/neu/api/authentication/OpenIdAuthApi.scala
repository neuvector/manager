package com.neu.api.authentication

import com.neu.api.*
import com.neu.service.Utils
import com.neu.service.authentication.AuthService
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.model.headers.HttpCookie

import java.nio.charset.StandardCharsets
import java.util.Base64
import java.util.UUID

//noinspection UnstableApiUsage
class OpenIdAuthApi(
  authService: AuthService
) extends BaseApi {

  private val openId = "openId_auth"

  val route: Route =
    (get & path(openId)) {
      extractClientIP { ip =>
        parameters(Symbol("code").?, Symbol("state").?) { (code, state) =>
          optionalHeaderValueByName("Host") { host =>
            parameter(Symbol("serverName").?) { serverName =>
              Utils.respondWithWebServerHeaders() {
                if (code.isEmpty && state.isEmpty) {
                  // Initial request: generate nonce and set cookie
                  val nonce        = UUID.randomUUID().toString
                  val encodedNonce =
                    Base64.getEncoder.encodeToString(nonce.getBytes(StandardCharsets.UTF_8))
                  setCookie(HttpCookie("temp", encodedNonce)) {
                    authService.getResources(code, state, ip.toString(), host, serverName, nonce)
                  }
                } else {
                  // OAuth callback: read nonce from existing cookie, do not overwrite it
                  optionalCookie("temp") { tempCookie =>
                    val nonce = tempCookie
                      .flatMap(c =>
                        scala.util
                          .Try(
                            new String(Base64.getDecoder.decode(c.value), StandardCharsets.UTF_8)
                          )
                          .toOption
                      )
                      .getOrElse("")
                    authService.getResources(code, state, ip.toString(), host, serverName, nonce)
                  }
                }
              }
            }
          }
        }
      }
    } ~
    (patch & path(openId)) {
      extractClientIP { ip =>
        optionalCookie("temp") { tempCookie =>
          val nonce = tempCookie.flatMap(c =>
            scala.util
              .Try(new String(Base64.getDecoder.decode(c.value), StandardCharsets.UTF_8))
              .toOption
          )
          Utils.respondWithWebServerHeaders() {
            deleteCookie("temp") {
              authService.validateToken(None, Some(ip), nonce)
            }
          }
        }
      }
    }
}
