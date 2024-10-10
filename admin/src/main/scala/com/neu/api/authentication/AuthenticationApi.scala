package com.neu.api.authentication

import com.neu.service.authentication.*
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

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
) extends Directives {

  val route: Route =
    new OpenIdAuthApi(openIdAuthService).route ~
    new SamlAuthApi(samlAuthService).route ~
    new SuseAuthApi(suseAuthService).route ~
    new ExtraAuthApi(extraAuthService).route
}
