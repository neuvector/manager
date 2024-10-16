package com.neu.model

import com.neu.core.Md5
import spray.json.*

/**
 * Json protocol for authentication token
 */
object AuthTokenJsonProtocol extends DefaultJsonProtocol {
  given permissionFormat: RootJsonFormat[Permission] = jsonFormat3(Permission.apply)
  given keyFormat: RootJsonFormat[Key]               = jsonFormat2(Key.apply)
  given tokenFormat: RootJsonFormat[Token]           = jsonFormat15(Token.apply)
  given tokenNewFormat: RootJsonFormat[TokenNew]     = jsonFormat15(TokenNew.apply)
  given tokenWrapFormat: RootJsonFormat[TokenWrap]   = jsonFormat3(TokenWrap.apply)

  given passFormat: RootJsonFormat[Password]           = jsonFormat4(Password.apply)
  given authRequestFormat: RootJsonFormat[AuthRequest] = jsonFormat2(AuthRequest.apply)

  given roleFormat: RootJsonFormat[Role]         = jsonFormat3(Role.apply)
  given roleWrapFormat: RootJsonFormat[RoleWrap] = jsonFormat1(RoleWrap.apply)

  given apikeyFormat: RootJsonFormat[Apikey]         = jsonFormat6(Apikey.apply)
  given apikeyWrapFormat: RootJsonFormat[ApikeyWrap] = jsonFormat1(ApikeyWrap.apply)

  given extraPermissionFormat: RootJsonFormat[ExtraPermission] = jsonFormat2(ExtraPermission.apply)
  given userFormat: RootJsonFormat[User]                       = jsonFormat16(User.apply)
  given usersFormat: RootJsonFormat[Users]                     = jsonFormat3(Users.apply)
  given userImageFormat: RootJsonFormat[UserImage]             = jsonFormat16(UserImage.apply)
  given usersOutputFormat: RootJsonFormat[UsersOutput]         = jsonFormat3(UsersOutput.apply)
  given selfWrapFormat: RootJsonFormat[SelfWrap]               = jsonFormat5(SelfWrap.apply)
  given userWrapFormat: RootJsonFormat[UserWrap]               = jsonFormat1(UserWrap.apply)
  given userTokenFormat: RootJsonFormat[UserToken]             = jsonFormat4(UserToken.apply)
  given userTokenNewFormat: RootJsonFormat[UserTokenNew]       = jsonFormat6(UserTokenNew.apply)

  given userProfileFormat: RootJsonFormat[UserProfile]         = jsonFormat11(UserProfile.apply)
  given userProfileWrapFormat: RootJsonFormat[UserProfileWrap] = jsonFormat1(UserProfileWrap.apply)

  given eulaFormat: RootJsonFormat[Eula]         = jsonFormat1(Eula.apply)
  given eulaWrapFormat: RootJsonFormat[EulaWrap] = jsonFormat1(EulaWrap.apply)

  given licenseRequestFormat: RootJsonFormat[LicenseRequest]         = jsonFormat9(LicenseRequest.apply)
  given licenseRequestWrapFormat: RootJsonFormat[LicenseRequestWrap] = jsonFormat1(
    LicenseRequestWrap.apply
  )
  given licenseKeyFormat: RootJsonFormat[LicenseKey]                 = jsonFormat1(LicenseKey.apply)

  given groupMappedRoleFormat: RootJsonFormat[GroupMappedRole] = jsonFormat3(GroupMappedRole.apply)
  given ldapServerFormat: RootJsonFormat[LdapServer]           = jsonFormat13(LdapServer.apply)
  given samlServerFormat: RootJsonFormat[SamlServer]           = jsonFormat13(SamlServer.apply)
  given ssoServerFormat: RootJsonFormat[SsoServer]             = jsonFormat3(SsoServer.apply)
  given samlTokenFormat: RootJsonFormat[SamlToken]             = jsonFormat3(SamlToken.apply)
  given samlResponseFormat: RootJsonFormat[SamlResponse]       = jsonFormat3(SamlResponse.apply)

  given serverOIDCFormat: RootJsonFormat[ServerOIDC]                 = jsonFormat11(ServerOIDC.apply)
  given openIdServerFormat: RootJsonFormat[OpenIdServer]             = jsonFormat8(
    OpenIdServer.apply
  )
  given openIdServerConfigFormat: RootJsonFormat[OpenIdServerConfig] = jsonFormat2(
    OpenIdServerConfig.apply
  )
  given redirectURLFormat: RootJsonFormat[RedirectURL]               = jsonFormat1(RedirectURL.apply)
  given samlRedirectURLFormat: RootJsonFormat[SamlRedirectURL]       = jsonFormat2(SamlRedirectURL.apply)

