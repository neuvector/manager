package com.neu.client

import akka.actor.ActorSystem
import com.neu.api.DefaultJsonFormats
import com.neu.core.{AuthenticationManager, ClientSslConfig}
import com.neu.core.CommonSettings._
import com.typesafe.scalalogging.LazyLogging
import spray.client.pipelining._
import spray.http.HttpEncodings._
import spray.http.HttpHeaders.`Accept-Encoding`
import spray.http.HttpHeaders.`Transfer-Encoding`
import spray.http.HttpHeaders.`Cache-Control`
import spray.http.HttpMethods._
import spray.http.Uri.apply
import spray.http.{HttpMethod, HttpRequest, _}
import spray.httpx.encoding.Gzip
import java.net.InetAddress
import scala.concurrent.duration._
import scala.concurrent.{Await, ExecutionContext, TimeoutException}
import scala.util.control.NonFatal
import java.io.{PrintWriter, StringWriter}
import scala.concurrent.Future

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

  val waitingLimit = Constant.waitingLimit

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

}

class RestClient extends DefaultJsonFormats with ClientSslConfig {

  implicit val system: ActorSystem = ActorSystem("api-spray-client")

  final val auth      = "auth"

  //noinspection ScalaStyle
  import system.dispatcher

  var token: Option[String] = None

