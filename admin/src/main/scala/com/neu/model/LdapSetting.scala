package com.neu.model

/**
 * Created by bxu on 7/5/17.
 */
case class GroupMappedRole(
  group: String,
  global_role: String,
  role_domains: Option[Map[String, Array[String]]]
)

case class LdapServer(
  hostname: Option[String],
  port: Option[Int],
  ssl: Option[Boolean],
  base_dn: Option[String],
  group_dn: Option[String],
  bind_dn: Option[String],
  bind_password: Option[String],
  enable: Option[Boolean],
  default_role: Option[String],
  directory: Option[String],
  group_mapped_roles: Option[Array[GroupMappedRole]],
  group_member_attr: Option[String],
  username_attr: Option[String]
)

case class LdapSetting(
  name: String = "ldap1",
  ldap: Option[LdapServer] = None,
  saml: Option[SamlServer] = None,
  oidc: Option[OpenIdServer] = None
)

case class LdapSettingWrap(config: LdapSetting)

case class LdapTestAccount(username: String, password: String)

/**
 * @param name
 *   Ldap server name
 * @param ldap
 *   LdapTestAccount
 */
case class LdapServerTestAccount(
  name: Option[String],
  ldap: Option[LdapServer],
  test_ldap: Option[LdapTestAccount]
)

case class LdapServerAccountWrap(test: LdapServerTestAccount)
