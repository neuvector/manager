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
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, StatusCodes }
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.duration._
import scala.concurrent.Await
import scala.util.control.NonFatal

//noinspection UnstableApiUsage
class SuseAuthApi(
  authenticationService: AuthenticationService
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  private val auth       = "auth"
  private val suseCookie = "R_SESS"

  val route: Route =
    (post & path(auth)) {
      extractClientIP { ip =>
        Utils.respondWithWebServerHeaders() {
          entity(as[Password]) { userPwd =>
            optionalCookie(suseCookie) {
              case Some(sCookie) => authenticationService.suseLogin(ip, userPwd, sCookie.value)
              case None          => authenticationService.suseLogin(ip, userPwd, "")
            }
          }
        }
      }
    } ~
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix(auth) {
          delete {
            Utils.respondWithWebServerHeaders() {
              complete {
                val cacheKey = tokenId.substring(0, 20)
                paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                  .removePagedData(s"$cacheKey-audit")
                paginationCacheManager[Array[ScannedWorkloads2]]
                  .removePagedData(s"$cacheKey-workload")
                paginationCacheManager[Array[GroupDTO]].removePagedData(s"$cacheKey-group")
                paginationCacheManager[List[org.json4s.JsonAST.JValue]]
                  .removePagedData(s"$cacheKey-network-rule")
                AuthenticationManager.invalidate(tokenId)
                RestClient.httpRequestWithHeader(s"$baseUri/$auth", HttpMethods.DELETE, "", tokenId)
              }
            }
          }
        } ~
        pathPrefix("heartbeat") {
          patch {
            Utils.respondWithWebServerHeaders() {
              authenticationService.validateSuseToken(tokenId)
            }
          }
        } ~
        pathPrefix("role2") {
          path("permission-options") {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info(s"Getting permission options ...")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/user_role_permission/options",
                    HttpMethods.GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          pathEnd {
            get {
              parameter('name.?) { name =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    var url = ""
                    if (name.isEmpty) {
                      url = "user_role"
                    } else {
                      url = s"user_role/${UrlEscapers.urlFragmentEscaper().escape(name.get)}"
                    }
                    logger.info(s"Getting roles ...")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$url",
                      HttpMethods.GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            post {
              entity(as[RoleWrap]) { roleWrap =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    val payload = roleWrapToJson(roleWrap)
                    logger.info("Add role: {}", payload)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/user_role",
                      HttpMethods.POST,
                      payload,
                      tokenId
                    )
                  }
                }
              }
            } ~
            patch {
              entity(as[RoleWrap]) { roleWrap =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    val payload = roleWrapToJson(roleWrap)
                    val name    = roleWrap.config.name
                    logger.info("Add role: {}", payload)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/user_role/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                      HttpMethods.PATCH,
                      payload,
                      tokenId
                    )
                  }
                }
              }
            } ~
            delete {
              parameter('name) { name =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Deleting role: {}", name)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/user_role/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                      HttpMethods.DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("api_key") {
          pathEnd {
            get {
              parameter('name.?) { name =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    if (name.isEmpty) {
                      logger.info("Getting all apikeys")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/api_key",
                        HttpMethods.GET,
                        "",
                        tokenId
                      )
                    } else {
                      logger.info("Getting apikey: {}", name.get)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/api_key/${UrlEscapers.urlFragmentEscaper().escape(name.get)}",
                        HttpMethods.GET,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            post {
              entity(as[ApikeyWrap]) { apikeyWrap =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    val payload = apikeyWrapToJson(apikeyWrap)
                    logger.info("Add apikey: {}", payload)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/api_key",
                      HttpMethods.POST,
                      payload,
                      tokenId
                    )
                  }
                }
              } ~
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Create apikey")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/api_key",
                    HttpMethods.POST,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            delete {
              parameter('name) { name =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Deleting apikey: {}", name)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/api_key/${UrlEscapers.urlFragmentEscaper().escape(name)}",
                      HttpMethods.DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("user") {
          get {
            parameter('name.?) { name =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  if (name.nonEmpty) {
                    try {
                      logger.info("Getting user")
                      val result =
                        RestClient.requestWithHeaderDecode(
                          s"$baseUri/user/${name.get}",
                          HttpMethods.GET,
                          "",
                          tokenId
                        )
                      val userWrap =
                        jsonToUserWrap(Await.result(result, RestClient.waitingLimit.seconds))
                      val user = userWrap.user
                      logger.info("user: {}", user)
                      val token1 = TokenWrap(
                        None,
                        None,
                        Some(
                          Token(
                            tokenId,
                            user.fullname,
                            user.server,
                            user.username,
                            user.email,
                            user.role,
                            user.locale,
                            Some(300),
                            user.default_password,
                            user.modify_password,
                            user.role_domains
                          )
                        )
                      )
                      logger.info("user token: {}", token1)
                      val authToken = AuthenticationManager.parseToken(tokenWrapToJson(token1))
                      authToken
                    } catch {
                      case NonFatal(e) =>
                        onExpiredOrInternalError(e)
                    }
                  } else {
                    try {
                      val result =
                        RestClient.requestWithHeaderDecode(
                          s"${baseClusterUri(tokenId)}/user",
                          HttpMethods.GET,
                          "",
                          tokenId
                        )
                      val users = jsonToUsers(Await.result(result, RestClient.waitingLimit.seconds))
                      val userImage =
                        users.users.map(userToUserImage).sortWith(_.username < _.username)
                      UsersOutput(
                        users.domain_roles,
                        users.global_roles,
                        userImage
                      )
                    } catch {
                      case NonFatal(e) =>
                        logger.warn(e.getMessage)
                        onNonFatal(e)
                    }
                  }
                }
              }
            }
          } ~
          post {
            entity(as[User]) { user =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Add user: {}", user.username)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/user",
                    HttpMethods.POST,
                    userWrapToJson(UserWrap(user)),
                    tokenId
                  )
                }
              }
            }
          } ~
          patch {
            entity(as[UserProfile]) { user =>
              {
                logger.info("Updating user: {}", user.fullname)
                val result =
                  RestClient.httpRequestWithHeaderDecode(
                    s"$baseUri/user/${UrlEscapers.urlFragmentEscaper().escape(user.fullname)}",
                    HttpMethods.PATCH,
                    userProfileWrapToJson(UserProfileWrap(user)),
                    tokenId
                  )
                val response = Await.result(result, RestClient.waitingLimit.seconds)
                logger.info("Server response {}", response.status)
                response.status match {
                  case StatusCodes.OK =>
                    val profile = Some(
                      UserToken(
                        Token(
                          tokenId,
                          user.fullname,
                          "",
                          user.username,
                          user.email,
                          user.role
                            .getOrElse("none"),
                          user.locale,
                          user.timeout,
                          user.default_password,
                          user.modify_password,
                          user.role_domains
                        ),
                        Md5.hash(user.email),
                        None,
                        None
                      )
                    )
                    Utils.respondWithWebServerHeaders() {
                      complete(profile)
                    }
                  case StatusCodes.RequestTimeout =>
                    logger.warn("Session timed out!")
                    Utils.respondWithWebServerHeaders() {
                      complete((StatusCodes.RequestTimeout, "Timed out"))
                    }
                  case _ =>
                    logger.warn("Error updating profile!")
                    Utils.respondWithWebServerHeaders() {
                      complete(response)
                    }
                }
              }
            }
          } ~
          delete {
            parameter('userId) { userId =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Deleting user: {}", userId)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/user/${UrlEscapers.urlFragmentEscaper().escape(userId)}",
                    HttpMethods.DELETE,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("self") {
          get {
            parameter('isOnNV.?, 'isRancherSSOUrl.?) { (isOnNV, isRancherSSOUrl) =>
              Utils.respondWithWebServerHeaders() {
                optionalCookie(suseCookie) {
                  case Some(sCookie) =>
                    authenticationService.refreshSuseToken(
                      isOnNV,
                      isRancherSSOUrl,
                      sCookie.value,
                      tokenId
                    )
                  case None =>
                    authenticationService.refreshSuseToken(isOnNV, isRancherSSOUrl, "", tokenId)
                }
              }
            }
          }
        } ~
        (get & path("version")) {
          Utils.respondWithWebServerHeaders() {
            complete(managerVersion)
          }
        } ~
        (post & path("token")) {
          Utils.respondWithWebServerHeaders() {
            complete {
              val user = AuthenticationManager.validate(tokenId)
              (StatusCodes.OK, user)
            }
          }
        }
      }
    }
}
