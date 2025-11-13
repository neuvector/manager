package com.neu.service.group

import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.model.*
import com.neu.model.CustomCheckConfigJsonProtocol.*
import com.neu.model.DlpJsonProtocol.*
import com.neu.model.FileProfileJsonProtocol.*
import com.neu.model.GroupJsonProtocol.{ *, given }
import com.neu.model.ProcessProfileJsonProtocol.*
import com.neu.model.SystemConfigJsonProtocol.*
import com.neu.model.WafJsonProtocol.*
import com.neu.service.{ BaseService, DefaultJsonFormats }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.Await
import scala.concurrent.duration.*
import scala.util.control.NonFatal

class GroupService extends BaseService with DefaultJsonFormats with LazyLogging {

  private final val serverErrorStatus = "Status: 503"

  def getGroupList(tokenId: String, scope: Option[String], f_kind: Option[String]): Route =
    complete {
      var url = s"${baseClusterUri(tokenId)}/group?start=0&brief=true"
      if (f_kind.isDefined) {
        logger.info("Getting group list: f_kind={}", f_kind.get)
        url = s"$url&f_kind=${f_kind.get}"
      }
      if (scope.isDefined) {
        logger.info("Getting fedrated group list")
        url = s"$url&scope=${scope.get}"
      }
      logger.info("Getting group list: {}", url)
      RestClient.httpRequestWithHeader(
        url,
        GET,
        "",
        tokenId
      )
    }

