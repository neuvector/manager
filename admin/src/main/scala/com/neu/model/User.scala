package com.neu.model

/**
 * Created by bxu on 3/24/16.
 */
case class User(
  fullname: String,
  server: String,
  username: String,
  password: String,
  email: Option[String],
  role: String,
  locale: String = "en",
  timeout: Option[Int],
  default_password: Boolean,
  modify_password: Boolean,
  password_resettable: Option[Boolean],
  blocked_for_failed_login: Option[Boolean],
  blocked_for_password_expired: Option[Boolean],
  role_domains: Option[Map[String, Array[String]]]
)

case class UserImage(
  fullname: String,
  server: String,
  username: String,
  password: String,
  email: Option[String],
  role: String,
  locale: String = "en",
  default_password: Boolean,
  modify_password: Boolean,
  password_resettable: Option[Boolean],
  emailHash: String = "",
  blocked_for_failed_login: Option[Boolean],
  blocked_for_password_expired: Option[Boolean],
  role_domains: Option[Map[String, Array[String]]]
)

case class UserWrap(
  user: User
)

case class SelfWrap(
  global_permissions: Option[Array[Permission]] = None,
  domain_permissions: Option[Map[String, Array[Permission]]] = None,
  password_days_until_expire: Option[Int],
  user: User
)

case class Users(
  domain_roles: Option[Array[String]],
  global_roles: Option[Array[String]],
  users: Array[User]
)

case class UsersOutput(
  domain_roles: Option[Array[String]],
  global_roles: Option[Array[String]],
  users: Array[UserImage]
)

case class Token(
  token: String,
  fullname: String,
  server: String,
  username: String,
  email: Option[String],
  role: String,
  locale: String,
  timeout: Option[Int],
  default_password: Boolean,
  modify_password: Boolean,
  role_domains: Option[Map[String, Array[String]]],
  global_permissions: Option[Array[Permission]] = None,
  domain_permissions: Option[Map[String, Array[Permission]]] = None
)

case class TokenNew(
  token: String,
  fullname: String,
  server: String,
  username: String,
  email: Option[String],
  role: String,
  locale: String,
  timeout: Option[Int],
  default_password: Boolean,
  modify_password: Boolean,
  global_permissions: Array[Permission],
  domain_permissions: Map[String, Array[Permission]],
  password_days_until_expire: Option[Int]
)

case class TokenWrap(
  password_days_until_expire: Option[Int],
  need_to_reset_password: Option[Boolean],
  token: Option[Token]
)

case class UserToken(
  token: Token,
  emailHash: String = "",
  roles: Option[Map[String, String]],
  login_timestamp: Option[String]
)

case class UserTokenNew(
  token: Option[TokenNew],
  emailHash: String = "",
  roles: Option[Map[String, String]],
  login_timestamp: Option[String],
  need_to_reset_password: Option[Boolean],
  is_suse_authenticated: Boolean = false
)

case class UserProfile(
  fullname: String,
  username: String,
  email: Option[String],
  role: Option[String],
  password: Option[String],
  new_password: Option[String],
  timeout: Option[Int],
  locale: String,
  default_password: Boolean,
  modify_password: Boolean,
  role_domains: Option[Map[String, Array[String]]]
)

/**
 * For core module restful web service only
 * @param config [[com.neu.model.UserProfile]]
 */
case class UserProfileWrap(config: UserProfile)

case class Eula(accepted: Boolean)

case class EulaWrap(eula: Eula)

case class Key(
  keyTable: Array[Array[Char]],
  keyMap: Map[Char, Array[Int]]
)
