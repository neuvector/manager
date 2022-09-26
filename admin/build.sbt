assembly / test := {}

Compile / unmanagedResourceDirectories += baseDirectory.value / "webapp"

Compile / unmanagedResourceDirectories += baseDirectory.value / "lib"

unmanagedResources / excludeFilter := HiddenFileFilter || "node_modules*" || "project*" || "target*" || "bower_components*" || "websrc"

Revolver.settings : Seq[sbt.Def.Setting[_]]

assembly / assemblyMergeStrategy  := {
  case PathList(ps @ _*) if ps.last endsWith  "io.netty.versions.properties" => MergeStrategy.first
  case x =>
    val strategy = (assembly / assemblyMergeStrategy).value(x)
    if (strategy == MergeStrategy.deduplicate) MergeStrategy.first
    else strategy
}
