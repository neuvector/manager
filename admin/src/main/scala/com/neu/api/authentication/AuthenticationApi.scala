package com.neu.api.authentication

import com.neu.api._
import com.neu.model._
import com.neu.model.AuthTokenJsonProtocol._
import com.neu.model.RebrandJsonProtocol._
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.CommonSettings._
import com.neu.core.{ AuthenticationManager, Md5 }
import com.neu.service.authentication.{ AuthProcessorBrand, AuthService, AuthServiceFactory }

import com.typesafe.scalalogging.LazyLogging
import com.google.common.net.UrlEscapers

import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model.{ HttpMethods, StatusCodes }
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.duration.DurationInt
import scala.concurrent.{ Await, ExecutionContext }
import scala.util.control.NonFatal

/**
 * Created by bxu on 3/24/16.
 *
 * Authentication rest service
 */
//noinspection UnstableApiUsage
class AuthenticationApi()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  private val authProcessorFactory = new AuthServiceFactory()
  private val openIdAuthProcessor: AuthService =
    authProcessorFactory.createService(AuthProcessorBrand.OPEN_ID)
  private val samlAuthProcessor: AuthService =
    authProcessorFactory.createService(AuthProcessorBrand.SAML)
  private val suseAuthProcessor: AuthService =
    authProcessorFactory.createService(AuthProcessorBrand.SUSE)

  val route: Route =
    new OpenIdAuthApi(openIdAuthProcessor).route ~
    new SamlAuthApi(samlAuthProcessor).route ~
    new SuseAuthApi(suseAuthProcessor).route ~
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
              RestClient.httpRequest(s"$baseUri/eula", HttpMethods.GET)
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
    headerValueByName("Token") { tokenId =>
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
            parameter(Symbol("name").?) { name =>
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
            parameter(Symbol("name")) { name =>
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
            parameter(Symbol("name").?) { name =>
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
            parameter(Symbol("name")) { name =>
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
          parameter(Symbol("name").?) { name =>
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
          parameter(Symbol("userId")) { userId =>
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
                  HttpMethods.POST,
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
                  HttpMethods.GET,
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
                      HttpMethods.POST,
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
                      HttpMethods.POST,
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
                  HttpMethods.GET,
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
                    HttpMethods.POST,
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
                  HttpMethods.GET,
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
                    HttpMethods.PATCH,
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
                  HttpMethods.GET,
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
                      HttpMethods.POST,
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
                      HttpMethods.PATCH,
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
                      HttpMethods.DELETE,
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
                  HttpMethods.POST,
                  ldapAccountWarpToJson(ldapAccountWarp),
                  tokenId
                )
              }
            }
          }
        }
      }
    }

}
