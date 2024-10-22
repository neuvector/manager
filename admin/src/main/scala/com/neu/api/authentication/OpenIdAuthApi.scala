package com.neu.api.authentication

import com.neu.api.*
import com.neu.service.Utils
import com.neu.service.authentication.AuthService
import org.apache.pekko.http.scaladsl.server.Route

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
                authService.getResources(
                  code,
                  state,
                  ip.toString(),
                  host,
                  serverName
                )
              }
            }
          }
        }
      }
    } ~
    (patch & path(openId)) {
      extractClientIP { ip =>
        Utils.respondWithWebServerHeaders() {
          authService.validateToken(None, Some(ip))
        }
      }
    }
}
