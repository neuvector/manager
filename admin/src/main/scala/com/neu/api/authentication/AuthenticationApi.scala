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

/**
 * Created by bxu on 3/24/16.
 *
 * Authentication rest service
 */
//noinspection UnstableApiUsage
class AuthenticationApi(
  authenticationService: AuthenticationService
) extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  val route: Route =
    new OpenIdAuthApi(authenticationService).route ~
    new SamlAuthApi(authenticationService).route ~
    new SuseAuthApi(authenticationService).route ~
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
