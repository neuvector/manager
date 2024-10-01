package com.neu.model

import spray.json.DefaultJsonProtocol
import spray.json.*
import com.neu.model.DashboardJsonProtocol.{ *, given }
import com.typesafe.scalalogging.LazyLogging

/**
 * Created by bxu on 4/29/16.
 */
object PolicyJsonProtocol extends DefaultJsonProtocol with LazyLogging {
  given deployFedRulesConfigFormat: RootJsonFormat[DeployFedRulesConfig] = jsonFormat2(
    DeployFedRulesConfig.apply
  )
  given responseRuleFormat: RootJsonFormat[Rule]                         = jsonFormat11(Rule.apply)
  given responseRule2Format: RootJsonFormat[Rule2]                       = jsonFormat11(Rule2.apply)
  given CLUSEventConditionFormat: RootJsonFormat[CLUSEventCondition]     = jsonFormat2(
    CLUSEventCondition.apply
  )
  given ruleFormat: RootJsonFormat[ResponseRule]                         = jsonFormat9(ResponseRule.apply)
  given responseRuleConfigFormat: RootJsonFormat[ResponseRuleConfig]     = jsonFormat1(
    ResponseRuleConfig.apply
  )
  given responseRulesFormat: RootJsonFormat[ResponseRules]               = jsonFormat2(ResponseRules.apply)
  given responseRulesWrapFormat: RootJsonFormat[ResponseRulesWrap]       = jsonFormat1(
    ResponseRulesWrap.apply
  )
  given responseRuleIDFormat: RootJsonFormat[ResponseRuleID]             = jsonFormat1(ResponseRuleID.apply)
  given unquarantineFormat: RootJsonFormat[Unquarantine]                 = jsonFormat1(Unquarantine.apply)
  given requestFormat: RootJsonFormat[Request]                           = jsonFormat1(Request.apply)
  given policyFormat: RootJsonFormat[Policy]                             = jsonFormat1(Policy.apply)
  given policy2Format: RootJsonFormat[Policy2]                           = jsonFormat2(Policy2.apply)
  given ruleInsertFormat: RootJsonFormat[RuleInsert]                     = jsonFormat2(RuleInsert.apply)
  given policyRuleInsertFormat: RootJsonFormat[PolicyRuleInsert]         = jsonFormat1(
    PolicyRuleInsert.apply
  )

  given applicationListFormat: RootJsonFormat[ApplicationList]         = jsonFormat1(ApplicationList.apply)
  given applicationListWrapFormat: RootJsonFormat[ApplicationListWrap] = jsonFormat1(
    ApplicationListWrap.apply
  )

  given scanConfigFormat: RootJsonFormat[ScanConfig]         = jsonFormat1(ScanConfig.apply)
  given scanConfigWrapFormat: RootJsonFormat[ScanConfigWrap] = jsonFormat1(ScanConfigWrap.apply)

  given ruleConfigFormat: RootJsonFormat[RuleConfig]         = jsonFormat8(RuleConfig.apply)
  given ruleConfigDataFormat: RootJsonFormat[RuleConfigData] = jsonFormat2(RuleConfigData.apply)

  given scannedWorkloadChildrenFormat: RootJsonFormat[ScannedWorkloadChildren]             =
    jsonFormat19(ScannedWorkloadChildren.apply)
  given scannedWorkloadsFormat: RootJsonFormat[ScannedWorkloads]                           = jsonFormat20(
    ScannedWorkloads.apply
  )
  given convertedScannedWorkloadsFormat: RootJsonFormat[ConvertedScannedWorkloads]         =
    jsonFormat22(ConvertedScannedWorkloads.apply)
  given scannedWorkloadsWrapFormat: RootJsonFormat[ScannedWorkloadsWrap]                   = jsonFormat2(
    ScannedWorkloadsWrap.apply
  )
  given convertedScannedWorkloadsWrapFormat: RootJsonFormat[ConvertedScannedWorkloadsWrap] =
    jsonFormat2(ConvertedScannedWorkloadsWrap.apply)

