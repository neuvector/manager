package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }

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

  implicit val dateTimeFormat: DateTimeFormat.type = DateTimeFormat

  implicit val networkTrafficSumFormat: RootJsonFormat[NetworkTrafficSum] = jsonFormat3(
    NetworkTrafficSum
  )

  implicit val scaleFormat: RootJsonFormat[Scale]         = jsonFormat2(Scale)
  implicit val directionFormat: RootJsonFormat[Direction] = jsonFormat1(Direction)
  implicit val scanBriefFormat: RootJsonFormat[ScanBrief] = jsonFormat3(ScanBrief)
  implicit val subNodeFormat: RootJsonFormat[SubNode]     = jsonFormat4(SubNode)
  implicit val fixedFormat: RootJsonFormat[Fixed]         = jsonFormat2(Fixed)
  implicit val nodeFormat: RootJsonFormat[Node]           = jsonFormat19(Node)

  implicit val graphEndpointFormat: RootJsonFormat[GraphEndpoint] = jsonFormat2(GraphEndpoint)
  implicit val graphItemFormat: RootJsonFormat[GraphItem]         = jsonFormat1(GraphItem)
  implicit val blacklist: RootJsonFormat[Blacklist]               = jsonFormat3(Blacklist)
  implicit val userBlacklist: RootJsonFormat[UserBlacklist]       = jsonFormat2(UserBlacklist)

  implicit val positionFormat: RootJsonFormat[Position]               = jsonFormat2(Position)
  implicit val userGraphLayoutFormat: RootJsonFormat[UserGraphLayout] = jsonFormat2(UserGraphLayout)

  implicit val edgeFormat: RootJsonFormat[Edge]                 = jsonFormat14(Edge)
  implicit val networkGraphFormat: RootJsonFormat[NetworkGraph] = jsonFormat3(NetworkGraph)

  def layoutToJson(layout: UserGraphLayout): String = layout.toJson.compactPrint
}
