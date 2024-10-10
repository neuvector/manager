package com.neu.api.policy

import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.AdmissionJsonProtocol.given
import com.neu.model.PolicyJsonProtocol.given
import com.neu.model.RegistryConfigJsonProtocol.given
import com.neu.model.*
import com.neu.service.Utils
import com.neu.service.policy.PolicyService
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

//noinspection UnstableApiUsage
class PolicyApi(resourceService: PolicyService) extends Directives {

  val route: Route =
    headerValueByName("Token") { tokenId =>
      {
        path("fed-deploy") {
          entity(as[DeployFedRulesConfig]) { deployFedRulesConfig =>
            post {
              Utils.respondWithWebServerHeaders() {
                resourceService.deployFedRules(tokenId, deployFedRulesConfig)
              }
            }
          }
        } ~
        path("conditionOption") {
          get {
            Utils.respondWithWebServerHeaders() {
              parameter(Symbol("scope").?) { scope =>
                resourceService.getConditionOptions(tokenId, scope)
              }
            }
          }
        } ~
        path("unquarantine") {
          post {
            entity(as[Request]) { request =>
              Utils.respondWithWebServerHeaders() {
                resourceService.unquarantine(tokenId, request)
              }
            }
          }
        } ~
        path("responseRule") {
          get {
            parameter(Symbol("id")) { id =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getResponseRuleById(tokenId, id)
              }
            }
          }
        } ~
        path("responsePolicy") {
          get {
            parameter(Symbol("scope").?) { scope =>
              Utils.respondWithWebServerHeaders() {
                resourceService.getResponsePolicy(tokenId, scope)
              }
            }
          } ~
          post {
            entity(as[ResponseRulesWrap]) { responseRulesWrap =>
              Utils.respondWithWebServerHeaders() {
                resourceService.insertResponseRules(tokenId, responseRulesWrap)
              }
            }
          } ~
          patch {
            entity(as[ResponseRuleConfig]) { responseRuleConfig =>
              Utils.respondWithWebServerHeaders() {
                resourceService.updateResponsePolicy(tokenId, responseRuleConfig)
              }
            }
          } ~
          delete {
            parameter(Symbol("scope").?, Symbol("id").?) { (scope, id) =>
              Utils.respondWithWebServerHeaders() {
                resourceService.deleteResponseRule(
                  tokenId,
                  scope,
                  id
                )
              }
            }
          }
        } ~
        pathPrefix("policy") {
          pathEnd {
            get {
              parameters(Symbol("scope").?, Symbol("start").?, Symbol("limit").?) {
                (scope, start, limit) =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getPolicy(
                      tokenId,
                      scope,
                      start,
                      limit
                    )
                  }
              }
            } ~
            patch {
              parameters(Symbol("scope")) { scope =>
                decodeRequest {
                  entity(as[Policy2]) { policy =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.updatePolicy(tokenId, scope, policy)
                    }
                  }
                }
              }
            } ~
            delete {
              parameter(Symbol("id").?) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.deletePolicy(tokenId, id)
                }
              }
            }
          } ~
          path("application") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getPolicyApplications(tokenId)
              }
            }
          } ~
          path("rule") {
            get {
              parameter(Symbol("id")) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getPolicyRules(tokenId, id)
                }
              }
            } ~
            post {
              entity(as[Rule]) { rule =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.addPolicyRule(tokenId, rule)
                }
              }
            } ~
            patch {
              entity(as[RuleConfig]) { rule =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updatePolicyRule(tokenId, rule)
                }
              }
            }
          } ~
          path("graph") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getPolicyGraph(tokenId)
              }
            }
          } ~
          path("promote") {
            post {
              entity(as[PromoteConfig]) { promoteConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.promotePolicy(tokenId, promoteConfig)
                }
              }
            }
          }
        } ~
        pathPrefix("scan") {
          path("status") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getScanStatus(tokenId)
              }
            }
          } ~
          path("workload") {
            get {
              parameter(Symbol("id").?, Symbol("show").?) { (id, show) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getScanWorkload(tokenId, id, show)
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.scanContainer(tokenId, id)
                }
              }
            }
          } ~
          path("host") {
            get {
              parameter(Symbol("id").?, Symbol("show").?) { (id, show) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getHostScanSummary(tokenId, id, show)
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.scanHost(tokenId, id)
                }
              }
            }
          } ~
          path("platform") {
            get {
              parameter(Symbol("platform").?, Symbol("show").?) { (platform, show) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getPlatformScanSummary(
                    tokenId,
                    platform,
                    show
                  )
                }
              }
            } ~
            post {
              entity(as[String]) { id =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.scanPlatform(tokenId, id)
                }
              }
            }
          } ~
          pathPrefix("config") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getScanConfig(tokenId)
              }
            } ~
            post {
              entity(as[ScanConfigWrap]) { scanConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.setAutoScanConfig(tokenId, scanConfig)
                }
              }
            }
          } ~
          pathPrefix("registry") {
            pathEnd {
              get {
                parameter(Symbol("name").?) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getScanRegistries(tokenId, name)
                  }
                }
              } ~
              post {
                entity(as[RegistryConfigV2Wrap]) { registryConfigV2 =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.addScanRegistry(tokenId, registryConfigV2)
                  }
                }
              } ~
              patch {
                entity(as[RegistryConfigV2DTO]) { registryConfigV2 =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.updateScanRegistry(tokenId, registryConfigV2)
                  }
                }
              } ~
              delete {
                parameter(Symbol("name")) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.deleteScanRegistry(tokenId, name)
                  }
                }
              }
            } ~
            path("test") {
              post {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  entity(as[RegistryConfigV2Wrap]) { registryConfigV2 =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.testScanRegistry(
                        tokenId,
                        transactionId,
                        registryConfigV2
                      )
                    }
                  }
                } ~
                entity(as[RegistryConfigV2Wrap]) { registryConfigV2 =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.testScanRegistry(
                      tokenId,
                      registryConfigV2
                    )
                  }
                }
              } ~
              delete {
                headerValueByName("X-Transaction-Id") { transactionId =>
                  parameter(Symbol("name")) { name =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.testDeleteScanRegistry(tokenId, transactionId, name)
                    }
                  }
                }
              }
            } ~
            path("repo") {
              get {
                parameter(Symbol("name")) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.getRepoScanRegistrySummary(tokenId, name)
                  }
                }
              } ~
              post {
                entity(as[String]) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.startRepoScanRegistry(tokenId, name)
                  }
                }
              } ~
              delete {
                parameter(Symbol("name")) { name =>
                  Utils.respondWithWebServerHeaders() {
                    resourceService.stopRepoScanRegistry(tokenId, name)
                  }
                }
              }
            } ~
            path("image") {
              get {
                parameter(Symbol("name"), Symbol("imageId"), Symbol("show").?) {
                  (name, imageId, show) =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.getImageScanReport(
                        tokenId,
                        name,
                        imageId,
                        show
                      )
                    }
                }
              }
            } ~
            path("type") {
              get {
                Utils.respondWithWebServerHeaders() {
                  resourceService.getRegistryTypes(tokenId)
                }
              }
            } ~
            path("layer") {
              get {
                parameter(Symbol("name"), Symbol("imageId"), Symbol("show").?) {
                  (name, imageId, show) =>
                    Utils.respondWithWebServerHeaders() {
                      resourceService.getLayerScanReport(
                        tokenId,
                        name,
                        imageId,
                        show
                      )
                    }
                }
              }
            }
          } ~
          path("top") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getTopVulnerableImages(tokenId)
              }
            }
          }
        } ~
        pathPrefix("admission") {
          path("rules") {
            get {
              parameters(Symbol("scope").?) { scope =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getAdmissionRules(tokenId, scope)
                }
              }
            }
          } ~
          path("rule") {
            post {
              entity(as[AdmRuleConfig]) { admissionRuleConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.addAdmissionRules(tokenId, admissionRuleConfig)
                }
              }
            } ~
            patch {
              entity(as[AdmRuleConfig]) { admissionRuleConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateAdmissionRule(tokenId, admissionRuleConfig)
                }
              }
            } ~
            delete {
              parameter(Symbol("scope").?, Symbol("id")) { (scope, id) =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.removeAdmissionDenyRule(tokenId, id, scope)
                }
              }
            }
          } ~
          path("options") {
            get {
              parameter(Symbol("scope").?) { scope =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.getAdmissionDenyRuleOptions(tokenId, scope)
                }
              }
            }
          } ~
          path("state") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.getAdmissionState(tokenId)
              }
            } ~
            patch {
              entity(as[AdmConfig]) { admConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.updateAdmissionState(tokenId, admConfig)
                }
              }
            }
          } ~
          path("test") {
            get {
              Utils.respondWithWebServerHeaders() {
                resourceService.testAdmissionControl(tokenId)
              }
            }
          } ~
          path("matching-test") {
            post {
              entity(as[String]) { formData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.testMatchingAdmissionRule(tokenId, formData)
                }
              }
            }
          } ~
          path("export") {
            post {
              entity(as[AdmExport]) { admExport =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.exportAdmission(tokenId, admExport)
                }
              }
            }
          } ~
          path("import") {
            post {
              headerValueByName("X-Transaction-Id") { transactionId =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importAdmission(
                    tokenId,
                    transactionId
                  )
                }
              } ~
              entity(as[String]) { formData =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.importAdmissionByFormData(tokenId, formData)
                }
              }
            }
          } ~
          path("promote") {
            post {
              entity(as[PromoteConfig]) { promoteConfig =>
                Utils.respondWithWebServerHeaders() {
                  resourceService.promoteAdmissionRule(tokenId, promoteConfig)
                }
              }
            }
          }
        }
      }
    }
}