  given ipAddressFormat: RootJsonFormat[IpAddress]                               = jsonFormat3(IpAddress.apply)
  given protoPortFormat: RootJsonFormat[ProtoPort]                               = jsonFormat4(ProtoPort.apply)
  given scanSummaryFormat: RootJsonFormat[ScanSummary]                           = jsonFormat11(ScanSummary.apply)
  given scannedWorkloadChildren2Format: RootJsonFormat[ScannedWorkloadChildren2] =
    jsonFormat21(ScannedWorkloadChildren2.apply)
  given scannedWorkloads2Format: RootJsonFormat[ScannedWorkloads2]               = jsonFormat22(
    ScannedWorkloads2.apply
  )
  given scannedWorkloadsWrap2Format: RootJsonFormat[ScannedWorkloadsWrap2]       = jsonFormat1(
    ScannedWorkloadsWrap2.apply
  )
  given ruleIdsFormat: RootJsonFormat[RuleIds]                                   = jsonFormat1(RuleIds.apply)
  given promoteConfigFormat: RootJsonFormat[PromoteConfig]                       = jsonFormat1(PromoteConfig.apply)

  given workloadBriefV2Format: RootJsonFormat[WorkloadBriefV2]           = jsonFormat14(
    WorkloadBriefV2.apply
  )
  given workloadSecurityV2Format: RootJsonFormat[WorkloadSecurityV2]     = jsonFormat10(
    WorkloadSecurityV2.apply
  )
  given workloadRtAttribesV2Format: RootJsonFormat[WorkloadRtAttribesV2] = jsonFormat12(
    WorkloadRtAttribesV2.apply
  )
  given workloadV2ChildFormat: RootJsonFormat[WorkloadV2Child]           = jsonFormat12(
    WorkloadV2Child.apply
  )
  given workloadV2Format: RootJsonFormat[WorkloadV2]                     = jsonFormat13(WorkloadV2.apply)
  given workloadsWrapV2Format: RootJsonFormat[WorkloadsWrapV2]           = jsonFormat1(WorkloadsWrapV2.apply)

  def policyToJson(policy: Policy): String                                     = policy.toJson.compactPrint
  def policy2ToJson(policy2: Policy2): String                                  = policy2.toJson.compactPrint
  def responseRuleConfigToJson(responseRuleConfig: ResponseRuleConfig): String =
    responseRuleConfig.toJson.compactPrint
  def responseRulesWrapToJson(responseRulesWrap: ResponseRulesWrap): String    =
    responseRulesWrap.toJson.compactPrint
  def policyRuleInsertToJson(policy: PolicyRuleInsert): String                 = policy.toJson.compactPrint
  def requestToJson(request: Request): String                                  = request.toJson.compactPrint

  def jsonToPolicy(response: String): Policy = response.parseJson.convertTo[Policy]

  def deployFedRulesConfigToJson(deployFedRulesConfig: DeployFedRulesConfig): String =
    deployFedRulesConfig.toJson.compactPrint

  def scanConfigWrapToJson(scanConfigWrap: ScanConfigWrap): String =
    scanConfigWrap.toJson.compactPrint

  def ruleConfigDataToJson(ruleConfigData: RuleConfigData): String =
    ruleConfigData.toJson.compactPrint

  def promoteConfigToJson(promoteConfig: PromoteConfig): String =
    promoteConfig.toJson.compactPrint

  def jsonToScannedWorkloadsWrap(response: String): ScannedWorkloadsWrap   =
    response.parseJson.convertTo[ScannedWorkloadsWrap]
  def jsonToScannedWorkloadsWrap2(response: String): ScannedWorkloadsWrap2 =
    response.parseJson.convertTo[ScannedWorkloadsWrap2]

  def jsonToWorkloadsWrapV2(response: String): WorkloadsWrapV2 =
    response.parseJson.convertTo[WorkloadsWrapV2]

