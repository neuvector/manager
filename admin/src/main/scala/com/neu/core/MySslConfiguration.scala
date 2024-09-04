package com.neu.core

import com.neu.core.CommonSettings.{ newCert, newKey, newMgrCert, newMgrKey }
import com.typesafe.scalalogging.LazyLogging
import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.asn1.x509._
import org.bouncycastle.cert.jcajce.{ JcaX509CertificateConverter, JcaX509v3CertificateBuilder }
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import org.bouncycastle.util.io.pem.{ PemObject, PemWriter }
import sun.security.util.DerInputStream

import java.io._
import java.math.BigInteger
import java.security._
import java.security.cert.{ Certificate, CertificateFactory, X509Certificate }
import java.security.interfaces.RSAPrivateKey
import java.security.spec._
import java.util.{ Base64, Date }
import javax.net.ssl.{ KeyManagerFactory, SSLContext, SSLEngine, TrustManagerFactory }
import scala.collection.JavaConverters._

trait MySslConfiguration extends LazyLogging {

  // if there is no SSLContext in scope implicitly the HttpServer uses the default SSLContext,
  // since we want non-default settings in this example we make a custom SSLContext available here
  implicit def sslContext: SSLContext = {
    logger.info("Import manager's certificate and private key to manager's keystore")
    val context     = SSLContext.getInstance("TLS")
    val fCert: File = new File(newCert)
    val fKey: File  = new File(newKey)
    logger.info(s"Cert Path: $newCert")
    logger.info(s"Key Path: $newKey")

    if (fCert.isFile && fKey.isFile) {
      loadCertificateAndKey(fCert, fKey, context)
    } else {
      logger.info("Certificate file is not existing, system is generating a dynamic certificate.")
      // Add Bouncy Castle as a security provider
      Security.addProvider(new BouncyCastleProvider())

      // Generate key pair
      val keyPair = generateKeyPair()

      // Generate self-signed certificate
      val certificate = generateSelfSignedCertificate(keyPair)

      // Save the certificate and private key to files (optional)
      saveCertificateAndKey(certificate, keyPair.getPrivate)

      val fCert: File = new File(newMgrCert)
      val fKey: File  = new File(newMgrKey)
      loadCertificateAndKey(fCert, fKey, context)
      context
    }
  }

  private def generateKeyPair(): KeyPair = {
    val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
    keyPairGenerator.initialize(2048)
    keyPairGenerator.generateKeyPair()
  }

  private def generateSelfSignedCertificate(keyPair: KeyPair): X509Certificate = {
    // Certificate details
    val issuer    = new X500Name("CN=neuvector, O=NeuVector, L=San Jose, ST=California, C=USA")
    val subject   = new X500Name("CN=neuvector")
    val serial    = BigInteger.valueOf(new SecureRandom().nextInt(Integer.MAX_VALUE))
    val notBefore = new Date()
    val notAfter  = new Date(notBefore.getTime + 365L * 24 * 60 * 60 * 1000) // 1 year validity

    // Create content signer
    val contentSigner = new JcaContentSignerBuilder("SHA256withRSA").build(keyPair.getPrivate)

    // Build certificate
    val certificateBuilder = new JcaX509v3CertificateBuilder(
      issuer,
      serial,
      notBefore,
      notAfter,
      subject,
      keyPair.getPublic
    )

    // Add X509v3 extensions
    certificateBuilder.addExtension(
      Extension.keyUsage,
      true,
      new KeyUsage(KeyUsage.digitalSignature | KeyUsage.keyEncipherment)
    )
    certificateBuilder.addExtension(
      Extension.extendedKeyUsage,
      false,
      new ExtendedKeyUsage(Array(KeyPurposeId.id_kp_serverAuth, KeyPurposeId.id_kp_clientAuth))
    )
    certificateBuilder.addExtension(Extension.basicConstraints, true, new BasicConstraints(false))

    val sanBuilder = new GeneralNamesBuilder()
    sanBuilder.addName(new GeneralName(GeneralName.dNSName, "neuvector"))
    val san = sanBuilder.build()
    certificateBuilder.addExtension(Extension.subjectAlternativeName, false, san)

    // Sign and generate the certificate
    val certificateHolder = certificateBuilder.build(contentSigner)

    // Convert to X509Certificate
    new JcaX509CertificateConverter().setProvider("BC").getCertificate(certificateHolder)
  }

