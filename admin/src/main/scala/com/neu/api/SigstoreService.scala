package com.neu.api

import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.model.SigstoreJsonProtocol._
import com.neu.model.JsonProtocol._
import com.neu.model._
import com.typesafe.scalalogging.LazyLogging
import spray.http.HttpMethods._
import spray.http.StatusCodes
import spray.routing.Route
import scala.util.control.NonFatal
import scala.concurrent.{ Await, ExecutionContext, TimeoutException }

class SigstoreService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {
  val sigstoreRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("sigstore") {
          pathEnd {
            get {
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting sigstore list...")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            } ~
            post {
              entity(as[RootOfTrust]) { rootOfTrust =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      val payload = rootOfTrustToJson(rootOfTrust)
                      logger.info("Creating sigstore: {}...", payload)
                      RestClient.httpRequestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust",
                        POST,
                        payload,
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            patch {
              entity(as[RootOfTrust]) { rootOfTrust =>
                {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      val payload = rootOfTrustToJson(rootOfTrust)
                      val url =
                        s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${rootOfTrust.name.get}"
                      logger.info("Updating sigstore: {}...", payload)
                      logger.info("url: {}...", url)
                      RestClient.httpRequestWithHeader(
                        url,
                        PATCH,
                        payload,
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            delete {
              parameters('rootOfTrustName) { (rootOfTrustName) =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info("Deleting sigstore: {}...", rootOfTrustName)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/$rootOfTrustName",
                      DELETE,
                      "",
                      tokenId
                    )
                  }
                }
              }
            }
          }
        } ~
        path("verifier") {
          get {
            parameters('rootOfTrustName) { (rootOfTrustName) =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Getting Verifiers of {}", rootOfTrustName)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${rootOfTrustName}/verifier",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          post {
            entity(as[Verifier]) { verifier =>
              {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    val payload = verifierToJson(verifier)
                    logger.info("Creating verifier: {}", payload)
                    logger.info("for {}...", verifier.root_of_trust_name.get)
                    RestClient.httpRequestWithHeaderDecode(
                      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${verifier.root_of_trust_name.get}/verifier",
                      POST,
                      payload,
                      tokenId
                    )
                  }
                }
              }
            }
          } ~
          patch {
            entity(as[Verifier]) { verifier =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  val payload = verifierToJson(verifier)
                  val url =
                    s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${verifier.root_of_trust_name.get}/verifier/${verifier.name.get}"
                  logger.info("Updating verifier: {}", payload)
                  logger.info("for {}...", verifier.root_of_trust_name.get)
                  logger.info("url: {}", url)
                  RestClient.httpRequestWithHeader(
                    url,
                    PATCH,
                    payload,
                    tokenId
                  )
                }
              }
            }
          } ~
          delete {
            parameters('rootOfTrustName, 'verifierName) { (rootOfTrustName, verifierName) =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info("Deleting verifier: {}", verifierName)
                  logger.info("for {}...", rootOfTrustName)
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${rootOfTrustName}/verifier/${verifierName}",
                    DELETE,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        }
      }
    }
}
