package com.neu.service.authentication

import com.neu.api.{ BaseService, DefaultJsonFormats }
import com.typesafe.scalalogging.LazyLogging

import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.stream.Materializer
import org.apache.pekko.http.scaladsl.model.RemoteAddress
import org.apache.pekko.http.scaladsl.server.{ RequestContext, Route }

import spray.json._
import scala.concurrent.{ ExecutionContext, Future }

object AuthProcessorBrand extends Enumeration {
  type AuthProcessorBrand = Value
  val SUSE, OPEN_ID, SAML = Value
}

abstract class AuthProcessor extends BaseService with DefaultJsonFormats with LazyLogging {

  def getResources(
    code: Option[String],
    state: Option[String],
    ip: String,
    host: Option[String],
    serverName: Option[String]
  ): Either[Route, Unit]

  def validateToken(): Route

  def login(ip: RemoteAddress, host: String, ctx: RequestContext): Either[Route, Unit]

  def logout(host: Option[String], tokenId: String): Either[Route, Unit]
}

class AuthProcessorFactory()(
  implicit system: ActorSystem,
  ec: ExecutionContext
) {

  def createProcessor(brand: AuthProcessorBrand.Value)(implicit mat: Materializer): AuthProcessor =
    brand match {
      // case AuthProcessorBrand.SUSE    => new SuseAuthProcessor()
      case AuthProcessorBrand.OPEN_ID => new OpenIdAuthProcessor()
      case AuthProcessorBrand.SAML    => new SamlAuthProcessor()
    }
}
