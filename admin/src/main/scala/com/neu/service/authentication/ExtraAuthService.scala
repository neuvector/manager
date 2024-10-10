package com.neu.service.authentication

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.core.CommonSettings.*
import com.neu.core.Md5
import com.neu.model.AuthTokenJsonProtocol.{ *, given }
import com.neu.model.RebrandJsonProtocol.{ *, given }
import com.neu.model.*
import com.neu.service.BaseService
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.Await
import scala.concurrent.duration.DurationInt
import scala.util.control.NonFatal

class ExtraAuthService() extends BaseService with DefaultJsonFormats with LazyLogging {

  def getGravatar: Route = complete(gravatarEnabled)

  def getEula: Route = complete {
    logger.info("Getting EULA")
    if ("true".equalsIgnoreCase(eulaOEMAppSafe)) {
      eulaWrapToJson(EulaWrap(Eula(true)))
    } else {
      RestClient.httpRequest(s"$baseUri/eula", HttpMethods.GET)
    }
  }

  def getRebrand: Route = complete(
    Rebrand(
      customLoginLogo,
      customPolicy,
      customPageHeaderContent,
      customPageHeaderColor,
      customPageFooterContent,
      customPageFooterColor
    )
  )

  def getPermissionOptions(tokenId: String): Route = complete {
    logger.info("Getting permission options ...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user_role_permission/options",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def getRoles(tokenId: String, name: Option[String]): Route = complete {
    var url = ""
    if (name.isEmpty) {
      url = "user_role"
    } else {
      url = s"user_role/${UrlEscapers.urlFragmentEscaper().escape(name.get)}"
    }
    logger.info("Getting roles ...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$url",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def addRole(tokenId: String, roleWrap: RoleWrap): Route = complete {
    val payload = roleWrapToJson(roleWrap)
    logger.info("Add role: {}", payload)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user_role",
      HttpMethods.POST,
      payload,
      tokenId
    )
  }

  def updateRole(tokenId: String, roleWrap: RoleWrap): Route = complete {
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

  def deleteRole(tokenId: String, name: String): Route = complete {
    logger.info("Deleting role: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user_role/${UrlEscapers.urlFragmentEscaper().escape(name)}",
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def getApiKey(tokenId: String, name: Option[String]): Route = complete {
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

  def addApiKey(tokenId: String, apikeyWrap: ApikeyWrap): Route = complete {
    val payload = apikeyWrapToJson(apikeyWrap)
    logger.info("Add apikey: {}", payload)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/api_key",
      HttpMethods.POST,
      payload,
      tokenId
    )
  }

  def createApiKey(tokenId: String): Route = complete {
    logger.info("Create apikey")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/api_key",
      HttpMethods.POST,
      "",
      tokenId
    )
  }

  def deleteApiKey(tokenId: String, name: String): Route = complete {
    logger.info("Deleting apikey: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/api_key/${UrlEscapers.urlFragmentEscaper().escape(name)}",
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def getUser(tokenId: String, name: Option[String]): Route = complete {
    if (name.nonEmpty) {
      try {
        logger.info("Getting user")
        val result    =
          RestClient.requestWithHeaderDecode(
            s"$baseUri/user/${name.get}",
            HttpMethods.GET,
            "",
            tokenId
          )
        val userWrap  =
          jsonToUserWrap(Await.result(result, RestClient.waitingLimit.seconds))
        val user      = userWrap.user
        logger.info("user: {}", user)
        val token1    = TokenWrap(
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
        val result    =
          RestClient.requestWithHeaderDecode(
            s"${baseClusterUri(tokenId)}/user",
            HttpMethods.GET,
            "",
            tokenId
          )
        val users     = jsonToUsers(Await.result(result, RestClient.waitingLimit.seconds))
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

  def addUser(tokenId: String, user: User): Route = complete {
    logger.info("Add user: {}", user.username)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user",
      HttpMethods.POST,
      userWrapToJson(UserWrap(user)),
      tokenId
    )
  }

  def updateUser(tokenId: String, user: UserProfile): Route = {
    logger.info("Updating user: {}", user.fullname)
    val result   =
      RestClient.httpRequestWithHeaderDecode(
        s"$baseUri/user/${UrlEscapers.urlFragmentEscaper().escape(user.fullname)}",
        HttpMethods.PATCH,
        userProfileWrapToJson(UserProfileWrap(user)),
        tokenId
      )
    val response = Await.result(result, RestClient.waitingLimit.seconds)
    logger.info("Server response {}", response.status)
    response.status match {
      case StatusCodes.OK             =>
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

        complete(profile)
      case StatusCodes.RequestTimeout =>
        logger.warn("Session timed out!")
        complete((StatusCodes.RequestTimeout, "Timed out"))
      case _                          =>
        logger.warn("Error updating profile!")
        complete(response)
    }
  }

  def deleteUser(tokenId: String, userId: String): Route = complete {
    logger.info("Deleting user: {}", userId)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user/${UrlEscapers.urlFragmentEscaper().escape(userId)}",
      HttpMethods.DELETE,
      "",
      tokenId
    )
  }

  def getVersion: Route = complete(managerVersion)

  def validateUserToken(tokenId: String): Route = complete {
    val user = AuthenticationManager.validate(tokenId)
    (StatusCodes.OK, user)
  }

  def setEula(tokenId: String, eula: Eula): Route = complete {
    logger.info("Setting EULA: {}", eula.accepted)
    RestClient.httpRequestWithHeader(
      s"$baseUri/eula",
      HttpMethods.POST,
      eulaWrapToJson(EulaWrap(eula)),
      tokenId
    )
  }

  def getLicense(tokenId: String): Route = complete {
    logger.info("Getting license")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/license",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def requestLicense(tokenId: String, licenseRequestWrap: LicenseRequestWrap): Route = complete {
    logger.info("Getting license code")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/license/request",
      HttpMethods.POST,
      licenseRequestToJson(licenseRequestWrap),
      tokenId
    )
  }

  def updateLicense(tokenId: String, licenseKey: LicenseKey): Route = complete {
    logger.info("Loading license")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/license/update",
      HttpMethods.POST,
      licenseKeyToJson(licenseKey),
      tokenId
    )
  }

  def getPasswordPublicProfile(tokenId: String): Route = complete {
    logger.info("Getting password public profile")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/password_profile/nvsyspwdprofile",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def updateUserBlock(tokenId: String, userBlockWrap: UserBlockWrap): Route = complete {
    logger.info("Updating user block")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/user/${userBlockWrap.config.fullname}/password",
      HttpMethods.POST,
      userBlockWrapToJson(userBlockWrap),
      tokenId
    )
  }

  def getPasswordProfile(tokenId: String): Route = complete {
    logger.info("Getting password profile")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/password_profile",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def updatePasswordProfile(tokenId: String, passwordProfileWrap: PasswordProfileWrap): Route =
    complete {
      logger.info("Updating password profile")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/password_profile/${passwordProfileWrap.config.name}",
        HttpMethods.PATCH,
        passwordProfileWrapToJson(passwordProfileWrap),
        tokenId
      )
    }

  def getLdapServer(tokenId: String): Route = complete {
    logger.info("Getting ldap/saml server")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/server",
      HttpMethods.GET,
      "",
      tokenId
    )
  }

  def addLdapServer(tokenId: String, ldapSettingWrap: LdapSettingWrap): Route = complete {
    logger.info("Adding ldap/saml server")
    logger.debug(ldapSettingWrapToJson(ldapSettingWrap))
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/server",
      HttpMethods.POST,
      ldapSettingWrapToJson(ldapSettingWrap),
      tokenId
    )
  }

  def updateLdapServer(tokenId: String, ldapSettingWrap: LdapSettingWrap): Route = complete {
    logger.info("Updating Ldap/saml server")
    logger.debug(ldapSettingWrapToJson(ldapSettingWrap))
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/server/${ldapSettingWrap.config.name}",
      HttpMethods.PATCH,
      ldapSettingWrapToJson(ldapSettingWrap),
      tokenId
    )
  }

  def deleteLdapServer(tokenId: String, ldapSettingWrap: LdapSettingWrap): Route = complete {
    logger.info("Deleting Ldap/saml server")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/server/${ldapSettingWrap.config.name}",
      HttpMethods.DELETE,
      ldapSettingWrapToJson(ldapSettingWrap),
      tokenId
    )
  }

  def testLdapServerConfig(tokenId: String, ldapAccountWarp: LdapServerAccountWrap): Route =
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
