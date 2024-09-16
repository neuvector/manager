package com.neu.model

import spray.json.*

object IpGeoJsonProtocol extends DefaultJsonProtocol {
  implicit val ipGeoFormat: RootJsonFormat[IpGeo] = jsonFormat4(IpGeo)
  implicit val ipMapFormat: RootJsonFormat[IpMap] = jsonFormat1(IpMap)

  def ipGeoToJson(ipGeo: IpGeo): String = ipGeo.toJson.compactPrint
  def ipMapToJson(ipMap: IpMap): String = ipMap.toJson.compactPrint
}
