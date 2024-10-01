package com.neu.model

import spray.json.*

/**
 * Created by bxu on 7/20/17.
 */
case class EndpointConfig(id: String, display_name: Option[String])
case class EndpointConfigWrap(config: EndpointConfig)

object EndpointConfigJsonProtocol extends DefaultJsonProtocol {
  given endpointConfigFormat: RootJsonFormat[EndpointConfig]         = jsonFormat2(EndpointConfig.apply)
  given endpointConfigWrapFormat: RootJsonFormat[EndpointConfigWrap] = jsonFormat1(
    EndpointConfigWrap.apply
  )

  def endpointConfigWrapToJson(config: EndpointConfigWrap): String = config.toJson.compactPrint
}
