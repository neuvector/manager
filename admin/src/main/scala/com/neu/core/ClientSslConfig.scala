package com.neu.core

import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.{ ConnectionContext, Http, HttpsConnectionContext }
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.settings.ConnectionPoolSettings
import org.apache.pekko.stream.Materializer
import org.apache.pekko.stream.scaladsl.{ Sink, Source }

import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.{
  HostnameVerifier,
  HttpsURLConnection,
  SSLContext,
  SSLEngine,
  TrustManager,
  X509TrustManager
}
import scala.concurrent.{ ExecutionContext, Future }
import scala.util.{ Failure, Success }

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

  private class DummyTrustManager extends X509TrustManager {

    def isClientTrusted(cert: Array[X509Certificate]): Boolean = true

    def isServerTrusted(cert: Array[X509Certificate]): Boolean = true

    override def getAcceptedIssuers: Array[X509Certificate] = Array.empty

    override def checkClientTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}

    override def checkServerTrusted(x509Certificates: Array[X509Certificate], s: String): Unit = {}
  }

  def mySendReceive(
    implicit system: ActorSystem,
    materializer: Materializer,
    executionContext: ExecutionContext
  ): HttpRequest => Future[HttpResponse] = { request: HttpRequest =>
    val poolSettings = ConnectionPoolSettings(system)

    val connectionPool = if (request.uri.scheme == "https") {
      Http().cachedHostConnectionPoolHttps[HttpRequest](
        request.uri.authority.host.toString,
        request.uri.effectivePort,
        connectionContext = httpsContext,
        settings = poolSettings
      )
    } else {
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
          Future.successful(response)
        case (Failure(exception), _) =>
          Future.failed(exception)
        case (Success(unexpected), _) =>
          Future.failed(new Exception(s"Unexpected response from HTTP transport: $unexpected"))
      }
  }
}
