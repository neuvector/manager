//package com.neu.service.cassandra
//
//import com.datastax.driver.core.ResultSet
//import com.neu.model._
//import com.neu.utils.EnumUtils
//import com.websudos.phantom.connectors.KeySpaceDef
//import com.websudos.phantom.dsl._
//
//import scala.concurrent.Future
//import scala.concurrent.Await
//import scala.concurrent.duration._
//
///**
//  * Created by bxu on 2/29/16.
//  *
//  * Node database with [[com.neu.model.SmartConnector]]
//  */
//class DataStore(override val connector: KeySpaceDef) extends Database(connector) {
//  object ConversationHistories extends ConcreteConversationHistories with connector.Connector
//  object Conversations         extends ConcreteConversation with connector.Connector
//  object ContainerApps         extends ConcreteContainerApplications with connector.Connector
//  object ConversationVolumes   extends ConcreteConversationVolume with connector.Connector
//  object Events                extends ConcreteEvents with connector.Connector
//  object Threats               extends ConcreteThreats with connector.Connector
//  object ThreatCounts          extends ConcreteThreatCount with connector.Connector
//
//  def saveConversation(history: ConversationHistory): Future[ResultSet] =
//    for {
//      his <- ConversationHistories.save(history)
//      snapshot <- Conversations.save(
//        Conversation(history.client_id,
//                     history.clientName,
//                     history.server_id,
//                     history.serverName,
//                     history.last_seen_at,
//                     history.severity)
//      )
//      apps <- ContainerApps.saveOrUpdate(
//        ContainerApplications(history.server_id, history.application)
//      )
//      volume <- ConversationVolumes.updateCount(
//        ConversationVolume(history.server_id, history.bytes)
//      )
//    } yield volume
//
//  def saveThreat(threat: Threat): Future[ResultSet] =
//    for {
//      insert <- Threats.save(threat)
//      counts <- ThreatCounts.updateCount(threat.name, EnumUtils.getCode(threat.severity))
//    } yield counts
//}
//
//object DataStore extends DataStore(SmartConnector.connector) {
//
//  /**
//    * Install schema, auto create all the tables list in NodeDatabase
//    *
//    * @return
//    */
//  def installSchema: Seq[ResultSet] = Await.result(autocreate.future(), 600.seconds)
//
//  /**
//    * Clean up schema, auto truncate all the tables list in NodeDatabase
//    *
//    * @return
//    */
//  def cleanUpSchema: Seq[ResultSet] = Await.result(autotruncate.future(), 300.seconds)
//}
