package com.neu.service.risk

import com.google.common.net.UrlEscapers
import com.neu.client.RestClient
import com.neu.client.RestClient.*
import com.neu.core.AuthenticationManager
import com.neu.core.CisNISTManager
import com.neu.model.ComplianceJsonProtocol.*
import com.neu.model.ComplianceNISTJsonProtocol.given
import com.neu.model.VulnerabilityJsonProtocol.*
import com.neu.model.*
import com.neu.service.BaseService
import com.neu.service.DefaultJsonFormats
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.HttpMethods.*
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.server.Route

import scala.concurrent.TimeoutException
import scala.util.control.NonFatal
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class RiskService extends BaseService with DefaultJsonFormats with LazyLogging {

  private val scanUrl                 = "scan/asset"
  private val complianceUrl           = "compliance/asset"
  private val complianceProfileUrl    = "compliance/profile"
  private val complianceFilterUrl     = "compliance/available_filter"
  private val vulnerabilityProfileUrl = "vulnerability/profile"

  final val serverErrorStatus = "Status: 503"

  def queryScannedAssets(tokenId: String, scannedAssetsQuery: ScannedAssetsQuery): Route =
    complete {
      logger.info("Getting scanned assets ...")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/scan/asset/images",
        POST,
        scannedAssetsQueryToJson(
          scannedAssetsQuery
        ),
        tokenId
      )
    }

  def getScannedImages(
    tokenId: String,
    token: String,
    start: String,
    row: String,
    orderby: Option[String],
    orderbyColumn: Option[String],
    qf: Option[String]
  ): Route = complete {
    val url =
      s"${baseClusterUri(tokenId)}/scan/asset/images?token=$token&start=$start&row=$row${
          if (orderby.isDefined)
            s"&orderby=${orderby.get}"
          else ""
        }${
          if (orderbyColumn.isDefined)
            s"&orderbyColumn=${orderbyColumn.get}"
          else ""
        }${
          if (qf.isDefined)
            s"&qf=${URLEncoder.encode(qf.get, StandardCharsets.UTF_8.toString)}"
          else ""
        }"
    RestClient.httpRequestWithHeader(url, GET, "", tokenId)
  }

  def queryAssetVulnerabilities(tokenId: String, vulnerabilityQuery: VulnerabilityQuery): Route =
    complete {
      logger.info("Getting asset vulnerabilities ...")
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/vulasset",
        POST,
        vulnerabilityQueryToJson(
          vulnerabilityQuery
        ),
        tokenId
      )
    }

  def getValAssets(
    tokenId: String,
    token: String,
    start: String,
    row: String,
    orderby: Option[String],
    orderbyColumn: Option[String],
    lastmtime: Option[String],
    qf: Option[String],
    scoretype: Option[String]
  ): Route = complete {
    val url =
      s"${baseClusterUri(tokenId)}/vulasset?token=$token&start=$start&row=$row${
          if (orderby.isDefined)
            s"&orderby=${orderby.get}"
          else ""
        }${
          if (orderbyColumn.isDefined)
            s"&orderbyColumn=${orderbyColumn.get}"
          else ""
        }${
          if (lastmtime.isDefined)
            s"&lastmtime=${lastmtime.get}"
          else ""
        }${
          if (qf.isDefined)
            s"&qf=${URLEncoder.encode(qf.get, StandardCharsets.UTF_8.toString)}"
          else ""
        }${
          if (scoretype.isDefined)
            s"&scoretype=${scoretype.get}"
          else ""
        }"
    RestClient.httpRequestWithHeader(url, GET, "", tokenId)
  }

  def getCve(tokenId: String, show: Option[String]): Route = complete {
    val url =
      s"${baseClusterUri(tokenId)}/$scanUrl${
          if (show.isDefined) s"?show=${show.get}"
          else ""
        }"
    logger.info("Getting asset vulnerabilities ...{}", url)
    RestClient.httpRequestWithHeader(url, GET, "", tokenId)
  }

  def queryCveAssetsView(
    tokenId: String,
    queryToken: Option[String],
    timeRange: TimeRange
  ): Route = {
    val url = queryToken.fold(
      s"${baseClusterUri(tokenId)}/assetvul"
    ) { queryToken =>
      s"${baseClusterUri(tokenId)}/assetvul?token=$queryToken"
    }
    complete {
      RestClient.httpRequestWithHeader(
        url,
        POST,
        timeRangeToJson(timeRange),
        tokenId
      )
    }
  }

  def getCveVulnerabilityProfiles(tokenId: String): Route = complete {
    logger.info("Getting vulnerability profiles ...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl",
      GET,
      "",
      tokenId
    )
  }

  def updateCveVulnerabilityProfiles(
    tokenId: String,
    vulnerabilityProfileConfigData: VulnerabilityProfileConfigData
  ): Route = complete {
    logger.info(
      "Update vulnerability profiles: {}",
      vulnerabilityProfileConfigData.config.name
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(vulnerabilityProfileConfigData.config.name)}",
      PATCH,
      vulnerabilityProfileConfigDataToJson(vulnerabilityProfileConfigData),
      tokenId
    )
  }

  def addCveVulnerabilityProfileEntry(
    tokenId: String,
    vulnerabilityProfileConfigData: VulnerabilityProfileConfigData
  ): Route = complete {
    try {
      logger.info(
        "Add vulnerability profile entry: {}",
        vulnerabilityProfileConfigData.config.name
      )
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(vulnerabilityProfileConfigData.config.name)}/entry",
        POST,
        vulnerabilityProfileEntryConfigDataToJson(
          VulnerabilityProfileEntryConfigData(
            vulnerabilityProfileConfigData.config.entries.get(0)
          )
        ),
        tokenId
      )
    } catch {
      case NonFatal(e)         =>
        logger.warn(e.getMessage)
        (StatusCodes.InternalServerError, "No entry has in the config data!")
      case e: TimeoutException =>
        logger.warn(e.getMessage)
        (StatusCodes.NetworkConnectTimeout, "Network connect timeout error")
    }
  }

  def updateCveVulnerabilityProfileEntry(
    tokenId: String,
    name: String,
    vulnerabilityProfileEntryConfigData: VulnerabilityProfileEntryConfigData
  ): Route = complete {
    logger.info(
      "Update vulnerability profile entry (Profile name): {}",
      name
    )
    logger.info(
      "Update vulnerability profile entry (Entry ID): {}",
      vulnerabilityProfileEntryConfigData.config.id
    )
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers
          .urlFragmentEscaper()
          .escape(name)}/entry/${vulnerabilityProfileEntryConfigData.config.id.get}",
      PATCH,
      vulnerabilityProfileEntryConfigDataToJson(
        vulnerabilityProfileEntryConfigData
      ),
      tokenId
    )
  }

  def deleteCveVulnerabilityProfileEntry(
    tokenId: String,
    profileName: String,
    entryId: String
  ): Route = complete {
    logger.info(
      "Delete vulnerability profile entry (Profile name): {}",
      profileName
    )
    logger.info("Delete vulnerability profile entry (Entry ID): {}", entryId)
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$vulnerabilityProfileUrl/${UrlEscapers
          .urlFragmentEscaper()
          .escape(profileName)}/entry/${UrlEscapers.urlFragmentEscaper().escape(entryId)}",
      DELETE,
      "",
      tokenId
    )
  }

  def exportCveProfile(
    tokenId: String,
    vulnerabilityProfileExportData: VulnerabilityProfileExportData
  ): Route = complete {
    logger.info("Exporting CVE profile")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file/$vulnerabilityProfileUrl",
      POST,
      vulnerabilityProfileExportDataToJson(vulnerabilityProfileExportData),
      tokenId
    )
  }

  def importCveProfile(tokenId: String, transactionId: String, option: String): Route = complete {
    try {
      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
      val baseUrl       = cachedBaseUrl.fold {
        baseClusterUri(tokenId)
      }(cachedBaseUrl => cachedBaseUrl)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("Transaction ID(Post): {}", transactionId)
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/$vulnerabilityProfileUrl/config?option=$option",
        POST,
        "",
        tokenId,
        Some(transactionId)
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def importCvsProfileByFormData(tokenId: String, formData: String, option: String): Route =
    complete {
      try {
        val baseUrl              =
          baseClusterUri(tokenId)
        AuthenticationManager.setBaseUrl(tokenId, baseUrl)
        logger.info("test baseUrl: {}", baseUrl)
        logger.info("No Transaction ID(Post)")
        val lines: Array[String] = formData.split("\n")
        val contentLines         = lines.slice(4, lines.length - 1)
        val bodyData             = contentLines.mkString("\n")
        RestClient.httpRequestWithHeader(
          s"$baseUrl/file/$vulnerabilityProfileUrl/config?option=$option",
          POST,
          bodyData,
          tokenId
        )
      } catch {
        case NonFatal(e) =>
          RestClient.handleError(
            timeOutStatus,
            authenticationFailedStatus,
            serverErrorStatus,
            e
          )
      }
    }

  def queryNistCompliances(complianceNISTConfigData: ComplianceNISTConfigData): Route = complete {
    logger.info("Get NIST compliances: {}", complianceNISTConfigData.config.names)
    CisNISTManager.getCompliancesNIST(complianceNISTConfigData.config.names)
  }

  def getCompliances(tokenId: String): Route = complete {
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$complianceUrl",
      GET,
      "",
      tokenId
    )
  }

  def getComplianceTemplate(tokenId: String): Route = complete {
    logger.info("Getting compliance template ...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/list/compliance",
      GET,
      "",
      tokenId
    )
  }

  def getAvailableComplianceFilters(tokenId: String): Route = complete {
    logger.info("Getting available compliance filters ...")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/$complianceFilterUrl",
      GET,
      "",
      tokenId
    )
  }

  def getComplianceProfile(tokenId: String, name: Option[String]): Route = complete {
    logger.info(s"Getting compliance profile $name ...")
    name.fold {
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$complianceProfileUrl",
        GET,
        "",
        tokenId
      )
    } { profileName =>
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$complianceProfileUrl/$profileName",
        GET,
        "",
        tokenId
      )
    }
  }

  def updateComplianceProfile(tokenId: String, profileConfig: ComplianceProfileConfig): Route =
    complete {
      val payload = configWrapToJson(
        ComplianceProfileConfigData(
          profileConfig
        )
      )
      logger.info("Updating compliance profile: {}", profileConfig.name)
      RestClient.httpRequestWithHeader(
        s"${baseClusterUri(tokenId)}/$complianceProfileUrl/${UrlEscapers.urlFragmentEscaper().escape(profileConfig.name)}",
        PATCH,
        payload,
        tokenId
      )
    }

  def exportComplianceProfile(
    tokenId: String,
    complianceProfileExportData: ComplianceProfileExportData
  ): Route = complete {
    logger.info("Exporting compliance profile")
    RestClient.httpRequestWithHeader(
      s"${baseClusterUri(tokenId)}/file/$complianceProfileUrl",
      POST,
      complianceProfileExportDataToJson(complianceProfileExportData),
      tokenId
    )
  }

  def importComplianceProfile(tokenId: String, transactionId: String): Route = complete {
    try {
      val cachedBaseUrl = AuthenticationManager.getBaseUrl(tokenId)
      val baseUrl       = cachedBaseUrl.fold {
        baseClusterUri(tokenId)
      }(cachedBaseUrl => cachedBaseUrl)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("Transaction ID(Post): {}", transactionId)
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/$complianceProfileUrl/config",
        POST,
        "",
        tokenId,
        Some(transactionId)
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }

  def importComplianceProfileByFormData(tokenId: String, formData: String): Route = complete {
    try {
      val baseUrl              =
        baseClusterUri(tokenId)
      AuthenticationManager.setBaseUrl(tokenId, baseUrl)
      logger.info("test baseUrl: {}", baseUrl)
      logger.info("No Transaction ID(Post)")
      val lines: Array[String] = formData.split("\n")
      val contentLines         = lines.slice(4, lines.length - 1)
      val bodyData             = contentLines.mkString("\n")
      RestClient.httpRequestWithHeader(
        s"$baseUrl/file/$complianceProfileUrl/config",
        POST,
        bodyData,
        tokenId
      )
    } catch {
      case NonFatal(e) =>
        RestClient.handleError(
          timeOutStatus,
          authenticationFailedStatus,
          serverErrorStatus,
          e
        )
    }
  }
}
