package com.neu.utils

import java.security.MessageDigest

object Common {
  def shortKey(jwt: String): String = {
    val digest = MessageDigest.getInstance("SHA-256")
    digest
      .digest(jwt.getBytes("UTF-8"))
      .take(20)
      .map("%02x".format(_))
      .mkString
  }
}
