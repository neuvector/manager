package com.neu.model

import spray.json.{ DefaultJsonProtocol, RootJsonFormat, _ }

object RebrandJsonProtocol extends DefaultJsonProtocol {

  implicit val rebrandFormat: RootJsonFormat[Rebrand] = jsonFormat6(Rebrand)

  def rebrandToJson(rebrand: Rebrand): String =
    rebrand.toJson.compactPrint
}
