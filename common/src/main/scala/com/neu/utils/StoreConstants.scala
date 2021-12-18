//package com.neu.utils
//
//import scala.util.Random
//
///**
//  * Created by bxu on 5/6/16.
//  */
//object StoreConstants {
//  val topics = Array("events", "threats", "conversations")
//  val logLevel = Array("EMERG", "ALERT", "CRIT", "ERR", "WARNING", "NOTICE", "INFO", "DEBUG")
//  //noinspection ScalaStyle
//  val severitys = Array("critical", "high", "medium", "low", "info")
//  val eventNames = Array("Container.Start", "Container.Stop", "Container.Remove", "Container.Secured",
//    "Container.Unsecured", "Enforcer.Start", "Enforcer.Join", "Enforcer.Leave", "Enforcer.Stop",
//    "Enforcer.Disconnect", "Controller.Start", "Controller.Join", "Controller.Leave", "Controller.Stop",
//    "User.Login", "User.Logout", "User.Timeout", "User.Login.Failed", "Config.Workload", "Config.Enforcer")
//  val eventCategory = Array("CONFIG", "AUTH", "WORKLOAD", "ENFORCER", "CONTROLLER")
//  val actions = Array("allow", "block", "violate")
//  val typeSeverity = Array(("DDos", "critical"), ("SQL Injection", "critical"), ("SSL 1.0", "medium"),
//    ("MS MFT", "high"), ("Panda Candle", "high"), ("Wu", "info"))
//
//  val containers = Array(("allInOne", "17da424523c3"), ("kafka1", "34ae324921d2"), ("zookeeper", "21cd514723b1"),
//    ("Kafka2", "65ca42452312"), ("mysql-proxy", "60da23458901"), ("nginx-main", "113a5245ae43"),
//    ("nginx1", "90b4424109c5"), ("apache", "09b24245276b"))
//
//  def getRandomItem: (Array[String]) => String = (items: Array[String]) => {
//    items(Random.nextInt(items.length))
//  }
//
//  def getRandomPair: (Array[(String, String)]) => (String, String) = (items: Array[(String, String)]) => {
//    items(Random.nextInt(items.length))
//  }
//}
