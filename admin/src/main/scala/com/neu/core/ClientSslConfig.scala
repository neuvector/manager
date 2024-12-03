package com.neu.core

import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.ConnectionContext
import org.apache.pekko.http.scaladsl.Http
import org.apache.pekko.http.scaladsl.HttpsConnectionContext
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.settings.ConnectionPoolSettings
import org.apache.pekko.stream.Materializer
import org.apache.pekko.stream.scaladsl.Sink
import org.apache.pekko.stream.scaladsl.Source

import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLEngine
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import scala.concurrent.ExecutionContext
import scala.concurrent.Future
import scala.util.Failure
import scala.util.Success

case class HttpResponseException(
  statusCode: Int,
  reason: String,
  response: HttpResponse
) extends RuntimeException(s"Status: $statusCode, Reason: $reason, Response: $response")

trait ClientSslConfig extends LazyLogging {

  implicit lazy val httpsContext: HttpsConnectionContext = ConnectionContext.httpsClient {
    (host, port) =>
      val engine: SSLEngine = sslContext.createSSLEngine(host, port)
      engine.setUseClientMode(true)
      engine
  }

  implicit lazy val sslContext: SSLContext = {
    val context = SSLContext.getInstance("TLS")
    context.init(null, Array[TrustManager](new DummyTrustManager), new SecureRandom)
    context
  }

  private final val SENSITIVE_HEADER = Set("X-R-Sess", "X-Auth-Token", "Authorization")

  def sendReceiver(using
    system: ActorSystem,
    materializer: Materializer,
    executionContext: ExecutionContext
  ): HttpRequest => Future[HttpResponse] = { (request: HttpRequest) =>
    val poolSettings = ConnectionPoolSettings(system)

    logger.info(s"Sending Request\n${maskSensitiveInfo(request.toString)}")

    val connectionPool = if (request.uri.scheme == "https") {
      logger.debug("Using HTTPS connection pool")
      Http().cachedHostConnectionPoolHttps[HttpRequest](
        request.uri.authority.host.toString,
        request.uri.effectivePort,
        connectionContext = httpsContext,
        settings = poolSettings
      )
    } else {
      logger.debug("Using HTTP connection pool")
      Http().cachedHostConnectionPool[HttpRequest](
        request.uri.authority.host.toString,
        request.uri.effectivePort,
        settings = poolSettings
      )
    }

    Source
      .single(request -> request)
      .via(connectionPool)
      .runWith(Sink.head)
      .flatMap {
        case (Success(response: HttpResponse), _) =>
          response.status match {
            case status if status.isSuccess() || status.isRedirection =>
              logger.info(s"Received Response - Success\n$response")
              Future.successful(response)
            case status                                               =>
              logger.info(
                s"Received Response - Failure\nStatusCode: ${status.intValue()} Reason: ${status.reason()}\n$response"
              )
              Future.failed(HttpResponseException(status.intValue(), status.reason(), response))
          }
        case (Failure(exception), _)              =>
          logger.info(s"Received Response - Failure\n$exception")
          Future.failed(exception)
      }
  }

  private def maskSensitiveInfo(str: String): String =
    SENSITIVE_HEADER.foldLeft(str) { (acc, header) =>
      val regex = s"($header:\\s*)([^\\s,]+)".r
      regex.replaceAllIn(acc, m => s"${m.group(1)}${maskToken(m.group(2))}")
    }

  private def maskToken(token: String): String = s"${token.take(4)}****${token.takeRight(4)}"

  private class DummyTrustManager extends X509TrustManager {

    def isClientTrusted(cert: Array[X509Certificate]): Boolean = true

    def isServerTrusted(cert: Array[X509Certificate]): Boolean = true

    override def getAcceptedIssuers: Array[X509Certificate] = Array.empty

    override def checkClientTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}

    override def checkServerTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}
  }
}
