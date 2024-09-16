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

  implicit val fileMonitorFilter: RootJsonFormat[FileMonitorFilter] = jsonFormat4(FileMonitorFilter)

  implicit val fileMonitorProfile: RootJsonFormat[FileMonitorProfile] = jsonFormat2(
    FileMonitorProfile
  )

  implicit val fileMonitorProfileData: RootJsonFormat[FileMonitorProfileData] = jsonFormat1(
    FileMonitorProfileData
  )

  implicit val fileMonitorProfilesData: RootJsonFormat[FileMonitorProfilesData] = jsonFormat1(
    FileMonitorProfilesData
  )

  implicit val fileMonitorConfigFormat: RootJsonFormat[FileMonitorConfig] = jsonFormat3(
    FileMonitorConfig
  )

  implicit val fileMonitorConfigDataFormat: RootJsonFormat[FileMonitorConfigData] = jsonFormat1(
    FileMonitorConfigData
  )

  implicit val configDTOFormat: RootJsonFormat[FileMonitorConfigDTO] = jsonFormat2(
    FileMonitorConfigDTO
  )

  def fileProfileToJson(profileConfig: FileMonitorConfigData): String =
    profileConfig.toJson.compactPrint
}
