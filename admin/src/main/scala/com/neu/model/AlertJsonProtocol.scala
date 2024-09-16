package com.neu.model

import com.neu.model.DashboardJsonProtocol._
import org.joda.time.DateTime
import spray.json._

case class Violation(
  client_id: String,
  client_name: String,
  server_id: String,
  server_name: String,
  server_port: Int,
  applications: Array[String],
  reported_at: DateTime,
  policy_id: Int,
  client_ip: String,
  server_ip: String
)

case class ViolationBrief(client_name: String, server_name: String, reported_at: DateTime)

case class ViolationWrap(violations: Array[Violation])

case class ThreatDTO(
  name: String,
  reported_at: DateTime,
  workload_id: String,
  workload_name: String,
  count: Int,
  severity: String,
  action: String,
  src_ip: String,
  dst_ip: String,
  src_port: Int,
  dst_port: Int,
  application: String,
  sess_ingress: Boolean
)

case class GlobalNotificationRequest(
  manager_alerts: Option[Array[String]],
  controller_alerts: Option[Array[String]],
  user_alerts: Option[Array[String]]
)

case class ThreatDTOWrap(threats: Array[ThreatDTO])
case class NewThreatDTOWrap(threats: Array[ConvertedThreat])

object AlertJsonProtocol extends DefaultJsonProtocol {
  implicit val dateTimeFormat: DateTimeFormat.type = DateTimeFormat

  implicit val violationFormat: RootJsonFormat[Violation]                              = jsonFormat10(Violation)
  implicit val violationBriefFormat: RootJsonFormat[ViolationBrief]                    = jsonFormat3(ViolationBrief)
  implicit val violationWrapFormat: RootJsonFormat[ViolationWrap]                      = jsonFormat1(ViolationWrap)
  implicit val threatDTOFormat: RootJsonFormat[ThreatDTO]                              = jsonFormat13(ThreatDTO)
  implicit val threatDTOWrapFormat: RootJsonFormat[ThreatDTOWrap]                      = jsonFormat1(ThreatDTOWrap)
  implicit val newThreatDTOWrapFormat: RootJsonFormat[NewThreatDTOWrap]                = jsonFormat1(
    NewThreatDTOWrap
  )
  implicit val globalNotificationRequestFmt: RootJsonFormat[GlobalNotificationRequest] =
    jsonFormat3(GlobalNotificationRequest)

  implicit val violationArrayFormat: RootJsonFormat[Array[Violation]]           = arrayFormat[Violation]
  implicit val violationBriefArrayFormat: RootJsonFormat[Array[ViolationBrief]] =
    arrayFormat[ViolationBrief]
  implicit val threatDTOArrayFormat: RootJsonFormat[Array[ThreatDTO]]           =
    arrayFormat[ThreatDTO]

  def jsonToViolationWrap(violations: String): ViolationWrap =
    violations.parseJson.convertTo[ViolationWrap]

  def jsonToThreatDTOWrap(threats: String): ThreatDTOWrap =
    threats.parseJson.convertTo[ThreatDTOWrap]

  def acceptNotificationToJson(notificationRequest: GlobalNotificationRequest): String =
    notificationRequest.toJson.compactPrint
}
