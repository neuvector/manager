package com.neu.core

import java.io.{BufferedInputStream, File, FileInputStream, FileNotFoundException}
import java.security.cert.{Certificate, CertificateFactory}
import java.security.interfaces.RSAPrivateKey
import java.security.spec.{RSAPrivateCrtKeySpec, _}
import java.security.{KeyFactory, KeyStore, PrivateKey, SecureRandom}
import java.util.Base64

import com.neu.core.CommonSettings.{newCert, newKey}
import com.typesafe.scalalogging.LazyLogging
import javax.net.ssl.{KeyManagerFactory, SSLContext, TrustManagerFactory}
import spray.io.ServerSSLEngineProvider
import sun.security.util.DerInputStream

import scala.collection.JavaConverters._


trait MySslConfiguration extends LazyLogging {

  // if there is no SSLContext in scope implicitly the HttpServer uses the default SSLContext,
  // since we want non-default settings in this example we make a custom SSLContext available here
  implicit def sslContext: SSLContext = {

    val password = Array('n', 'e', 'u', 'v', 'e', 'c', 't', 'o', 'r')
    val cf: CertificateFactory = CertificateFactory.getInstance("X.509")
    val trustManagerFactory = TrustManagerFactory.getInstance("SunX509")
    val keyManagerFactory = KeyManagerFactory.getInstance("SunX509")
    val ks: KeyStore = KeyStore.getInstance("jks")
    val keyFactory: KeyFactory = KeyFactory.getInstance("RSA")
    val context = SSLContext.getInstance("TLS")
    logger.info("Import manager's certificate and private key to manager's keystore")

    val fCert: File = new File(newCert)
    val fKey: File = new File(newKey)
    var fisCert: FileInputStream = null
    var fisKey: FileInputStream = null
    var bisCert: BufferedInputStream = null
    var bisKey: BufferedInputStream = null
    if (fCert.isFile && fKey.isFile) {
      try {
        fisCert = new FileInputStream(fCert)
        fisKey = new FileInputStream(fKey)

        bisCert = new BufferedInputStream(fisCert)
        bisKey = new BufferedInputStream(fisKey)

        if (bisCert.available > 0 && bisKey.available > 0) {
          val privateKeyBytes = new Array[Byte](fKey.length.toInt)
          bisKey.read(privateKeyBytes)
          var privateKey: PrivateKey = null

          if (privateKeyBytes.map(_.toChar).mkString.contains("BEGIN PRIVATE KEY")) {
            logger.info("PKCS#8 private key is being used")
            val encodedPrivateKey =
              privateKeyBytes.map(_.toChar)
                .mkString
                .replaceAll("\\n|\\r\\n", "").
                replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
            privateKey = keyFactory.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder.decode(encodedPrivateKey))).asInstanceOf[RSAPrivateKey]
          } else if (privateKeyBytes.map(_.toChar).mkString.contains("BEGIN RSA PRIVATE KEY")) {
            logger.info("PKCS#1 private key is being used")
            val encodedPrivateKey =
              privateKeyBytes.map(_.toChar)
                .mkString
                .replaceAll("\\n|\\r\\n", "").
                replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")

            val bytes = Base64.getDecoder.decode(encodedPrivateKey)

            val derReader = new DerInputStream(bytes)
            val seq = derReader.getSequence(0)
            // skip version seq[0];
            val modulus = seq(1).getBigInteger
            val publicExp = seq(2).getBigInteger
            val privateExp = seq(3).getBigInteger
            val prime1 = seq(4).getBigInteger
            val prime2 = seq(5).getBigInteger
            val exp1 = seq(6).getBigInteger
            val exp2 = seq(7).getBigInteger
            val crtCoef = seq(8).getBigInteger

            val keySpec = new RSAPrivateCrtKeySpec(modulus, publicExp, privateExp, prime1, prime2, exp1, exp2, crtCoef)
            val keyFactory = KeyFactory.getInstance("RSA")
            privateKey = keyFactory.generatePrivate(keySpec)
          } else {
            throw new SecurityException("Invalid private key is being used")
          }
          val certs: Array[Certificate] = cf.generateCertificates(bisCert).asScala.toArray
          val keyEntry: KeyStore.Entry = new KeyStore.PrivateKeyEntry(
            privateKey,
            certs
          )
          ks.load(null, password)
          ks.setEntry(
            "neuvector_mgr_cert",
            keyEntry,
            new KeyStore.PasswordProtection(password)
          )

          val keyStore = KeyStore.getInstance("jks")
          keyManagerFactory.init(ks, password)
          trustManagerFactory.init(keyStore)

          context.init(
            keyManagerFactory.getKeyManagers,
            trustManagerFactory.getTrustManagers,
            new SecureRandom
          )
        }
        context
      } catch {
        case e: FileNotFoundException =>
          logger.warn(e.getMessage)
          context
        case e: SecurityException =>
          logger.warn(e.getMessage)
          context
      } finally {
        if (fisCert != null) {
          fisCert.close()
        }
        if (fisKey != null) {
          fisKey.close()
        }
        if (bisCert != null) {
          bisCert.close()
        }
        if (bisKey != null) {
          bisKey.close()
        }
      }
    } else {
      logger.info("Certificate file is not existing!")
      context
    }
  }

  implicit val myEngineProvider = ServerSSLEngineProvider { engine =>
    engine.setEnabledCipherSuites(Array("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"))
    engine.setEnabledProtocols(Array("TLSv1.2"))
    engine
  }
}
