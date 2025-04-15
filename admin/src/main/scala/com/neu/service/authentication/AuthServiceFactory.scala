package com.neu.service.authentication

import com.neu.service.BaseService
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model.RemoteAddress
import org.apache.pekko.http.scaladsl.server.RequestContext
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.stream.Materializer

import scala.concurrent.ExecutionContext

enum AuthProvider:
  case SUSE, OPEN_ID, SAML

trait AuthService extends BaseService with DefaultJsonFormats with LazyLogging {

  def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Route

  def validateToken(tokenId: Option[String], ip: Option[RemoteAddress]): Route

  def login(ip: RemoteAddress, host: String, ctx: RequestContext): Route

  def logout(host: Option[String], tokenId: String): Route

  def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String,
    ip: RemoteAddress,
    ctx: RequestContext
  ): Route
}

class AuthServiceFactory()(implicit
  system: ActorSystem,
  ec: ExecutionContext
) {

  def createService(
    brand: AuthProvider
  )(implicit mat: Materializer): AuthService =
    brand match {
      case AuthProvider.SUSE    => new SuseAuthService()
      case AuthProvider.OPEN_ID => new OpenIdAuthService()
      case AuthProvider.SAML    => new SamlAuthService()
    }

  def createExtraAuthService()(implicit mat: Materializer): ExtraAuthService = new ExtraAuthService
}
