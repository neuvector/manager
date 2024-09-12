package com.neu.core

import com.neu.model.{ ComplianceNIST, ComplianceNISTMap }
import com.typesafe.scalalogging.LazyLogging
import scala.collection.mutable._
import java.io.{ InputStream, InputStreamReader }
import org.apache.commons.csv.{ CSVFormat, CSVRecord }

import scala.jdk.CollectionConverters._

object CisNISTManager extends LazyLogging {
  private val inputStream: InputStream               = getClass.getResourceAsStream("/CIS_NIST-MASTER.CSV")
  private val inputStreamReader                      = new InputStreamReader(inputStream, "UTF-8")
  private val csvFormat: CSVFormat                   = CSVFormat.DEFAULT.builder().setHeader().build()
  private val csvRecords: scala.Iterable[CSVRecord]  = csvFormat.parse(inputStreamReader).asScala
  private val arrayNIST: ArrayBuffer[ComplianceNIST] = ArrayBuffer()
  private val mapNIST: scala.collection.mutable.Map[String, ComplianceNIST] =
    scala.collection.mutable.Map()
  for (record <- csvRecords) {
    val name       = record.get("Recommendation #")
    val subcontrol = record.get("CIS Sub-Control")
    val control_id = record.get("NIST Control Identifier")
    val title      = record.get("NIST Title")
    val nist = ComplianceNIST(
      name = name,
      subcontrol = subcontrol,
      control_id =
        if (control_id.startsWith("\"") && control_id.endsWith("\""))
          control_id.substring(1, control_id.length - 1)
        else control_id,
      title = title
    )
    arrayNIST += nist
    mapNIST += (name -> nist)
  }

  def getComplianceNIST(name: String): Option[ComplianceNIST] =
    mapNIST.get(name)

  def getCompliancesNIST(compliances: Array[String]): ComplianceNISTMap = {
    val nistMap: scala.collection.mutable.Map[String, ComplianceNIST] =
      scala.collection.mutable.Map()
    compliances.foreach(name => {
      mapNIST.get(name) match {
        case None                 => ()
        case Some(complianceNIST) => nistMap += (name -> complianceNIST)
      }
    })
    ComplianceNISTMap(nistMap.toMap)
  }
}
