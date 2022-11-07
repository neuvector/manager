package com.neu.core

import com.typesafe.scalalogging.LazyLogging
import spray.client.pipelining.SendReceive
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.{ SSLContext, TrustManager, X509TrustManager }

import akka.actor.ActorRefFactory
import akka.io.IO
import akka.pattern.ask
import akka.util.Timeout
import spray.can.Http
import spray.can.Http.HostConnectorSetup
import spray.http.{ HttpResponse, HttpResponsePart }
import spray.io.ClientSSLEngineProvider
import spray.util._
import com.neu.client.RestClient

import scala.concurrent.ExecutionContext
import scala.concurrent.duration._

/**
 * Created by bxu on 6/6/16.
 */
trait ClientSslConfig extends LazyLogging {
  implicit lazy val engineProvider = ClientSSLEngineProvider(engine => engine)

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

  // rewrite sendReceiveMethod from spray.client.pipelining
  def mySendReceive(
    implicit refFactory: ActorRefFactory,
    executionContext: ExecutionContext,
    futureTimeout: Timeout = RestClient.waitingLimit.seconds
  ): SendReceive = {
    val transport = IO(Http)(actorSystem)
    // HttpManager actually also accepts Msg (HttpRequest, HostConnectorSetup)
    request =>
      val uri = request.uri
      val setup =
        HostConnectorSetup(uri.authority.host.toString, uri.effectivePort, uri.scheme == "https")
      transport ? ((request, setup)) map {
        case x: HttpResponse => x
        case x: HttpResponsePart =>
          sys.error("sendReceive doesn't support chunked responses, try sendTo instead")
        case x: Http.ConnectionClosed =>
          sys.error("Connection closed before reception of response: " + x)
        case x => sys.error("Unexpected response from HTTP transport: " + x)
      }
  }
}
