package com.neu.model

import spray.json.*

case class FileMonitorFilter(
  filter: String,
  recursive: Boolean = false,
  behavior: String,
  applications: Option[Array[String]] = None
)

case class FileMonitorProfile(group: String, filters: Array[FileMonitorFilter])

case class FileMonitorProfileData(profile: FileMonitorProfile)

case class FileMonitorProfilesData(profiles: Array[FileMonitorProfile])

case class FileMonitorConfig(
  add_filters: Option[Array[FileMonitorFilter]],
  delete_filters: Option[Array[FileMonitorFilter]],
  update_filters: Option[Array[FileMonitorFilter]]
)

case class FileMonitorConfigData(config: FileMonitorConfig)

case class FileMonitorConfigDTO(group: String, fileMonitorConfigData: FileMonitorConfigData)

object FileProfileJsonProtocol extends DefaultJsonProtocol {

  given fileMonitorFilter: RootJsonFormat[FileMonitorFilter] = jsonFormat4(FileMonitorFilter.apply)

  given fileMonitorProfile: RootJsonFormat[FileMonitorProfile] = jsonFormat2(
    FileMonitorProfile.apply
  )

  given fileMonitorProfileData: RootJsonFormat[FileMonitorProfileData] = jsonFormat1(
    FileMonitorProfileData.apply
  )

  given fileMonitorProfilesData: RootJsonFormat[FileMonitorProfilesData] = jsonFormat1(
    FileMonitorProfilesData.apply
  )

  given fileMonitorConfigFormat: RootJsonFormat[FileMonitorConfig] = jsonFormat3(
    FileMonitorConfig.apply
  )

  given fileMonitorConfigDataFormat: RootJsonFormat[FileMonitorConfigData] = jsonFormat1(
    FileMonitorConfigData.apply
  )

  given configDTOFormat: RootJsonFormat[FileMonitorConfigDTO] = jsonFormat2(
    FileMonitorConfigDTO.apply
  )

  def fileProfileToJson(profileConfig: FileMonitorConfigData): String =
    profileConfig.toJson.compactPrint
}
