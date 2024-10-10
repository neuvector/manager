package com.neu.utils

/**
 * Created by bxu on 5/6/16.
 */
object EnumUtils {
  val info = "info"

  private val codeSeverityMap =
    Map(5 -> "Critical", 4 -> "high", 3 -> "medium", 2 -> "low", 1 -> info)

  private val severityCodeMap =
    Map("Critical" -> 5, "high" -> 4, "medium" -> 3, "low" -> 2, info -> 1)

  def getSeverity(code: Int): String = codeSeverityMap.getOrElse(code, info)

  def getCode(severity: String): Int = severityCodeMap.getOrElse(severity, 1)

}
