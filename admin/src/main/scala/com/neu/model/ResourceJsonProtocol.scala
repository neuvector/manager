package com.neu.model

import com.typesafe.scalalogging.LazyLogging
import spray.json.{ DefaultJsonProtocol, _ }

/**
 * Created by bxu on 5/11/16.
 */
/**
 * Refer to RESTWorkloadBrief in go
 *
 * @param id The id of the container
 * @param name The name of the container
 * @param display_name The normalized display name
 * @param platform_role The role of the container, like "core", "addon", ""
 * @param state The state of the container which includes: "disconnected", "exit", "un-managed",
 *              "monitor", "protect"
 * @param service The service
 * @param service_group The service group name
 */
case class Container(
  id: String,
  name: String,
  display_name: String,
  platform_role: String = "",
  state: String,
  service: String,
  service_group: String
)

case class ContainerWrap(workloads: Array[Container])

case class ConversationBrief(
  from: Container,
  to: Container,
  bytes: Long,
  severity: Option[String],
  policy_action: String
)

case class ConversationBriefWrap(conversations: Array[ConversationBrief])

/**
 *
 * @param id The id of the container
 * @param name The name of the container
 * @param display_name The normalized display name
 * @param platform_role The role of the container, like "core", "addon"
 * @param state The state of the container which includes: "disconnected", "exit", "un-managed",
 *              "monitor", "protect",  "quarantined"
 * @param kind The type of the endpoint, including: "external", "container", "node_ip",
 *             "workload_ip", "address", "service"
 * @param service_group The service group name
 * @param share_ns_with Share network with endpoint specified by id
 */
case class ConversationEndpoint(
  id: String,
  name: String,
  display_name: String,
  state: String,
  kind: String,
  platform_role: Option[String],
  service_group: Option[String],
  domain: String,
  share_ns_with: Option[String],
  policy_mode: Option[String],
  scan_summary: Option[ScanBrief],
  cap_quarantine: Boolean,
  cap_change_mode: Boolean,
  cap_sniff: Boolean,
  service_mesh: Option[Boolean] = None,
  service_mesh_sidecar: Option[Boolean] = None,
  children: Option[Array[WorkloadBrief]]
)

case class ConversationEndpointData(endpoints: Array[ConversationEndpoint])

case class EndPointConversation(
  from: String,
  to: String,
  bytes: Long,
  sessions: Int,
  severity: Option[String],
  policy_action: String,
  event_type: Option[Seq[String]],
  protocols: Option[Array[String]],
  applications: Option[Array[String]],
  ports: Option[Array[String]],
  sidecar_proxy: Option[Boolean]
)

case class EndpointConversationData(conversations: Array[EndPointConversation])

case class GraphData(
  endpoints: Array[ConversationEndpoint],
  conversations: Array[EndPointConversation],
  error: Option[Error]
)

case class ServerVolume(id: String, name: String, volume: Long)

case class ThreatBrief(name: String, severity: String, application: String)

case class ThreatBriefDTO(name: String, severity: String, severityId: Int, application: String)

case class ThreatBriefWrap(threats: Array[ThreatBrief])

object ResourceJsonProtocol extends DefaultJsonProtocol with LazyLogging {

  implicit val errorFormat: RootJsonFormat[Error]                 = jsonFormat1(Error)
  implicit val containerFormat: RootJsonFormat[Container]         = jsonFormat7(Container)
  implicit val containerWrapFormat: RootJsonFormat[ContainerWrap] = jsonFormat1(ContainerWrap)

  implicit val conversationBriefFormat: RootJsonFormat[ConversationBrief] = jsonFormat5(
    ConversationBrief
  )
  implicit val conversationBriefWrapFormat: RootJsonFormat[ConversationBriefWrap] = jsonFormat1(
    ConversationBriefWrap
  )

  implicit val scanBriefFormat: RootJsonFormat[ScanBrief] = jsonFormat3(ScanBrief)
  implicit val workloadBriefFormat: RootJsonFormat[WorkloadBrief] = rootFormat(
    lazyFormat(jsonFormat15(WorkloadBrief))
  )
  implicit val endpointFormat: RootJsonFormat[ConversationEndpoint] = jsonFormat17(
    ConversationEndpoint
  )
  //  implicit val endpointFormat: RootJsonFormat[ConversationEndpoint] = rootFormat(lazyFormat(jsonFormat12(ConversationEndpoint)))
  implicit val endpointWrapFormat: RootJsonFormat[ConversationEndpointData] = jsonFormat1(
    ConversationEndpointData
  )

