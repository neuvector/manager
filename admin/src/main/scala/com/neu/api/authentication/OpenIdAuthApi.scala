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
class OpenIdAuthApi(
  authenticationService: AuthenticationService
) extends BaseService
    with LazyLogging {

  private val openId = "openId_auth"

  val route: Route =
    (get & path(openId)) {
      extractClientIP { ip =>
        parameters('code.?, 'state.?) { (code, state) =>
          optionalHeaderValueByName("Host") { host =>
            logger.info(s"get openId_auth: $host")
            parameter('serverName.?) { serverName =>
              Utils.respondWithWebServerHeaders() {
                authenticationService.getOpenIdresources(
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
          authenticationService.validateOpenIdToken()
        }
      }
    }
}
