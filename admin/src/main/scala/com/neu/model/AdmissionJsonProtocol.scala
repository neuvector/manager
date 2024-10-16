package com.neu.model

import spray.json.*

object AdmissionJsonProtocol extends DefaultJsonProtocol {
  given admissionRuleSubCriterionFormat: RootJsonFormat[AdmRuleSubCriterion] = jsonFormat3(
    AdmRuleSubCriterion.apply
  )
  given admissionRuleCriterionFormat: RootJsonFormat[AdmRuleCriterion]       = jsonFormat8(
    AdmRuleCriterion.apply
  )
  given admissionRuleFormat: RootJsonFormat[AdmRule]                         = jsonFormat10(AdmRule.apply)
  given admissionRuleConfigFormat: RootJsonFormat[AdmRuleConfig]             = jsonFormat1(AdmRuleConfig.apply)
  given admStateFormat: RootJsonFormat[AdmState]                             = jsonFormat5(AdmState.apply)
  given admConfigFormat: RootJsonFormat[AdmConfig]                           = jsonFormat1(AdmConfig.apply)
  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]       = jsonFormat3(
    RemoteExportOptions.apply
  )
  given admExportFormat: RootJsonFormat[AdmExport]                           = jsonFormat3(AdmExport.apply)

  def admissionRuleCriterionToJson(admissionRuleCriterion: AdmRuleCriterion): String =
    admissionRuleCriterion.toJson.compactPrint
  def admissionRuleToJson(admissionRule: AdmRule): String                            = admissionRule.toJson.compactPrint
  def admissionRuleConfigToJson(admissionRuleConfig: AdmRuleConfig): String          =
    admissionRuleConfig.toJson.compactPrint
  def admConfigToJson(admConfig: AdmConfig): String                                  = admConfig.toJson.compactPrint
  def admExportToJson(admExport: AdmExport): String                                  = admExport.toJson.compactPrint
  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String    =
    remoteExportOptions.toJson.compactPrint
}
