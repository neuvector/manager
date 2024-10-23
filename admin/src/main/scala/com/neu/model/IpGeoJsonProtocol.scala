package com.neu.model

import spray.json.*

object IpGeoJsonProtocol extends DefaultJsonProtocol {
  given ipGeoFormat: RootJsonFormat[IpGeo] = jsonFormat4(IpGeo.apply)
  given ipMapFormat: RootJsonFormat[IpMap] = jsonFormat1(IpMap.apply)

  def ipGeoToJson(ipGeo: IpGeo): String = ipGeo.toJson.compactPrint
  def ipMapToJson(ipMap: IpMap): String = ipMap.toJson.compactPrint
}
