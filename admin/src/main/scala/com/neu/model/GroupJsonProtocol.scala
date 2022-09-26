package com.neu.model

import spray.json.DefaultJsonProtocol
import spray.json._

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

  implicit val rule4GroupFormat: RootJsonFormat[Rule4Group] = jsonFormat11(Rule4Group)
  implicit val CLUSEventCondition4GroupFormat: RootJsonFormat[CLUSEventCondition4Group] =
    jsonFormat2(CLUSEventCondition4Group)
  implicit val responseRule4GroupFormat: RootJsonFormat[ResponseRule4Group] = jsonFormat8(
    ResponseRule4Group
  )
  implicit val criteriaEntryFormat: RootJsonFormat[CriteriaEntry] = jsonFormat3(CriteriaEntry)
  implicit val scanBriefFormat: RootJsonFormat[ScanBrief]         = jsonFormat3(ScanBrief)
  implicit val workloadBriefFormat: RootJsonFormat[WorkloadBrief] = rootFormat(
    lazyFormat(jsonFormat15(WorkloadBrief))
  )
  implicit val groupFormat: RootJsonFormat[Group]         = jsonFormat17(Group)
  implicit val groupWrapFormat: RootJsonFormat[GroupWrap] = jsonFormat1(GroupWrap)

  implicit val groupConfigFormat: RootJsonFormat[GroupConfig]         = jsonFormat4(GroupConfig)
  implicit val groupConfigWrapFormat: RootJsonFormat[GroupConfigWrap] = jsonFormat1(GroupConfigWrap)
  implicit val groupsFormat: RootJsonFormat[Groups]                   = jsonFormat1(Groups)
  implicit val groups4ExportFormat: RootJsonFormat[Groups4Export]     = jsonFormat2(Groups4Export)

  implicit val criteriaItemFormat: RootJsonFormat[CriteriaItem]     = jsonFormat1(CriteriaItem)
  implicit val groupConfigDTOFormat: RootJsonFormat[GroupConfigDTO] = jsonFormat4(GroupConfigDTO)
  implicit val serviceAddressFormat: RootJsonFormat[ServiceAddress] = jsonFormat2(ServiceAddress)
  implicit val groupDTOFormat: RootJsonFormat[GroupDTO]             = jsonFormat17(GroupDTO)
  implicit val groupDTOsFormat: RootJsonFormat[GroupDTOs]           = jsonFormat1(GroupDTOs)
  implicit val groupDTOWrapFormat: RootJsonFormat[GroupDTOWrap]     = jsonFormat1(GroupDTOWrap)
  implicit val group4SingleFormat: RootJsonFormat[Group4Single]     = jsonFormat17(Group4Single)
  implicit val group4SingleWrapFormat: RootJsonFormat[Group4SingleWrap] = jsonFormat1(
    Group4SingleWrap
  )
  implicit val grou4SingleDTOFormat: RootJsonFormat[Group4SingleDTO] = jsonFormat17(Group4SingleDTO)
  implicit val group4SingleDTOWrapFormat: RootJsonFormat[Group4SingleDTOWrap] = jsonFormat1(
    Group4SingleDTOWrap
  )

  def groupsToJson(groups: Groups): String                      = groups.toJson.compactPrint
  def groups4ExportToJson(groups4Export: Groups4Export): String = groups4Export.toJson.compactPrint

  def groupConfigWrapToJson(groupConfigWrap: GroupConfigWrap): String =
    groupConfigWrap.toJson.compactPrint

  def groupWrapToJson(groupWrap: GroupWrap): String = groupWrap.toJson.compactPrint

  def jsonToGroups(response: String): Groups = response.parseJson.convertTo[Groups]

  def jsonToGroupWrap(response: String): GroupWrap = response.parseJson.convertTo[GroupWrap]
  def jsonToGroup4SingleWrap(response: String): Group4SingleWrap =
    response.parseJson.convertTo[Group4SingleWrap]

  def groupDTOsToJson(groups: GroupDTOs): String = groups.toJson.compactPrint

  private def opToSign = (op: String) => {
    op match {
      case "@"          => containsSign
      case "^"          => prefixSign
      case "~"          => regexSign
      case "!="         => notEqualOp
      case `notRegexOp` => notRegexSign
      case _            => equalOp
    }
  }

  private def signToOp = (sign: String) => {
    sign match {
      case "contains"     => containsOp
      case "prefix"       => prefixOp
      case `regexSign`    => regexOp
      case "!="           => notEqualOp
      case `notRegexSign` => notRegexOp
      case _              => equalOp
    }
  }

  def criteriaEntryToItem: CriteriaEntry => CriteriaItem = (criteria: CriteriaEntry) => {
    CriteriaItem(criteria.key + signToOp(criteria.op) + criteria.value)
  }

  def stringToCriteriaEntry: String => Option[CriteriaEntry] = (criteria: String) => {
    val opIndex = ops.map(x => OpIndex(x, opToSign(x), criteria.indexOf(x))).filter(_.index > 0)
    opIndex match {
      case Nil => None
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
      group.baseline_profile,
      group.platform_role,
      group.cap_change_mode,
      group.cap_scorable,
      group.kind,
      group.cfg_type,
      group.not_scored
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
      group.baseline_profile,
      group.platform_role,
      group.cap_change_mode,
      group.cap_scorable,
      group.kind,
      group.cfg_type,
      group.not_scored
    )
  }
}

case class OpIndex(op: String, sign: String, index: Int)
