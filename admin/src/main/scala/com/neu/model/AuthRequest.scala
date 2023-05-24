package com.neu.model

/**
 * Created by bxu on 3/24/16.
 */
case class Password(username: String, password: String)

case class AuthRequest(password: Password, client_ip: String)

case class Apikey(
  expiration_type: String,
  expiration_hours: Int,
  apikey_name: String,
  description: String,
  role: String,
  role_domains: Option[Map[String, Array[String]]]
)

case class ApikeyWrap(
  apikey: Option[Apikey]
)

case class Permission(
  id: String,
  read: Boolean,
  write: Boolean
)

case class Role(
  name: String,
  comment: Option[String],
  permissions: Array[Permission]
)

case class RoleWrap(
  config: Role
)

case class PasswordProfile(
  name: String,
  min_len: Option[Int],
  min_uppercase_count: Option[Int],
  min_lowercase_count: Option[Int],
  min_digit_count: Option[Int],
  min_special_count: Option[Int],
  block_after_failed_login_count: Option[Int],
  password_expire_after_days: Option[Int],
  password_keep_history_count: Option[Int],
  block_minutes: Option[Int],
  enable_block_after_failed_login: Option[Boolean],
  enable_password_expiration: Option[Boolean],
  enable_password_history: Option[Boolean],
  session_timeout: Option[Int]
)

case class PasswordProfileWrap(
  config: PasswordProfile
)

case class UserBlock(
  fullname: String,
  clear_failed_login: Option[Boolean],
  new_password: Option[String]
)

case class UserBlockWrap(
  config: UserBlock
)
