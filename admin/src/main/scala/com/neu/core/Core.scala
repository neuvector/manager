package com.neu.core

import java.io._
import java.security.KeyStore
import java.security.cert.{Certificate, CertificateFactory}
import java.util.concurrent.TimeUnit

import akka.actor.{ActorRef, ActorRefFactory, ActorSystem, Props}
import com.typesafe.config.ConfigFactory._
import spray.can.server.ServerSettings
import com.neu.api.{Api, RoutedHttpService}
import com.neu.core.CommonSettings.{httpPort, newCtrlCert, trustStore}
import akka.io.IO
import akka.util.Timeout
import spray.can.Http
import com.neu.web.StaticResources
import com.typesafe.config.Config
import com.typesafe.scalalogging.LazyLogging

/**
  * Core is type containing the ``system: ActorSystem`` member. This enables us to use it in our
  * apps as well as in our tests.
  */
trait Core {

  protected implicit def system: ActorSystem

}

/**
  * This trait implements ``Core`` by starting the required ``ActorSystem`` and registering the
  * termination handler to stop the system when the JVM exits.
  */
trait BootedCore
    extends Core
    with Api
    with StaticResources
    with MySslConfiguration
    with LazyLogging {
  val BIND_TIMEOUT = 10

  implicit lazy val system: ActorSystem = ActorSystem("manager-system")
  def actorRefFactory: ActorRefFactory  = system
  implicit val timeout: Timeout         = Timeout(BIND_TIMEOUT, TimeUnit.SECONDS)
  val rootService: ActorRef             = system.actorOf(Props(new RoutedHttpService(routes ~ staticResources)))

//  val password = Array('n', 'e', 'u', 'v', 'e', 'c', 't', 'o', 'r')
//  val cf: CertificateFactory = CertificateFactory.getInstance("X.509")
//
//  val f: File = new File(newCtrlCert)
//  var fis: FileInputStream = _
//  var bis: BufferedInputStream = _
//  var fos: FileOutputStream = _
//
//  System.clearProperty("javax.net.ssl.trustStore")
//  System.clearProperty("javax.net.ssl.trustStorePassword")
//  if (f.isFile) {
//    try {
//      fis = new FileInputStream(f)
//      bis = new BufferedInputStream(fis)
//      fos = new FileOutputStream(trustStore)
//      if (bis.available > 0) {
//        logger.info("Import controller's certificate into keystore")
//        val cert: Certificate = cf.generateCertificate(bis)
//        val ks: KeyStore = KeyStore.getInstance("jks")
//        ks.load(null, password)
//        ks.setEntry("neuvector_ctrl_cert", new KeyStore.TrustedCertificateEntry(cert), null)
//
//        ks.store(fos, password)
//
//        logger.info("Set keystore to property")
//        System.setProperty("javax.net.ssl.trustStore", trustStore)
//        System.setProperty("javax.net.ssl.trustStorePassword", password.mkString(""))
//      }
//    } catch {
//      case e: FileNotFoundException =>
//        logger.warn(e.getMessage)
//      case e: SecurityException =>
//        logger.warn(e.getMessage)
//    } finally {
//      if (fis != null) {
//        fis.close()
//      }
//      if (fos != null) {
//        fos.close()
//      }
//      if (bis != null) {
//        bis.close()
//      }
//    }
//  } else {
//    logger.info("Certificate file is not existing!")
//  }

//  logger.info(IpGeoManager.readCsv)
  IpGeoManager
  System.setProperty("net.sf.ehcache.enableShutdownHook", "true")

  val useSSL: String = sys.env.getOrElse("MANAGER_SSL", "on")
  private var sslConfig: Config =
    load.getConfig("ssl").withFallback(defaultReference(getClass.getClassLoader))
  useSSL match {
    case "off" =>
      sslConfig = load.getConfig("noneSsl").withFallback(defaultReference(getClass.getClassLoader))
    case _ =>
  }
  private val sslSettings = ServerSettings(sslConfig)
  IO(Http)(system) ! Http.Bind(rootService,
                               "0.0.0.0",
                               port = httpPort.toInt,
                               settings = Some(sslSettings))

  /**
    * Ensure that the constructed ActorSystem is shut down when the JVM shuts down
    */
  sys.addShutdownHook(system.shutdown())

}

/**
  * This trait contains the actors that make up our application; it can be mixed in with
  * ``BootedCore`` for running code or ``TestKit`` for unit and integration tests.
  */
trait CoreActors {
  this: Core =>

}
