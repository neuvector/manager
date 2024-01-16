package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.AuthenticationManager
import com.neu.core.CisNISTManager
import com.neu.model.ComplianceNISTJsonProtocol._
import com.neu.model.ComplianceJsonProtocol._
import com.neu.model.VulnerabilityJsonProtocol._
import com.neu.model.{
  ComplianceNISTConfigData,
  ComplianceProfileConfig,
  ComplianceProfileConfigData,
  ComplianceProfileExportData,
  TimeRange,
  VulnerabilityProfileConfigData,
  VulnerabilityProfileEntryConfigData,
  VulnerabilityProfileExportData,
  VulnerabilityQuery
}
import com.typesafe.scalalogging.LazyLogging
import spray.can.Http._
import spray.http.HttpMethods._
import spray.http.StatusCodes
import spray.routing.{ Directives, Route }

import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, TimeoutException }
import scala.util.control.NonFatal

//noinspection UnstableApiUsage
class RiskService()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {
  private val scanUrl                 = "scan/asset"
  private val complianceUrl           = "compliance/asset"
  private val complianceProfileUrl    = "compliance/profile"
  private val vulnerabilityProfileUrl = "vulnerability/profile"

  final val serverErrorStatus = "Status: 503"

  val riskRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("vulasset") {
          pathEnd {
            post {
              entity(as[VulnerabilityQuery]) { vulnerabilityQuery =>
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info(s"Getting asset vulnerabilities ...")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/vulasset",
                      POST,
                      vulnerabilityQueryToJson(
                        vulnerabilityQuery
                      ),
                      tokenId
                    )
                  }
                }
              }
            } ~
            get {
              parameters('token, 'start, 'row, 'orderby.?, 'orderbyColumn.?) {
                (token, start, row, orderby, orderbyColumn) =>
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      val url =
                        s"${baseClusterUri(tokenId)}/vulasset?token=$token&start=$start&row=$row${if (orderby.isDefined)
                          s"&orderby=${orderby.get}"
                        else ""}${if (orderbyColumn.isDefined)
                          s"&orderbyColumn=${orderbyColumn.get}"
                        else ""}"
                      RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                    }
                  }
              }
            }
          }
        } ~
        pathPrefix("risk") {
          pathPrefix("cve") {
            pathEnd {
              get {
                parameters('show.?) { show =>
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      val url =
                        s"${baseClusterUri(tokenId)}/$scanUrl${if (show.isDefined) s"?show=${show.get}"
                        else ""}"
                      logger.info(s"Getting asset vulnerabilities ...{}", url)
                      RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                    }
                  }
                }
              }
            } ~
            pathPrefix("assets-view") {
              pathEnd {
                patch {
                  parameter('queryToken) { queryToken =>
                    entity(as[TimeRange]) { timeRange =>
                      Utils.respondWithWebServerHeaders() {
                        complete {
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/assetvul?token=$queryToken",
                            POST,
                            timeRangeToJson(timeRange),
                            tokenId
                          )
                        }
                      }
                    }
                  }
                }
              }
            } ~
            pathPrefix("profile") {
              pathEnd {
                get {
                  Utils.respondWithWebServerHeaders() {
                    complete {
                      logger.info(s"Getting vulnerability profiles ...")
                      RestClient.httpRequestWithHeader(
                        s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl",
                        GET,
                        "",
                        tokenId
                      )
                    }
                  }
                } ~
                patch {
                  entity(as[VulnerabilityProfileConfigData]) { vulnerabilityProfileConfigData =>
                    Utils.respondWithWebServerHeaders() {
                      complete {
                        logger.info(
                          s"Update vulnerability profiles: {}",
                          vulnerabilityProfileConfigData.config.name
                        )
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(vulnerabilityProfileConfigData.config.name)}",
                          PATCH,
                          vulnerabilityProfileConfigDataToJson(vulnerabilityProfileConfigData),
                          tokenId
                        )
                      }
                    }
                  }
                }
              } ~
              path("entry") {
                post {
                  entity(as[VulnerabilityProfileConfigData]) { vulnerabilityProfileConfigData =>
                    Utils.respondWithWebServerHeaders() {

                      complete {
                        try {
                          logger.info(
                            "Add vulnerability profile entry: {}",
                            vulnerabilityProfileConfigData.config.name
                          )
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(vulnerabilityProfileConfigData.config.name)}/entry",
                            POST,
                            vulnerabilityProfileEntryConfigDataToJson(
                              VulnerabilityProfileEntryConfigData(
                                vulnerabilityProfileConfigData.config.entries.get(0)
                              )
                            ),
                            tokenId
                          )
                        } catch {
                          case NonFatal(e) =>
                            logger.warn(e.getMessage)
                            (StatusCodes.InternalServerError, "No entry has in the config data!")
                          case e: TimeoutException =>
                            logger.warn(e.getMessage)
                            (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                          case e: ConnectionAttemptFailedException =>
                            logger.warn(e.getMessage)
                            (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                        }
                      }
                    }
                  }
                } ~
                patch {
                  parameters('name) { name =>
                    entity(as[VulnerabilityProfileEntryConfigData]) {
                      vulnerabilityProfileEntryConfigData =>
                        Utils.respondWithWebServerHeaders() {
                          complete {
                            logger.info(
                              "Update vulnerability profile entry (Profile name): {}",
                              name
                            )
                            logger.info(
                              "Update vulnerability profile entry (Entry ID): {}",
                              vulnerabilityProfileEntryConfigData.config.id
                            )
                            RestClient.httpRequestWithHeader(
                              s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers
                                .urlFragmentEscaper()
                                .escape(name)}/entry/${vulnerabilityProfileEntryConfigData.config.id.get}",
                              PATCH,
                              vulnerabilityProfileEntryConfigDataToJson(
                                vulnerabilityProfileEntryConfigData
                              ),
                              tokenId
                            )
                          }
                        }
                    }
                  }
                } ~
                delete {
                  parameter('profile_name, 'entry_id) { (profileName, entryId) =>
                    Utils.respondWithWebServerHeaders() {
                      complete {
                        logger.info(
                          "Delete vulnerability profile entry (Profile name): {}",
                          profileName
                        )
                        logger.info("Delete vulnerability profile entry (Entry ID): {}", entryId)
                        RestClient.httpRequestWithHeader(
                          s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers
                            .urlFragmentEscaper()
                            .escape(profileName)}/entry/${UrlEscapers.urlFragmentEscaper().escape(entryId)}",
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
                  entity(as[VulnerabilityProfileExportData]) { vulnerabilityProfileExportData =>
                    {
                      Utils.respondWithWebServerHeaders() {
                        complete {
                          logger.info("Exporting CVE profile")
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/file/$vulnerabilityProfileUrl",
                            POST,
                            vulnerabilityProfileExportDataToJson(vulnerabilityProfileExportData),
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
                    Utils.respondWithWebServerHeaders() {
                      parameter('option) { option =>
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
                              s"$baseUrl/file/$vulnerabilityProfileUrl/config?option=$option",
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
                    }
                  } ~
                  entity(as[String]) { formData =>
                    Utils.respondWithWebServerHeaders() {
                      parameter('option) { option =>
                        complete {
                          try {
                            val baseUrl =
                              baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                            AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                            logger.info("test baseUrl: {}", baseUrl)
                            logger.info("No Transaction ID(Post)")
                            val lines: Array[String] = formData.split("\n")
                            val contentLines         = lines.slice(4, lines.length - 1)
                            val bodyData             = contentLines.mkString("\n")
                            RestClient.httpRequestWithHeader(
                              s"$baseUrl/file/$vulnerabilityProfileUrl/config?option=$option",
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
              }
            }
          } ~
          path("complianceNIST") {
            post {
              entity(as[ComplianceNISTConfigData]) { complianceNISTConfigData =>
                complete {
                  logger.info("Get NIST compliances: {}", complianceNISTConfigData.config.names)
                  CisNISTManager.getCompliancesNIST(complianceNISTConfigData.config.names)
                }
              }
            }
          } ~
          pathPrefix("compliance") {
            pathEnd {
              get {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$complianceUrl",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            path("template") {
              get {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info(s"Getting compliance template ...")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/list/compliance",
                      GET,
                      "",
                      tokenId
                    )
                  }
                }
              }
            } ~
            pathPrefix("profile") {
              pathEnd {
                get {
                  parameter('name.?) { name =>
                    Utils.respondWithWebServerHeaders() {
                      complete {
                        logger.info(s"Getting compliance profile $name ...")
                        name.fold {
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/$complianceProfileUrl",
                            GET,
                            "",
                            tokenId
                          )
                        } { profileName =>
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/$complianceProfileUrl/$profileName",
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
                  entity(as[ComplianceProfileConfig]) { profileConfig =>
                    {
                      Utils.respondWithWebServerHeaders() {
                        complete {
                          val payload = configWrapToJson(
                            ComplianceProfileConfigData(
                              profileConfig
                            )
                          )
                          logger.info("Updating compliance profile: {}", profileConfig.name)
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/$complianceProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(profileConfig.name)}",
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
                  entity(as[ComplianceProfileExportData]) { complianceProfileExportData =>
                    {
                      Utils.respondWithWebServerHeaders() {
                        complete {
                          logger.info("Exporting compliance profile")
                          RestClient.httpRequestWithHeader(
                            s"${baseClusterUri(tokenId)}/file/$complianceProfileUrl",
                            POST,
                            complianceProfileExportDataToJson(complianceProfileExportData),
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
                    Utils.respondWithWebServerHeaders() {
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
                            s"$baseUrl/file/$complianceProfileUrl/config",
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
                    Utils.respondWithWebServerHeaders() {
                      complete {
                        try {
                          val baseUrl =
                            baseClusterUri(tokenId, RestClient.reloadCtrlIp(tokenId, 0))
                          AuthenticationManager.setBaseUrl(tokenId, baseUrl)
                          logger.info("test baseUrl: {}", baseUrl)
                          logger.info("No Transaction ID(Post)")
                          val lines: Array[String] = formData.split("\n")
                          val contentLines         = lines.slice(4, lines.length - 1)
                          val bodyData             = contentLines.mkString("\n")
                          RestClient.httpRequestWithHeader(
                            s"$baseUrl/file/$complianceProfileUrl/config",
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
            }
          }
        }
      }
    }
}
