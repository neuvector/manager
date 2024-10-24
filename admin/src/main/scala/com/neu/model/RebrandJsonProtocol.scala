package com.neu.model

import spray.json.*

object RebrandJsonProtocol extends DefaultJsonProtocol {

  given rebrandFormat: RootJsonFormat[Rebrand] = jsonFormat6(Rebrand.apply)

  def rebrandToJson(rebrand: Rebrand): String =
    rebrand.toJson.compactPrint
}
