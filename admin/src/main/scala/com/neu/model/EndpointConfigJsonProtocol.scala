package com.neu.model


import spray.json.{DefaultJsonProtocol, _}

/**
  * Created by bxu on 7/20/17.
  */

case class EndpointConfig(id: String, display_name: Option[String])
case class EndpointConfigWrap(config: EndpointConfig)

object EndpointConfigJsonProtocol extends DefaultJsonProtocol {
  implicit val endpointConfigFormat: RootJsonFormat[EndpointConfig] = jsonFormat2(EndpointConfig)
  implicit val endpointConfigWrapFormat: RootJsonFormat[EndpointConfigWrap] = jsonFormat1(EndpointConfigWrap)

  def endpointConfigWrapToJson(config: EndpointConfigWrap): String = config.toJson.compactPrint
}
