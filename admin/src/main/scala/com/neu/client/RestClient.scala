package com.neu.client

import com.neu.api.DefaultJsonFormats
import com.neu.core.{ AuthenticationManager, ClientSslConfig }
import com.neu.core.CommonSettings._
import com.neu.web.Rest.{ executionContext, system }
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.Http
import org.apache.pekko.http.scaladsl.coding.Coders
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.model.headers._
import org.apache.pekko.http.scaladsl.unmarshalling.Unmarshal
import org.apache.pekko.http.scaladsl.marshalling.Marshal
import org.apache.pekko.stream.Materializer

import java.io.{ PrintWriter, StringWriter }
import java.net.InetAddress
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContext, Future }
import scala.util.control.NonFatal

object Constant {
  val waitingLimit = 60
}

/**
 * Rest client
 *
 */
object RestClient extends RestClient with LazyLogging {

  var baseUri: String = s"https://$ctrlHost:$ctrlPort/v1"
  var fedUri: String  = s"https://$ctrlHost:$ctrlPort/v1/fed"

  val waitingLimit: Int = Constant.waitingLimit

  def reloadCtrlIp(): Unit =
    baseUri = s"https://$ctrlHost:$ctrlPort/v1"

  def switchCluster(tokenId: String, name: Option[String]): Unit = {
    logger.info("Switching to cluster: {}", name)
    AuthenticationManager.switchCluster(tokenId, name)
  }

  def getClusterSummaryUrl(name: String): String =
    s"https://$ctrlHost:$ctrlPort/v1/fed/cluster/$name/v1/system/summary"

  def baseClusterUri(tokenId: String, ctrlHostIp: String = ctrlHost): String = {
    val clusterId: Option[String] = AuthenticationManager.getCluster(tokenId)
    clusterId.fold(
      s"https://$ctrlHost:$ctrlPort/v1"
    )(
      id => s"https://$ctrlHost:$ctrlPort/v1/fed/cluster/$id/v1"
    )
  }

  def baseClusterUriV2(tokenId: String, ctrlHostIp: String = ctrlHost): String = {
    val clusterId: Option[String] = AuthenticationManager.getCluster(tokenId)
    clusterId.fold(
      s"https://$ctrlHost:$ctrlPort/v2"
    )(
      id => s"https://$ctrlHost:$ctrlPort/v1/fed/cluster/$id/v2"
    )
  }

}

