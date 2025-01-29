package com.neu.core

import com.neu.api.Api
import com.neu.core.CommonSettings.httpPort
import com.neu.web.StaticResources
import com.typesafe.config.{ Config, ConfigValueFactory }
import com.typesafe.config.ConfigFactory.*
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.actor.ActorSystem
import org.apache.pekko.http.scaladsl.ConnectionContext
import org.apache.pekko.http.scaladsl.Http
import org.apache.pekko.http.scaladsl.HttpsConnectionContext
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.http.scaladsl.settings.ServerSettings
import org.apache.pekko.stream.Materializer

import scala.concurrent.ExecutionContextExecutor
import scala.concurrent.Future

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

  private val useSSL: String              = sys.env.getOrElse("MANAGER_SSL", "on")
  private val httpMaxHeaderLength: String = sys.env.getOrElse("HTTP_MAX_HEADER_LENGTH", "32k")
  private val config: Config              =
    load
      .getConfig(if (useSSL == "off") "noneSsl" else "ssl")
      .withFallback(defaultReference(getClass.getClassLoader))
      .withValue(
        "pekko.http.server.parsing.max-header-value-length",
        ConfigValueFactory.fromAnyRef(
          httpMaxHeaderLength
        )
      )
      .withValue(
        "pekko.http.client.parsing.max-header-value-length",
        ConfigValueFactory.fromAnyRef(
          httpMaxHeaderLength
        )
      )

  private lazy val https: Option[HttpsConnectionContext] = useSSL match {
    case "off" => None
    case _     =>
      Some(ConnectionContext.httpsServer { () =>
        val engine = sslContext.createSSLEngine()
        configureSSLEngine(engine)
      })
  }

  private val settings = ServerSettings(config)

  private val bindingFuture: Future[Http.ServerBinding] = useSSL match {
    case "off" =>
      logger.info("Starting server in HTTP mode (MANAGER_SSL=off).")
      NoOperationSSLContext.init()
      Http()
        .newServerAt("0.0.0.0", httpPort.toInt)
        .withSettings(settings)
        .bind(rootService)
    case _     =>
      https match {
        case Some(httpsCtx) =>
          logger.info("Starting server in HTTPS mode (MANAGER_SSL=on).")
          Http()
            .newServerAt("0.0.0.0", httpPort.toInt)
            .enableHttps(httpsCtx)
            .withSettings(settings)
            .bind(rootService)
        case None           =>
          throw new IllegalStateException(
            "SSL is enabled but HttpsConnectionContext is not configured"
          )
      }
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
