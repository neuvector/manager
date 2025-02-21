import com.scalapenos.sbt.prompt.SbtPrompt.autoImport.*
import sbt.Keys.watchSources
import ExternalDependencies.*
import sbt.Keys.*
import sbt.*

ThisBuild / version                  := "1.0"
ThisBuild / scalaVersion             := "3.3.4"
ThisBuild / organization             := "com.neuvector"
ThisBuild / scalafmtOnCompile        := true
ThisBuild / semanticdbEnabled        := true
ThisBuild / Test / fork              := true
ThisBuild / Test / parallelExecution := true
ThisBuild / semanticdbVersion        := scalafixSemanticdb.revision

lazy val promptSettings = Seq(
  description :=
    """NeuVector Security Center""".stripMargin,
  homepage    := Some(url("https://github.com/neuvector/manager")),
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
    "-source:future",        // enable future language features
    "-Wunused:all"           // add required compiler option for RemoveUnused[1]
  ),
  Compile / console / scalacOptions --= Seq("-Ywarn-unused", "-Ywarn-unused-import")
)

lazy val commonDependencies = Seq(
  scalaTest,
  "javax.activation"   % "activation"         % "1.1.1",
  "org.glassfish.jaxb" % "jaxb-runtime"       % "4.0.5",
  "javax.xml.bind"     % "jaxb-api"           % "2.3.1",
  "com.sun.xml.ws"     % "jaxws-ri"           % "4.0.3",
  "javax.xml.soap"     % "javax.xml.soap-api" % "1.4.0",
  "org.json4s"        %% "json4s-native"      % "4.0.7",
  "org.bouncycastle"   % "bcprov-jdk18on"     % "1.79",
  "org.bouncycastle"   % "bcpkix-jdk18on"     % "1.79",
  "org.bouncycastle"   % "bctls-jdk18on"      % "1.80",
  pekkoActor,
  typesafeConfig,
  joda,
  slf4jLog4j,
  scalaLogging,
  sprayJson,
  ehCache,
  guava,
  // https://mvnrepository.com/artifact/org.apache.commons/commons-csv
  "org.apache.commons" % "commons-csv"        % "1.10.0"
)

lazy val commonSettings = Seq(
  javaOptions ++= Seq(
    "--add-opens=java.base/java.lang=ALL-UNNAMED",
    "--add-opens=java.base/java.util=ALL-UNNAMED",
    "--add-opens=java.base/java.io=ALL-UNNAMED"
  ),
  Test / javaOptions ++= Seq(
    "--add-opens=java.base/java.lang=ALL-UNNAMED",
    "--add-opens=java.base/java.util=ALL-UNNAMED",
    "--add-opens=java.base/java.io=ALL-UNNAMED"
  ),
  run / javaOptions ++= Seq(
    "--add-opens=java.base/java.lang=ALL-UNNAMED",
    "--add-opens=java.base/java.util=ALL-UNNAMED",
    "--add-opens=java.base/java.io=ALL-UNNAMED"
  )
)

// lazy val buil1dSettings = Defaults.coreDefaultSettings ++ Seq(
//   scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-target:jvm-1.7"),
//   libraryDependencies                        := Seq(scalaTest),
//   libraryDependencies += "javax.activation"   % "activation"         % "1.1.1",
//   libraryDependencies += "org.glassfish.jaxb" % "jaxb-runtime"       % "4.0.5",
//   libraryDependencies += "javax.xml.bind"     % "jaxb-api"           % "2.3.1",
//   libraryDependencies += "com.sun.xml.ws"     % "jaxws-ri"           % "4.0.2",
//   libraryDependencies += "javax.xml.soap"     % "javax.xml.soap-api" % "1.4.0",
//   libraryDependencies += "org.json4s"        %% "json4s-native"      % "4.0.7"
// )

lazy val manager = (project in file("."))
  .aggregate(common, admin)
  .settings(
    name        := "Manager",
    buildSettings,
    watchSources ++= (baseDirectory.value / "public/ui" ** "*").get,
    promptTheme := ScalapenosTheme
  )

lazy val common = (project in file("common"))
  .settings(
    name        := "common",
    buildSettings,
    commonSettings,
    promptTheme := ScalapenosTheme,
    libraryDependencies ++= commonDependencies
  )

lazy val admin = (project in file("admin"))
  .dependsOn(common)
  .settings(
    name        := "admin",
    buildSettings,
    commonSettings,
    promptTheme := ScalapenosTheme,
    libraryDependencies += pekkoHttp,
    libraryDependencies += pekkoJson,
    libraryDependencies += pekkoSlf4j,
    libraryDependencies += pekkoStream
  )

resolvers ++= Seq(
  ("spray repo".at("http://repo.spray.io")).withAllowInsecureProtocol(true),
  ("scalaz-bintray".at("http://dl.bintray.com/scalaz/releases")).withAllowInsecureProtocol(true),
  "Typesafe repository snapshots".at("https://repo.typesafe.com/typesafe/snapshots/"),
  "Typesafe repository releases".at("https://repo.typesafe.com/typesafe/releases/"),
  "Sonatype repo".at("https://oss.sonatype.org/content/groups/scala-tools/"),
  "Sonatype releases".at("https://oss.sonatype.org/content/repositories/releases"),
  "Sonatype snapshots".at("https://oss.sonatype.org/content/repositories/snapshots"),
  ("Sonatype staging"
    .at("http://oss.sonatype.org/content/repositories/staging"))
    .withAllowInsecureProtocol(true),
  ("Java.net Maven2 Repository"
    .at("http://download.java.net/maven/2/"))
    .withAllowInsecureProtocol(true),
  ("geomajas repo".at("http://maven.geomajas.org")).withAllowInsecureProtocol(true)
)

Test / scalacOptions ++= Seq("-Yrangepos")

assembly / test := {}

Revolver.settings: Seq[sbt.Def.Setting[_]]

assembly / assemblyMergeStrategy := {
  case PathList(ps @ _*) if ps.last.endsWith("io.netty.versions.properties") => MergeStrategy.first
  case x                                                                     =>
    val oldStrategy = (assembly / assemblyMergeStrategy).value
    oldStrategy(x)
}