  given ldapSettingFormat: RootJsonFormat[LdapSetting]                     = jsonFormat4(LdapSetting.apply)
  given ldapSettingWrapFormat: RootJsonFormat[LdapSettingWrap]             = jsonFormat1(LdapSettingWrap.apply)
  given ldapTestAccountFormat: RootJsonFormat[LdapTestAccount]             = jsonFormat2(LdapTestAccount.apply)
  given ldapServerAccountFormat: RootJsonFormat[LdapServerTestAccount]     = jsonFormat3(
    LdapServerTestAccount.apply
  )
  given ldapServerAccountWrapFormat: RootJsonFormat[LdapServerAccountWrap] = jsonFormat1(
    LdapServerAccountWrap.apply
  )
  given passwordProfileFormat: RootJsonFormat[PasswordProfile]             = jsonFormat14(
    PasswordProfile.apply
  )
  given passwordProfileWrapFormat: RootJsonFormat[PasswordProfileWrap]     = jsonFormat1(
    PasswordProfileWrap.apply
  )

  given userBlockFormat: RootJsonFormat[UserBlock]         = jsonFormat5(UserBlock.apply)
  given userBlockWrapFormat: RootJsonFormat[UserBlockWrap] = jsonFormat1(UserBlockWrap.apply)

  def authRequestToJson(authRequest: AuthRequest): String = authRequest.toJson.compactPrint

  def jsonToUserWrap(response: String): UserWrap = response.parseJson.convertTo[UserWrap]

  def jsonToSelfWrap(response: String): SelfWrap = response.parseJson.convertTo[SelfWrap]

  def jsonToUsers(response: String): Users = response.parseJson.convertTo[Users]

  def jsonToToken(response: String): TokenWrap = response.parseJson.convertTo[TokenWrap]

  def tokenWrapToJson(tokenWrap: TokenWrap): String = tokenWrap.toJson.compactPrint

  def userWrapToJson(userWrap: UserWrap): String = userWrap.toJson.compactPrint

  def userProfileToJson(userProfile: UserProfile): String = userProfile.toJson.compactPrint

  def userProfileWrapToJson(userProfileWrap: UserProfileWrap): String =
    userProfileWrap.toJson.compactPrint

  def passwordProfileWrapToJson(passwordProfileWrap: PasswordProfileWrap): String =
    passwordProfileWrap.toJson.compactPrint

  def userBlockWrapToJson(userBlockWrap: UserBlockWrap): String = userBlockWrap.toJson.compactPrint

  def userToUserImage: User => UserImage = (user: User) =>
    UserImage(
      user.fullname,
      user.server,
      user.username,
      user.password,
      user.email,
      user.role,
      user.locale,
      user.default_password,
      user.modify_password,
      user.password_resettable,
      Md5.hash(user.email),
      user.blocked_for_failed_login,
      user.blocked_for_password_expired,
      user.role_domains,
      user.extra_permissions,
      user.extra_permissions_domains
    )

  def eulaWrapToJson(eulaWrap: EulaWrap): String = eulaWrap.toJson.compactPrint

  def licenseRequestToJson(licenseRequestWrap: LicenseRequestWrap): String =
    licenseRequestWrap.toJson.compactPrint
  def licenseKeyToJson(licenseKey: LicenseKey): String                     = licenseKey.toJson.compactPrint

  def samlResponseToJson(samlResponse: SamlResponse): String                      = samlResponse.toJson.compactPrint
  def ldapSettingWrapToJson(ldapSettingWrap: LdapSettingWrap): String             =
    ldapSettingWrap.toJson.compactPrint
  def ldapAccountWarpToJson(ldapServerAccountWrap: LdapServerAccountWrap): String =
    ldapServerAccountWrap.toJson.compactPrint

  def redirectUrlToJson(redirectURL: RedirectURL): String = redirectURL.toJson.compactPrint

  def samlRedirectUrlToJson(samlRedirectURL: SamlRedirectURL): String =
    samlRedirectURL.toJson.compactPrint

  def roleWrapToJson(roleWrap: RoleWrap): String = roleWrap.toJson.compactPrint

  def apikeyWrapToJson(apikeyWrap: ApikeyWrap): String = apikeyWrap.toJson.compactPrint
}
