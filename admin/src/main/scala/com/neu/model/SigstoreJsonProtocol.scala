package com.neu.model

import spray.json.*

object SigstoreJsonProtocol extends DefaultJsonProtocol {
  given verifierFormat: RootJsonFormat[Verifier]       = jsonFormat10(Verifier.apply)
  given rootOfTrustFormat: RootJsonFormat[RootOfTrust] = jsonFormat9(RootOfTrust.apply)

  def verifierToJson(verifier: Verifier): String          =
    verifier.toJson.compactPrint
  def rootOfTrustToJson(rootOfTrust: RootOfTrust): String = rootOfTrust.toJson.compactPrint
}
