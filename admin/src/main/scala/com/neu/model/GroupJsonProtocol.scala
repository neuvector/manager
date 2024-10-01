package com.neu.model

import spray.json.DefaultJsonProtocol
import spray.json.*

/**
 * Created by bxu on 4/25/16.
 */
object GroupJsonProtocol extends DefaultJsonProtocol {
  val equalOp    = "="
  val notEqualOp = "!="
  val containsOp = "@"
  val prefixOp   = "^"
  val regexOp    = "~"
  val notRegexOp = "!~"

  val containsSign = "contains"
  val prefixSign   = "prefix"
  val regexSign    = "regex"
  val notRegexSign = "!regex"
  val ops          = Seq(equalOp, notEqualOp, containsOp, prefixOp, regexOp, notRegexOp)

  given rule4GroupFormat: RootJsonFormat[Rule4Group]                             = jsonFormat11(Rule4Group.apply)
  given CLUSEventCondition4GroupFormat: RootJsonFormat[CLUSEventCondition4Group] =
    jsonFormat2(CLUSEventCondition4Group.apply)
  given responseRule4GroupFormat: RootJsonFormat[ResponseRule4Group]             = jsonFormat8(
    ResponseRule4Group.apply
  )
  given criteriaEntryFormat: RootJsonFormat[CriteriaEntry]                       = jsonFormat3(CriteriaEntry.apply)
  given scanBriefFormat: RootJsonFormat[ScanBrief]                               = jsonFormat3(ScanBrief.apply)
  given workloadBriefFormat: RootJsonFormat[WorkloadBrief]                       = rootFormat(
    lazyFormat(jsonFormat15(WorkloadBrief.apply))
  )
  given groupFormat: RootJsonFormat[Group]                                       = jsonFormat22(Group.apply)
  given groupWrapFormat: RootJsonFormat[GroupWrap]                               = jsonFormat1(GroupWrap.apply)

  given groupConfigFormat: RootJsonFormat[GroupConfig]                         = jsonFormat8(GroupConfig.apply)
  given groupConfig4LearnedFormat: RootJsonFormat[GroupConfig4Learned]         = jsonFormat5(
    GroupConfig4Learned.apply
  )
  given groupConfigWrapFormat: RootJsonFormat[GroupConfigWrap]                 = jsonFormat1(GroupConfigWrap.apply)
  given groupConfigWrap4LearnedFormat: RootJsonFormat[GroupConfigWrap4Learned] = jsonFormat1(
    GroupConfigWrap4Learned.apply
  )
  given groupsFormat: RootJsonFormat[Groups]                                   = jsonFormat1(Groups.apply)
  given remoteExportOptionsFormat: RootJsonFormat[RemoteExportOptions]         = jsonFormat3(
    RemoteExportOptions.apply
  )
  given groups4ExportFormat: RootJsonFormat[Groups4Export]                     = jsonFormat3(Groups4Export.apply)

  given criteriaItemFormat: RootJsonFormat[CriteriaItem]               = jsonFormat1(CriteriaItem.apply)
  given groupConfigDTOFormat: RootJsonFormat[GroupConfigDTO]           = jsonFormat8(GroupConfigDTO.apply)
  given serviceAddressFormat: RootJsonFormat[ServiceAddress]           = jsonFormat2(ServiceAddress.apply)
  given groupDTOFormat: RootJsonFormat[GroupDTO]                       = jsonFormat22(GroupDTO.apply)
  given groupDTOsFormat: RootJsonFormat[GroupDTOs]                     = jsonFormat1(GroupDTOs.apply)
  given groupDTOWrapFormat: RootJsonFormat[GroupDTOWrap]               = jsonFormat1(GroupDTOWrap.apply)
  given group4SingleFormat: RootJsonFormat[Group4Single]               = jsonFormat22(Group4Single.apply)
  given group4SingleWrapFormat: RootJsonFormat[Group4SingleWrap]       = jsonFormat1(
    Group4SingleWrap.apply
  )
  given grou4SingleDTOFormat: RootJsonFormat[Group4SingleDTO]          = jsonFormat22(Group4SingleDTO.apply)
  given group4SingleDTOWrapFormat: RootJsonFormat[Group4SingleDTOWrap] = jsonFormat1(
    Group4SingleDTOWrap.apply
  )

