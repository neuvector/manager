package com.neu.model

import spray.json.{ DefaultJsonProtocol, _ }
import org.joda.time.DateTime
import com.typesafe.scalalogging.LazyLogging

case class DashboardThreat(
  name: String,
  host_name: String,
  level: String,
  client_workload_id: String,
  client_workload_name: Option[String],
  client_workload_domain: Option[String],
  client_ip: Option[String],
  client_port: Option[Int],
  server_workload_id: String,
  server_workload_name: Option[String],
  server_workload_domain: Option[String],
  server_ip: Option[String],
  server_port: Option[Int],
  server_conn_port: Option[Int],
  application: Option[String],
  target: Option[String],
  reported_at: DateTime
)

case class DashboardViolation(
  policy_id: Int,
  host_name: String,
  level: String,
  client_id: String,
  client_ip: Option[String],
  client_name: Option[String],
  client_domain: Option[String],
  server_id: String,
  server_ip: Option[String],
  server_name: Option[String],
  server_domain: Option[String],
  server_port: Option[Int],
  application: Option[String],
  reported_at: DateTime
)

case class DashboardIncident(
  name: String,
  host_name: String,
  level: String,
  workload_id: Option[String],
  workload_name: Option[String],
  workload_domain: Option[String],
  client_ip: Option[String],
  client_port: Option[Int],
  remote_workload_id: Option[String],
  remote_workload_name: Option[String],
  remote_workload_domain: Option[String],
  server_ip: Option[String],
  server_port: Option[Int],
  server_conn_port: Option[Int],
  conn_ingress: Option[Boolean],
  reported_at: DateTime
)

case class DashboardThreatData(
  threats: Array[DashboardThreat],
  error: Option[Error]
)

case class DashboardViolationData(
  violations: Array[DashboardViolation],
  error: Option[Error]
)

case class DashboardIncidentData(
  incidents: Array[DashboardIncident],
  error: Option[Error]
)

case class DashboardSecurityEvents(
  threats: Option[Array[DashboardThreat]],
  violations: Option[Array[DashboardViolation]],
  incidents: Option[Array[DashboardIncident]],
  error: Option[Error]
)

case class CriticalDashboardSecurityEventDTO(
  summary: Map[String, Seq[(String, Int)]],
  top_security_events: TopSecurityEvent
)

case class ConvertedDashboardSecurityEvent(
  policy_id: Option[Int],
  name: Option[String],
  source_workload_id: Option[String],
  source_workload_name: Option[String],
  destination_workload_id: Option[String],
  destination_workload_name: Option[String],
  source_domain: Option[String],
  destination_domain: Option[String],
  level: String,
  host_name: String,
  source_port: Option[Int],
  destination_port: Option[Int],
  server_conn_port: Option[Int],
  source_ip: Option[String],
  destination_ip: Option[String],
  application: Option[String],
  reported_at: DateTime
)

case class TopSecurityEvent(
  source: Array[Array[ConvertedDashboardSecurityEvent]],
  destination: Array[Array[ConvertedDashboardSecurityEvent]]
)

case class DashboardNotificationDTO2(
  criticalSecurityEvents: Either[Error, CriticalDashboardSecurityEventDTO]
)

object DashboardSecurityEventsProtocol extends DefaultJsonProtocol with LazyLogging {
  implicit val dateTimeFormat                     = DateTimeFormat
  implicit val errorFormat: RootJsonFormat[Error] = jsonFormat1(Error)
  implicit val dashboardThreatFormat: RootJsonFormat[DashboardThreat] = jsonFormat17(
    DashboardThreat
  )
  implicit val dashboardThreatDataFormat: RootJsonFormat[DashboardThreatData] = jsonFormat2(
    DashboardThreatData
  )
  implicit val dashboardViolationFormat: RootJsonFormat[DashboardViolation] = jsonFormat14(
    DashboardViolation
  )
  implicit val dashboardViolationDataFormat: RootJsonFormat[DashboardViolationData] = jsonFormat2(
    DashboardViolationData
  )
  implicit val dashboardIncidentFormat: RootJsonFormat[DashboardIncident] = jsonFormat16(
    DashboardIncident
  )
  implicit val dashboardIncidentDataFormat: RootJsonFormat[DashboardIncidentData] = jsonFormat2(
    DashboardIncidentData
  )
  implicit val dashboardSecurityEventsFormat: RootJsonFormat[DashboardSecurityEvents] = jsonFormat4(
    DashboardSecurityEvents
  )
  implicit val convertedDashboardSecurityEventFormat
    : RootJsonFormat[ConvertedDashboardSecurityEvent] = jsonFormat17(
    ConvertedDashboardSecurityEvent
  )
  implicit val topSecurityEventFormat: RootJsonFormat[TopSecurityEvent] = jsonFormat2(
    TopSecurityEvent
  )
  implicit val criticalSecurityEventDTO2Format: RootJsonFormat[CriticalDashboardSecurityEventDTO] =
    jsonFormat2(CriticalDashboardSecurityEventDTO)
  implicit val dashboardNotificationDTO2Format: RootJsonFormat[DashboardNotificationDTO2] =
    jsonFormat1(DashboardNotificationDTO2)