  def checkGroupByName(tokenId: String, name: String): Route = complete {
    logger.info(s"url: ${baseClusterUri(tokenId)}/custom_check/$name")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/custom_check/$name",
      GET,
      "",
      tokenId
    )
  }

  def updateCheckGroupScripts(tokenId: String, customCheckDTO: CustomCheckConfigDTO): Route =
    complete {
      val payload = customConfigToJson(CustomCheckConfigData(customCheckDTO.config))
      logger.info("Saving custom scripts: {}", payload)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/custom_check/${customCheckDTO.group}",
        PATCH,
        payload,
        tokenId
      )
    }

  def exportGroups(tokenId: String, groups4Export: Groups4Export): Route = complete {
    val payload = groups4ExportToJson(groups4Export)
    logger.info("Exporting groups: {}", payload)
    RestClient.httpRequestWithHeaderDecode(
      s"${baseClusterUri(tokenId)}/file/group",
      POST,
      payload,
      tokenId
    )
  }

  def importGroupConfig(tokenId: String, transactionId: String): Route = complete {
    Thread.sleep(1000)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file/group/config",
      POST,
      "",
      tokenId,
      Some(transactionId)
    )
  }

  def importGroupConfigByFormData(tokenId: String, formData: String): Route =
    complete {
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
      logger.info("Importing groups")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/group/config",
        POST,
        bodyData,
        tokenId
      )
    }

  def createGroup(tokenId: String, groupConfigDTO: GroupConfigDTO): Route = {
    logger.info("Adding group: {}", groupConfigDTO.name)
    val criteria = groupConfigDTO.criteria.flatMap((criteriaItem: CriteriaItem) =>
      stringToCriteriaEntry(criteriaItem.name)
    )
    logger.info(
      "{}",
      groupConfigWrapToJson(
        GroupConfigWrap(
          GroupConfig(
            groupConfigDTO.name,
            groupConfigDTO.comment,
            criteria,
            groupConfigDTO.cfg_type,
            groupConfigDTO.monitor_metric,
            groupConfigDTO.group_sess_cur,
            groupConfigDTO.group_sess_rate,
            groupConfigDTO.group_band_width
          )
        )
      )
    )
    complete {
      logger.info("Completing request...")
      if (criteria.nonEmpty) {
        logger.info("Criteria: {}", criteria)
        val response = RestClient.httpRequestWithHeader(
          if (groupConfigDTO.cfg_type.getOrElse("").equals("federal"))
            s"$baseUri/group"
          else s"${baseClusterUri(tokenId)}/group",
          POST,
          groupConfigWrapToJson(
            GroupConfigWrap(
              GroupConfig(
                groupConfigDTO.name,
                groupConfigDTO.comment,
                criteria,
                groupConfigDTO.cfg_type,
                groupConfigDTO.monitor_metric,
                groupConfigDTO.group_sess_cur,
                groupConfigDTO.group_sess_rate,
                groupConfigDTO.group_band_width
              )
            )
          ),
          tokenId
        )
        response
      } else {
        logger.info("Bad criteria")
        (StatusCodes.BadRequest, "Bad criteria")
      }
    }
  }

  def getGroup(
    tokenId: String,
    name: Option[String],
    scope: Option[String],
    start: Option[String],
    limit: Option[String],
    with_cap: Option[String]
  ): Route = complete {
    val cacheKey                   = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
    var groupDTOs: Array[GroupDTO] = null

    def getGroupDTOs =
      if (start.isDefined && limit.isDefined) {
        if (groupDTOs == null) {
          groupDTOs = paginationCacheManager[Array[GroupDTO]]
            .getPagedData(s"$cacheKey-group")
            .getOrElse(Array[GroupDTO]())
        }
        val output     =
          groupDTOs.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
        if (output.length < limit.get.toInt) {
          paginationCacheManager[Array[GroupDTO]]
            .removePagedData(s"$cacheKey-group")
        }
        val cachedData = paginationCacheManager[Array[GroupDTO]]
          .getPagedData(s"$cacheKey-group")
          .getOrElse(Array[GroupDTO]())
        logger.info("Cached data size: {}", cachedData.length)
        logger.info("Paged response size: {}", output.length)
        output
      } else {
        groupDTOs
      }

    if (name.isEmpty && scope.isEmpty) {
      try {
        if (start.isEmpty || start.get.toInt == 0) {
          logger.info("Getting groups")
          val result =
            RestClient.requestWithHeaderDecode(
              s"${baseClusterUri(tokenId)}/group?view=pod${with_cap.fold("&with_cap=false") { with_cap =>
                  s"&with_cap=$with_cap"
                }}",
              GET,
              "",
              tokenId
            )
          val groups =
            jsonToGroups(Await.result(result, RestClient.waitingLimit.seconds))
          groupDTOs = groups.groups.map(toGroupDTO)
          logger.debug(groupDTOsToJson(GroupDTOs(groupDTOs)))
          logger.info("Got all groups.")
          if (start.isDefined && start.get.toInt == 0) {
            paginationCacheManager[Array[GroupDTO]]
              .savePagedData(s"$cacheKey-group", groupDTOs)
          }
        }
        getGroupDTOs
      } catch {
        case NonFatal(e) =>
          paginationCacheManager[Array[GroupDTO]]
            .removePagedData(s"$cacheKey-group")
          onNonFatal(e)
      }
    } else if (scope.isEmpty) {
      try {
        logger.info("Getting group {}", name.get)
        val groupResult =
          RestClient.requestWithHeaderDecode(
            s"${baseClusterUri(tokenId)}/group/${name.get}?view=pod${with_cap.fold("&with_cap=false") { with_cap =>
                s"&with_cap=$with_cap"
              }}",
            GET,
            "",
            tokenId
          )
        val group       = jsonToGroup4SingleWrap(
          Await.result(groupResult, RestClient.waitingLimit.seconds)
        )
        val groupDTO    = toGroup4SingleDTO(group.group)
        logger.info("Got group {}", name.get)
        Group4SingleDTOWrap(groupDTO)
      } catch {
        case NonFatal(e) =>
          onNonFatal(e)
      }
    } else if (name.isEmpty) {
      try {
        if (start.isEmpty || start.get.toInt == 0) {
          logger.info("Getting Fed groups, scope={}", scope.get)
          val result =
            RestClient.requestWithHeaderDecode(
              if (scope.get.equals("fed"))
                s"$baseUri/group?view=pod&scope=${scope.get}"
              else
                s"${baseClusterUri(tokenId)}/group?view=pod&scope=${scope.get}${with_cap.fold("&with_cap=false") { with_cap =>
                    s"&with_cap=$with_cap"
                  }}",
              GET,
              "",
              tokenId
            )
          val groups =
            jsonToGroups(Await.result(result, RestClient.waitingLimit.seconds))
          groupDTOs = groups.groups.map(toGroupDTO)
          logger.debug(groupDTOsToJson(GroupDTOs(groupDTOs)))
          if (start.isDefined && start.get.toInt == 0) {
            paginationCacheManager[Array[GroupDTO]]
              .savePagedData(s"$cacheKey-group", groupDTOs)
          }
        }
        getGroupDTOs
      } catch {
        case NonFatal(e) =>
          paginationCacheManager[Array[GroupDTO]]
            .removePagedData(s"$cacheKey-group")
          onNonFatal(e)
      }
    } else {
      try {
        logger.info("Getting Fed group {}", name.get)
        val groupResult =
          RestClient.requestWithHeaderDecode(
            s"${baseClusterUri(tokenId)}/group/${name.get}?view=pod&scope=$scope${with_cap.fold("&with_cap=false") { with_cap =>
                s"&with_cap=$with_cap"
              }}",
            GET,
            "",
            tokenId
          )
        val group       = jsonToGroupWrap(
          Await.result(groupResult, RestClient.waitingLimit.seconds)
        )
        val groupDTO    = toGroupDTO(group.group)
        logger.info("Got Fed group {}", name.get)
        GroupDTOWrap(groupDTO)
      } catch {
        case NonFatal(e) =>
          onNonFatal(e)
      }
    }
  }

  def updateGroup(tokenId: String, groupConfigDTO: GroupConfigDTO): Route = {
    logger.info(
      "Updating group: {}, {}, {}",
      groupConfigDTO.name,
      groupConfigDTO.cfg_type,
      groupConfigDTO.criteria.last.name
    )

    val criteria = groupConfigDTO.criteria.flatMap((criteriaItem: CriteriaItem) =>
      stringToCriteriaEntry(criteriaItem.name)
    )
    val url      =
      if (groupConfigDTO.cfg_type.getOrElse("user_created").equals("federal"))
        s"$baseUri/group/${groupConfigDTO.name}"
      else
        s"${baseClusterUri(tokenId)}/group/${groupConfigDTO.name}"
    val cfgtype  =
      groupConfigDTO.cfg_type
        .getOrElse("user_created")
    if (criteria.nonEmpty) {
      complete {
        RestClient.httpRequestWithHeader(
          url,
          PATCH,
          if (
            cfgtype
              .equals("user_created") ||
            cfgtype
              .equals("federal")
          )
            groupConfigWrapToJson(
              GroupConfigWrap(
                GroupConfig(
                  groupConfigDTO.name,
                  groupConfigDTO.comment,
                  criteria,
                  groupConfigDTO.cfg_type,
                  groupConfigDTO.monitor_metric,
                  groupConfigDTO.group_sess_cur,
                  groupConfigDTO.group_sess_rate,
                  groupConfigDTO.group_band_width
                )
              )
            )
          else
            groupConfigWrap4LearnedToJson(
              GroupConfigWrap4Learned(
                GroupConfig4Learned(
                  groupConfigDTO.name,
                  groupConfigDTO.monitor_metric,
                  groupConfigDTO.group_sess_cur,
                  groupConfigDTO.group_sess_rate,
                  groupConfigDTO.group_band_width
                )
              )
            ),
          tokenId
        )
      }
    } else {
      complete((StatusCodes.BadRequest, "Bad criteria"))
    }
  }

  def deleteGroup(tokenId: String, name: String, scope: Option[String]): Route = complete {
    logger.info("Deleting group: {}", name)
    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/group/$name") { scope =>
        if (scope.equals("fed")) s"$baseUri/group/$name"
        else s"${baseClusterUri(tokenId)}/group/$name?scope=$scope"
      },
      DELETE,
      "",
      tokenId
    )
  }

  def getService(tokenId: String, name: Option[String], with_cap: Option[String]): Route =
    complete {
      if (name.isEmpty) {
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/service?view=pod${with_cap.fold("&with_cap=false") { with_cap =>
              s"&with_cap=$with_cap"
            }}",
          GET,
          "",
          tokenId
        )
      } else {
        RestClient.httpRequestWithHeader(
          s"${baseClusterUri(tokenId)}/service/${name.get}?view=pod${with_cap.fold("&with_cap=false") { with_cap =>
              s"&with_cap=$with_cap"
            }}",
          GET,
          "",
          tokenId
        )
      }
    }

  def updateService(tokenId: String, serviceConfig: ServiceConfig): Route =
    complete {
      val payload = serviceConfigToJson(serviceConfig)
      logger.info("Switching policy mode/scorability: {}", payload)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/service/config",
        PATCH,
        payload,
        tokenId
      )
    }

  def createService(tokenId: String, serviceConfigParam: ServiceConfigParam): Route = complete {
    val payload = systemConfigWrapToJson(
      SystemConfigWrap(
        Some(
          SystemConfig(
            new_service_policy_mode = Some(serviceConfigParam.policy_mode.getOrElse("Discover"))
          )
        ),
        None,
        None,
        None,
        None
      )
    )
    logger.info("Switching policy mode for new service: {}", payload)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/system/config",
      PATCH,
      payload,
      tokenId
    )
  }

  def updateSystemRequest(tokenId: String, systemRequestContent: SystemRequestContent): Route =
    complete {
      val payload = systemRequestToJson(SystemRequest(systemRequestContent))
      logger.info("Switching policy mode: {}", payload)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/system/request",
        POST,
        payload,
        tokenId
      )
    }

  def getProcessProfileByName(tokenId: String, name: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/process_profile/$name",
      GET,
      "",
      tokenId
    )
  }

  def getProcessProfileByScope(tokenId: String, scope: Option[String]): Route = complete {
    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/process_profile?start=0&limit=1000") { scope =>
        if (scope.equals("fed"))
          s"$baseUri/process_profile?start=0&limit=1000&scope=$scope"
        else
          s"${baseClusterUri(tokenId)}/process_profile?start=0&limit=1000&scope=$scope"
      },
      GET,
      "",
      tokenId
    )
  }

  def updateProcessProfile(
    tokenId: String,
    scope: Option[String],
    profile: ProcessProfileConfigData
  ): Route = complete {
    val payload = profileConfigToJson(profile)
    logger.info("Updating process profile: {}", payload)
    RestClient.httpRequestWithHeader(
      scope.fold(
        s"${baseClusterUri(tokenId)}/process_profile/${profile.process_profile_config.group}"
      ) { scope =>
        if (scope.equals("fed"))
          s"$baseUri/process_profile/${profile.process_profile_config.group}?scope=$scope"
        else
          s"${baseClusterUri(tokenId)}/process_profile/${profile.process_profile_config.group}?scope=$scope"
      },
      PATCH,
      payload,
      tokenId
    )
  }

  def getFileProfileByName(tokenId: String, name: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file_monitor/$name",
      GET,
      "",
      tokenId
    )
  }

  def getFileProfileByScope(tokenId: String, scope: Option[String]): Route = complete {
    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/file_monitor?start=0&limit=1000") { scope =>
        if (scope.equals("fed"))
          s"$baseUri/file_monitor?start=0&limit=1000&scope=$scope"
        else
          s"${baseClusterUri(tokenId)}/file_monitor?start=0&limit=1000&scope=$scope"
      },
      GET,
      "",
      tokenId
    )
  }

  def updateFileProfile(
    tokenId: String,
    scope: Option[String],
    profile: FileMonitorConfigDTO
  ): Route = complete {
    val payload = fileProfileToJson(profile.fileMonitorConfigData)
    logger.info("Updating file monitor profile: {}", payload)
    RestClient.httpRequestWithHeader(
      scope.fold(s"${baseClusterUri(tokenId)}/file_monitor/${profile.group}") { scope =>
        if (scope.equals("fed"))
          s"$baseUri/file_monitor/${profile.group}?scope=$scope"
        else
          s"${baseClusterUri(tokenId)}/file_monitor/${profile.group}?scope=$scope"
      },
      PATCH,
      payload,
      tokenId
    )
  }

  def getFilePreProfile(tokenId: String, name: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file_monitor/$name?predefined",
      GET,
      "",
      tokenId
    )
  }

  def createDlpSensor(tokenId: String, dlpSensorConfigData: DlpSensorConfigData): Route = {
    logger.info("Adding sensor: {}", dlpSensorConfigData.config.name)
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/dlp/sensor",
        POST,
        dlpSensorConfigToJson(dlpSensorConfigData),
        tokenId
      )
    }
  }

  def getDlpSensor(tokenId: String, name: Option[String], scope: Option[String]): Route = complete {
    if (name.isEmpty) {
      logger.info("Getting sensors")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/dlp/sensor${if (scope.nonEmpty) s"?scope=${scope.get}" else ""}",
        GET,
        "",
        tokenId
      )
    } else {
      logger.info(s"Getting sensor ${name.get}")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/dlp/sensor/${name.get}",
        GET,
        "",
        tokenId
      )
    }
  }

  def updatePldSensor(tokenId: String, dlpSensorConfigData: DlpSensorConfigData): Route =
    logger.info("Updating sensor {}", dlpSensorConfigData.config.name)
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/dlp/sensor/${dlpSensorConfigData.config.name}",
        PATCH,
        dlpSensorConfigToJson(dlpSensorConfigData),
        tokenId
      )
    }

  def deletePldSensor(tokenId: String, name: String): Route = complete {
    logger.info("Deleting sensor: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/dlp/sensor/$name",
      DELETE,
      "",
      tokenId
    )
  }

  def exportDlpSensorConfig(
    tokenId: String,
    exportedDlpSensorList: ExportedDlpSensorList,
    scope: String = "local"
  ): Route = {
    logger.info("Export sensors")
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/dlp?scope=$scope",
        POST,
        exportedDlpSensorListToJson(exportedDlpSensorList),
        tokenId
      )
    }
  }

  def importDlpSensorConfig(
    tokenId: String,
    transactionId: String,
    scope: String = "local"
  ): Route = complete {
    try {
      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
      val baseUrl       = cachedBaseUrl.fold {
        baseClusterUri(tokenId)
      }(cachedBaseUrl => cachedBaseUrl)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("Transaction ID(Post): {}", transactionId)
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/dlp/config?scope=$scope",
        POST,
        "",
        tokenId,
        Some(transactionId)
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def importDlpSensorConfigByFormData(
    tokenId: String,
    formData: String,
    scope: String = "local"
  ): Route = complete {
    try {
      val baseUrl              = baseClusterUri(tokenId)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("No Transaction ID(Post)")
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/dlp/config?scope=$scope",
        POST,
        bodyData,
        tokenId
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def getDlpGroupRulesByName(tokenId: String, name: String): Route = complete {
    logger.info(s"Getting rules for group $name")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/dlp/group/$name",
      GET,
      "",
      tokenId
    )
  }

  def updateDlpGroupConfig(tokenId: String, dlpGroupConfigData: DlpGroupConfigData): Route =
    logger.info("Updating sensor {}", dlpGroupConfigData.config.name)
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/dlp/group/${dlpGroupConfigData.config.name}",
        PATCH,
        dlpGroupConfigToJson(dlpGroupConfigData),
        tokenId
      )
    }

  def createWafSensor(tokenId: String, wafSensorConfigData: WafSensorConfigData): Route = complete {
    logger.info("Adding sensor: {}", wafSensorConfigData.config.name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/waf/sensor",
      POST,
      wafSensorConfigToJson(wafSensorConfigData),
      tokenId
    )
  }

  def getWafSensor(tokenId: String, name: Option[String], scope: Option[String]): Route = complete {
    if (name.isEmpty) {
      logger.info("Getting sensors")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/waf/sensor${if (scope.nonEmpty) s"?scope=${scope.get}" else ""}",
        GET,
        "",
        tokenId
      )
    } else {
      logger.info(s"Getting sensor ${name.get}")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/waf/sensor/${name.get}",
        GET,
        "",
        tokenId
      )
    }
  }

  def updateWafSensor(tokenId: String, wafSensorConfigData: WafSensorConfigData): Route = complete {
    logger.info("Updating sensor {}", wafSensorConfigData.config.name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/waf/sensor/${wafSensorConfigData.config.name}",
      PATCH,
      wafSensorConfigToJson(wafSensorConfigData),
      tokenId
    )
  }

  def deleteWafSensor(tokenId: String, name: String): Route = complete {
    logger.info("Deleting sensor: {}", name)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/waf/sensor/$name",
      DELETE,
      "",
      tokenId
    )
  }

  def exportWafSensors(tokenId: String, exportedWafSensorList: ExportedWafSensorList): Route =
    complete {
      logger.info("Export sensors")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/file/waf",
        POST,
        exportedWafSensorListToJson(exportedWafSensorList),
        tokenId
      )
    }

  def importWafSensorConfig(tokenId: String, transactionId: String): Route = complete {
    try {
      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
      val baseUrl       = cachedBaseUrl.fold {
        baseClusterUri(tokenId)
      }(cachedBaseUrl => cachedBaseUrl)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("Transaction ID(Post): {}", transactionId)
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/waf/config",
        POST,
        "",
        tokenId,
        Some(transactionId)
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def importWafSensorConfigByFormData(tokenId: String, formData: String): Route = complete {
    try {
      val baseUrl              = baseClusterUri(tokenId)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("No Transaction ID(Post)")
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/waf/config",
        POST,
        bodyData,
        tokenId
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def getWafGroupRulesByName(tokenId: String, name: String): Route = complete {
    logger.info(s"Getting rules for group $name")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/waf/group/$name",
      GET,
      "",
      tokenId
    )
  }

  def updateWafGroupConfig(tokenId: String, wafGroupConfigData: WafGroupConfigData): Route =
    logger.info("Updating sensor {}", wafGroupConfigData.config.name)
    complete {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/waf/group/${wafGroupConfigData.config.name}",
        PATCH,
        wafGroupConfigToJson(wafGroupConfigData),
        tokenId
      )
    }
}