  def remoteExportOptionsToJson(remoteExportOptions: RemoteExportOptions): String =
    remoteExportOptions.toJson.compactPrint
  def groupsToJson(groups: Groups): String                                        = groups.toJson.compactPrint
  def groups4ExportToJson(groups4Export: Groups4Export): String                   = groups4Export.toJson.compactPrint

  def groupConfigWrapToJson(groupConfigWrap: GroupConfigWrap): String                         =
    groupConfigWrap.toJson.compactPrint
  def groupConfigWrap4LearnedToJson(groupConfigWrap4Learned: GroupConfigWrap4Learned): String =
    groupConfigWrap4Learned.toJson.compactPrint

  def groupWrapToJson(groupWrap: GroupWrap): String = groupWrap.toJson.compactPrint

  def jsonToGroups(response: String): Groups = response.parseJson.convertTo[Groups]

  def jsonToGroupWrap(response: String): GroupWrap               = response.parseJson.convertTo[GroupWrap]
  def jsonToGroup4SingleWrap(response: String): Group4SingleWrap =
    response.parseJson.convertTo[Group4SingleWrap]

  def groupDTOsToJson(groups: GroupDTOs): String = groups.toJson.compactPrint

  private def opToSign = (op: String) =>
    op match {
      case "@"          => containsSign
      case "^"          => prefixSign
      case "~"          => regexSign
      case "!="         => notEqualOp
      case `notRegexOp` => notRegexSign
      case _            => equalOp
    }

  private def signToOp = (sign: String) =>
    sign match {
      case "contains"     => containsOp
      case "prefix"       => prefixOp
      case `regexSign`    => regexOp
      case "!="           => notEqualOp
      case `notRegexSign` => notRegexOp
      case _              => equalOp
    }

  def criteriaEntryToItem: CriteriaEntry => CriteriaItem = (criteria: CriteriaEntry) =>
    CriteriaItem(criteria.key + signToOp(criteria.op) + criteria.value)

  def stringToCriteriaEntry: String => Option[CriteriaEntry] = (criteria: String) => {
    val opIndex = ops.map(x => OpIndex(x, opToSign(x), criteria.indexOf(x))).filter(_.index > 0)
    opIndex match {
      case Nil              => None
      case ls: Seq[OpIndex] =>
        val opIndex = ls.minBy(_.index)
        Some(
          CriteriaEntry(
            criteria.substring(0, opIndex.index),
            criteria.substring(opIndex.index + opIndex.op.length),
            opIndex.sign
          )
        )
    }
  }

  def toGroupDTO: Group => GroupDTO = (group: Group) => {
    val item =
      group.criteria.map((criteriaEntry: CriteriaEntry) => criteriaEntryToItem(criteriaEntry))
    GroupDTO(
      group.name,
      group.comment,
      group.domain,
      group.learned,
      group.reserved,
      item,
      group.members,
      group.policy_rules,
      group.response_rules.getOrElse(Array()),
      group.policy_mode,
      group.profile_mode,
      group.baseline_profile,
      group.platform_role,
      group.cap_change_mode,
      group.cap_scorable,
      group.kind,
      group.cfg_type,
      group.not_scored,
      group.monitor_metric,
      group.group_sess_cur,
      group.group_sess_rate,
      group.group_band_width
    )
  }

  def toGroup4SingleDTO: Group4Single => Group4SingleDTO = (group: Group4Single) => {
    val item =
      group.criteria.map((criteriaEntry: CriteriaEntry) => criteriaEntryToItem(criteriaEntry))
    Group4SingleDTO(
      group.name,
      group.comment,
      group.domain,
      group.learned,
      group.reserved,
      item,
      group.members,
      group.policy_rules,
      group.response_rules,
      group.policy_mode,
      group.profile_mode,
      group.baseline_profile,
      group.platform_role,
      group.cap_change_mode,
      group.cap_scorable,
      group.kind,
      group.cfg_type,
      group.not_scored,
      group.monitor_metric,
      group.group_sess_cur,
      group.group_sess_rate,
      group.group_band_width
    )
  }
}

case class OpIndex(op: String, sign: String, index: Int)
