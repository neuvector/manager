package com.neu.model

/**
 * Created by bxu on 5/4/16.
 *
 * Domain objects for network graph
 */
/**
 * Scan brief summary for the endpoint
 * @param status
 *   The status of the scanning process on the endpoint
 * @param high
 *   The high risky vulnerable item number
 * @param medium
 *   The medium risky vulnerable item number
 */
case class ScanBrief(status: String, high: Int, medium: Int)

case class SubNode(
  id: String,
  label: String,
  scanBrief: Option[ScanBrief],
  sidecar: Option[Boolean] = None
)

case class Fixed(x: Boolean, y: Boolean)

/**
 * The node of the network graph which represent current active container
 * @param id
 *   the id of the container
 * @param label
 *   the name of the container
 */
case class Node(
  id: String,
  label: String,
  group: String,
  clusterId: String,
  clusterName: String,
  scanBrief: Option[ScanBrief],
  platform_role: String = "",
  state: String,
  domain: String,
  cap_quarantine: Boolean,
  cap_change_mode: Boolean,
  cap_sniff: Boolean,
  service_mesh: Option[Boolean] = None,
  service_mesh_sidecar: Option[Boolean] = None,
  children: Option[Array[SubNode]] = None,
  policyMode: Option[String] = None,
  x: Option[Float] = None,
  y: Option[Float] = None,
  fixed: Option[Fixed] = None
)

case class Position(x: Float, y: Float)

case class UserGraphLayout(user: String, nodePositions: Option[Map[String, Position]])

case class GraphEndpoint(name: String, id: String)
case class GraphItem(name: String)

/**
 * Hidden items for Graph Layout.
 * @param domains
 *   The hidden domains
 * @param groups
 *   The hidden groups
 * @param endpoints
 *   The hidden endpoints
 */
case class Blacklist(
  domains: Array[GraphItem],
  groups: Array[GraphItem],
  endpoints: Array[GraphEndpoint]
)

case class UserBlacklist(user: String, blacklist: Option[Blacklist])

case class Scale(enabled: Boolean, scaleFactor: Double)

case class Direction(to: Scale)

/**
 * Edge of the network graph
 * @param source
 *   the id of the client container
 * @param target
 *   the id of the server container
 * @param status
 *   the status of the conversation
 */
case class Edge(
  id: Option[String],
  source: String,
  target: String,
  label: Option[String] = None,
  status: String = "OK",
  fromGroup: Option[String] = None,
  toGroup: Option[String] = None,
  fromDomain: Option[String] = None,
  toDomain: Option[String] = None,
  protocols: Option[Array[String]],
  applications: Option[Array[String]],
  event_type: Option[Seq[String]] = None,
  sidecar_proxy: Option[Boolean] = None,
  bytes: Long
)

case class NetworkGraph(
  nodes: Array[Node],
  edges: Array[Edge],
  blacklist: Option[Blacklist] = None,
  enableGPU: Boolean = false
)
