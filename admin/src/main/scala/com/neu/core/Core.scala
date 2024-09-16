package com.neu.core

import com.neu.api.Api
import com.neu.core.CommonSettings.httpPort
import com.neu.web.StaticResources
import com.typesafe.config.Config
import com.typesafe.config.ConfigFactory.*
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.settings.ServerSettings
import org.apache.pekko.http.scaladsl.{ ConnectionContext, Http, HttpsConnectionContext }
import org.apache.pekko.stream.Materializer

import scala.concurrent.{ ExecutionContextExecutor, Future }

trait Core {
  protected implicit def system: ActorSystem
}

trait BootedCore
    extends Core
    with Api
    with StaticResources
    with MySslConfiguration
    with LazyLogging {

  given system: ActorSystem                        = ActorSystem("manager-system")
  given materializer: Materializer                 = Materializer(system)
  given executionContext: ExecutionContextExecutor = system.dispatcher

  private val rootService: Route = routes ~ staticResources

  IpGeoManager
  CisNISTManager
  System.setProperty("net.sf.ehcache.enableShutdownHook", "true")

  private val https: HttpsConnectionContext = ConnectionContext.httpsServer { () =>
    val engine = sslContext.createSSLEngine()
    configureSSLEngine(engine)
  }

  // Use your existing configuration logic
  private val useSSL: String    = sys.env.getOrElse("MANAGER_SSL", "on")
  private val sslConfig: Config =
    load.getConfig("ssl").withFallback(defaultReference(getClass.getClassLoader))

  private val sslSettings = ServerSettings(sslConfig)

  private val bindingFuture: Future[Http.ServerBinding] = useSSL match {
    case "off" =>
      Http()
        .newServerAt("0.0.0.0", httpPort.toInt)
        .bind(rootService)
    case _     =>
      Http()
        .newServerAt("0.0.0.0", httpPort.toInt)
        .enableHttps(https)
        .withSettings(sslSettings)
        .bind(rootService)
  }

  bindingFuture.map { binding =>
    logger.info(s"Server is listening on ${binding.localAddress}")
  }.recover { case ex =>
    logger.error(s"Failed to bind HTTP server: ${ex.getMessage}")
    system.terminate()
  }

  sys.addShutdownHook(system.terminate())
}

trait CoreActors {
  this: Core =>
}
