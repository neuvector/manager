import com.scalapenos.sbt.prompt.SbtPrompt.autoImport._
import sbt.Keys.watchSources
import ExternalDependencies._
import sbt.Keys._
import sbt._

ThisBuild / version                   := "1.0"
ThisBuild / scalaVersion              := "2.11.12"
ThisBuild / organization              := "com.neuvector"
//ThisBuild / scalafmtOnCompile         := true
//ThisBuild / fork in Test              := true
ThisBuild / parallelExecution in Test := true

lazy val promptSettings = Seq(
  description :=
    """NeuVector Security Center.
      """.stripMargin,
  homepage := Some(url("https://github.com/")),
  promptTheme := ScalapenosTheme
)

lazy val buildSettings = Seq(
  Compile / scalacOptions ++= Seq(
    "-encoding",
    "UTF-8", // source files are in UTF-8
    "-deprecation", // warn about use of deprecated APIs
    "-unchecked", // warn about unchecked type parameters
    "-feature", // warn about misused language features
    "-language:higherKinds", // allow higher kinded types without `import scala.language.higherKinds`
    "-Xlint", // enable handy linter warnings
    "-Ypartial-unification" // allow the compiler to unify type constructors of different arities
  ),
  Compile / console / scalacOptions --= Seq("-Ywarn-unused", "-Ywarn-unused-import")
)

lazy val commonDependencies = Seq(
  scalaTest,
  "javax.activation" % "activation" % "1.1",
  "org.glassfish.jaxb" % "jaxb-runtime" % "2.3.0",
  "javax.xml.bind" % "jaxb-api" % "2.3.0",
  "com.sun.xml.ws" % "jaxws-ri" % "2.3.3",
  "javax.xml.soap" % "javax.xml.soap-api" % "1.4.0",
  "org.json4s" %% "json4s-native" % "3.6.10",
  akka,
  typesafeConfig,
  joda,
  slf4jLog4j,
  scalaLogging,
  sprayJson,
  ehCache,
  guava
)

lazy val buil1dSettings = Defaults.coreDefaultSettings ++ Seq(
  scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-target:jvm-1.7"),
  libraryDependencies := Seq(scalaTest),
  // https://mvnrepository.com/artifact/javax.xml.ws/jaxws-api
  //libraryDependencies += "javax.xml.ws" % "jaxws-api" % "2.3.1"
  libraryDependencies += "javax.activation" % "activation" % "1.1",
  libraryDependencies += "org.glassfish.jaxb" % "jaxb-runtime" % "2.3.0",
  // https://mvnrepository.com/artifact/javax.xml.bind/jaxb-api
  libraryDependencies += "javax.xml.bind" % "jaxb-api" % "2.3.0",
  // https://github.com/stagemonitor/stagemonitor/issues/455
  libraryDependencies += "com.sun.xml.ws" % "jaxws-ri" % "2.3.3",
  // https://mvnrepository.com/artifact/com.sun.xml.bind/jaxb-core
  //libraryDependencies += "com.sun.xml.bind" % "jaxb-core" % "2.3.0.1"
  // https://mvnrepository.com/artifact/com.sun.xml.bind/jaxb-impl
  //libraryDependencies += "com.sun.xml.bind" % "jaxb-impl" % "2.3.2"
  // https://mvnrepository.com/artifact/javax.xml.soap/javax.xml.soap-api
  libraryDependencies += "javax.xml.soap" % "javax.xml.soap-api" % "1.4.0",
  libraryDependencies += "org.json4s" %% "json4s-native" % "3.6.10"
)

lazy val manager = (project in file("."))
  .aggregate (common, admin)
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
  ("spray repo"                       at "http://repo.spray.io").withAllowInsecureProtocol(true),
  ("scalaz-bintray"                   at "http://dl.bintray.com/scalaz/releases").withAllowInsecureProtocol(true),
  "Typesafe repository snapshots"    at "https://repo.typesafe.com/typesafe/snapshots/",
  "Typesafe repository releases"     at "https://repo.typesafe.com/typesafe/releases/",
  "Sonatype repo"                    at "https://oss.sonatype.org/content/groups/scala-tools/",
  "Sonatype releases"                at "https://oss.sonatype.org/content/repositories/releases",
  "Sonatype snapshots"               at "https://oss.sonatype.org/content/repositories/snapshots",
  ("Sonatype staging"                 at "http://oss.sonatype.org/content/repositories/staging").withAllowInsecureProtocol(true),
  ("Java.net Maven2 Repository"       at "http://download.java.net/maven/2/").withAllowInsecureProtocol(true),
  ("geomajas repo"                    at "http://maven.geomajas.org").withAllowInsecureProtocol(true)
)

addCompilerPlugin("org.typelevel" %% "kind-projector" % "0.10.3")

scalacOptions in Test ++= Seq("-Yrangepos")

test in assembly := {}


Revolver.settings : Seq[sbt.Def.Setting[_]]

scalafmtOnCompile := true

assembly / assemblyMergeStrategy := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val oldStrategy = (assembly / assemblyMergeStrategy ).value
    oldStrategy(x)
}
