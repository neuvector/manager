package com.neu.utils

import java.security.MessageDigest

object Common {
  def shortKey(jwt: String): String = {
    val digest = MessageDigest.getInstance("SHA-256")
    digest
      .digest(jwt.getBytes(java.nio.charset.StandardCharsets.UTF_8))
      .take(10)
      .map("%02x".format(_))
      .mkString
  }
}
