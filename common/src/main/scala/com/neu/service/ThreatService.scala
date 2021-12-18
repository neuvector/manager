//package com.neu.service
//
//import com.neu.model.Threat
//import scala.concurrent.Future
//
///**
//  * Services for Node
//  */
//trait ThreatService {
//
//  /**
//    * Save [[com.neu.model.Threat]] into database
//    * @param threat The [[com.neu.model.Threat]] object
//    * @return [[scala.concurrent.Future]] of [[Unit]]
//    */
//  def save(threat: Threat): Future[Unit]
//
//  /**
//    * Get [[com.neu.model.Threat]] details by id
//    * @param id The id of the [[com.neu.model.Threat]]
//    * @return [[com.neu.model.Threat]] object
//    */
//  def getById(id: String): Future[Option[Threat]]
//
//  /**
//    * Get all the [[com.neu.model.Threat]]
//    * @return [[List]] of [[com.neu.model.Threat]] as [[scala.concurrent.Future]]
//    */
//  def getAllThreats: Future[List[Threat]]
//
//  /**
//    * Get paged threats
//    * @param start The start position
//    * @param limit The page size
//    * @return Iterator of Threats
//    */
//  def getThreatPage(start: Int, limit: Int): Future[Iterator[Threat]]
//}
