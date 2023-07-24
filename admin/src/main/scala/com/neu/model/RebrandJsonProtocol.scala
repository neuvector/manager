package com.neu.model

import spray.json.{ pimpAny, DefaultJsonProtocol, RootJsonFormat }

object RebrandJsonProtocol extends DefaultJsonProtocol {

  implicit val rebrandFormat: RootJsonFormat[Rebrand] = jsonFormat6(Rebrand)
  def rebrandToJson(rebrand: Rebrand): String =
    rebrand.toJson.compactPrint
}
