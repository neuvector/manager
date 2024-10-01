package com.neu.model

import spray.json.*

object ComplianceJsonProtocol extends DefaultJsonProtocol {
  given complianceNISTConfigFormat: RootJsonFormat[ComplianceNISTConfig] =
    jsonFormat1(ComplianceNISTConfig.apply)

  given complianceNISTConfigDataFormat: RootJsonFormat[ComplianceNISTConfigData] =
    jsonFormat1(ComplianceNISTConfigData.apply)

  given complianceProfileEntryFormat: RootJsonFormat[ComplianceProfileEntry] = jsonFormat2(
    ComplianceProfileEntry.apply
  )

  given complianceProfileEntryDataFormat: RootJsonFormat[ComplianceProfileEntryData] =
    jsonFormat1(
      ComplianceProfileEntryData.apply
    )

  given complianceProfileEntryDTOFormat: RootJsonFormat[ComplianceProfileEntryDTO] =
    jsonFormat2(
      ComplianceProfileEntryDTO.apply
    )

  given complianceProfileFormat: RootJsonFormat[ComplianceProfile] = jsonFormat3(
    ComplianceProfile.apply
  )

  given complianceProfileDataFormat: RootJsonFormat[ComplianceProfileData] = jsonFormat1(
    ComplianceProfileData.apply
  )

  given complianceProfilesDataFormat: RootJsonFormat[ComplianceProfilesData] = jsonFormat1(
    ComplianceProfilesData.apply
  )

  given complianceProfileConfigFormat: RootJsonFormat[ComplianceProfileConfig] = jsonFormat3(
    ComplianceProfileConfig.apply
  )

  given complianceProfileConfigDataFormat: RootJsonFormat[ComplianceProfileConfigData] =
    jsonFormat1(
      ComplianceProfileConfigData.apply
    )
  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]                 = jsonFormat3(
    RemoteExportOptions.apply
  )
  given complianceProfileExportDataFormat: RootJsonFormat[ComplianceProfileExportData] =
    jsonFormat2(ComplianceProfileExportData.apply)

  def complianceNISTConfigDataToJson(config: ComplianceNISTConfigData): String =
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
