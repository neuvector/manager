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

     def pekkoExclude: ModuleID =
       module
         .exclude(scalaLang, scalaLib)
         .exclude("com.typesafe", "config")
  }

  val sprayV = "1.3.3"
  val pekkoV = "1.0.3"

  val typesafeConfig = "com.typesafe"               % "config"         % "1.3.0"
  val slf4jLog4j     = "org.slf4j"                  % "slf4j-log4j12"  % "1.7.21"
  val scalaLogging   = "com.typesafe.scala-logging" %% "scala-logging" % "3.9.4"

  val joda           = "joda-time"         % "joda-time"   % "2.9.2"

  val ehCache        = "net.sf.ehcache"    % "ehcache"     % "2.10.6"
  val guava          = "com.google.guava"  % "guava"       % "33.3.0-jre"

  val pekkoActor   = "org.apache.pekko" %% "pekko-actor"   % pekkoV pekkoExclude
  val pekkoHttp   = "org.apache.pekko" %% "pekko-http"   % "1.0.1"
  val pekkoJson = "org.apache.pekko" %% "pekko-http-spray-json" % "1.0.1"
  val pekkoSlf4j   = "org.apache.pekko" %% "pekko-slf4j"   % pekkoV
  val pekkoStream  = "org.apache.pekko" %% "pekko-stream"  % pekkoV

  private val ioSpray: String = "io.spray"
  val sprayJson               = ioSpray %% "spray-json" % "1.3.6" exclude ("org.scala-lang", "scala-library")

  val scalaTest = "org.scalatest" %% "scalatest" % "3.2.16" % "test" scalaTestExclude
  val spec2     = "org.specs2" %% "specs2" % "3.7" % "test"
}
