package com.neu.model

/**
 * Saml server config
 */
case class SamlServer(
  sso_url: String,
  issuer: String,
  x509_cert: Option[String],
  x509_cert_extra: Option[Array[String]],
  group_claim: Option[String] = Some(""),
  enable: Option[Boolean],
  default_role: Option[String],
  group_mapped_roles: Option[Array[GroupMappedRole]],
  authn_signing_enabled: Option[Boolean],
  slo_enabled: Option[Boolean],
  slo_url: Option[String],
  signing_cert: Option[String],
  signing_key: Option[String]
)

case class SamlConfig(name: String, saml: SamlServer)

case class SamlConfigWrap(config: SamlConfig)

case class SsoServer(server_name: String, server_type: String, redirect_url: String)

case class SamlRedirectURL(redirect_endpoint: String, issuer: String)

case class SamlToken(
  token: String,
  state: Option[String] = None,
  redirect_endpoint: Option[String] = None
)

case class SamlResponse(
  client_ip: String,
  password: Option[Password] = None,
  Token: Option[SamlToken] = None
)
