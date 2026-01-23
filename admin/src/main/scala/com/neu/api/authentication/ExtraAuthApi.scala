package com.neu.api.authentication

import com.neu.api.BaseApi
import com.neu.model.*
import com.neu.model.AuthTokenJsonProtocol.given
import com.neu.service.Utils
import com.neu.service.authentication.ExtraAuthService
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class ExtraAuthApi(
  authService: ExtraAuthService
) extends BaseApi {

  val route: Route =
    path("gravatar") {
      get {
        Utils.respondWithWebServerHeaders() {
          authService.getGravatar
        }
      }
    } ~
    path("eula") {
      get {
        parameter(Symbol("isSSO").?) { isSSO =>
          Utils.respondWithWebServerHeaders() {
            authService.getEula(isSSO)
          }
        }
      }
    } ~
    path("rebrand") {
      get {
        Utils.respondWithWebServerHeaders() {
          authService.getRebrand
        }
      }
    } ~
    headerValueByName("Token") { tokenId =>
      pathPrefix("role2") {
        path("permission-options") {
          get {
            Utils.respondWithWebServerHeaders() {
              authService.getPermissionOptions(tokenId)
            }
          }
        } ~
        pathEnd {
          get {
            parameter(Symbol("name").?) { name =>
              Utils.respondWithWebServerHeaders() {
                authService.getRoles(tokenId, name)
              }
            }
          } ~
          post {
            entity(as[RoleWrap]) { roleWrap =>
              Utils.respondWithWebServerHeaders() {
                authService.addRole(tokenId, roleWrap)
              }
            }
          } ~
          patch {
            entity(as[RoleWrap]) { roleWrap =>
              Utils.respondWithWebServerHeaders() {
                authService.updateRole(tokenId, roleWrap)
              }
            }
          } ~
          delete {
            parameter(Symbol("name")) { name =>
              Utils.respondWithWebServerHeaders() {
                authService.deleteRole(tokenId, name)
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
                authService.getApiKey(tokenId, name)
              }
            }
          } ~
          post {
            entity(as[ApikeyWrap]) { apikeyWrap =>
              Utils.respondWithWebServerHeaders() {
                authService.addApiKey(tokenId, apikeyWrap)
              }
            } ~
            Utils.respondWithWebServerHeaders() {
              authService.createApiKey(tokenId)
            }
          } ~
          delete {
            parameter(Symbol("name")) { name =>
              Utils.respondWithWebServerHeaders() {
                authService.deleteApiKey(tokenId, name)
              }
            }
          }
        }
      } ~
      pathPrefix("user") {
        pathEnd {
          get {
            parameter(Symbol("name").?) { name =>
              Utils.respondWithWebServerHeaders() {
                authService.getUser(tokenId, name)
              }
            }
          } ~
          post {
            entity(as[User]) { user =>
              Utils.respondWithWebServerHeaders() {
                authService.addUser(tokenId, user)
              }
            }
          } ~
          patch {
            entity(as[UserProfile]) { user =>
              Utils.respondWithWebServerHeaders() {
                authService.updateUser(tokenId, user)
              }
            }
          } ~
          delete {
            parameter(Symbol("userId")) { userId =>
              Utils.respondWithWebServerHeaders() {
                authService.deleteUser(tokenId, userId)
              }
            }
          }
        }
      } ~
      (get & path("version")) {
        Utils.respondWithWebServerHeaders() {
          authService.getVersion
        }
      } ~
      (post & path("token")) {
        Utils.respondWithWebServerHeaders() {
          authService.validateUserToken(tokenId)
        }
      } ~
      path("eula") {
        post {
          entity(as[Eula]) { eula =>
            Utils.respondWithWebServerHeaders() {
              authService.setEula(tokenId, eula)
            }
          }
        }
      } ~
      pathPrefix("license") {
        pathEnd {
          get {
            Utils.respondWithWebServerHeaders() {
              authService.getLicense(tokenId)
            }
          } ~
          post {
            entity(as[LicenseRequestWrap]) { (licenseRequestWrap: LicenseRequestWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.requestLicense(tokenId, licenseRequestWrap)
              }
            }
          }
        } ~
        path("update") {
          post {
            entity(as[LicenseKey]) { (licenseKey: LicenseKey) =>
              Utils.respondWithWebServerHeaders() {
                authService.updateLicense(tokenId, licenseKey)
              }
            }
          }
        }
      } ~
      pathPrefix("password-profile") {
        path("public") {
          get {
            Utils.respondWithWebServerHeaders() {
              authService.getPasswordPublicProfile(tokenId)
            }
          }
        } ~
        path("user") {
          post {
            entity(as[UserBlockWrap]) { (userBlockWrap: UserBlockWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.updateUserBlock(tokenId, userBlockWrap)
              }
            }
          }
        } ~
        pathEnd {
          get {
            Utils.respondWithWebServerHeaders() {
              authService.getPasswordProfile(tokenId)
            }
          } ~
          patch {
            entity(as[PasswordProfileWrap]) { (passwordProfileWrap: PasswordProfileWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.updatePasswordProfile(tokenId, passwordProfileWrap)
              }
            }
          }
        }
      } ~
      pathPrefix("server") {
        pathEnd {
          get {
            Utils.respondWithWebServerHeaders() {
              authService.getLdapServer(tokenId)
            }
          } ~
          post {
            entity(as[LdapSettingWrap]) { (ldapSettingWrap: LdapSettingWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.addLdapServer(tokenId, ldapSettingWrap)
              }
            }
          } ~
          patch {
            entity(as[LdapSettingWrap]) { (ldapSettingWrap: LdapSettingWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.updateLdapServer(tokenId, ldapSettingWrap)
              }
            }
          } ~
          delete {
            entity(as[LdapSettingWrap]) { (ldapSettingWrap: LdapSettingWrap) =>
              Utils.respondWithWebServerHeaders() {
                authService.deleteLdapServer(tokenId, ldapSettingWrap)
              }
            }
          }
        }
      } ~
      (post & path("debug")) {
        entity(as[LdapServerAccountWrap]) { (ldapAccountWarp: LdapServerAccountWrap) =>
          Utils.respondWithWebServerHeaders() {
            authService.testLdapServerConfig(tokenId, ldapAccountWarp)
          }
        }
      }
    }

}
