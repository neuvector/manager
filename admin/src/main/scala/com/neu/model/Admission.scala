package com.neu.model

case class AdmRuleSubCriterion(
  name: String,
  op: String,
  value: String
)

case class AdmRuleCriterion(
  sub_criteria: Option[Array[AdmRuleSubCriterion]],
  name: String,
  op: Option[String],
  value: Option[String],
  path: Option[String],
  template_kind: Option[String],
  `type`: Option[String],
  value_type: Option[String]
)

case class AdmRule(
  id: Int,
  category: String,
  comment: Option[String],
  criteria: Option[Array[AdmRuleCriterion]],
  disable: Option[Boolean],
  critical: Option[Boolean] = None,
  cfg_type: Option[String] = Some("user_created"),
  rule_type: Option[String]
)

case class AdmRuleConfig(
  config: AdmRule
)

case class AdmState(
  enable: Boolean,
  mode: String,
  default_action: String,
  adm_client_mode: String,
  adm_client_mode_options: Map[String, String]
)

case class AdmConfig(
  state: AdmState
)

case class AdmExport(
  ids: Array[Int],
  export_config: Boolean
)