  def groupToNode(group: Group): Node =
    Node(
      group.name,
      group.name,
      if (group.reserved && group.name.equals("nv.external")) "external"
      else if (group.learned) "learned"
      else "custom",
      "",
      "",
      None,
      "",
      "",
      "",
      false,
      false,
      false
    )

  def ruleToEdge: (Rule, Int) => Edge =
    (rule: Rule, i: Int) =>
      Edge(
        id = Some(rule.id.toString),
        source = rule.from,
        target = rule.to,
        label = if ("deny".equalsIgnoreCase(rule.action)) Some("X") else None,
        status = rule.action,
        protocols = None,
        applications = rule.applications,
        bytes = 0
      )

  def convertScannedWorkloads(
    workloadsWrap: ScannedWorkloadsWrap
  ): ConvertedScannedWorkloadsWrap = {
    val convertedWorkloads = workloadsWrap.workloads.map { workload =>

      var high   = workload.high;
      var medium = workload.medium;
      if (workload.children.isDefined) {
        workload.children.get.foreach { child =>
          high += child.high
          medium += child.medium
        }
      }

      ConvertedScannedWorkloads(
        workload.id,
        workload.name,
        workload.base_os,
        workload.display_name,
        workload.domain,
        workload.high,
        workload.medium,
        high,
        medium,
        workload.host,
        workload.image,
        workload.platform_role,
        workload.policy_mode,
        workload.result,
        workload.service,
        workload.service_group,
        workload.state,
        workload.status,
        workload.scanner_version,
        workload.children,
        workload.scanned_timestamp,
        workload.scanned_at
      )
    }

    ConvertedScannedWorkloadsWrap(
      convertedWorkloads,
      workloadsWrap.status
    )
  }

  def convertScannedWorkloads2(workloadsWrap: ScannedWorkloadsWrap2): ScannedWorkloadsWrap2 = {
    val convertedWorkloads = workloadsWrap.workloads.map { workload =>

      var high   = workload.scan_summary.high;
      var medium = workload.scan_summary.medium;
      workload.children.foreach { child =>
        high += child.scan_summary.high
        medium += child.scan_summary.medium
      }

      workload.copy(
        scan_summary = ScanSummary(
          workload.scan_summary.status,
          workload.scan_summary.high,
          workload.scan_summary.medium,
          Option(high),
          Option(medium),
          workload.scan_summary.result,
          workload.scan_summary.scanned_timestamp,
          workload.scan_summary.scanned_at,
          workload.scan_summary.base_os,
          workload.scan_summary.scanner_version,
          workload.scan_summary.cvedb_create_time
        )
      )
    }

    ScannedWorkloadsWrap2(
      convertedWorkloads
    )
  }

  def convertWorkloadV2(workloadsWrapV2: WorkloadsWrapV2): WorkloadsWrapV2 = {
    val convertedWorkloads = workloadsWrapV2.workloads.map { workload =>

      var high   = workload.security.scan_summary.high;
      var medium = workload.security.scan_summary.medium;
      workload.children.foreach { child =>
        high += child.security.scan_summary.high
        medium += child.security.scan_summary.medium
      }

      val wlSecurity = workload.security.copy(
        scan_summary = ScanSummary(
          workload.security.scan_summary.status,
          workload.security.scan_summary.high,
          workload.security.scan_summary.medium,
          Option(high),
          Option(medium),
          workload.security.scan_summary.result,
          workload.security.scan_summary.scanned_timestamp,
          workload.security.scan_summary.scanned_at,
          workload.security.scan_summary.base_os,
          workload.security.scan_summary.scanner_version,
          workload.security.scan_summary.cvedb_create_time
        )
      )

      workload.copy(
        security = wlSecurity
      )
    }

    WorkloadsWrapV2(
      convertedWorkloads
    )
  }
}

case class ScanConfig(auto_scan: Boolean)

case class ScanConfigWrap(config: ScanConfig)
