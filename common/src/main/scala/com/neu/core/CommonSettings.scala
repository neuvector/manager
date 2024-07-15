package com.neu.core

import akka.japi.Util.immutableSeq
import com.typesafe.config.{ Config, ConfigFactory }
import com.typesafe.scalalogging.LazyLogging

/**
 * Configuration for the system, load from application.conf
 *
 */
object CommonSettings extends LazyLogging {

  protected val config: Config = ConfigFactory.load.getConfig("common")

  val gravatarEnabled: String = sys.env.getOrElse("GRAVATAR_ENABLED", "false")
  val ctrlHost: String =
    sys.env.getOrElse("CTRL_SERVER_IP", config.getString("rest.ctrl.server.ip"))
  val ctrlPort: String =
    sys.env.getOrElse("CTRL_SERVER_PORT", config.getString("rest.ctrl.server.port"))

  val httpPort: String =
    sys.env.getOrElse("MANAGER_SERVER_PORT", config.getString("rest.server.port"))
  val trustStore: String  = config.getString("rest.trust.store")
  val newCert: String     = config.getString("rest.new.cert")
  val newKey: String      = config.getString("rest.new.key")
  val newMgrCert: String  = config.getString("rest.new.mgr.cert")
  val newMgrKey: String   = config.getString("rest.new.mgr.key")
  val newCtrlCert: String = config.getString("rest.new.ctrl.cert")
  val newCtrlKey: String  = config.getString("rest.new.ctrl.key")

  val eulaOEMAppSafe: String =
    sys.env.getOrElse("EULA_OEM_APPSAFE", config.getString("product.eula.oem.appsafe"))

  val cassandraUser: String                = config.getString("cassandra.user")
  val cassandraPassword: String            = config.getString("cassandra.password")
  val cassandraConcurrency: Int            = config.getInt("cassandra.concurrency")
  val cassandraKeyspace: String            = config.getString("cassandra.keySpace")
  val cassandraHosts: String               = config.getString("cassandra.contact.points")
  val nodeTableName: String                = config.getString("cassandra.table.node")
  val eventTableName: String               = config.getString("cassandra.table.event")
  val conversationTableName: String        = config.getString("cassandra.table.conversation")
  val conversationHistoryTableName: String = config.getString("cassandra.table.conversationHistory")
  val ttl: Int                             = config.getInt("cassandra.ttl")
  val pageSize: Int                        = config.getInt("cassandra.page.size")
  val testMode: Boolean                    = config.getBoolean("cassandra.test.mode")
  val recordLimit: Int                     = config.getInt("cassandra.record.limit")

  val zookeeper: String         = config.getString("kafka.zookeeper")
  val numPartitions: Int        = config.getInt("kafka.partition.num")
  val eventTopic: String        = config.getString("kafka.event.topic")
  val eventGroup: String        = config.getString("kafka.event.group")
  val threatTopic: String       = config.getString("kafka.threat.topic")
  val threatGroup: String       = config.getString("kafka.threat.group")
  val conversationTopic: String = config.getString("kafka.conversation.topic")
  val conversationGroup: String = config.getString("kafka.conversation.group")

  val brokerList: Set[String] = immutableSeq(
    config.getStringList("kafka.producer.metadata.broker.list")
  ).toSet
  val kafkaSerializer: String = config.getString("kafka.producer.serializer.class")
  val kafkaBatchSize: Int     = config.getInt("kafka.producer.batch.size")

  val managerVersion: String = config.getString("product.manager.version")

  val customLoginLogo: String         = sys.env.getOrElse("CUSTOM_LOGIN_LOGO", "")
  val customPolicy: String            = sys.env.getOrElse("CUSTOM_EULA_POLICY", "")
  val customPageHeaderContent: String = sys.env.getOrElse("CUSTOM_PAGE_HEADER_CONTENT", "")
  val customPageHeaderColor: String   = sys.env.getOrElse("CUSTOM_PAGE_HEADER_COLOR", "")
  val customPageFooterContent: String = sys.env.getOrElse("CUSTOM_PAGE_FOOTER_CONTENT", "")
  val customPageFooterColor: String   = sys.env.getOrElse("CUSTOM_PAGE_FOOTER_COLOR", "")
}
