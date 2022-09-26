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
  }

  val sprayV         = "1.3.3"
  val akkaV          = "2.3.14"

  val typesafeConfig = "com.typesafe"               % "config"         % "1.3.0"
  val slf4jLog4j     = "org.slf4j"                  % "slf4j-log4j12"  % "1.7.21"
  val scalaLogging   = "com.typesafe.scala-logging" %% "scala-logging" % "3.9.4"

  val akka           = "com.typesafe.akka" %% "akka-actor" % akkaV akkaExclude
  val akkaLog        = "com.typesafe.akka" %% "akka-slf4j" % akkaV

  val joda           = "joda-time"         % "joda-time"   % "2.9.2"

  val ehCache        = "net.sf.ehcache"    % "ehcache"     % "2.10.6"
  val guava          = "com.google.guava"  % "guava"       % "16.0.1"

  private val ioSpray: String = "io.spray"
  val sprayRoutingShapeless   = ioSpray %% "spray-routing-shapeless2" % sprayV
  val sprayCan                = ioSpray %% "spray-can" % sprayV
  val sprayJson               = ioSpray %% "spray-json" % "1.3.2" exclude ("org.scala-lang", "scala-library")
  val sprayClient             = ioSpray %% "spray-client" % sprayV exclude ("org.xerial.snappy", "snappy-java")

  val scalaTest = "org.scalatest" %% "scalatest" % "2.2.5" % "test" scalaTestExclude
  val spec2     = "org.specs2" %% "specs2" % "3.7" % "test"
}
