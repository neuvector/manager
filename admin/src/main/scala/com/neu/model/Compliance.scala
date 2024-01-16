package com.neu.model

case class ComplianceNISTConfig(
  names: Array[String]
)

case class ComplianceNISTConfigData(
  config: ComplianceNISTConfig
)

case class ComplianceProfileEntry(
  test_number: String,
  tags: Array[String]
)

case class ComplianceProfileEntryData(
  entry: ComplianceProfileEntry
)

case class ComplianceProfileEntryDTO(
  name: String,
  entry: ComplianceProfileEntry
)

case class ComplianceProfile(
  name: String,
  disable_system: Boolean,
  entries: Array[ComplianceProfileEntry]
)

case class ComplianceProfileData(
  profile: ComplianceProfile
)

case class ComplianceProfilesData(
  profiles: Array[ComplianceProfile]
)

case class ComplianceProfileConfig(
  name: String,
  disable_system: Option[Boolean],
  entries: Option[Array[ComplianceProfileEntry]]
)

case class ComplianceProfileConfigData(
  config: ComplianceProfileConfig
)

case class ComplianceProfileExportData(
  names: Array[String],
  remote_export_options: Option[RemoteExportOptions] = None
)
