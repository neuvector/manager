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
import com.typesafe.scalalogging.LazyLogging
import spray.can.Http._
import spray.http.HttpMethods._
import spray.http.{ HttpCookie, StatusCodes }
import spray.httpx.ResponseTransformation
import spray.routing.Route

import java.nio.charset.StandardCharsets
import java.util.Base64
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, TimeoutException }
import scala.util.control.NonFatal

/**
 * Created by bxu on 3/24/16.
 *
 * Authentication rest service
 */
//noinspection UnstableApiUsage
class AuthenticationService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with ResponseTransformation
    with LazyLogging {

  val auth               = "auth"
  val samlSloResp        = "samlslo"
  val saml               = "token_auth_server"
  val samlslo            = "token_auth_server_slo"
  val openId             = "openId_auth"
  private val rootPath   = "/"
  private val samlKey    = "samlSso"
  private val suseCookie = "R_SESS"

  val authRoute: Route =
    (get & path(openId)) {
      clientIP { ip =>
        parameters('code.?, 'state.?) { (code, state) =>
          if (state.isEmpty) {
            optionalHeaderValueByName("Host") { host =>
              logger.info(s"get openId_auth: $host")
              parameter('serverName.?) { serverName =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    if (serverName.isEmpty) {
                      logger.info(s"openId-g: no server name.")
                      RestClient.httpRequest(s"$baseUri/$saml", GET)
                    } else {
                      if (host.isEmpty) {
                        logger.info(s"openId-g: no host.")
                        RestClient.httpRequest(s"$baseUri/$saml/openId1", GET)
                      } else {
                        logger.info(s"openId-g: to get redirect url")
                        RestClient.httpRequest(
                          s"$baseUri/$saml/openId1",
                          POST,
                          redirectUrlToJson(RedirectURL(s"https://${host.get}/$openId"))
                        )
                      }
                    }
                  }
                }
              }
            }
          } else {
            logger.info(s"openId-g: state is ${state.get}.")
            logger.info(s"openId-g: code is ${code.getOrElse("no code")}")
            optionalHeaderValueByName("Host") { host =>
              logger.info(s"openId-g:  host is ${host.get}")
              val text =
                Base64.getEncoder.encodeToString(samlKey.getBytes(StandardCharsets.UTF_8))
              val cookie = HttpCookie("temp", content = text)

              setCookie(cookie) { ctx =>
                {
                  val result = RestClient.passHttpRequest(
                    s"$baseUri/$auth/openId1",
                    POST,
                    samlResponseToJson(
                      SamlResponse(
                        client_ip = ip.toString,
                        Token = Some(
                          SamlToken(
                            code.getOrElse(""),
                            state,
                            Some(s"https://${host.get}/$openId")
                          )
                        )
                      )
                    )
                  )
                  val response = Await.result(result, RestClient.waitingLimit.seconds)
                  logger.info("openId-g: OpenId Login. ")

                  response.status match {
                    case StatusCodes.OK =>
                      val authToken = AuthenticationManager.parseToken(response.entity.asString)
                      logger.info(
                        s"openId-g: added authToken"
                      )
                      AuthenticationManager.putToken(samlKey, authToken)
                      ctx.redirect(rootPath, StatusCodes.Found)
                    case _ =>
                      logger.warn(s"openId-g: invalid response. redirect /")
                      ctx.redirect(rootPath, StatusCodes.MovedPermanently)
                  }
                }
              }
            }
          }
        }
      }
    } ~
    (patch & path(openId)) {
      clientIP { ip =>
        logger.info(s"openId-pt: to validate authToken from {}", ip)
        val authToken = AuthenticationManager.validate(samlKey)
        authToken match {
          case Some(x) =>
            logger.info("openId-pt: authToken is matched and valid.")
            AuthenticationManager.invalidate(samlKey)
            Utils.respondWithWebServerHeaders() {
              complete(x)
            }
          case _ =>
            logger.info("openId-pt: no authToken")
            Utils.respondWithWebServerHeaders() {
              complete((StatusCodes.Unauthorized, authError))
            }
        }
      }
    } ~
    (get & path(saml)) {
      clientIP { _ =>
        optionalHeaderValueByName("Host") { host =>
          parameter('serverName.?) { serverName =>
            Utils.respondWithWebServerHeaders() {
              complete {
                if (serverName.isEmpty) {
                  logger.info(s"saml-g: servername is empty")
                  RestClient.httpRequest(s"$baseUri/$saml", GET)
                } else {
                  logger.info(s"saml-g: $serverName")
                  RestClient.httpRequest(
                    s"$baseUri/$saml/saml1",
                    GET,
                    samlRedirectUrlToJson(
                      SamlRedirectURL(s"https://${host.get}/$saml", s"https://${host.get}/$saml")
                    )
                  )
                }
              }
            }
          }
        }
      }
    } ~
    (patch & path(saml)) {
      clientIP { _ =>
        logger.info(s"saml-pt: to validate authToken.")
        val authToken = AuthenticationManager.validate(samlKey)

        authToken match {
          case Some(x) =>
            logger.info(s"saml-pt: authToken matched.")
            AuthenticationManager.invalidate(samlKey)
            Utils.respondWithWebServerHeaders() {
              complete(x)
            }
          case None =>
            logger.info("saml-pt: no authToken.")
            Utils.respondWithWebServerHeaders() {
              complete((StatusCodes.Unauthorized, authError))
            }
        }
      }
    } ~
    (post & path(saml)) {
      clientIP { ip =>
        optionalHeaderValueByName("Host") { host =>
          logger.info(s"saml-p: ${host.get}")
          val text = Base64.getEncoder.encodeToString(samlKey.getBytes(StandardCharsets.UTF_8))

          setCookie(HttpCookie("temp", content = text)) { ctx =>
            {
              val result = RestClient.passHttpRequest(
                s"$baseUri/$auth/saml1",
                POST,
                samlResponseToJson(
                  SamlResponse(
                    client_ip = ip.toString,
                    Token = Some(
                      SamlToken(
                        ctx.request.entity.asString,
                        None,
                        Some(s"https://${host.get}/$saml")
                      )
                    )
                  )
                )
              )
              val response = Await.result(result, RestClient.waitingLimit.seconds)

              logger.info("saml-p: added temp cookie.")

              response.status match {
                case StatusCodes.OK =>
                  logger.info(s"saml-p: added authToken. redirect to $rootPath")
                  val authToken = AuthenticationManager.parseToken(response.entity.asString)
                  AuthenticationManager.putToken("samlSso", authToken)
                  ctx.redirect(rootPath, StatusCodes.Found)
                case _ =>
                  logger.warn(
                    s"saml-p: {} . SAML login error. redirect to $rootPath ",
                    response.status
                  )
                  ctx.redirect(rootPath, StatusCodes.MovedPermanently)
              }
            }
          }
        }
      }
    } ~
    (post & path(samlSloResp)) {
      redirect(rootPath, StatusCodes.Found)
    } ~
    (get & path(samlSloResp)) {
      redirect(rootPath, StatusCodes.Found)
    } ~
    path("gravatar") {
      get {
        Utils.respondWithWebServerHeaders() {
          complete(gravatarEnabled)
        }
      }
    } ~
    path("eula") {
      get {
        Utils.respondWithWebServerHeaders() {
          complete {
            logger.info("Getting EULA")
            if ("true".equalsIgnoreCase(eulaOEMAppSafe)) {
              eulaWrapToJson(EulaWrap(Eula(true)))
            } else {
              RestClient.httpRequest(s"$baseUri/eula", GET)
            }
          }
        }
      }
    } ~
    path("rebrand") {
      get {
        Utils.respondWithWebServerHeaders() {
          complete(
            Rebrand(
              customLoginLogo,
              customPolicy,
              customPageHeaderContent,
              customPageHeaderColor,
              customPageFooterContent,
              customPageFooterColor
            )
          )
        }
      }
    } ~
    (post & path(auth)) {
      optionalCookie(suseCookie) {
        case Some(sCookie) => loginWithSUSEToken(sCookie.content)
        case None          => loginWithSUSEToken("")
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
                RestClient.httpRequestWithHeader(s"$baseUri/$auth", DELETE, "", tokenId)
              }
            }
          }
        } ~
        pathPrefix("heartbeat") {
          patch {
            Utils.respondWithWebServerHeaders() {
              complete {
                RestClient.httpRequestWithHeader(
                  s"${baseClusterUri(tokenId)}/$auth",
                  PATCH,
                  "",
                  tokenId
                )
              }
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
                    GET,
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
                      GET,
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
                      POST,
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
                      PATCH,
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
                      DELETE,
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
                        GET,
                        "",
                        tokenId
                      )
                    } else {
                      logger.info("Getting apikey: {}", name.get)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/api_key/${UrlEscapers.urlFragmentEscaper().escape(name.get)}",
                        GET,
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
                      POST,
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
                    POST,
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
                      DELETE,
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
                          GET,
                          "",
                          tokenId
                        )
                      val userWrap =
                        jsonToUserWrap(Await.result(result, RestClient.waitingLimit.seconds))
                      val user = userWrap.user
                      logger.info("user: {}", user)
                      val token1 = TokenWrap(
                        None,
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
                          GET,
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
                    POST,
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
                    PATCH,
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
                    DELETE,
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
            parameter('isOnNV.?) { isOnNV =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  try {
                    logger.info("Getting self ..")
                    val result =
                      RestClient.requestWithHeaderDecode(
                        s"$baseUri/selfuser",
                        GET,
                        "",
                        tokenId
                      )
                    val selfWrap =
                      jsonToSelfWrap(Await.result(result, RestClient.waitingLimit.seconds))
                    val user = selfWrap.user
                    logger.info("user: {}", user)
                    val token1 = TokenWrap(
                      selfWrap.password_days_until_expire,
                      Token(
                        tokenId,
                        user.fullname,
                        user.server,
                        user.username,
                        user.email,
                        user.role,
                        user.locale,
                        if (isOnNV.getOrElse("") == "true") user.timeout else Some(300),
                        user.default_password,
                        user.modify_password,
                        user.role_domains,
                        selfWrap.global_permissions,
                        selfWrap.domain_permissions
                      )
                    )
                    val authToken = AuthenticationManager.parseToken(tokenWrapToJson(token1))
                    authToken
                  } catch {
                    case NonFatal(e) =>
                      onExpiredOrInternalError(e)
                  }
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
        } ~
        path("eula") {
          post {
            entity(as[Eula]) { eula =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Setting EULA: {}", eula.accepted)
                  RestClient.httpRequestWithHeader(
                    s"$baseUri/eula",
                    POST,
                    eulaWrapToJson(EulaWrap(eula)),
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("license") {
          pathEnd {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting license")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/system/license",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            post {
              entity(as[LicenseRequestWrap]) { licenseRequestWrap: LicenseRequestWrap =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info("Getting license code")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/system/license/request",
                        POST,
                        licenseRequestToJson(licenseRequestWrap),
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          path("update") {
            post {
              entity(as[LicenseKey]) { licenseKey: LicenseKey =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info("Loading license")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/system/license/update",
                        POST,
                        licenseKeyToJson(licenseKey),
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("password-profile") {
          path("public") {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting password public profile")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/password_profile/nvsyspwdprofile",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          path("user") {
            post {
              entity(as[UserBlockWrap]) { userBlockWrap: UserBlockWrap =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Updating user block")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/user/${userBlockWrap.config.fullname}/password",
                      POST,
                      userBlockWrapToJson(userBlockWrap),
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          pathEnd {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting password profile")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/password_profile",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            patch {
              entity(as[PasswordProfileWrap]) { passwordProfileWrap: PasswordProfileWrap =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Updating password profile")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/password_profile/${passwordProfileWrap.config.name}",
                      PATCH,
                      passwordProfileWrapToJson(passwordProfileWrap),
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("server") {
          pathEnd {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting ldap/saml server")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/server",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            post {
              entity(as[LdapSettingWrap]) { ldapSettingWrap: LdapSettingWrap =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info("Adding ldap/saml server")
                      logger.debug(ldapSettingWrapToJson(ldapSettingWrap))
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/server",
                        POST,
                        ldapSettingWrapToJson(ldapSettingWrap),
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            patch {
              entity(as[LdapSettingWrap]) { ldapSettingWrap: LdapSettingWrap =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info("Updating Ldap/saml server")
                      logger.debug(ldapSettingWrapToJson(ldapSettingWrap))
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/server/${ldapSettingWrap.config.name}",
                        PATCH,
                        ldapSettingWrapToJson(ldapSettingWrap),
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            delete {
              entity(as[LdapSettingWrap]) { ldapSettingWrap: LdapSettingWrap =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info("Deleting Ldap/saml server")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/server/${ldapSettingWrap.config.name}",
                        DELETE,
                        ldapSettingWrapToJson(ldapSettingWrap),
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          }
        } ~
        (post & path("debug")) {
          entity(as[LdapServerAccountWrap]) { ldapAccountWarp: LdapServerAccountWrap =>
            {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Testing Ldap server config")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/debug/server/test",
                    POST,
                    ldapAccountWarpToJson(ldapAccountWarp),
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        (get & path(samlslo)) {
          clientIP { _ =>
            optionalHeaderValueByName("Host") { host =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info(s"saml-g: slo")
                  RestClient.httpRequestWithHeader(
                    s"$baseUri/$saml/saml1/slo",
                    GET,
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

  private def loginWithSUSEToken(suseCookieValue: String) =
    clientIP { ip =>
      entity(as[Password]) { userPwd =>
        def login: Route = {
          val result =
            RestClient.httpRequestWithTokenHeader(
              s"$baseUri/$auth",
              POST,
              authRequestToJson(AuthRequest(userPwd, ip.toString())),
              suseCookieValue
            )
          val response  = Await.result(result, RestClient.waitingLimit.seconds)
          var authToken = AuthenticationManager.parseToken(response)
          authToken = UserTokenNew(
            authToken.token,
            authToken.emailHash,
            authToken.roles,
            authToken.login_timestamp,
            suseCookieValue.nonEmpty
          )
          AuthenticationManager.suseTokenMap += (authToken.token.token -> suseCookieValue)
          logger.info("login with SUSE cookie")
          logger.info("Client ip {}", ip)
          Utils.respondWithWebServerHeaders() {
            complete(authToken)
          }
        }
        {
          try {
            logger.info(s"post path auth")
            login
          } catch {
            case NonFatal(e) =>
              logger.warn(e.getMessage)
              if (e.getMessage.contains("Status: 401") || e.getMessage.contains("Status: 403")) {
                Utils.respondWithWebServerHeaders() {
                  onUnauthorized(e)
                }
              } else {
                logger.warn(e.getClass.toString)
                reloadCtrlIp()
                try {
                  login
                } catch {
                  case NonFatal(`e`) =>
                    logger.warn(e.getMessage)
                    if (e.getMessage.contains("Status: 401") || e.getMessage.contains(
                          "Status: 403"
                        )) {
                      Utils.respondWithWebServerHeaders() {
                        onUnauthorized(e)
                      }
                    } else {
                      Utils.respondWithWebServerHeaders() {
                        complete((StatusCodes.InternalServerError, "Controller unavailable!"))
                      }
                    }
                  case e: TimeoutException =>
                    logger.warn(e.getMessage)
                    Utils.respondWithWebServerHeaders() {
                      complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
                    }
                  case e: ConnectionAttemptFailedException =>
                    logger.warn(e.getMessage)
                    Utils.respondWithWebServerHeaders() {
                      complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
                    }
                }
              }
            case e: TimeoutException =>
              logger.warn(e.getMessage)
              Utils.respondWithWebServerHeaders() {
                complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
              }
            case e: ConnectionAttemptFailedException =>
              logger.warn(e.getMessage)
              Utils.respondWithWebServerHeaders() {
                complete((StatusCodes.NetworkConnectTimeout, "Network connect timeout error"))
              }
          }
        }
      }
    }

}
