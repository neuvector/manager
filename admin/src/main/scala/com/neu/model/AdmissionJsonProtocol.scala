package com.neu.model

import spray.json.*

object AdmissionJsonProtocol extends DefaultJsonProtocol {
  implicit val admissionRuleSubCriterionFormat: RootJsonFormat[AdmRuleSubCriterion] = jsonFormat3(
    AdmRuleSubCriterion
  )
  implicit val admissionRuleCriterionFormat: RootJsonFormat[AdmRuleCriterion]       = jsonFormat8(
    AdmRuleCriterion
  )
  implicit val admissionRuleFormat: RootJsonFormat[AdmRule]                         = jsonFormat10(AdmRule)
  implicit val admissionRuleConfigFormat: RootJsonFormat[AdmRuleConfig]             = jsonFormat1(AdmRuleConfig)
  implicit val admStateFormat: RootJsonFormat[AdmState]                             = jsonFormat5(AdmState)
  implicit val admConfigFormat: RootJsonFormat[AdmConfig]                           = jsonFormat1(AdmConfig)
  implicit val remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]       = jsonFormat3(
    RemoteExportOptions
  )
  implicit val admExportFormat: RootJsonFormat[AdmExport]                           = jsonFormat3(AdmExport)

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