  def jsonToDashboardThreatData(endpointData: String): DashboardThreatData =
    endpointData.parseJson
      .convertTo[DashboardThreatData]

  def jsonToDashboardViolationData(endpointData: String): DashboardViolationData =
    endpointData.parseJson
      .convertTo[DashboardViolationData]

  def jsonToDashboardIncidentData(endpointData: String): DashboardIncidentData =
    endpointData.parseJson
      .convertTo[DashboardIncidentData]

  def threatsToConvertedDashboardThreats: (DashboardThreat) => ConvertedDashboardSecurityEvent =
    (threat: DashboardThreat) => {

      ConvertedDashboardSecurityEvent(
        None,
        Some(threat.name),
        Some(threat.server_workload_id),
        if (threat.target == "client") {
          if (!threat.server_workload_name.getOrElse("").isEmpty()) threat.server_workload_name
          else if (!threat.server_ip.getOrElse("").isEmpty()) threat.server_ip
          else Some(threat.server_workload_id)
        } else {
          if (!threat.client_workload_name.getOrElse("").isEmpty()) threat.client_workload_name
          else if (!threat.client_ip.getOrElse("").isEmpty()) threat.client_ip
          else Some(threat.client_workload_id)
        },
        Some(threat.server_workload_id),
        if (threat.target == "client") {
          if (!threat.client_workload_name.getOrElse("").isEmpty()) threat.client_workload_name
          else if (!threat.client_ip.getOrElse("").isEmpty()) threat.client_ip
          else Some(threat.client_workload_id)
        } else {
          if (!threat.server_workload_name.getOrElse("").isEmpty()) threat.server_workload_name
          else if (!threat.server_ip.getOrElse("").isEmpty()) threat.server_ip
          else Some(threat.server_workload_id)
        },
        if (threat.target == "client") threat.server_workload_domain
        else threat.client_workload_domain,
        if (threat.target == "client") threat.client_workload_domain
        else threat.server_workload_domain,
        threat.level,
        threat.host_name,
        if (threat.target == "client") threat.server_port else threat.client_port,
        if (threat.target == "client") threat.client_port else threat.server_port,
        threat.server_conn_port,
        if (threat.target == "client") threat.server_ip else threat.client_ip,
        if (threat.target == "client") threat.client_ip else threat.server_ip,
        threat.application,
        threat.reported_at
      )
    }

  def violationsToConvertedDashboardViolations
    : (DashboardViolation) => ConvertedDashboardSecurityEvent =
    (violation: DashboardViolation) => {

      ConvertedDashboardSecurityEvent(
        Some(violation.policy_id),
        None,
        Some(violation.client_id),
        if (!violation.client_name.getOrElse("").isEmpty()) violation.client_name
        else if (!violation.client_ip.getOrElse("").isEmpty()) violation.client_ip
        else Some(violation.client_id),
        Some(violation.server_id),
        if (!violation.server_name.getOrElse("").isEmpty()) violation.server_name
        else if (!violation.server_ip.getOrElse("").isEmpty()) violation.server_ip
        else Some(violation.server_id),
        violation.client_domain,
        violation.server_domain,
        violation.level,
        violation.host_name,
        None,
        violation.server_port,
        None,
        violation.client_ip,
        violation.server_ip,
        violation.application,
        violation.reported_at
      )
    }

