package com.neu.model

import com.neu.core.Md5
import spray.json.{ DefaultJsonProtocol, _ }

/**
 * Json protocol for authentication token
 *
 */
object AuthTokenJsonProtocol extends DefaultJsonProtocol {
  implicit val permissionFormat: RootJsonFormat[Permission] = jsonFormat3(Permission)
  implicit val keyFormat: RootJsonFormat[Key]               = jsonFormat2(Key)
  implicit val tokenFormat: RootJsonFormat[Token]           = jsonFormat13(Token)
  implicit val tokenNewFormat: RootJsonFormat[TokenNew]     = jsonFormat13(TokenNew)
  implicit val tokenWrapFormat: RootJsonFormat[TokenWrap]   = jsonFormat2(TokenWrap)

  implicit val passFormat: RootJsonFormat[Password]           = jsonFormat2(Password)
  implicit val authRequestFormat: RootJsonFormat[AuthRequest] = jsonFormat2(AuthRequest)

  implicit val roleFormat: RootJsonFormat[Role]         = jsonFormat3(Role)
  implicit val roleWrapFormat: RootJsonFormat[RoleWrap] = jsonFormat1(RoleWrap)

  implicit val apikeyFormat: RootJsonFormat[Apikey]         = jsonFormat7(Apikey)
  implicit val apikeyWrapFormat: RootJsonFormat[ApikeyWrap] = jsonFormat1(ApikeyWrap)

  implicit val userFormat: RootJsonFormat[User]                 = jsonFormat13(User)
  implicit val usersFormat: RootJsonFormat[Users]               = jsonFormat3(Users)
  implicit val userImageFormat: RootJsonFormat[UserImage]       = jsonFormat13(UserImage)
  implicit val usersOutputFormat: RootJsonFormat[UsersOutput]   = jsonFormat3(UsersOutput)
  implicit val selfWrapFormat: RootJsonFormat[SelfWrap]         = jsonFormat4(SelfWrap)
  implicit val userWrapFormat: RootJsonFormat[UserWrap]         = jsonFormat1(UserWrap)
  implicit val userTokenFormat: RootJsonFormat[UserToken]       = jsonFormat4(UserToken)
  implicit val userTokenNewFormat: RootJsonFormat[UserTokenNew] = jsonFormat5(UserTokenNew)

  implicit val userProfileFormat: RootJsonFormat[UserProfile]         = jsonFormat11(UserProfile)
  implicit val userProfileWrapFormat: RootJsonFormat[UserProfileWrap] = jsonFormat1(UserProfileWrap)

  implicit val eulaFormat: RootJsonFormat[Eula]         = jsonFormat1(Eula)
  implicit val eulaWrapFormat: RootJsonFormat[EulaWrap] = jsonFormat1(EulaWrap)

  implicit val licenseRequestFormat: RootJsonFormat[LicenseRequest] = jsonFormat9(LicenseRequest)
  implicit val licenseRequestWrapFormat: RootJsonFormat[LicenseRequestWrap] = jsonFormat1(
    LicenseRequestWrap
  )
  implicit val licenseKeyFormat: RootJsonFormat[LicenseKey] = jsonFormat1(LicenseKey)

  implicit val groupMappedRoleFormat: RootJsonFormat[GroupMappedRole] = jsonFormat3(GroupMappedRole)
  implicit val ldapServerFormat: RootJsonFormat[LdapServer]           = jsonFormat12(LdapServer)
  implicit val samlServerFormat: RootJsonFormat[SamlServer]           = jsonFormat8(SamlServer)
  implicit val ssoServerFormat: RootJsonFormat[SsoServer]             = jsonFormat3(SsoServer)
  implicit val samlTokenFormat: RootJsonFormat[SamlToken]             = jsonFormat3(SamlToken)
  implicit val samlResponseFormat: RootJsonFormat[SamlResponse]       = jsonFormat3(SamlResponse)

  implicit val serverOIDCFormat: RootJsonFormat[ServerOIDC] = jsonFormat11(ServerOIDC)
  implicit val openIdServerFormat: RootJsonFormat[OpenIdServer] = jsonFormat8(
    OpenIdServer
  )
  implicit val openIdServerConfigFormat: RootJsonFormat[OpenIdServerConfig] = jsonFormat2(
    OpenIdServerConfig
  )
  implicit val redirectURLFormat: RootJsonFormat[RedirectURL] = jsonFormat1(RedirectURL)

  implicit val ldapSettingFormat: RootJsonFormat[LdapSetting]         = jsonFormat4(LdapSetting)
  implicit val ldapSettingWrapFormat: RootJsonFormat[LdapSettingWrap] = jsonFormat1(LdapSettingWrap)
  implicit val ldapTestAccountFormat: RootJsonFormat[LdapTestAccount] = jsonFormat2(LdapTestAccount)
  implicit val ldapServerAccountFormat: RootJsonFormat[LdapServerTestAccount] = jsonFormat3(
    LdapServerTestAccount
  )
  implicit val ldapServerAccountWrapFormat: RootJsonFormat[LdapServerAccountWrap] = jsonFormat1(
    LdapServerAccountWrap
  )
  implicit val passwordProfileFormat: RootJsonFormat[PasswordProfile] = jsonFormat14(
    PasswordProfile
  )
  implicit val passwordProfileWrapFormat: RootJsonFormat[PasswordProfileWrap] = jsonFormat1(
    PasswordProfileWrap
  )

  implicit val userBlockFormat: RootJsonFormat[UserBlock]         = jsonFormat3(UserBlock)
  implicit val userBlockWrapFormat: RootJsonFormat[UserBlockWrap] = jsonFormat1(UserBlockWrap)

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

  def userToUserImage: User => UserImage = (user: User) => {
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
      Md5.hash(user.email),
      user.blocked_for_failed_login,
      user.blocked_for_password_expired,
      user.role_domains
    )
  }

  def eulaWrapToJson(eulaWrap: EulaWrap): String = eulaWrap.toJson.compactPrint

  def licenseRequestToJson(licenseRequestWrap: LicenseRequestWrap): String =
    licenseRequestWrap.toJson.compactPrint
  def licenseKeyToJson(licenseKey: LicenseKey): String = licenseKey.toJson.compactPrint

  def samlResponseToJson(samlResponse: SamlResponse): String = samlResponse.toJson.compactPrint
  def ldapSettingWrapToJson(ldapSettingWrap: LdapSettingWrap): String =
    ldapSettingWrap.toJson.compactPrint
  def ldapAccountWarpToJson(ldapServerAccountWrap: LdapServerAccountWrap): String =
    ldapServerAccountWrap.toJson.compactPrint

  def redirectUrlToJson(redirectURL: RedirectURL): String = redirectURL.toJson.compactPrint

  def roleWrapToJson(roleWrap: RoleWrap): String = roleWrap.toJson.compactPrint

  def apikeyWrapToJson(apikeyWrap: ApikeyWrap): String = apikeyWrap.toJson.compactPrint
}
