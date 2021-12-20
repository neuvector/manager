package com.neu.model

/**
 * OpenId server
 * @param issuer the issuer
 * @param client_id the client id
 * @param client_secret the client secret
 * @param enable enable this server or not
 * @param default_role the default role for users authenticated via this server
 * @param role_groups the optional role -> groups mapping
 */
case class OpenIdServer(
  issuer: String,
  client_id: String,
  client_secret: Option[String],
  group_claim: Option[String] = Some(""),
  scopes: Option[Array[String]] = None,
  enable: Option[Boolean],
  default_role: Option[String],
  group_mapped_roles: Option[Array[GroupMappedRole]]
)

/**
 * OpenId server
 * @param issuer the issuer
 * @param authorization_endpoint the authorization url
 * @param token_endpoint the token url
 * @param user_info_endpoint the user info url
 * @param client_id the client id
 * @param client_secret the client secret
 * @param enable enable this server or not
 * @param default_role the default role for users authenticated via this server
 * @param role_groups the optional role -> groups mapping
 */
case class ServerOIDC(
  issuer: String,
  authorization_endpoint: String,
  token_endpoint: String,
  user_info_endpoint: String,
  client_id: String,
  client_secret: Option[String],
  group_claim: Option[String] = Some(""),
  scopes: Option[Array[String]] = None,
  enable: Option[Boolean],
  default_role: Option[String],
  role_groups: Option[Map[String, Array[String]]]
)

/**
 * OpenId server config
 * @param name the name of the server
 * @param oidc the [[com.neu.model.OpenIdServer]]
 */
case class OpenIdServerConfig(name: String, oidc: OpenIdServer)

/**
 * Redirect endpoint
 * @param redirect_endpoint the redirect url
 */
case class RedirectURL(redirect_endpoint: String)
