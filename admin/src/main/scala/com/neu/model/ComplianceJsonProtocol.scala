package com.neu.model

import spray.json.{DefaultJsonProtocol, _}

object ComplianceJsonProtocol extends DefaultJsonProtocol {
  implicit val complianceProfileEntryFormat: RootJsonFormat[ComplianceProfileEntry] = jsonFormat2(
    ComplianceProfileEntry
  )

  implicit val complianceProfileEntryDataFormat: RootJsonFormat[ComplianceProfileEntryData] = jsonFormat1(
    ComplianceProfileEntryData
  )

  implicit val complianceProfileEntryDTOFormat: RootJsonFormat[ComplianceProfileEntryDTO] = jsonFormat2(
    ComplianceProfileEntryDTO
  )

  implicit val complianceProfileFormat: RootJsonFormat[ComplianceProfile] = jsonFormat3(
    ComplianceProfile
  )

  implicit val complianceProfileDataFormat: RootJsonFormat[ComplianceProfileData] = jsonFormat1(
    ComplianceProfileData
  )

  implicit val complianceProfilesDataFormat: RootJsonFormat[ComplianceProfilesData] = jsonFormat1(
    ComplianceProfilesData
  )

  implicit val complianceProfileConfigFormat: RootJsonFormat[ComplianceProfileConfig] = jsonFormat3(
    ComplianceProfileConfig
  )

  implicit val complianceProfileConfigDataFormat: RootJsonFormat[ComplianceProfileConfigData] =
    jsonFormat1(
      ComplianceProfileConfigData
    )

  def configWrapToJson(config: ComplianceProfileConfigData): String =
    config.toJson.compactPrint

  def profileWrapToJson(profile: ComplianceProfileEntryData): String =
    profile.toJson.compactPrint
}