  implicit val endpointConversationFormat: RootJsonFormat[EndPointConversation] = jsonFormat11(
    EndPointConversation
  )
  implicit val endpointConversationDataFormat: RootJsonFormat[EndpointConversationData] =
    jsonFormat1(EndpointConversationData)

  implicit val graphDataFormat: RootJsonFormat[GraphData] = jsonFormat3(GraphData)

  implicit val serverVolume: RootJsonFormat[ServerVolume] = jsonFormat3(ServerVolume)

  implicit val threatBriefFormat: RootJsonFormat[ThreatBrief]         = jsonFormat3(ThreatBrief)
  implicit val threatBriefDTOFormat: RootJsonFormat[ThreatBriefDTO]   = jsonFormat4(ThreatBriefDTO)
  implicit val threatBriefWrapFormat: RootJsonFormat[ThreatBriefWrap] = jsonFormat1(ThreatBriefWrap)

  val nginxTunnelSecured = "secured"
  val nginxTunnelPartial = "partial"
  val address            = "address"

  def jsonToContainerWrap(container: String): ContainerWrap =
    container.parseJson.convertTo[ContainerWrap]

  def jsonToEndpointData(endpointData: String): ConversationEndpointData =
    endpointData.parseJson
      .convertTo[ConversationEndpointData]

  def endpointToNode: ConversationEndpoint => Node =
    (endpoint: ConversationEndpoint) =>
      Node(
        endpoint.id,
        getCompactName(endpoint.display_name, endpoint.name),
        getGroup(endpoint),
        getClusterId(endpoint),
        getClusterName(endpoint),
        endpoint.scan_summary,
        endpoint.platform_role.getOrElse(""),
        endpoint.state,
        getDomain(endpoint),
        endpoint.cap_quarantine,
        endpoint.cap_change_mode,
        endpoint.cap_sniff,
        endpoint.service_mesh,
        endpoint.service_mesh_sidecar,
        getChildren(endpoint),
        endpoint.policy_mode
      )

  def jsonToConversationData(wrap: String): EndpointConversationData =
    wrap.parseJson.convertTo[EndpointConversationData]

  def jsonToGraphData(wrap: String): GraphData =
    wrap.parseJson.convertTo[GraphData]

  def conversationToEdge: (EndPointConversation, Map[String, Node]) => Edge =
    (conversation: EndPointConversation, nodeMap: Map[String, Node]) =>
      Edge(
        id = Some(conversation.from + conversation.to),
        source = conversation.from,
        target = conversation.to,
        label = getLabel(conversation),
        status = getStatus(conversation, nodeMap),
        fromGroup = nodeMap.get(conversation.from).flatMap(getCluster),
        toGroup = nodeMap.get(conversation.to).flatMap(getCluster),
        fromDomain = nodeMap.get(conversation.from).flatMap(getNamespace),
        toDomain = nodeMap.get(conversation.to).flatMap(getNamespace),
        protocols = conversation.protocols,
        applications = conversation.applications,
        event_type = conversation.event_type,
        sidecar_proxy = conversation.sidecar_proxy,
        bytes = conversation.bytes
      )

  def jsonToThreatWrap(threatWrap: String): ThreatBriefWrap =
    threatWrap.parseJson.convertTo[ThreatBriefWrap]

  private def getCluster: Node => Option[String] = (node: Node) => {
    Some(node.clusterId)
  }

  private def getNamespace: Node => Option[String] = (node: Node) => {
    Some(node.domain)
  }

  private def strToOp: Option[String] => Option[String] = (str: Option[String]) => {
    if (str.isEmpty) None else if (str.get.isEmpty) None else str
  }

  private def getLabel: EndPointConversation => Option[String] =
    (conversation: EndPointConversation) => {
      val label: Option[String] = strToOp(
        merge(conversation.applications, conversation.ports)
          .map(_.filter(_.nonEmpty).take(3).mkString(","))
      )
      if ("deny".equalsIgnoreCase(conversation.policy_action)) {
        (Some("X") ++ label).reduceOption(_ + " " + _)
      } else if (conversation.event_type.nonEmpty && (conversation.event_type.get.contains("dlp") || conversation.event_type.get
                   .contains("waf"))) {
        (Some("$") ++ label).reduceOption(_ + " " + _)
      } else
        label
    }

  private def merge(xs: Option[Array[String]]*) = xs.flatten.reduceLeftOption(_ ++ _)

