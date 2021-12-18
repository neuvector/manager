test in assembly := {}

unmanagedResourceDirectories in Compile <++= baseDirectory {
  base => Seq(base / "webapp", base / "lib")
}

excludeFilter in unmanagedResources := HiddenFileFilter || "node_modules*" || "project*" || "target*" || "bower_components*" || "app_src*"

Revolver.settings : Seq[sbt.Def.Setting[_]]

ivyScala := ivyScala.value map { _.copy(overrideScalaVersion = true) }

assemblyMergeStrategy in assembly := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val strategy = (assemblyMergeStrategy in assembly).value(x)
    if (strategy == MergeStrategy.deduplicate) MergeStrategy.first
    else strategy
}
