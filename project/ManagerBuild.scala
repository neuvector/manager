import ExternalDependencies._
import com.scalapenos.sbt.prompt.SbtPrompt.autoImport._
import sbt.Keys._
import sbt._

object ManagerBuild extends Build {

  lazy val promptSettings = Seq(
    description :=
      """NeuVector Security Center.
      """.stripMargin,
    homepage := Some(url("https://github.com/")),
    promptTheme := ScalapenosTheme
  )

  private val buildSettings = Defaults.coreDefaultSettings ++ Seq(
    scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-target:jvm-1.7"),
    version := "1.0",
    scalaVersion := "2.11.12",
    organization := "com.neu",
    libraryDependencies := Seq(scalaTest),
    // https://mvnrepository.com/artifact/javax.xml.ws/jaxws-api
    //libraryDependencies += "javax.xml.ws" % "jaxws-api" % "2.3.1"
    libraryDependencies += "javax.activation" % "activation" % "1.1",
    libraryDependencies += "org.glassfish.jaxb" % "jaxb-runtime" % "2.3.0",
    // https://mvnrepository.com/artifact/javax.xml.bind/jaxb-api
    libraryDependencies += "javax.xml.bind" % "jaxb-api" % "2.3.0",
    // https://github.com/stagemonitor/stagemonitor/issues/455
    libraryDependencies += "com.sun.xml.ws" % "jaxws-ri" % "2.3.0",
    // https://mvnrepository.com/artifact/com.sun.xml.bind/jaxb-core
    //libraryDependencies += "com.sun.xml.bind" % "jaxb-core" % "2.3.0.1"
    // https://mvnrepository.com/artifact/com.sun.xml.bind/jaxb-impl
    //libraryDependencies += "com.sun.xml.bind" % "jaxb-impl" % "2.3.2"
    // https://mvnrepository.com/artifact/javax.xml.soap/javax.xml.soap-api
    libraryDependencies += "javax.xml.soap" % "javax.xml.soap-api" % "1.4.0",
    libraryDependencies += "org.json4s" %% "json4s-native" % "3.6.10"
  )

  lazy val manager = Project(
    id = "manager",
    base = file("."),
    settings = buildSettings ++ promptSettings ++ Seq()
  ) aggregate (common, admin)

  lazy val common = Project(
    id = "common",
    base = file("common"),
    settings = buildSettings ++ promptSettings ++ Seq(
      libraryDependencies += akka,
      libraryDependencies += typesafeConfig,
      libraryDependencies += joda,
      libraryDependencies += slf4jLog4j,
      libraryDependencies += scalaLogging,
      libraryDependencies += sprayJson,
      libraryDependencies += ehCache,
      libraryDependencies += guava
//      libraryDependencies += phantomDsl,
//      libraryDependencies += phantomZookeeper
    )
  )

  lazy val admin = Project(
    id = "admin",
    base = file("admin"),
    settings = buildSettings ++ promptSettings ++ Seq(
      libraryDependencies += sprayRoutingShapeless,
      libraryDependencies += sprayCan,
      libraryDependencies += sprayClient,
      libraryDependencies += akkaLog,
      libraryDependencies += spec2
    )
  ).dependsOn(common)

//  lazy val store = Project(
//    id = "store",
//    base = file("store"),
//    settings = buildSettings ++ promptSettings ++ Seq(
//      libraryDependencies += akkaLog,
//      libraryDependencies += kafkaRx
//    )
//  ).dependsOn(common)
}
