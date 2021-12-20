//package com.neu.service
//
//import com.neu.model.Event
//
//import scala.concurrent.Future
//
///**
//  * Services for Node
//  */
//trait EventService {
//
//  /**
//    * Save [[com.neu.model.Event]] into database
//    * @param event The [[com.neu.model.Event]] object
//    * @return [[scala.concurrent.Future]] of [[Unit]]
//    */
//  def save(event: Event): Future[Unit]
//
//  /**
//    * Get [[com.neu.model.Event]] details by id
//    * @param id The UUID of the [[com.neu.model.Event]]
//    * @return [[com.neu.model.Event]] object
//    */
//  def getById(id: String): Future[Option[Event]]
//
//  /**
//    * Get all the [[com.neu.model.Event]]
//    * @return [[List]] of [[com.neu.model.Event]] as [[scala.concurrent.Future]]
//    */
//  def getAllEvents: Future[List[Event]]
//
//  /**
//    * Get paged events
//    * @param start The start position
//    * @param limit The page size
//    * @return Iterator of Events
//    */
//  def getEventPage(start: Int, limit: Int): Future[Iterator[Event]]
//}
