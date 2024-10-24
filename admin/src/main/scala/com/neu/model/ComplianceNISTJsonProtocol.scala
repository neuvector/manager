package com.neu.model

import spray.json.*

object ComplianceNISTJsonProtocol extends DefaultJsonProtocol {
  given complianceNISTFormat: RootJsonFormat[ComplianceNIST]       = jsonFormat4(ComplianceNIST.apply)
  given complianceNISTMapFormat: RootJsonFormat[ComplianceNISTMap] = jsonFormat1(
    ComplianceNISTMap.apply
  )

  def complianceNISTToJson(complianceNIST: ComplianceNIST): String          =
    complianceNIST.toJson.compactPrint
  def complianceNISTMapToJson(complianceNISTMap: ComplianceNISTMap): String =
    complianceNISTMap.toJson.compactPrint
}
