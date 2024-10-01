package com.neu.model

import com.neu.model.DashboardJsonProtocol.{ *, given }
import org.joda.time.DateTime
import spray.json.*

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
  given dateTimeFormat: DateTimeFormat.type = DateTimeFormat

  given violationFormat: RootJsonFormat[Violation]                              = jsonFormat10(Violation.apply)
  given violationBriefFormat: RootJsonFormat[ViolationBrief]                    = jsonFormat3(ViolationBrief.apply)
  given violationWrapFormat: RootJsonFormat[ViolationWrap]                      = jsonFormat1(ViolationWrap.apply)
  given threatDTOFormat: RootJsonFormat[ThreatDTO]                              = jsonFormat13(ThreatDTO.apply)
  given threatDTOWrapFormat: RootJsonFormat[ThreatDTOWrap]                      = jsonFormat1(ThreatDTOWrap.apply)
  given newThreatDTOWrapFormat: RootJsonFormat[NewThreatDTOWrap]                = jsonFormat1(
    NewThreatDTOWrap.apply
  )
  given globalNotificationRequestFmt: RootJsonFormat[GlobalNotificationRequest] =
    jsonFormat3(GlobalNotificationRequest.apply)

  given violationArrayFormat: RootJsonFormat[Array[Violation]]           = arrayFormat[Violation]
  given violationBriefArrayFormat: RootJsonFormat[Array[ViolationBrief]] =
    arrayFormat[ViolationBrief]
  given threatDTOArrayFormat: RootJsonFormat[Array[ThreatDTO]]           =
    arrayFormat[ThreatDTO]

  def jsonToViolationWrap(violations: String): ViolationWrap =
    violations.parseJson.convertTo[ViolationWrap]

  def jsonToThreatDTOWrap(threats: String): ThreatDTOWrap =
    threats.parseJson.convertTo[ThreatDTOWrap]

  def acceptNotificationToJson(notificationRequest: GlobalNotificationRequest): String =
    notificationRequest.toJson.compactPrint
}
