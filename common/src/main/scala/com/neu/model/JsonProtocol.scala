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
    NetworkTrafficSum.apply
  )

  given scaleFormat: RootJsonFormat[Scale]         = jsonFormat2(Scale.apply)
  given directionFormat: RootJsonFormat[Direction] = jsonFormat1(Direction.apply)
  given scanBriefFormat: RootJsonFormat[ScanBrief] = jsonFormat3(ScanBrief.apply)
  given subNodeFormat: RootJsonFormat[SubNode]     = jsonFormat4(SubNode.apply)
  given fixedFormat: RootJsonFormat[Fixed]         = jsonFormat2(Fixed.apply)
  given nodeFormat: RootJsonFormat[Node]           = jsonFormat19(Node.apply)

  given graphEndpointFormat: RootJsonFormat[GraphEndpoint] = jsonFormat2(GraphEndpoint.apply)
  given graphItemFormat: RootJsonFormat[GraphItem]         = jsonFormat1(GraphItem.apply)
  given blacklist: RootJsonFormat[Blacklist]               = jsonFormat3(Blacklist.apply)
  given userBlacklist: RootJsonFormat[UserBlacklist]       = jsonFormat2(UserBlacklist.apply)

  given positionFormat: RootJsonFormat[Position]               = jsonFormat2(Position.apply)
  given userGraphLayoutFormat: RootJsonFormat[UserGraphLayout] = jsonFormat2(UserGraphLayout.apply)

  given edgeFormat: RootJsonFormat[Edge]                 = jsonFormat14(Edge.apply)
  given networkGraphFormat: RootJsonFormat[NetworkGraph] = jsonFormat4(NetworkGraph.apply)

  def layoutToJson(layout: UserGraphLayout): String = layout.toJson.compactPrint
}
