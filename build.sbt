import com.scalapenos.sbt.prompt.SbtPrompt.autoImport._
import sbt.Keys.watchSources
import ExternalDependencies._
import sbt.Keys._
import sbt._

ThisBuild / version := "1.0"
ThisBuild / scalaVersion := "2.11.12"
ThisBuild / organization := "com.neuvector"
ThisBuild / scalafmtOnCompile := true
ThisBuild / Test / fork := true
ThisBuild / Test / parallelExecution := true

lazy val promptSettings = Seq(
  description :=
    """NeuVector Security Center""".stripMargin,
  homepage := Some(url("https://github.com/neuvector/manager")),
  promptTheme := ScalapenosTheme
)

lazy val buildSettings = Seq(
  Compile / scalacOptions ++= Seq(
      "-encoding",
      "UTF-8",                 // source files are in UTF-8
      "-deprecation",          // warn about use of deprecated APIs
      "-unchecked",            // warn about unchecked type parameters
      "-feature",              // warn about misused language features
      "-language:higherKinds", // allow higher kinded types without `import scala.language.higherKinds`
      "-Xlint",                // enable handy linter warnings
      "-Ypartial-unification"  // allow the compiler to unify type constructors of different arities
    ),
  Compile / console / scalacOptions --= Seq("-Ywarn-unused", "-Ywarn-unused-import")
)

lazy val commonDependencies = Seq(
  scalaTest,
  "javax.activation"   % "activation"         % "1.1",
  "org.glassfish.jaxb" % "jaxb-runtime"       % "2.3.0",
  "javax.xml.bind"     % "jaxb-api"           % "2.3.0",
  "com.sun.xml.ws"     % "jaxws-ri"           % "2.3.3",
  "javax.xml.soap"     % "javax.xml.soap-api" % "1.4.0",
  "org.json4s"         %% "json4s-native"     % "3.6.10",
  "org.bouncycastle" % "bcprov-jdk15on" % "1.70",
  "org.bouncycastle" % "bcpkix-jdk15on" % "1.70",
  akka,
  typesafeConfig,
  joda,
  slf4jLog4j,
  scalaLogging,
  sprayJson,
  ehCache,
  guava,
  // https://mvnrepository.com/artifact/org.apache.commons/commons-csv
  "org.apache.commons" % "commons-csv" % "1.9.0"
)

lazy val buil1dSettings = Defaults.coreDefaultSettings ++ Seq(
    scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-target:jvm-1.7"),
    libraryDependencies := Seq(scalaTest),
    libraryDependencies += "javax.activation"   % "activation"         % "1.1",
    libraryDependencies += "org.glassfish.jaxb" % "jaxb-runtime"       % "2.3.0",
    libraryDependencies += "javax.xml.bind"     % "jaxb-api"           % "2.3.0",
    libraryDependencies += "com.sun.xml.ws"     % "jaxws-ri"           % "2.3.3",
    libraryDependencies += "javax.xml.soap"     % "javax.xml.soap-api" % "1.4.0",
    libraryDependencies += "org.json4s"         %% "json4s-native"     % "3.6.10"
  )

lazy val manager = (project in file("."))
  .aggregate(common, admin)
  .settings(
    name := "Manager",
    buildSettings,
    watchSources ++= (baseDirectory.value / "public/ui" ** "*").get,
    promptTheme := ScalapenosTheme
  )

lazy val common = (project in file("common"))
  .settings(
    name := "common",
    buildSettings,
    promptTheme := ScalapenosTheme,
    libraryDependencies ++= commonDependencies
  )

lazy val admin = (project in file("admin"))
  .dependsOn(common)
  .settings(
    name := "admin",
    buildSettings,
    promptTheme := ScalapenosTheme,
    libraryDependencies += sprayRoutingShapeless,
    libraryDependencies += sprayCan,
    libraryDependencies += sprayClient,
    libraryDependencies += akkaLog,
    libraryDependencies += spec2
  )

resolvers ++= Seq(
  ("spray repo" at "http://repo.spray.io").withAllowInsecureProtocol(true),
  ("scalaz-bintray" at "http://dl.bintray.com/scalaz/releases").withAllowInsecureProtocol(true),
  "Typesafe repository snapshots" at "https://repo.typesafe.com/typesafe/snapshots/",
  "Typesafe repository releases" at "https://repo.typesafe.com/typesafe/releases/",
  "Sonatype repo" at "https://oss.sonatype.org/content/groups/scala-tools/",
  "Sonatype releases" at "https://oss.sonatype.org/content/repositories/releases",
  "Sonatype snapshots" at "https://oss.sonatype.org/content/repositories/snapshots",
  ("Sonatype staging" at "http://oss.sonatype.org/content/repositories/staging")
    .withAllowInsecureProtocol(true),
  ("Java.net Maven2 Repository" at "http://download.java.net/maven/2/")
    .withAllowInsecureProtocol(true),
  ("geomajas repo" at "http://maven.geomajas.org").withAllowInsecureProtocol(true)
)

addCompilerPlugin("org.typelevel" %% "kind-projector" % "0.10.3")

Test / scalacOptions ++= Seq("-Yrangepos")

assembly / test := {}

Revolver.settings: Seq[sbt.Def.Setting[_]]

assembly / assemblyMergeStrategy := {
  case PathList(ps @ _*) if ps.last endsWith "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val oldStrategy = (assembly / assemblyMergeStrategy).value
    oldStrategy(x)
}