class RestClient()(
  implicit system: ActorSystem,
  executionContext: ExecutionContext
) extends DefaultJsonFormats
    with ClientSslConfig
    with LazyLogging {

  final val auth = "auth"

  var token: Option[String] = None

  private val TOKEN_HEADER: String    = "X-Auth-Token"
  private val X_NV_PAGE: String       = "X-Nv-Page"
  private val X_TRN_ID: String        = "X-Transaction-Id"
  private val X_AS_STANDALONE: String = "X-As-Standalone"
  private val X_SUSE_TOKEN: String    = "X-R-Sess"

  def sendAndReceive: HttpRequest => Future[HttpResponse] = mySendReceive

  def createHttpRequest(uri: String, method: HttpMethod, data: String): HttpRequest =
    HttpRequest(method = method, uri = uri, entity = HttpEntity(data))

  def cloneHttpRequest(uri: String, request: HttpRequest): HttpRequest =
    request.copy(uri = uri, headers = Nil)

  /**
   * Makes HTTP request
   *
   * @param uri    The request uri
   * @param data   The payload
   * @param method The method of the request
   * @return
   */
  def httpRequest(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = ""
  ): Future[String] = {
    val request = createHttpRequest(uri, method, data)
    sendAndReceive(request).flatMap { response =>
      response.entity.toStrict(5.seconds).map(_.data.utf8String)
    }
  }

  /**
   * Makes HTTP request
   *
   * @param uri    The request uri
   * @param data   The payload
   * @param method The method of the request
   * @return
   */
  def passHttpRequest(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = ""
  ): Future[HttpResponse] = {
    val request = createHttpRequest(uri, method, data)
    sendAndReceive(request)
  }

  def proxyHttpRequest(uri: String, request: HttpRequest): Future[HttpResponse] = {
    val clonedRequest = cloneHttpRequest(uri, request)
    sendAndReceive(clonedRequest)
  }

  def httpRequestWithTokenHeader(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = "",
    suseToken: String = ""
  ): Future[String] = {
    val request =
      createHttpRequest(uri, method, data).withHeaders(RawHeader(X_SUSE_TOKEN, suseToken))
    sendAndReceive(request).flatMap { response =>
      response.entity.toStrict(5.seconds).map(_.data.utf8String)
    }
  }

  def httpRequestWithHeader(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = "",
    token: String,
    transactionId: Option[String] = None,
    asStandalone: Option[String] = None,
    source: Option[String] = None
  ): Future[HttpResponse] = {
    logger.info("httpRequestWithHeader {}", source)
    var request = createHttpRequest(uri, method, data).withHeaders(RawHeader(TOKEN_HEADER, token))

    transactionId.foreach(id => request = request.withHeaders(RawHeader(X_TRN_ID, id)))
    asStandalone.foreach(
      standalone => request = request.withHeaders(RawHeader(X_AS_STANDALONE, standalone))
    )
    source.foreach(src => request = request.withHeaders(RawHeader(X_NV_PAGE, src)))

    logger.info("httpRequestWithHeader {}", request)
    sendAndReceive(request)
  }

  private def baseRequest(
    uri: String,
    method: HttpMethod,
    data: String,
    token: String
  ): HttpRequest =
    HttpRequest(method, uri, entity = HttpEntity(ContentTypes.`application/json`, data))
      .withHeaders(
        RawHeader(TOKEN_HEADER, token),
        RawHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.getOrElse(token, "")),
        `Accept-Encoding`(HttpEncodings.gzip),
        RawHeader("Transfer-Encoding", "gzip"),
        `Cache-Control`(CacheDirectives.`no-cache`)
      )

  def httpRequestWithHeaderDecode(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = "",
    token: String
  ): Future[HttpResponse] = {
    val request = baseRequest(uri, method, data, token)
    sendAndReceive(request)
  }

  def binaryWithHeader(
    uri: String,
    method: HttpMethod = HttpMethods.POST,
    data: Multipart.FormData,
    token: String,
    transactionId: Option[String] = None,
    asStandalone: Option[String] = None
  ): Future[HttpResponse] = {
    // Create the base request with the URI, method, and entity
    val baseRequest = HttpRequest(
      method = method,
      uri = uri,
      entity = data.toEntity()
    ).withHeaders(RawHeader(TOKEN_HEADER, token))

    // Add optional headers
    val requestWithTransactionId = transactionId.fold(baseRequest) { id =>
      baseRequest.withHeaders(baseRequest.headers :+ RawHeader(X_TRN_ID, id))
    }

    val finalRequest = asStandalone.fold(requestWithTransactionId) { standalone =>
      requestWithTransactionId.withHeaders(
        requestWithTransactionId.headers :+ RawHeader(X_AS_STANDALONE, standalone)
      )
    }

    // Send the request
    sendAndReceive(finalRequest)
  }

  private def basePost(uri: String, data: Multipart.FormData, token: String): Future[HttpRequest] =
    // Marshal the Multipart.FormData to an entity
    Marshal(data).to[RequestEntity].map { entity =>
      HttpRequest(
        method = HttpMethods.POST,
        uri = uri,
        entity = entity
      ).withHeaders(
        RawHeader(TOKEN_HEADER, token),
        RawHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.getOrElse(token, "")),
        `Accept-Encoding`(HttpEncodings.gzip),
        RawHeader("Transfer-Encoding", "gzip"),
        `Cache-Control`(CacheDirectives.`no-cache`)
      )
    }

  def requestWithHeader(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = "",
    token: String
  ): Future[String] = {
    val request = baseRequest(uri, method, data, token)
    sendAndReceive(request).flatMap { response =>
      response.entity.toStrict(5.seconds).map(_.data.utf8String)
    }
  }

  def requestWithHeaderDecode(
    uri: String,
    method: HttpMethod = HttpMethods.GET,
    data: String = "",
    token: String,
    nvPage: String = ""
  ): Future[String] = {
    val request = if (nvPage != "dashboard") {
      baseRequest(uri, method, data, token)
    } else {
      baseRequest(uri, method, data, token).withHeaders(RawHeader(X_NV_PAGE, "dashboard"))
    }

    sendAndReceive(request).flatMap { response =>
      Unmarshal(response.entity.withContentType(ContentTypes.`application/json`)).to[String]
    }
  }

  def reloadCtrlIp(tokenId: String, index: Int): String = {
    val ctrlCluster: Array[String] = InetAddress.getAllByName(ctrlHost).map(_.getHostAddress)
    logger.info("Controller ips: {}", ctrlCluster.mkString(" "))
    val ctrlIp = ctrlCluster(index)
    try {
      val res = requestWithHeader(
        s"https://$ctrlIp:$ctrlPort/v1/$auth",
        HttpMethods.PATCH,
        "",
        tokenId
      )
      Await.result(res, Constant.waitingLimit.seconds)
      ctrlIp
    } catch {
      case NonFatal(e) =>
        if (!e.getMessage.contains("Status: 401") &&
            !e.getMessage.contains("Status: 408") &&
            index < ctrlCluster.length - 1) {
          reloadCtrlIp(tokenId, index + 1)
        } else {
          throw e
        }
    }
  }

  def handleError(
    timeOutStatus: String,
    authenticationFailedStatus: String,
    serverErrorStatus: String,
    e: Throwable
  ): (StatusCode, String) = {
    val PERMISSION_DENIED = "Permission denied"
    val sw                = new StringWriter
    e.printStackTrace(new PrintWriter(sw))
    logger.warn(sw.toString)
    if (e.getMessage.contains(timeOutStatus)) {
      (StatusCodes.RequestTimeout, "Session expired!")
    } else if (e.getMessage.contains(authenticationFailedStatus)) {
      (StatusCodes.Unauthorized, "Authentication failed!")
    } else if (e.getMessage.contains(serverErrorStatus)) {
      (StatusCodes.ServiceUnavailable, "Server is not available!")
    } else if (e.getMessage.contains(PERMISSION_DENIED)) {
      (StatusCodes.Forbidden, PERMISSION_DENIED)
    } else {
      (StatusCodes.InternalServerError, "Internal server error")
    }
  }
}
