import sbt._

object ExternalDependencies {
  implicit class Exclude(module: ModuleID) {
    private val scalaLang: String   = "org.scala-lang"
    private val scalaLib: String    = "scala-library"
    private val scalaModule: String = "org.scala-lang.modules"

    def scalaLoggingExclude: ModuleID =
      module
        .exclude("org.slf4j", "slf4j-api")
        .exclude(scalaLang, scalaLib)
        .exclude(scalaLang, "scala-reflect")

    def scalaTestExclude: ModuleID =
      module exclude (scalaModule, "scala-xml")

    def akkaExclude: ModuleID =
      module
        .exclude(scalaLang, scalaLib)
        .exclude("com.typesafe", "config")

//    def phantomExclude: ModuleID =
//      module
//        .exclude("ch.qos.logback", "logback-classic")
//        .exclude("com.chuusai", "shapeless")
//        .exclude(scalaLang, scalaLib)
//        .exclude(scalaLang, "scala-reflect")
//        .exclude("org.slf4j", "log4j-over-slf4j")
//        .exclude("org.jboss.netty", "netty")
//        .exclude("org.xerial.snappy", "snappy-java")
//        .exclude("joda-time", "joda-time")
////      .exclude("com.twitter", "util-core" )
////      .exclude("com.typesafe.play", "play-iteratees")
////      .exclude("io.netty", "netty-handler")
////      .exclude("io.netty", "netty-transport-native-epoll")
//        .exclude("io.dropwizard.metrics", "metrics-core")
//        .exclude("org.apache.zookeeper", "zookeeper")

//    def kafkaExclude: ModuleID =
//      module
//        .exclude("com.101tec", "zkclient")
//        .exclude("net.sf.jopt-simple", "jopt-simple")
//        .exclude("org.apache.zookeeper", "zookeeper")
//        .exclude(scalaLang, scalaLib)
//        .exclude(scalaModule, "scala-parser-combinators")
//        .exclude(scalaModule, "scala-xml")
  }
//  val phantomVersion = "1.22.0"
  val sprayV         = "1.3.3"
  val akkaV          = "2.3.14"

  val typesafeConfig = "com.typesafe"               % "config"         % "1.3.0"
  val slf4jLog4j     = "org.slf4j"                  % "slf4j-log4j12"  % "1.7.21"
  val scalaLogging   = "com.typesafe.scala-logging" %% "scala-logging" % "3.4.0"

  val akka           = "com.typesafe.akka" %% "akka-actor" % akkaV akkaExclude
  val akkaLog        = "com.typesafe.akka" %% "akka-slf4j" % akkaV

  val joda           = "joda-time"         % "joda-time"   % "2.9.2"

  val ehCache        = "net.sf.ehcache"    % "ehcache"     % "2.10.6"
  val guava          = "com.google.guava"  % "guava"       % "16.0.1"

//  val kafkaRx = "com.cj"           %% "kafka-rx" % "0.3.1" exclude ("org.apache.kafka", "kafka")
//  val kafka   = "org.apache.kafka" %% "kafka"    % "0.9.0.1"

  private val ioSpray: String = "io.spray"
  val sprayRoutingShapeless   = ioSpray %% "spray-routing-shapeless2" % sprayV
  val sprayCan                = ioSpray %% "spray-can" % sprayV
  val sprayJson               = ioSpray %% "spray-json" % "1.3.2" exclude ("org.scala-lang", "scala-library")
  val sprayClient             = ioSpray %% "spray-client" % sprayV exclude ("org.xerial.snappy", "snappy-java")

//  val phantomDsl       = "com.websudos" %% "phantom-dsl"       % phantomVersion phantomExclude
//  val phantomZookeeper = "com.websudos" %% "phantom-zookeeper" % phantomVersion phantomExclude
//  val phantomTest = "com.websudos" %% "phantom-testkit" % "1.12.2" % "test, provided"

  val scalaTest = "org.scalatest" %% "scalatest" % "2.2.5" % "test" scalaTestExclude
  val spec2     = "org.specs2" %% "specs2" % "3.7" % "test"
}
