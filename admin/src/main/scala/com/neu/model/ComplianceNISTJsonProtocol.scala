package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }
import scala.collection.mutable.Map

object ComplianceNISTJsonProtocol extends DefaultJsonProtocol {
  implicit val complianceNISTFormat: RootJsonFormat[ComplianceNIST] = jsonFormat4(ComplianceNIST)
  implicit val complianceNISTMapFormat: RootJsonFormat[ComplianceNISTMap] = jsonFormat1(
    ComplianceNISTMap
  )

  def complianceNISTToJson(complianceNIST: ComplianceNIST): String =
    complianceNIST.toJson.compactPrint
  def complianceNISTMapToJson(complianceNISTMap: ComplianceNISTMap): String =
    complianceNISTMap.toJson.compactPrint
}
