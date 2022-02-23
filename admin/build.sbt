test in assembly := {}

unmanagedResourceDirectories in Compile += baseDirectory.value / "webapp"

unmanagedResourceDirectories in Compile += baseDirectory.value / "lib"

excludeFilter in unmanagedResources := HiddenFileFilter || "node_modules*" || "project*" || "target*" || "bower_components*" || "app_src*"

Revolver.settings : Seq[sbt.Def.Setting[_]]

assembly / assemblyMergeStrategy  := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val strategy = (assembly / assemblyMergeStrategy).value(x)
    if (strategy == MergeStrategy.deduplicate) MergeStrategy.first
    else strategy
}
