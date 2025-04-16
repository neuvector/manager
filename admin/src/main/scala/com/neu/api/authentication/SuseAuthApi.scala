package com.neu.api.authentication

import com.neu.api.*
import com.neu.service.Utils
import com.neu.service.authentication.AuthService
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class SuseAuthApi(
  authService: AuthService
) extends BaseApi {

  private val auth       = "auth"
  private val suseCookie = "R_SESS"

  val route: Route =
    (post & path(auth)) {
      extractClientIP { ip =>
        extractRequestContext { ctx =>
          Utils.respondWithWebServerHeaders() {
            authService.login(ip, "", ctx)
          }
        }
      }
    } ~
    headerValueByName("Token") { tokenId =>
      pathPrefix(auth) {
        delete {
          Utils.respondWithWebServerHeaders() {
            authService.logout(None, tokenId)
          }
        }
      } ~
      pathPrefix("heartbeat") {
        patch {
          Utils.respondWithWebServerHeaders() {
            authService.validateToken(Some(tokenId), None)
          }
        }
      } ~
      pathPrefix("self") {
        get {
          extractClientIP { ip =>
            extractRequestContext { ctx =>
              parameter(Symbol("isOnNV").?, Symbol("isRancherSSOUrl").?) {
                (isOnNV, isRancherSSOUrl) =>
                  Utils.respondWithWebServerHeaders() {
                    optionalCookie(suseCookie) {
                      case Some(sCookie) =>
                        authService.getSelf(
                          isOnNV,
                          isRancherSSOUrl,
                          sCookie.value,
                          tokenId,
                          ip,
                          ctx
                        )
                      case None          =>
                        authService.getSelf(
                          isOnNV,
                          isRancherSSOUrl,
                          "",
                          tokenId,
                          ip,
                          ctx
                        )
                    }
                  }
              }
            }
          }
        }
      }
    }
}
