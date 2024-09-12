package com.neu.api.authentication

import com.neu.api._
import com.neu.service.authentication.AuthService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class SuseAuthApi(
  authProcessor: AuthService
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  private val auth       = "auth"
  private val suseCookie = "R_SESS"

  val route: Route =
    (post & path(auth)) {
      extractClientIP { ip =>
        extractRequestContext { ctx =>
          Utils.respondWithWebServerHeaders() {
            authProcessor.login(ip, "", ctx)
          }
        }
      }
    } ~
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix(auth) {
          delete {
            Utils.respondWithWebServerHeaders() {
              authProcessor.logout(None, tokenId)
            }
          }
        } ~
        pathPrefix("heartbeat") {
          patch {
            Utils.respondWithWebServerHeaders() {
              authProcessor.validateToken(Some(tokenId))
            }
          }
        } ~
        pathPrefix("self") {
          get {
            parameter(Symbol("isOnNV").?, Symbol("isRancherSSOUrl").?) {
              (isOnNV, isRancherSSOUrl) =>
                Utils.respondWithWebServerHeaders() {
                  optionalCookie(suseCookie) {
                    case Some(sCookie) =>
                      authProcessor.getSelf(
                        isOnNV,
                        isRancherSSOUrl,
                        sCookie.value,
                        tokenId
                      )
                    case None =>
                      authProcessor.getSelf(isOnNV, isRancherSSOUrl, "", tokenId)
                  }
                }
            }
          }
        }
      }
    }
}
