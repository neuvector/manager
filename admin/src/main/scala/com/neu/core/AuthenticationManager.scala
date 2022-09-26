package com.neu.core

import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Calendar

import com.neu.model.AuthTokenJsonProtocol._
import com.neu.model.{ Key, Token, TokenNew, UserTokenNew }
import com.typesafe.scalalogging.LazyLogging

import scala.Array._
import scala.collection.mutable
import scala.io.Source
import scala.util.control.Breaks._

/**
 * Created by bxu on 3/25/16.
 */
object AuthenticationManager extends LazyLogging {
  var token: Option[Token] = None
  val tokenMap: mutable.Map[String, UserTokenNew] =
    scala.collection.mutable.Map[String, UserTokenNew]()

  val tokenClusterMap: mutable.Map[String, String] = scala.collection.mutable.Map[String, String]()

  val tokenBaseUrlMap: mutable.Map[String, String] = scala.collection.mutable.Map[String, String]()

  val suseTokenMap: mutable.Map[String, String]   = scala.collection.mutable.Map[String, String]()
  def getCluster(tokenId: String): Option[String] = tokenClusterMap.get(tokenId)
  def switchCluster(tokenId: String, clusterId: Option[String]): Unit =
    clusterId.fold(
      tokenClusterMap -= tokenId
    )(
      id => tokenClusterMap += tokenId -> id
    )

  def validate(tokenId: String): Option[UserTokenNew] =
    tokenMap.get(tokenId)

  def invalidate(tokenId: String): Unit = {
    tokenMap -= tokenId
    tokenClusterMap -= tokenId
    suseTokenMap -= tokenId
  }

  def setBaseUrl(tokenId: String, baseUrl: String): Unit =
    tokenBaseUrlMap += (tokenId -> baseUrl)

  def getBaseUrl(tokenId: String): Option[String] =
    tokenBaseUrlMap.get(tokenId)

  def removeBaseUrl(tokenId: String): Unit =
    tokenBaseUrlMap -= tokenId

  def parseToken: (String) => UserTokenNew = (authToken: String) => {
    val timestamp: Long                             = System.currentTimeMillis
    val datetime: String                            = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ").format(timestamp)
    var converted_role_domains: Map[String, String] = null
    var userToken: UserTokenNew                     = null
    val authRes                                     = jsonToToken(authToken)
    token = Some(authRes.token)

    val tokenNew = TokenNew(
      token.get.token,
      token.get.fullname,
      token.get.server,
      token.get.username,
      token.get.email,
      token.get.role,
      token.get.locale,
      token.get.timeout,
      token.get.default_password,
      token.get.modify_password,
      token.get.global_permissions.getOrElse(Array()),
      token.get.domain_permissions.getOrElse(Map()),
      Option(authRes.password_days_until_expire.getOrElse(-1))
    )

    token.get.role_domains match {
      case Some(role_domains) =>
        converted_role_domains = getRolesDigit(token.get.role, Option(role_domains), timestamp)
      case None =>
        converted_role_domains = getRolesDigit(token.get.role, None, timestamp)
    }
    userToken = UserTokenNew(
      tokenNew,
      Md5.hash(token.get.email),
      Option(converted_role_domains),
      Option(datetime)
    )
    if (token.nonEmpty) tokenMap += token.get.token -> userToken
    userToken
  }

  def putToken(id: String, userToken: UserTokenNew): Unit =
    tokenMap += id -> userToken

  def getRolesDigit(
    global_role: String,
    role_domains: Option[Map[String, Array[String]]],
    timestamp: Long
  ): Map[String, String] = {
    var global_role_digit                   = "0"
    var roles_domains: Map[String, String]  = null
    var admin_domains: Map[String, String]  = null
    var reader_domains: Map[String, String] = null
    global_role match {
      case "fedAdmin"  => global_role_digit = "4"
      case "fedReader" => global_role_digit = "3"
      case "admin"     => global_role_digit = "2"
      case "reader"    => global_role_digit = "1"
      case default     => global_role_digit = "0"
    }
    val global = Map(
      "global" -> global_role_digit
    )
    roles_domains = global
    role_domains match {
      case Some(role_domains) =>
        role_domains.get("fedAdmin") match {
          case Some(admin) =>
            admin_domains = admin
              .map(namespace => {
                namespace -> "4"
              })
              .toMap
            roles_domains ++= admin_domains
          case None => None
        }
        role_domains.get("fedReader") match {
          case Some(reader) =>
            reader_domains = reader
              .map(namespace => {
                namespace -> "3"
              })
              .toMap
            roles_domains ++= reader_domains
          case None => None
        }
        role_domains.get("admin") match {
          case Some(admin) =>
            admin_domains = admin
              .map(namespace => {
                namespace -> "2"
              })
              .toMap
            roles_domains ++= admin_domains
          case None => None
        }
        role_domains.get("reader") match {
          case Some(reader) =>
            reader_domains = reader
              .map(namespace => {
                namespace -> "1"
              })
              .toMap
            roles_domains ++= reader_domains
          case None => None
        }
      case None =>
        roles_domains = global
    }
    roles_domains
  }
}

object Md5 {
  val MD5 = "MD5"
  def hash(s: Option[String]): String =
    s match {
      case Some(str) =>
        val md5 = MessageDigest.getInstance(MD5).digest(str.getBytes)
        asString(md5)
      case None =>
        val md5 = MessageDigest.getInstance(MD5).digest("".getBytes)
        asString(md5)
    }

  def hash(str: String): String = {
    val md5 = MessageDigest.getInstance(MD5).digest(str.getBytes)
    asString(md5)
  }

  val hexDigits: Array[Char] = "0123456789abcdef".toCharArray

  private def asString(bytes: Array[Byte]): String =
    bytes.foldLeft("") { case (agg, b) => agg + hexDigits((b >> 4) & 0xf) + hexDigits(b & 0xf) }

}