  def incidentsToConvertedDashboardIncidents
    : (DashboardIncident) => ConvertedDashboardSecurityEvent =
    (incident: DashboardIncident) => {

      ConvertedDashboardSecurityEvent(
        None,
        Some(incident.name),
        incident.workload_id,
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) {
            if (incident.remote_workload_id.isDefined) {
              if (!incident.remote_workload_name.getOrElse("").isEmpty())
                incident.remote_workload_name
              else if (!incident.server_ip.getOrElse("").isEmpty()) incident.server_ip
              else incident.remote_workload_id
            } else {
              None
            }
          } else {
            if (incident.workload_id.isDefined) {
              if (!incident.workload_name.getOrElse("").isEmpty()) incident.workload_name
              else if (!incident.client_ip.getOrElse("").isEmpty()) incident.client_ip
              else incident.workload_id
            } else {
              None
            }
          }
        } else {
          if (incident.workload_id.isDefined) {
            if (!incident.workload_name.getOrElse("").isEmpty()) incident.workload_name
            else if (!incident.client_ip.getOrElse("").isEmpty()) incident.client_ip
            else incident.workload_id
          } else if (incident.remote_workload_id.isDefined) {
            if (!incident.remote_workload_name.getOrElse("").isEmpty())
              incident.remote_workload_name
            else if (!incident.server_ip.getOrElse("").isEmpty()) incident.server_ip
            else incident.remote_workload_id
          } else {
            Some("Host: " + incident.host_name)
          }
        },
        incident.remote_workload_id,
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) {
            if (incident.workload_id.isDefined) {
              if (!incident.workload_name.getOrElse("").isEmpty()) incident.workload_name
              else if (!incident.client_ip.getOrElse("").isEmpty()) incident.client_ip
              else incident.workload_id
            } else {
              None
            }
          } else {
            if (incident.remote_workload_id.isDefined) {
              if (!incident.remote_workload_name.getOrElse("").isEmpty())
                incident.remote_workload_name
              else if (!incident.server_ip.getOrElse("").isEmpty()) incident.server_ip
              else incident.remote_workload_id
            } else {
              None
            }
          }
        } else {
          if (incident.workload_id.isDefined) {
            if (!incident.workload_name.getOrElse("").isEmpty()) incident.workload_name
            else if (!incident.client_ip.getOrElse("").isEmpty()) incident.client_ip
            else incident.workload_id
          } else if (incident.remote_workload_id.isDefined) {
            if (!incident.remote_workload_name.getOrElse("").isEmpty())
              incident.remote_workload_name
            else if (!incident.server_ip.getOrElse("").isEmpty()) incident.server_ip
            else incident.remote_workload_id
          } else {
            Some("Host: " + incident.host_name)
          }
        },
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.remote_workload_domain
          else incident.workload_domain
        } else {
          if (incident.workload_domain.isDefined) {
            incident.workload_domain
          } else if (incident.remote_workload_domain.isDefined) {
            incident.remote_workload_domain
          } else {
            None
          }
        },
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.workload_domain
          else incident.remote_workload_domain
        } else {
          None
        },
        incident.level,
        incident.host_name,
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.server_port else incident.client_port
        } else {
          if (incident.client_port.isDefined) {
            incident.client_port
          } else if (incident.server_port.isDefined) {
            incident.server_port
          } else {
            None
          }
        },
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.client_port else incident.server_port
        } else {
          if (incident.client_port.isDefined) {
            incident.client_port
          } else if (incident.server_port.isDefined) {
            incident.server_port
          } else {
            None
          }
        },
        incident.server_conn_port,
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.server_ip else incident.client_ip
        } else {
          if (incident.client_ip.isDefined) {
            incident.client_ip
          } else if (incident.server_ip.isDefined) {
            incident.server_ip
          } else {
            None
          }
        },
        if (incident.conn_ingress.isDefined) {
          if (incident.conn_ingress.get) incident.client_ip else incident.server_ip
        } else {
          if (incident.client_ip.isDefined) {
            incident.client_ip
          } else if (incident.server_ip.isDefined) {
            incident.server_ip
          } else {
            None
          }
        },
        None,
        incident.reported_at
      )
    }
}
