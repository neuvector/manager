package com.neu.model

import spray.json.*

object ComplianceJsonProtocol extends DefaultJsonProtocol {
  implicit val complianceNISTConfigFormat: RootJsonFormat[ComplianceNISTConfig] =
    jsonFormat1(ComplianceNISTConfig)

  implicit val complianceNISTConfigDataFormat: RootJsonFormat[ComplianceNISTConfigData] =
    jsonFormat1(ComplianceNISTConfigData)

  implicit val complianceProfileEntryFormat: RootJsonFormat[ComplianceProfileEntry] = jsonFormat2(
    ComplianceProfileEntry
  )

  implicit val complianceProfileEntryDataFormat: RootJsonFormat[ComplianceProfileEntryData] =
    jsonFormat1(
      ComplianceProfileEntryData
    )

  implicit val complianceProfileEntryDTOFormat: RootJsonFormat[ComplianceProfileEntryDTO] =
    jsonFormat2(
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
  implicit val remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]                 = jsonFormat3(
    RemoteExportOptions
  )
  implicit val complianceProfileExportDataFormat: RootJsonFormat[ComplianceProfileExportData] =
    jsonFormat2(ComplianceProfileExportData)
  def complianceNISTConfigDataToJson(config: ComplianceNISTConfigData): String                =
    config.toJson.compactPrint

  def configWrapToJson(config: ComplianceProfileConfigData): String =
    config.toJson.compactPrint

  def profileWrapToJson(profile: ComplianceProfileEntryData): String              =
    profile.toJson.compactPrint

  def complianceProfileExportDataToJson(
    complianceProfileExportData: ComplianceProfileExportData
  ): String = complianceProfileExportData.toJson.compactPrint
  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String =
    remoteExportOptions.toJson.compactPrint
}
