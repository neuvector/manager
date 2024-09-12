package com.neu.api.authentication

import com.neu.api._
import com.neu.service.authentication.AuthService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class OpenIdAuthApi(
  authProcessor: AuthService
) extends BaseService
    with LazyLogging {

  private val openId = "openId_auth"

  val route: Route =
    (get & path(openId)) {
      extractClientIP { ip =>
        parameters(Symbol("code").?, Symbol("state").?) { (code, state) =>
          optionalHeaderValueByName("Host") { host =>
            logger.info(s"get openId_auth: $host")
            parameter(Symbol("serverName").?) { serverName =>
              Utils.respondWithWebServerHeaders() {
                authProcessor.getResources(
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
        logger.info(s"openId-pt: to validate authToken from {}", ip)
        Utils.respondWithWebServerHeaders() {
          authProcessor.validateToken(None)
        }
      }
    }
}
