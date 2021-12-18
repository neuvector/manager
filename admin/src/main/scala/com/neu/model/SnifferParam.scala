package com.neu.model

/**
  * Sniffer arguments
  * @param file_number number of file chunks
  * @param duration the duration in seconds
  * @param filter filters in free string form, like "port 80"
  */
case class SnifferParam (file_number: Option[Int], duration: Option[Int], filter: Option[String])

case class SnifferParamWarp (sniffer: SnifferParam)

case class SnifferData (workloadId: String, snifferParamWarp: SnifferParamWarp)