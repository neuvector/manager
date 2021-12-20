test in assembly := {}

ivyScala := ivyScala.value map { _.copy(overrideScalaVersion = true) }

assemblyMergeStrategy in assembly := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val oldStrategy = (assemblyMergeStrategy in assembly).value
    oldStrategy(x)
}