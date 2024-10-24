package com.neu.api.risk

import com.neu.api.BaseApi
import com.neu.client.RestClient.*
import com.neu.model.*
import com.neu.model.ComplianceJsonProtocol.given
import com.neu.model.VulnerabilityJsonProtocol.given
import com.neu.service.Utils
import com.neu.service.risk.RiskService
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class RiskApi(resourceService: RiskService) extends BaseApi {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("scanned-assets") {
          post {
            entity(as[ScannedAssetsQuery]) { scannedAssetsQuery =>
              Utils.respondWithWebServerHeaders() {
                resourceService.queryScannedAssets(tokenId, scannedAssetsQuery)
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
                resourceService.getScannedImages(
                  tokenId,
                  token,
                  start,
                  row,
                  orderby,
                  orderbyColumn,
                  qf
                )
              }
            }
          }
        } ~
        pathPrefix("vulasset") {
          pathEnd {
            post {
              entity(as[VulnerabilityQuery]) { vulnerabilityQuery =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.queryAssetVulnerabilities(
                    tokenId,
                    vulnerabilityQuery
                  )
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
              ) { (token, start, row, lastmtime, orderby, orderbyColumn, qf, scoretype) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getValAssets(
                    tokenId,
                    token,
                    start,
                    row,
                    orderby,
                    orderbyColumn,
                    lastmtime,
                    qf,
                    scoretype
                  )
                }
              }
            }
          }
        } ~
        pathPrefix("risk") {
          pathPrefix("cve") {
            pathEnd {
              get {
                parameters(Symbol("show").?) { show =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getCve(tokenId, show)
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
                        resourceService.queryCveAssetsView(
                          tokenId,
                          queryToken,
                          timeRange
                        )
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
                    resourceService.getCveVulnerabilityProfiles(tokenId)
                  }
                } ~
                patch {
                  entity(as[VulnerabilityProfileConfigData]) { vulnerabilityProfileConfigData =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.updateCveVulnerabilityProfiles(
                        tokenId,
                        vulnerabilityProfileConfigData
                      )
                    }
                  }
                }
              } ~
              path("entry") {
                post {
                  entity(as[VulnerabilityProfileConfigData]) { vulnerabilityProfileConfigData =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.addCveVulnerabilityProfileEntry(
                        tokenId,
                        vulnerabilityProfileConfigData
                      )
                    }
                  }
                } ~
                patch {
                  parameters(Symbol("name")) { name =>
                    entity(as[VulnerabilityProfileEntryConfigData]) {
                      vulnerabilityProfileEntryConfigData =>
                        Utils.respondWithWebServerHeaders() {
                          resourceService.updateCveVulnerabilityProfileEntry(
                            tokenId,
                            name,
                            vulnerabilityProfileEntryConfigData
                          )
                        }
                    }
                  }
                } ~
                delete {
                  parameter(Symbol("profile_name"), Symbol("entry_id")) { (profileName, entryId) =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.deleteCveVulnerabilityProfileEntry(
                        tokenId,
                        profileName,
                        entryId
                      )
                    }
                  }
                }
              } ~
              path("export") {
                post {
                  entity(as[VulnerabilityProfileExportData]) { vulnerabilityProfileExportData =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.exportCveProfile(
                        tokenId,
                        vulnerabilityProfileExportData
                      )
                    }
                  }
                }
              } ~
              path("import") {
                post {
                  headerValueByName("X-Transaction-Id") { transactionId =>
                    Utils.respondWithWebServerHeaders() {
                      parameter(Symbol("option")) { option =>
                        resourceService.importCveProfile(tokenId, transactionId, option)
                      }
                    }
                  } ~
                  entity(as[String]) { formData =>
                    Utils.respondWithWebServerHeaders() {
                      parameter(Symbol("option")) { option =>
                        resourceService.importCvsProfileByFormData(tokenId, formData, option)
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
                resourceService.queryNistCompliances(complianceNISTConfigData)
              }
            }
          } ~
          pathPrefix("compliance") {
            pathEnd {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.getCompliances(tokenId)
                }
              }
            } ~
            path("template") {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.getComplianceTemplate(tokenId)
                }
              }
            } ~
            path("available_filter") {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.getAvailableComplianceFilters(tokenId)
                }
              }
            } ~
            pathPrefix("profile") {
              pathEnd {
                get {
                  parameter(Symbol("name").?) { name =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.getComplianceProfile(tokenId, name)
                    }
                  }
                } ~
                patch {
                  entity(as[ComplianceProfileConfig]) { profileConfig =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.updateComplianceProfile(tokenId, profileConfig)
                    }
                  }
                }
              } ~
              path("export") {
                post {
                  entity(as[ComplianceProfileExportData]) { complianceProfileExportData =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.exportComplianceProfile(
                        tokenId,
                        complianceProfileExportData
                      )
                    }
                  }
                }
              } ~
              path("import") {
                post {
                  headerValueByName("X-Transaction-Id") { transactionId =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.importComplianceProfile(tokenId, transactionId)
                    }
                  } ~
                  entity(as[String]) { formData =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.importComplianceProfileByFormData(tokenId, formData)
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
