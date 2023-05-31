package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

object SigstoreJsonProtocol extends DefaultJsonProtocol {
  implicit val verifierFormat: RootJsonFormat[Verifier]       = jsonFormat10(Verifier)
  implicit val rootOfTrustFormat: RootJsonFormat[RootOfTrust] = jsonFormat8(RootOfTrust)

  def verifierToJson(verifier: Verifier): String =
    verifier.toJson.compactPrint
  def rootOfTrustToJson(rootOfTrust: RootOfTrust): String = rootOfTrust.toJson.compactPrint
}
