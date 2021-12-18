package com.neu.model

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