  private def saveCertificateAndKey(certificate: X509Certificate, privateKey: PrivateKey): Unit = {
    val fCert: File = new File(newMgrCert)
    val fKey: File  = new File(newMgrKey)
    if (fCert.exists) {
      if (fCert.delete) logger.info("Removed existing manager certificate")
      else logger.info("Failed to remove existing manager certificate")
    }
    if (fKey.exists) {
      if (fKey.delete) logger.info("Removed existing manager private key")
      else logger.info("Failed to remove existing manager private key")
    }
    try {
      // Save the certificate
      val certOut = new PemWriter(new OutputStreamWriter(new FileOutputStream(newMgrCert)))
      certOut.writeObject(new PemObject("CERTIFICATE", certificate.getEncoded))
      certOut.close()

      // Save the private key
      val keyOut = new PemWriter(new OutputStreamWriter(new FileOutputStream(newMgrKey)))
      keyOut.writeObject(new PemObject("PRIVATE KEY", privateKey.getEncoded))
      keyOut.close()

    } catch {
      case e: IOException => e.printStackTrace()
      case e: Exception   => e.printStackTrace()
    }
  }

  private def loadCertificateAndKey(fCert: File, fKey: File, context: SSLContext): SSLContext = {

    val password               = Array('n', 'e', 'u', 'v', 'e', 'c', 't', 'o', 'r')
    val cf: CertificateFactory = CertificateFactory.getInstance("X.509")
    val trustManagerFactory    = TrustManagerFactory.getInstance("SunX509")
    val keyManagerFactory      = KeyManagerFactory.getInstance("SunX509")
    val ks: KeyStore           = KeyStore.getInstance("jks")
    val keyFactory: KeyFactory = KeyFactory.getInstance("RSA")

    var fisCert: FileInputStream     = null
    var fisKey: FileInputStream      = null
    var bisCert: BufferedInputStream = null
    var bisKey: BufferedInputStream  = null

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
            privateKeyBytes
              .map(_.toChar)
              .mkString
              .replaceAll("\\n|\\r\\n", "")
              .replace("-----BEGIN PRIVATE KEY-----", "")
              .replace("-----END PRIVATE KEY-----", "")
          privateKey = keyFactory
            .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder.decode(encodedPrivateKey)))
            .asInstanceOf[RSAPrivateKey]
        } else if (privateKeyBytes.map(_.toChar).mkString.contains("BEGIN RSA PRIVATE KEY")) {
          logger.info("PKCS#1 private key is being used")
          val encodedPrivateKey =
            privateKeyBytes
              .map(_.toChar)
              .mkString
              .replaceAll("\\n|\\r\\n", "")
              .replace("-----BEGIN RSA PRIVATE KEY-----", "")
              .replace("-----END RSA PRIVATE KEY-----", "")

          val bytes = Base64.getDecoder.decode(encodedPrivateKey)

          val derReader = new DerInputStream(bytes)
          val seq       = derReader.getSequence(0)
          // skip version seq[0];
          val modulus    = seq(1).getBigInteger
          val publicExp  = seq(2).getBigInteger
          val privateExp = seq(3).getBigInteger
          val prime1     = seq(4).getBigInteger
          val prime2     = seq(5).getBigInteger
          val exp1       = seq(6).getBigInteger
          val exp2       = seq(7).getBigInteger
          val crtCoef    = seq(8).getBigInteger

          val keySpec = new RSAPrivateCrtKeySpec(
            modulus,
            publicExp,
            privateExp,
            prime1,
            prime2,
            exp1,
            exp2,
            crtCoef
          )
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
  }

  def configureSSLEngine(engine: SSLEngine): SSLEngine = {
    engine.setUseClientMode(false)
    engine.setEnabledCipherSuites(Array("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"))
    engine.setEnabledProtocols(Array("TLSv1.2"))
    engine
  }
}
