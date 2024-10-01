package com.neu.model

import spray.json.*

import java.util.UUID

/**
 * Created by bxu on 3/17/16.
 *
 * For Json serialization and de-serialization
 */
object JsonProtocol extends DefaultJsonProtocol {

  implicit object UuidJsonFormat extends RootJsonFormat[UUID] {
    def write(x: UUID): JsString = JsString(x.toString)

    def read(value: JsValue): UUID = value match {
      case JsString(x) => UUID.fromString(x)
      case _           => deserializationError("Expected UUID as JsString")
    }
  }

  given dateTimeFormat: DateTimeFormat.type = DateTimeFormat

  given networkTrafficSumFormat: RootJsonFormat[NetworkTrafficSum] = jsonFormat3(
    NetworkTrafficSum
  )

  given scaleFormat: RootJsonFormat[Scale]         = jsonFormat2(Scale)
  given directionFormat: RootJsonFormat[Direction] = jsonFormat1(Direction)
  given scanBriefFormat: RootJsonFormat[ScanBrief] = jsonFormat3(ScanBrief)
  given subNodeFormat: RootJsonFormat[SubNode]     = jsonFormat4(SubNode)
  given fixedFormat: RootJsonFormat[Fixed]         = jsonFormat2(Fixed)
  given nodeFormat: RootJsonFormat[Node]           = jsonFormat19(Node)

  given graphEndpointFormat: RootJsonFormat[GraphEndpoint] = jsonFormat2(GraphEndpoint)
  given graphItemFormat: RootJsonFormat[GraphItem]         = jsonFormat1(GraphItem)
  given blacklist: RootJsonFormat[Blacklist]               = jsonFormat3(Blacklist)
  given userBlacklist: RootJsonFormat[UserBlacklist]       = jsonFormat2(UserBlacklist)

  given positionFormat: RootJsonFormat[Position]               = jsonFormat2(Position)
  given userGraphLayoutFormat: RootJsonFormat[UserGraphLayout] = jsonFormat2(UserGraphLayout)

  given edgeFormat: RootJsonFormat[Edge]                 = jsonFormat14(Edge)
  given networkGraphFormat: RootJsonFormat[NetworkGraph] = jsonFormat3(NetworkGraph)

  def layoutToJson(layout: UserGraphLayout): String = layout.toJson.compactPrint
}
