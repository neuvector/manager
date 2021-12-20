package com.neu.model

case class LicenseRequest(
  name: String,
  email: String,
  phone: Option[String] = None,
  months: Int,
  node_limit: Int,
  multi_cluster_limit: Option[Int],
  cpu_limit: Option[Int] = None,
  scan: Boolean,
  enforce: Option[Boolean] = Some(true)
)
case class LicenseRequestWrap(license_request: LicenseRequest)

case class LicenseCode(license_code: String)

case class LicenseKey(license_key: String)
