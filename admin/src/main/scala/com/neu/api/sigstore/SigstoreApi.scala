package com.neu.api.sigstore

import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.*
import com.neu.model.SigstoreJsonProtocol.{ *, given }
import com.neu.service.Utils
import com.neu.service.sigstore.SigstoreService
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.server.{ Directives, Route }

import scala.concurrent.ExecutionContext

class SigstoreApi(resourceService: SigstoreService)(implicit executionContext: ExecutionContext)
    extends Directives {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      pathPrefix("sigstore") {
        pathEnd {
          get {
            Utils.respondWithWebServerHeaders() {
              resourceService.getSigstoreList(tokenId)
            }
          } ~
          post {
            entity(as[RootOfTrust]) { rootOfTrust =>
              Utils.respondWithWebServerHeaders() {
                resourceService.createSigstore(tokenId, rootOfTrust)
              }
            }
          } ~
          patch {
            entity(as[RootOfTrust]) { rootOfTrust =>
              Utils.respondWithWebServerHeaders() {
                resourceService.updateSigstore(tokenId, rootOfTrust)
              }
            }
          } ~
          delete {
            parameters(Symbol("rootOfTrustName")) { rootOfTrustName =>
              Utils.respondWithWebServerHeaders() {
                resourceService.removeSigstore(tokenId, rootOfTrustName)
              }
            }
          }
        }
      } ~
      path("verifier") {
        get {
          parameters(Symbol("rootOfTrustName")) { rootOfTrustName =>
            Utils.respondWithWebServerHeaders() {
              resourceService.getVerifiers(tokenId, rootOfTrustName)
            }
          }
        } ~
        post {
          entity(as[Verifier]) { verifier =>
            Utils.respondWithWebServerHeaders() {
              resourceService.createVerifier(tokenId, verifier)
            }
          }
        } ~
        patch {
          entity(as[Verifier]) { verifier =>
            Utils.respondWithWebServerHeaders() {
              resourceService.updateVerifier(tokenId, verifier)
            }
          }
        } ~
        delete {
          parameters(Symbol("rootOfTrustName"), Symbol("verifierName")) {
            (rootOfTrustName, verifierName) =>
              Utils.respondWithWebServerHeaders() {
                resourceService.removeVerifier(tokenId, verifierName, rootOfTrustName)
              }
          }
        }
      }
    }
}
