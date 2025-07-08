package com.neu.service.sigstore

import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.SigstoreJsonProtocol.*
import com.neu.model.*
import com.neu.service.BaseService
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.server.Route

class SigstoreService() extends BaseService with DefaultJsonFormats with LazyLogging {

  def getSigstoreList(tokenId: String): Route = complete {
    logger.info("Getting sigstore list...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust",
      GET,
      "",
      tokenId
    )
  }

  def createSigstore(tokenId: String, rootOfTrust: RootOfTrust): Route = complete {
    val payload = rootOfTrustToJson(rootOfTrust)
    logger.info("Creating sigstore")
    RestClient.httpRequestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust",
      POST,
      payload,
      tokenId
    )
  }

  def updateSigstore(tokenId: String, rootOfTrust: RootOfTrust): Route = complete {
    val payload = rootOfTrustToJson(rootOfTrust)
    val url     =
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${rootOfTrust.name.get}"
    logger.info("Updating sigstore")
    logger.info("url: {}...", url)
    RestClient.httpRequestWithHeader(
      url,
      PATCH,
      payload,
      tokenId
    )
  }

  def removeSigstore(tokenId: String, rootOfTrustName: String): Route = complete {
    logger.info("Deleting sigstore: {}...", rootOfTrustName)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/$rootOfTrustName",
      DELETE,
      "",
      tokenId
    )
  }

  def getVerifiers(tokenId: String, rootOfTrustName: String): Route = complete {
    logger.info("Getting Verifiers of {}", rootOfTrustName)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/$rootOfTrustName/verifier",
      GET,
      "",
      tokenId
    )
  }

  def createVerifier(tokenId: String, verifier: Verifier): Route = complete {
    val payload = verifierToJson(verifier)
    logger.info("Creating verifier")
    logger.info("for {}...", verifier.root_of_trust_name.get)
    RestClient.httpRequestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${verifier.root_of_trust_name.get}/verifier",
      POST,
      payload,
      tokenId
    )
  }

  def updateVerifier(tokenId: String, verifier: Verifier): Route = complete {
    val payload = verifierToJson(verifier)
    val url     =
      s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/${verifier.root_of_trust_name.get}/verifier/${verifier.name.get}"
    logger.info("Updating verifier")
    logger.info("for {}...", verifier.root_of_trust_name.get)
    logger.info("url: {}", url)
    RestClient.httpRequestWithHeader(
      url,
      PATCH,
      payload,
      tokenId
    )
  }

  def removeVerifier(tokenId: String, verifierName: String, rootOfTrustName: String): Route =
    complete {
      logger.info("Deleting verifier: {}", verifierName)
      logger.info("for {}...", rootOfTrustName)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/scan/sigstore/root_of_trust/$rootOfTrustName/verifier/$verifierName",
        DELETE,
        "",
        tokenId
      )
    }
}
