test in assembly := {}

assembly / assemblyMergeStrategy := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val oldStrategy = (assembly / assemblyMergeStrategy).value
    oldStrategy(x)
}