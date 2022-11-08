package com.neu.api

import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.model.GroupJsonProtocol._
import com.neu.model.DlpJsonProtocol._
import com.neu.model.WafJsonProtocol._
import com.neu.model.SystemConfigJsonProtocol._
import com.neu.model._
import com.neu.model.ProcessProfileJsonProtocol._
import com.neu.model.FileProfileJsonProtocol._
import com.neu.model.CustomCheckConfigJsonProtocol._
import com.typesafe.scalalogging.LazyLogging
import spray.http.HttpMethods._
import spray.http._
import spray.http.StatusCodes
import spray.routing.{ Directives, Route }
import com.neu.core.AuthenticationManager

import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext }
import scala.util.control.NonFatal
import org.json4s._
import org.json4s.native.JsonMethods._
import com.neu.cache.paginationCacheManager

/**
 * Created by bxu on 4/25/16.
 */
class GroupService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {

  final val serverErrorStatus = "Status: 503"

  val groupRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("group-list") {
          get {
            parameters('scope.?, 'f_kind.?) { (scope, f_kind) =>
              Utils.respondWithNoCacheControl() {
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
              }
            }
          }
        } ~
        pathPrefix("group") {
          path("custom_check") {
            get {
              parameter('name) { name =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    logger.info(s"url: ${baseClusterUri(tokenId)}/custom_check/$name")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/custom_check/$name",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            patch {
              entity(as[CustomCheckConfigDTO]) { customCheckDTO =>
                {
                  Utils.respondWithNoCacheControl() {
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
                  }
                }
              }
            }
          } ~
          path("export") {
            post {
              entity(as[Groups4Export]) { groups4Export =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val payload = groups4ExportToJson(groups4Export)
                      logger.info("Exporting groups: {}", payload)
                      RestClient.httpRequestWithHeaderDecode(
                        s"${baseClusterUri(tokenId)}/file/group",
                        GET,
                        payload,
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          path("import") {
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                Utils.respondWithNoCacheControl() {
                  complete {
                    Thread.sleep(1000)
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/file/group/config",
                      POST,
                      "",
                      tokenId,
                      Some(transactionId)
                    )
                  }
                }
              } ~
              entity(as[String]) { formData =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val lines: Array[String] = formData.split("\n")
                      val contentLines         = lines.slice(4, lines.length - 1)
                      val bodyData             = contentLines.mkString("\n").substring(3)
                      logger.info("Importing groups")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/file/group/config",
                        POST,
                        bodyData,
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          } ~
          pathEnd {
            post {
              entity(as[GroupConfigDTO]) { groupConfigDTO =>
                {
                  logger.info("Adding group: {}", groupConfigDTO.name)
                  val criteria = groupConfigDTO.criteria.flatMap(
                    (criteriaItem: CriteriaItem) => stringToCriteriaEntry(criteriaItem.name)
                  )
                  logger.info(
                    "{}",
                    groupConfigWrapToJson(
                      GroupConfigWrap(
                        GroupConfig(
                          groupConfigDTO.name,
                          groupConfigDTO.comment,
                          criteria,
                          groupConfigDTO.cfg_type
                        )
                      )
                    )
                  )
                  if (criteria.nonEmpty) {
                    logger.info("Criteria: {}", criteria)
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
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
                                groupConfigDTO.cfg_type
                              )
                            )
                          ),
                          tokenId
                        )
                      }
                    }
                  } else {
                    Utils.respondWithNoCacheControl() {
                      complete((StatusCodes.BadRequest, "Bad criteria"))
                    }
                  }
                }
              }
            } ~
            get {
              parameter('name.?, 'scope.?, 'start.?, 'limit.?, 'with_cap.?) {
                (name, scope, start, limit, with_cap) =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      val cacheKey                   = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
                      var groupDTOs: Array[GroupDTO] = null

                      def getGroupDTOs =
                        if (start.isDefined && limit.isDefined) {
                          if (groupDTOs == null) {
                            groupDTOs = paginationCacheManager[Array[GroupDTO]]
                              .getPagedData(s"$cacheKey-group")
                              .getOrElse(Array[GroupDTO]())
                          }
                          val output =
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
                          val group = jsonToGroup4SingleWrap(
                            Await.result(groupResult, RestClient.waitingLimit.seconds)
                          )
                          val groupDTO = toGroup4SingleDTO(group.group)
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
                          val group = jsonToGroupWrap(
                            Await.result(groupResult, RestClient.waitingLimit.seconds)
                          )
                          val groupDTO = toGroupDTO(group.group)
                          logger.info("Got Fed group {}", name.get)
                          GroupDTOWrap(groupDTO)
                        } catch {
                          case NonFatal(e) =>
                            onNonFatal(e)
                        }
                      }
                    }
                  }
              }
            } ~
            patch {
              entity(as[GroupConfigDTO]) { groupConfigDTO =>
                {
                  logger.info(
                    "Updating group: {}, {}, {}",
                    groupConfigDTO.name,
                    groupConfigDTO.cfg_type,
                    groupConfigDTO.criteria.last.name
                  )
                  val criteria = groupConfigDTO.criteria.flatMap(
                    (criteriaItem: CriteriaItem) => stringToCriteriaEntry(criteriaItem.name)
                  )
                  if (criteria.nonEmpty) {
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
                          if (groupConfigDTO.cfg_type.getOrElse("").equals("federal"))
                            s"$baseUri/group/${groupConfigDTO.name}"
                          else s"${baseClusterUri(tokenId)}/group/${groupConfigDTO.name}",
                          PATCH,
                          groupConfigWrapToJson(
                            GroupConfigWrap(
                              GroupConfig(
                                groupConfigDTO.name,
                                groupConfigDTO.comment,
                                criteria,
                                groupConfigDTO.cfg_type
                              )
                            )
                          ),
                          tokenId
                        )
                      }
                    }
                  } else {
                    Utils.respondWithNoCacheControl() {
                      complete((StatusCodes.BadRequest, "Bad criteria"))
                    }
                  }
                }
              }
            } ~
            delete {
              parameter('name, 'scope.?) { (name, scope) =>
                Utils.respondWithNoCacheControl() {
                  complete {
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
                }
              }
            }
          }
        } ~
        pathPrefix("service") {
          get {
            parameter('name.?, 'with_cap.?) { (name, with_cap) =>
              Utils.respondWithNoCacheControl() {
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
              }
            }
          } ~
          patch {
            decompressRequest() {
              entity(as[ServiceConfig]) { serviceConfig =>
                {
                  Utils.respondWithNoCacheControl() {
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
                  }
                }
              }
            }
          } ~
          post {
            entity(as[ServiceConfigParam]) { serviceConfigParam =>
              {
                Utils.respondWithNoCacheControl() {
                  complete {
                    val payload = systemConfigWrapToJson(
                      SystemConfigWrap(
                        Some(
                          SystemConfig(
                            new_service_policy_mode =
                              Some(serviceConfigParam.policy_mode.getOrElse("Discover"))
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
                }
              }
            }
          } ~
          path("all") {
            patch {
              entity(as[SystemRequestContent]) { systemRequestContent =>
                {
                  Utils.respondWithNoCacheControl() {
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
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("processProfile") {
          get {
            parameter('name) { name =>
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/process_profile/$name",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          get {
            parameter('scope.?) { scope =>
              Utils.respondWithNoCacheControl() {
                complete {
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
              }
            }
          } ~
          patch {
            parameter('scope.?) { scope =>
              entity(as[ProcessProfileConfigData]) { profile =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
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
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("fileProfile") {
          get {
            Utils.respondWithNoCacheControl() {
              parameter('name) { name =>
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/file_monitor/$name",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          } ~
          get {
            parameter('scope.?) { scope =>
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    scope.fold(s"${baseClusterUri(tokenId)}/file_monitor?start=0&limit=1000") {
                      scope =>
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
              }
            }
          } ~
          patch {
            parameter('scope.?) { scope =>
              entity(as[FileMonitorConfigDTO]) { profile =>
                {
                  Utils.respondWithNoCacheControl() {
                    complete {
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
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("filePreProfile") {
          get {
            parameter('name) { name =>
              Utils.respondWithNoCacheControl() {
                complete {
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/file_monitor/$name?predefined",
                    GET,
                    "",
                    tokenId
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("dlp") {
          pathPrefix("sensor") {
            pathEnd {
              post {
                entity(as[DlpSensorConfigData]) { dlpSensorConfigData =>
                  {
                    logger.info("Adding sensor: {}", dlpSensorConfigData.config.name)
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/dlp/sensor",
                          POST,
                          dlpSensorConfigToJson(dlpSensorConfigData),
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              get {
                parameter('name.?) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      if (name.isEmpty) {
                        logger.info("Getting sensors")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/dlp/sensor",
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
                  }
                }
              } ~
              patch {
                entity(as[DlpSensorConfigData]) { dlpSensorConfigData =>
                  {
                    logger.info("Updating sensor {}", dlpSensorConfigData.config.name)
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/dlp/sensor/${dlpSensorConfigData.config.name}",
                          PATCH,
                          dlpSensorConfigToJson(dlpSensorConfigData),
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              delete {
                parameter('name) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Deleting sensor: {}", name)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/dlp/sensor/$name",
                        DELETE,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            path("export") {
              post {
                entity(as[ExportedDlpSensorList]) { ExportedDlpSensorList =>
                  {
                    Utils.respondWithNoCacheControl() {
                      logger.info("Export sensors")
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/file/dlp",
                          POST,
                          exportedDlpSensorListToJson(ExportedDlpSensorList),
                          tokenId
                        )
                      }
                    }
                  }
                }
              }
            } ~
            path("import") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
                        val baseUrl = cachedBaseUrl.fold {
                          baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        }(
                          cachedBaseUrl => cachedBaseUrl
                        )
                        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                        logger.info("test baseUrl: {}", baseUrl)
                        logger.info("Transaction ID(Post): {}", transactionId)
                        RestClient.httpRequestWithHeader(
                          s"$baseUrl/file/dlp/config",
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
                  }
                } ~
                entity(as[String]) { formData =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                        logger.info("test baseUrl: {}", baseUrl)
                        logger.info("No Transaction ID(Post)")
                        val lines: Array[String] = formData.split("\n")
                        val contentLines         = lines.slice(4, lines.length - 1)
                        val bodyData             = contentLines.mkString("\n").substring(3)
                        RestClient.httpRequestWithHeader(
                          s"$baseUrl/file/dlp/config",
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
                  }
                }
              }
            }
          } ~
          path("group") {
            get {
              parameter('name) { name =>
                Utils.respondWithNoCacheControl() {
                  complete {

                    logger.info(s"Getting rules for group $name")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/dlp/group/$name",
                      GET,
                      "",
                      tokenId
                    )

                  }
                }
              }
            } ~
            patch {
              entity(as[DlpGroupConfigData]) { dlpGroupConfigData =>
                {
                  logger.info("Updating sensor {}", dlpGroupConfigData.config.name)
                  Utils.respondWithNoCacheControl() {
                    complete {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/dlp/group/${dlpGroupConfigData.config.name}",
                        PATCH,
                        dlpGroupConfigToJson(dlpGroupConfigData),
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          }
        } ~
        pathPrefix("waf") {
          pathPrefix("sensor") {
            pathEnd {
              post {
                entity(as[WafSensorConfigData]) { wafSensorConfigData =>
                  {
                    logger.info("Adding sensor: {}", wafSensorConfigData.config.name)
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/waf/sensor",
                          POST,
                          wafSensorConfigToJson(wafSensorConfigData),
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              get {
                parameter('name.?) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      if (name.isEmpty) {
                        logger.info("Getting sensors")
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/waf/sensor",
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
                  }
                }
              } ~
              patch {
                entity(as[WafSensorConfigData]) { wafSensorConfigData =>
                  {
                    logger.info("Updating sensor {}", wafSensorConfigData.config.name)
                    Utils.respondWithNoCacheControl() {
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/waf/sensor/${wafSensorConfigData.config.name}",
                          PATCH,
                          wafSensorConfigToJson(wafSensorConfigData),
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              delete {
                parameter('name) { name =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      logger.info("Deleting sensor: {}", name)
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/waf/sensor/$name",
                        DELETE,
                        "",
                        tokenId
                      )
                    }
                  }
                }
              }
            } ~
            path("export") {
              post {
                entity(as[ExportedWafSensorList]) { exportedWafSensorList =>
                  {
                    Utils.respondWithNoCacheControl() {
                      logger.info("Export sensors")
                      complete {
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/file/waf",
                          POST,
                          exportedWafSensorListToJson(exportedWafSensorList),
                          tokenId
                        )
                      }
                    }
                  }
                }
              }
            } ~
            path("import") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
                        val baseUrl = cachedBaseUrl.fold {
                          baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        }(
                          cachedBaseUrl => cachedBaseUrl
                        )
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
                  }
                } ~
                entity(as[String]) { formData =>
                  Utils.respondWithNoCacheControl() {
                    complete {
                      try {
                        val baseUrl = baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                        logger.info("test baseUrl: {}", baseUrl)
                        logger.info("No Transaction ID(Post)")
                        val lines: Array[String] = formData.split("\n")
                        val contentLines         = lines.slice(4, lines.length - 1)
                        val bodyData             = contentLines.mkString("\n").substring(3)
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
                  }
                }
              }
            }
          } ~
          path("group") {
            get {
              parameter('name) { name =>
                Utils.respondWithNoCacheControl() {
                  complete {

                    logger.info(s"Getting rules for group $name")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/waf/group/$name",
                      GET,
                      "",
                      tokenId
                    )

                  }
                }
              }
            } ~
            patch {
              entity(as[WafGroupConfigData]) { wafGroupConfigData =>
                {
                  logger.info("Updating sensor {}", wafGroupConfigData.config.name)
                  Utils.respondWithNoCacheControl() {
                    complete {
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/waf/group/${wafGroupConfigData.config.name}",
                        PATCH,
                        wafGroupConfigToJson(wafGroupConfigData),
                        tokenId
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

  private def handleError(e: Throwable) = {
    logger.warn(e.getMessage)
    if (e.getMessage.contains("Status: 408") || e.getMessage.contains("Status: 401")) {
      (StatusCodes.RequestTimeout, "Session expired!")
    } else {
      (StatusCodes.InternalServerError, "Internal server error")
    }
  }
}
