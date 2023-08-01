package com.neu.core

import com.neu.model.{ ComplianceNIST, ComplianceNISTMap }
import com.typesafe.scalalogging.LazyLogging
import scala.collection.mutable._
import scala.io.Source
import scala.math._
import scala.collection.mutable.Map
import java.io.{ File, FileReader }
import org.apache.commons.csv.CSVFormat
import scala.collection.JavaConverters._

object CisNISTManager extends LazyLogging {
  val fileURL                                = getClass.getResource("/CIS_NIST-MASTER.CSV")
  val file                                   = new File(fileURL.toURI)
  val fileReader                             = new FileReader(file)
  val csvFormat                              = CSVFormat.DEFAULT.withHeader()
  val csvRecords                             = csvFormat.parse(fileReader).asScala
  var arrayNIST: ArrayBuffer[ComplianceNIST] = ArrayBuffer()
  val mapNIST
    : scala.collection.mutable.Map[String, ComplianceNIST] = scala.collection.mutable.Map();
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
    var nistMap: scala.collection.mutable.Map[String, ComplianceNIST] =
      scala.collection.mutable.Map();
    compliances.foreach(name => {
      mapNIST.get(name) match {
        case None                 => None
        case Some(complianceNIST) => nistMap += (name -> complianceNIST)
      }
    })
    ComplianceNISTMap(nistMap.toMap)
  }
}
