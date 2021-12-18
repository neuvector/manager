name := "manager"

version := "1.0"

resolvers += "spray repo" at "http://repo.spray.io"

resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"

resolvers ++= Seq(
  "Typesafe repository snapshots" at "https://repo.typesafe.com/typesafe/snapshots/",
  "Typesafe repository releases" at "https://repo.typesafe.com/typesafe/releases/",
  "Sonatype repo"                    at "https://oss.sonatype.org/content/groups/scala-tools/",
  "Sonatype releases"                at "https://oss.sonatype.org/content/repositories/releases",
  "Sonatype snapshots"               at "https://oss.sonatype.org/content/repositories/snapshots",
  "Sonatype staging"                 at "http://oss.sonatype.org/content/repositories/staging",
  "Java.net Maven2 Repository"       at "http://download.java.net/maven/2/",
  "Twitter Repository"               at "http://maven.twttr.com",
  "geomajas repo"                    at "http://maven.geomajas.org",
  Resolver.bintrayRepo("websudos", "oss-releases")
)

scalacOptions in Test ++= Seq("-Yrangepos")

test in assembly := {}


Revolver.settings : Seq[sbt.Def.Setting[_]]

ivyScala := ivyScala.value map { _.copy(overrideScalaVersion = true) }

assemblyMergeStrategy in assembly := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val oldStrategy = (assemblyMergeStrategy in assembly).value
    oldStrategy(x)
}
