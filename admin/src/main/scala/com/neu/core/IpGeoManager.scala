package com.neu.core

import com.neu.model.IpGeo
import com.neu.model.IpMap
import com.typesafe.scalalogging.LazyLogging

import java.net.InetAddress
import scala.collection.mutable.*
import scala.io.Source
import scala.math.*

/**
 * Created by bxu on 3/25/16.
 */
object IpGeoManager extends LazyLogging {
  private val fileStreamIpV4                = getClass.getResourceAsStream("/IP2LOCATION-LITE-DB1.CSV")
  private val fileStreamIpV6                = getClass.getResourceAsStream("/IP2LOCATION-LITE-DB1.IPV6.CSV")
  private val fileStreamBufferIpV4          = Source.fromInputStream(fileStreamIpV4)
  private val fileStreamBufferIpV6          = Source.fromInputStream(fileStreamIpV6)
  private val arrayIpV4: ArrayBuffer[IpGeo] = ArrayBuffer()
  private val arrayIpV6: ArrayBuffer[IpGeo] = ArrayBuffer()
  for (line <- fileStreamBufferIpV4.getLines) {
    val cols = line.split(",").map(_.trim)
    arrayIpV4 += IpGeo(
      BigInt(cols(0).substring(1, cols(0).length - 1)),
      BigInt(cols(1).substring(1, cols(1).length - 1)),
      cols(2).substring(1, cols(2).length - 1),
      cols(3).substring(1, cols(3).length - 1)
    )
  }
  for (line <- fileStreamBufferIpV6.getLines) {
    val cols = line.split(",").map(_.trim)
    arrayIpV6 += IpGeo(
      BigInt(cols(0).substring(1, cols(0).length - 1)),
      BigInt(cols(1).substring(1, cols(1).length - 1)),
      cols(2).substring(1, cols(2).length - 1),
      cols(3).substring(1, cols(3).length - 1)
    )
  }
  fileStreamBufferIpV4.close
  fileStreamBufferIpV6.close

  private def ipV4ToNum(ip: String): BigInt =
    InetAddress.getByName(ip).getAddress.foldLeft(0L)((acc, b) => (acc << 8) + (b & 0xff))

  private def ipV6ToNum(ip: String): BigInt =
    BigInt(1, InetAddress.getByName(ip).getAddress)

  private def isIpV4(ip: String): Boolean = {
    val regexIPv4 =
      "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$".r
    ip.trim match {
      case regexIPv4(_*) => true
      case _             => false
    }
  }

  private def isIpV6(ip: String): Boolean = {
    val regexIPv6 =
      "^(?:(?:(?:[A-F0-9]{1,4}:){6}|(?=(?:[A-F0-9]{0,4}:){0,6}(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$)(([0-9A-F]{1,4}:){0,5}|:)((:[0-9A-F]{1,4}){1,5}:|:))(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}|(?=(?:[A-F0-9]{0,4}:){0,7}[A-F0-9]{0,4}$)(([0-9A-F]{1,4}:){1,7}|:)((:[0-9A-F]{1,4}){1,7}|:))$".r
    ip.trim match {
      case regexIPv6(_*) => true
      case _             => false
    }
  }

  private def binarySearch(data: ArrayBuffer[IpGeo], key: BigInt): IpGeo = {
    var start: Int = 0
    var end: Int   = data.length - 1
    var mid: Int   = 0
    while (start <= end) {
      mid = start - (start - end) / 2
      if (data(mid).from <= key && data(mid).to >= key) {
        return data(mid)
      } else if (data(mid).from < key) {
        start = mid + 1
      } else {
        end = mid - 1
      }
    }
    IpGeo(
      key,
      key,
      "-",
      "-"
    )
  }

  private def getCountry(ip: String): IpGeo =
    if (isIpV4(ip)) {
      binarySearch(arrayIpV4, ipV4ToNum(ip))
    } else if (isIpV6(ip)) {
      binarySearch(arrayIpV6, ipV6ToNum(ip))
    } else {
      IpGeo(
        0,
        0,
        "-",
        "-"
      )
    }

  def getCountries(ipList: Array[String]): IpMap = {
    val ipMap: scala.collection.mutable.Map[String, IpGeo] = scala.collection.mutable.Map();
    ipList.foreach { ip =>
      ipMap.get(ip) match {
        case Some(ipGeo) => None
        case None        => ipMap += (ip -> getCountry(ip))
      }
    }
    IpMap(ipMap.toMap)
  }
}
