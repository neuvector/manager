package com.neu.api

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient._
import com.neu.core.CisNISTManager
import com.neu.model.ComplianceNISTJsonProtocol._
import com.neu.model.ComplianceJsonProtocol._
import com.neu.model.VulnerabilityJsonProtocol._
import com.neu.model.{
  ComplianceNISTConfigData,
  ComplianceProfileConfig,
  ComplianceProfileConfigData,
  VulnerabilityProfileConfigData,
  VulnerabilityProfileEntryConfigData
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

  val riskRoute: Route =
    headerValueByName("Token") { tokenId =>
      {
        pathPrefix("risk") {
          pathPrefix("cve") {
            pathEnd {
              get {
                parameters('show.?) { show =>
                  Utils.respondWithNoCacheControl() {
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
            pathPrefix("profile") {
              pathEnd {
                get {
                  Utils.respondWithNoCacheControl() {
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
                    Utils.respondWithNoCacheControl() {
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
                    Utils.respondWithNoCacheControl() {

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
                        Utils.respondWithNoCacheControl() {
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
                    Utils.respondWithNoCacheControl() {
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
                Utils.respondWithNoCacheControl() {
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
                Utils.respondWithNoCacheControl() {
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
            path("profile") {
              get {
                parameter('name.?) { name =>
                  Utils.respondWithNoCacheControl() {
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
                    Utils.respondWithNoCacheControl() {
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
            }
          }
        }
      }
    }
}
