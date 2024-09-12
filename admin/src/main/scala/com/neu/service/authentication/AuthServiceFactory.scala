package com.neu.service.authentication

import com.neu.api.{ BaseService, DefaultJsonFormats }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.model.RemoteAddress
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }
import org.apache.pekko.stream.Materializer

import scala.concurrent.ExecutionContext

object AuthProcessorBrand extends Enumeration {
  type AuthProcessorBrand = Value
  val SUSE, OPEN_ID, SAML = Value
}

trait AuthService extends BaseService with DefaultJsonFormats with LazyLogging {

  def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Route

  def validateToken(tokenId: Option[String]): Route

  def login(ip: RemoteAddress, host: String, ctx: RequestContext): Route

  def logout(host: Option[String], tokenId: String): Route

  def getSelf(
    isOnNV: Option[String],
    isRancherSSOUrl: Option[String],
    suseCookieValue: String,
    tokenId: String
  ): Route
}

class AuthServiceFactory()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) {

  def createService(
    brand: AuthProcessorBrand.Value
  )(implicit mat: Materializer): AuthService =
    brand match {
      case AuthProcessorBrand.SUSE    => new SuseAuthService()
      case AuthProcessorBrand.OPEN_ID => new OpenIdAuthService()
      case AuthProcessorBrand.SAML    => new SamlAuthService()
    }
}