  private def getChildren: ConversationEndpoint => Option[Array[SubNode]] =
    (endpoint: ConversationEndpoint) => {
      endpoint.children match {
        case None => None
        case Some(nodes) =>
          Some(
            nodes.map(
              x =>
                SubNode(
                  x.id,
                  getCompactName(x.display_name, x.name),
                  x.scan_summary,
                  x.service_mesh_sidecar
                )
            )
          )
      }
    }

  private def getStatus: (EndPointConversation, Map[String, Node]) => String =
    (conversation: EndPointConversation, nodeMap: Map[String, Node]) => {
      if (!"allow".equalsIgnoreCase(conversation.policy_action) && !"open".equalsIgnoreCase(
            conversation.policy_action
          )) {
        conversation.policy_action
      } else {
        conversation.severity match {
          case None =>
            getCode(conversation, nodeMap)
          case Some("") =>
            getCode(conversation, nodeMap)
          case Some(value) => value
        }
      }
    }

  private def getCode: (EndPointConversation, Map[String, Node]) => String =
    (conversation: EndPointConversation, nodeMap: Map[String, Node]) => {

      val fromNode = nodeMap.get(conversation.from)
      val toNode   = nodeMap.get(conversation.to)
      if (fromNode.isEmpty || toNode.isEmpty) {
        logger.info(
          s"get hidden node: $fromNode - $toNode, ${conversation.from} - ${conversation.to}"
        )
        "OK"
      } else {
        if (nodeMap(conversation.from).clusterId == nodeMap(conversation.to).clusterId) {
          "intraGroup"
        } else {
          "OK"
        }
      }

    }

  private def getGroup: ConversationEndpoint => String = (endpoint: ConversationEndpoint) => {
    if ("container".equals(endpoint.kind) || "ip_service".equals(endpoint.kind)) {
      endpoint.state match {
        case "unmanaged" => "containerUnmanaged"
        case _ =>
          if (endpoint.service_mesh.getOrElse(false))
            s"mesh${endpoint.policy_mode.getOrElse("")}"
          else
            endpoint.kind + endpoint.policy_mode.getOrElse("")
      }
    } else {
      endpoint.kind match {
        case "node_ip" => {
          if (endpoint.service_group.isDefined &&
              endpoint.service_group.get.equalsIgnoreCase("nodes"))
            s"host${endpoint.policy_mode.getOrElse("")}"
          else endpoint.kind
        }
        case _ => endpoint.kind
      }
    }
  }

  private def getClusterId: ConversationEndpoint => String = (endpoint: ConversationEndpoint) => {
    val cluster = endpoint.service_group.getOrElse("")
    if (cluster.isEmpty) {
      setClusterName(endpoint)
    } else {
      cluster
    }
  }

  private def removeFirstAndLast[A](xs: Iterable[A]) = xs.drop(1).dropRight(1)

  private def getClusterName: ConversationEndpoint => String = (endpoint: ConversationEndpoint) => {
    val cluster = endpoint.service_group.getOrElse("")
    if (cluster.isEmpty) {
      setClusterName(endpoint)
    } else {
      val str = cluster.split("\\.")
      if (str.length < 3)
        cluster
      else
        removeFirstAndLast(str).mkString(".")
    }
  }

  private def setClusterName(endpoint: ConversationEndpoint): String =
    endpoint.kind match {
      case "node_ip" | "workload_ip" | `address` | "ip_service" => endpoint.id
      case _ =>
        logger.info(endpoint.toJson.prettyPrint)
        s"${endpoint.domain}_group"
    }

  private def getDomain: ConversationEndpoint => String = (endpoint: ConversationEndpoint) => {
    if (endpoint.domain.isEmpty) {
      endpoint.kind match {
        case "node_ip" =>
          if (endpoint.service_group.isDefined &&
              endpoint.service_group.get.equalsIgnoreCase("nodes")) "nvManagedNode"
          else "nvUnmanagedNode"
        case "workload_ip" | `address` => "nvUnmanagedWorkload"
        case "external"                => "external"
        case _                         => "_namespace"
      }
    } else {
      endpoint.domain
    }
  }

  val emptyThreatBriefDTO: ThreatBriefDTO = ThreatBriefDTO(" ", "", 0, "")

  def getCompactName: (String, String) => String = (display_name: String, name: String) => {
    display_name match {
      case x if x.isEmpty => name
      case _              => display_name
    }
  }

}
