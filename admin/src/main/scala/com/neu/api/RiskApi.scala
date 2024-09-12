package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.{ AuthenticationManager, CisNISTManager }
import com.neu.model.ComplianceJsonProtocol._
import com.neu.model.ComplianceNISTJsonProtocol._
import com.neu.model.VulnerabilityJsonProtocol._
import com.neu.model._
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods._
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.{ ExecutionContext, TimeoutException }
import scala.util.control.NonFatal

//noinspection UnstableApiUsage
class RiskApi()(implicit executionContext: ExecutionContext)
    extends BaseService
    with DefaultJsonFormats
    with LazyLogging {
  private val scanUrl                 = "scan/asset"
  private val complianceUrl           = "compliance/asset"
  private val complianceProfileUrl    = "compliance/profile"
  private val complianceFilterUrl     = "compliance/available_filter"
  private val vulnerabilityProfileUrl = "vulnerability/profile"

  final val serverErrorStatus = "Status: 503"

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("scanned-assets") {
          post {
            entity(as[ScannedAssetsQuery]) { scannedAssetsQuery =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  logger.info(s"Getting scanned assets ...")
                  RestClient.httpRequestWithHeader(
                    s"${baseClusterUri(tokenId)}/scan/asset/images",
                    POST,
                    scannedAssetsQueryToJson(
                      scannedAssetsQuery
                    ),
                    tokenId
                  )
                }
              }
            }
          } ~
          get {
            parameters(
              Symbol("token"),
              Symbol("start"),
              Symbol("row"),
              Symbol("orderby").?,
              Symbol("orderbyColumn").?,
              Symbol("qf").?
            ) { (token, start, row, orderby, orderbyColumn, qf) =>
              Utils.respondWithWebServerHeaders() {
                complete {
                  val url =
                    s"${baseClusterUri(tokenId)}/scan/asset/images?token=$token&start=$start&row=$row${if (orderby.isDefined)
                      s"&orderby=${orderby.get}"
                    else ""}${if (orderbyColumn.isDefined)
                      s"&orderbyColumn=${orderbyColumn.get}"
                    else ""}${if (qf.isDefined)
                      s"&qf=${qf.get}"
                    else ""}"
                  RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                }
              }
            }
          }
        } ~
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
              parameters(
                Symbol("token"),
                Symbol("start"),
                Symbol("row"),
                Symbol("lastmtime").?,
                Symbol("orderby").?,
                Symbol("orderbyColumn").?,
                Symbol("qf").?,
                Symbol("scoretype").?
              )((token, start, row, lastmtime, orderby, orderbyColumn, qf, scoretype) => {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    val url =
                      s"${baseClusterUri(tokenId)}/vulasset?token=$token&start=$start&row=$row${if (orderby.isDefined)
                        s"&orderby=${orderby.get}"
                      else ""}${if (orderbyColumn.isDefined)
                        s"&orderbyColumn=${orderbyColumn.get}"
                      else ""}${if (lastmtime.isDefined)
                        s"&lastmtime=${lastmtime.get}"
                      else ""}${if (qf.isDefined)
                        s"&qf=${qf.get}"
                      else ""}${if (scoretype.isDefined)
                        s"&scoretype=${scoretype.get}"
                      else ""}"
                    RestClient.httpRequestWithHeader(url, GET, "", tokenId)
                  }
                }
              })
            }
          }
        } ~
        pathPrefix("risk") {
          pathPrefix("cve") {
            pathEnd {
              get {
                parameters(Symbol("show").?) { show =>
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
                  parameter(Symbol("queryToken").?) { queryToken =>
                    entity(as[TimeRange]) { timeRange =>
                      Utils.respondWithWebServerHeaders() {
                        val url = queryToken.fold(
                          s"${baseClusterUri(tokenId)}/assetvul"
                        ) { queryToken =>
                          s"${baseClusterUri(tokenId)}/assetvul?token=$queryToken"
                        }
                        complete {
                          RestClient.httpRequestWithHeader(
                            url,
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
                          //   case e: ConnectionAttemptFailedException =>
                          //     logger.warn(e.getMessage)
                          //     (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
                        }
                      }
                    }
                  }
                } ~
                patch {
                  parameters(Symbol("name")) { name =>
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
                  parameter(Symbol("profile_name"), Symbol("entry_id")) { (profileName, entryId) =>
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
                      parameter(Symbol("option")) { option =>
                        complete {
                          try {
                            val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
                            val baseUrl = cachedBaseUrl.fold {
                              baseClusterUri(tokenId)
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
                      parameter(Symbol("option")) { option =>
                        complete {
                          try {
                            val baseUrl =
                              baseClusterUri(tokenId)
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
            path("available_filter") {
              get {
                Utils.respondWithWebServerHeaders() {
                  complete {
                    logger.info(s"Getting available compliance filters ...")
                    RestClient.httpRequestWithHeader(
                      s"${baseClusterUri(tokenId)}/$complianceFilterUrl",
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
                  parameter(Symbol("name").?) { name =>
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
                            baseClusterUri(tokenId)
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
                            baseClusterUri(tokenId)
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
