package com.neu.service.workload

import com.neu.cache.paginationCacheManager
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.model.ContainerConfigJsonProtocol.*
import com.neu.model.NamespaceJsonProtocol.*
import com.neu.model.PolicyJsonProtocol.{ *, given }
import com.neu.model.*
import com.neu.service.BaseService
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.Await
import scala.concurrent.duration.*
import scala.util.control.NonFatal

class WorkloadService() extends BaseService with DefaultJsonFormats with LazyLogging {

  private val monitorConfig = """{"config": {"monitor": """

  def getWorkload(tokenId: String, id: Option[String]): Route = complete {
    id.fold(
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/workload?view=pod",
        GET,
        "",
        tokenId
      )
    )(someId =>
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/workload/$someId/stats",
        GET,
        "",
        tokenId
      )
    )
  }

  def updateWorkload(tokenId: String, quarantineRequest: ContainerQuarantineRequest): Route =
    complete {
      val payload = quarantineConfigWarpToJson(
        QuarantineConfigWarp(QuarantineConfig(quarantineRequest.quarantine))
      )
      logger.info("Quarantining container: {}", payload)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/workload/${quarantineRequest.id}",
        PATCH,
        payload,
        tokenId
      )
    }

  def getScannedWorkload(tokenId: String, start: Option[String], limit: Option[String]): Route = {
    val cacheKey                                   = if (tokenId.length > 20) tokenId.substring(0, 20) else tokenId
    var convertedScannedWorkloads: WorkloadsWrapV2 = null
    var elements: Array[WorkloadV2]                = null
    complete {
      try {
        if (start.isEmpty || start.get.toInt == 0) {
          val url              = s"${baseClusterUriV2(tokenId)}/workload?view=pod"
          logger.info("Get workloads data from {}", url)
          val scannedWorkloads = RestClient.requestWithHeaderDecode(
            url,
            GET,
            "",
            tokenId
          )
          logger.info("Waiting....")
          convertedScannedWorkloads = convertWorkloadV2(
            jsonToWorkloadsWrapV2(
              Await.result(scannedWorkloads, RestClient.waitingLimit.seconds)
            )
          )
          logger.info("convertedScannedWorkloads {}", convertedScannedWorkloads)
          if (start.isDefined && start.get.toInt == 0) {
            paginationCacheManager[Array[WorkloadV2]]
              .savePagedData(s"$cacheKey-workload", convertedScannedWorkloads.workloads)
          }
        }
        if (start.isDefined && limit.isDefined) {
          if (elements == null) {
            elements = paginationCacheManager[Array[WorkloadV2]]
              .getPagedData(s"$cacheKey-workload")
              .getOrElse(Array[WorkloadV2]())
          }
          val output     =
            elements.slice(start.get.toInt, start.get.toInt + limit.get.toInt)
          if (output.length < limit.get.toInt) {
            paginationCacheManager[Array[WorkloadV2]]
              .removePagedData(s"$cacheKey-workload")
          }
          val cachedData = paginationCacheManager[Array[WorkloadV2]]
            .getPagedData(s"$cacheKey-workload")
            .getOrElse(Array[WorkloadV2]())
          logger.info("Cached data size: {}", cachedData.length)
          logger.info("Paged response size: {}", output.length)
          output
        } else {
          convertedScannedWorkloads
        }
      } catch {
        case NonFatal(e) =>
          paginationCacheManager[Array[WorkloadV2]]
            .removePagedData(s"$cacheKey-workload")
          if (
            e.getMessage.contains("Status: 408") || e.getMessage.contains(
              "Status: 401"
            )
          ) {
            (StatusCodes.RequestTimeout, "Session expired!")
          } else {
            logger.info("Error message: {}", e.getMessage)
            (StatusCodes.InternalServerError, "Internal server error")
          }
      }
    }
  }

  def getWorkloadById(tokenId: String, id: Option[String]): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload/${id.get}",
      GET,
      "",
      tokenId
    )
  }

  def updateWorkloadMonitor(tokenId: String, id: String, monitor: String): Route = complete {
    logger.info(id + monitor)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload/$id",
      PATCH,
      monitorConfig + s"$monitor}}",
      tokenId
    )
  }

  def getWorkloadCompliance(tokenId: String, id: String): Route = complete {
    logger.info(s"get compliance for $id")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload/$id/compliance",
      GET,
      "",
      tokenId
    )
  }

  def getContainer(tokenId: String, id: Option[String]): Route = complete {
    id.fold(
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/workload?view=pod",
        GET,
        "",
        tokenId
      )
    )(someId =>
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/workload/$someId?view=pod",
        GET,
        "",
        tokenId
      )
    )
  }

  def getContainerProcess(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload/$id/process",
      GET,
      "",
      tokenId
    )
  }

  def getContainerProcessHistory(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/workload/$id/process_history",
      GET,
      "",
      tokenId
    )
  }

  def getSniffer(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/sniffer?f_workload=$id",
      GET,
      "",
      tokenId
    )
  }

  def createSniffer(tokenId: String, snifferData: SnifferData): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/sniffer?f_workload=${snifferData.workloadId}",
      POST,
      snifferParamWarpToJson(snifferData.snifferParamWarp),
      tokenId
    )
  }

  def stopSniffer(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/sniffer/stop/$id",
      PATCH,
      "",
      tokenId
    )
  }

  def removeSniffer(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/sniffer/$id",
      DELETE,
      "",
      tokenId
    )
  }

  def getPcap(tokenId: String, id: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/sniffer/$id/pcap?limit=104857600",
      GET,
      "",
      tokenId
    )
  }

  def getDomain(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/domain",
      GET,
      "",
      tokenId
    )
  }

  def updateDomain(tokenId: String, config: NamespaceConfig): Route = complete {
    val payload = configWrapToJson(
      NamespaceConfigData(config)
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/domain/${config.name}",
      PATCH,
      payload,
      tokenId
    )
  }

  def updateDomain(tokenId: String, config: DomainConfig): Route        = complete {
    val payload = domainConfigWrapToJson(
      DomainConfigData(config)
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/domain",
      PATCH,
      payload,
      tokenId
    )
  }
  def getScanReport(tokenId: String, request: ScanReportRequest): Route = complete {
    val payload = scanReportRequestToJson(request)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/scan/workloads/scan_report",
      POST,
      payload,
      tokenId
    )
  }
}
