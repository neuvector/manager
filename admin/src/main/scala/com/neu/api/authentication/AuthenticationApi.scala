package com.neu.api.authentication

import com.neu.service.authentication.*
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext

/**
 * Created by bxu on 3/24/16.
 *
 * Authentication rest service
 */
//noinspection UnstableApiUsage
class AuthenticationApi(
  openIdAuthService: AuthService,
  samlAuthService: AuthService,
  suseAuthService: AuthService,
  extraAuthService: ExtraAuthService
)(implicit
  system: ActorSystem,
  ec: ExecutionContext
) extends Directives {

  val route: Route =
    new OpenIdAuthApi(openIdAuthService).route ~
    new SamlAuthApi(samlAuthService).route ~
    new SuseAuthApi(suseAuthService).route ~
    new ExtraAuthApi(extraAuthService).route
}