  //To be able to mock
  def sendAndReceive: SendReceive = mySendReceive

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
  def httpRequest(uri: String, method: HttpMethod = GET, data: String = ""): Future[String] = {
    val pipeline: HttpRequest => Future[String] = sendAndReceive ~> unmarshal[String]
    pipeline {
      createHttpRequest(uri, method, data)
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
    method: HttpMethod = GET,
    data: String = ""
  ): Future[HttpResponse] = {
    val pipeline: HttpRequest => Future[HttpResponse] = sendAndReceive
    pipeline {
      createHttpRequest(uri, method, data)
    }
  }

  def proxyHttpRequest(uri: String, request: HttpRequest): Future[HttpResponse] = {
    val pipeline: HttpRequest => Future[HttpResponse] = sendAndReceive
    pipeline {
      cloneHttpRequest(uri, request)
    }
  }

  private val TOKEN_HEADER: String = "X-Auth-Token"
  private val X_NV_PAGE: String = "X-Nv-Page"
  private val X_TRN_ID: String = "X-Transaction-Id"
  private val X_AS_STANDALONE: String = "X-As-Standalone"
  private val X_SUSE_TOKEN: String = "X-R_SESS"

  /**
    * Makes HTTP request
    *
    * @param uri    The request uri
    * @param data   The payload
    * @param method The method of the request
    * @param token  The token header
    * @return
    */
  def httpRequestWithTokenHeader(uri: String, method: HttpMethod = GET, data: String = "", suseToken: String = ""): Future[String] = {
    val pipeline: HttpRequest => Future[String] = sendAndReceive ~> unmarshal[String]
    pipeline {
      createHttpRequest(uri, method, data) ~>
        addHeader(X_SUSE_TOKEN, suseToken)
    }
  }

  def httpRequestWithHeader(
    uri: String,
    method: HttpMethod = GET,
    data: String = "",
    token: String,
    transactionId: Option[String] = None,
    asStandalone: Option[String] = None
  ): Future[HttpResponse] = {
    val pipeline = sendAndReceive
    transactionId.fold(
      asStandalone.fold(
        pipeline {
          createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`))
        }
      ) {
        asStandalone =>
        pipeline {
          createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_AS_STANDALONE, asStandalone)
        }
      }

    ){
      transactionId =>
      asStandalone.fold(
        pipeline {
          createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_TRN_ID, transactionId)
        }
      ) {
        asStandalone =>
        pipeline {
          createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_TRN_ID, transactionId) ~>
            addHeader(X_AS_STANDALONE, asStandalone)
        }
      }
    }
  }

  def httpRequestWithHeaderDecode(
    uri: String,
    method: HttpMethod = GET,
    data: String = "",
    token: String
  ): Future[HttpResponse] = {
    val pipeline = sendAndReceive ~> decode(Gzip)
    pipeline {
      createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
        addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
        addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
        addHeader(`Cache-Control`(CacheDirectives.`no-cache`))
    }
  }

  def binaryWithHeader(
    uri: String,
    method: HttpMethod = GET,
    data: MultipartFormData,
    token: String,
    transactionId: Option[String] = None,
    asStandalone: Option[String] = None
  ): Future[HttpResponse] = {
    val pipeline = sendAndReceive
    transactionId.fold(
      asStandalone.fold(
        pipeline {
          Post(uri, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`))
        }
      ) {
        asStandalone =>
        pipeline {
          Post(uri, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_AS_STANDALONE, asStandalone)
        }
      }

    ){
      transactionId =>
      asStandalone.fold(
        pipeline {
          Post(uri, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_TRN_ID, transactionId)
        }
      ) {
        asStandalone =>
        pipeline {
          Post(uri, data) ~> addHeader(TOKEN_HEADER, token) ~>
            addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
            addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
            addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~> addHeader(X_TRN_ID, transactionId) ~>
            addHeader(X_AS_STANDALONE, asStandalone)
        }
      }
    }
  }

  def requestWithHeader(
    uri: String,
    method: HttpMethod = GET,
    data: String = "",
    token: String
  ): Future[String] = {
    val pipeline = sendAndReceive ~> unmarshal[String]
    pipeline {
      createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
        addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
        addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
        addHeader(`Cache-Control`(CacheDirectives.`no-cache`))
    }
  }

  def requestWithHeaderDecode(
    uri: String,
    method: HttpMethod = GET,
    data: String = "",
    token: String,
    nvPage: String = ""
  ): Future[String] = {
    val pipeline = sendAndReceive ~> decode(Gzip) ~> unmarshal[String]
    if (!nvPage.equals("dashboard")) {
      pipeline {
        createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
          addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
          addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
          addHeader(`Cache-Control`(CacheDirectives.`no-cache`))
      }
    } else {
      pipeline {
        createHttpRequest(uri, method, data) ~> addHeader(TOKEN_HEADER, token) ~>
          addHeader(X_SUSE_TOKEN, AuthenticationManager.suseTokenMap.get(token).getOrElse("")) ~>
          addHeader(`Accept-Encoding`(gzip)) ~> addHeader(`Transfer-Encoding`("gzip")) ~>
          addHeader(`Cache-Control`(CacheDirectives.`no-cache`)) ~>
          addHeader(X_NV_PAGE, "dashboard")
      }
    }
  }

  def reloadCtrlIp(tokenId: String, index: Int): String = {
    val ctrlCluster: Array[String] = InetAddress.getAllByName(ctrlHost).map(_.getHostAddress)
    logger.info("Controller ips: {}", ctrlCluster.mkString(" "))
    val ctrlIp = ctrlCluster(index)
    try {
      val res = RestClient.httpRequestWithHeader(
        s"https://$ctrlIp:$ctrlPort/v1/$auth",
        PATCH,
        "",
        tokenId
      )
      val response  = Await.result(res, Constant.waitingLimit.seconds)
      ctrlIp
    } catch {
      case NonFatal(e) => {
        if (
          !e.getMessage.contains("Status: 401") &&
          !e.getMessage.contains("Status: 408") &&
          index < ctrlCluster.length - 1
        ) {
          reloadCtrlIp(tokenId, index + 1)
        } else {
          throw e
        }
      }
    }
  }

  def handleError(timeOutStatus: String, authenticationFailedStatus: String, serverErrorStatus: String, e: Throwable) = {
    val sw = new StringWriter
    e.printStackTrace(new PrintWriter(sw))
    logger.warn(sw.toString)
    if (e.getMessage.contains(timeOutStatus)) {
      (StatusCodes.RequestTimeout, "Session expired!")
    } else if (e.getMessage.contains(authenticationFailedStatus)) {
      (StatusCodes.Unauthorized, "Authentication failed!")
    } else if (e.getMessage.contains(serverErrorStatus)) {
      (StatusCodes.ServiceUnavailable, "Server is not available!")
    } else {
      (StatusCodes.InternalServerError, "Internal server error")
    }
  }
}
