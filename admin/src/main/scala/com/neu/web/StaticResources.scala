package com.neu.web

import com.google.common.net.UrlEscapers
import com.neu.core.CommonSettings.*
import com.neu.core.Md5
import com.neu.service.Utils
import com.typesafe.scalalogging.LazyLogging
import org.apache.pekko.http.scaladsl.model.ContentTypes
import org.apache.pekko.http.scaladsl.model.HttpEntity
import org.apache.pekko.http.scaladsl.model.HttpResponse
import org.apache.pekko.http.scaladsl.model.StatusCodes
import org.apache.pekko.http.scaladsl.model.Uri
import org.apache.pekko.http.scaladsl.model.headers.Location
import org.apache.pekko.http.scaladsl.model.headers.RawHeader
import org.apache.pekko.http.scaladsl.server.Directives
import org.apache.pekko.http.scaladsl.server.Route

trait StaticResources extends Directives with LazyLogging {
  private val shortPath           = 10
  private val isUsingSSL: Boolean = sys.env.getOrElse("MANAGER_SSL", "on") == "on"
  private val isDev: Boolean      = sys.env.getOrElse("IS_DEV", "false") == "true"

  private val _managerPathPrefixWithPrependedSlash: String = {
    val rawPathOption: Option[String] = sys.env.get("PATH_PREFIX")

    rawPathOption match {
      case Some(value) => "/" + value.trim
      case None        => ""
    }
  }

  private val managerPathPrefixWithPrependedSlash: String    = _managerPathPrefixWithPrependedSlash

  // # Rewrite redirect-implementation base on "spray/spray-routing/src/main/scala/spray/routing/RequestContext.scala, added strict transport security header"
  private def redirectMe(uri: Uri, redirectionType: StatusCodes.Redirection) =
    complete {
      HttpResponse(
        status = redirectionType,
        headers =
          if (isUsingSSL)
            Location(uri) :: RawHeader("X-Frame-Options", "SAMEORIGIN") :: RawHeader(
              "Strict-Transport-Security",
              "max-age=31536000; includeSubDomains; preload"
            ) :: Nil
          else {
            Location(uri) :: RawHeader("X-Frame-Options", "SAMEORIGIN") :: Nil
          },
        entity = redirectionType.htmlTemplate match {
          case ""       => HttpEntity.Empty
          case template => HttpEntity(ContentTypes.`text/html(UTF-8)`, template.format(uri))
        }
      )
    }

  val staticResources: Route = get {
    rawPathPrefix(sys.env.get("PATH_PREFIX").map(r => Slash ~ r).getOrElse("")) {
      path("") {
        redirectMe(
          UrlEscapers
            .urlFragmentEscaper()
            .escape(
              managerPathPrefixWithPrependedSlash + "/index.html?v=" + Md5
                .hash(managerVersion)
                .take(shortPath)
            ),
          StatusCodes.MovedPermanently
        )
      } ~
      path("index.html") {
        parameters(Symbol("v").?) { v =>
          val hash = Md5.hash(managerVersion).take(shortPath)
          if (v.isEmpty) {
            redirectMe(
              UrlEscapers
                .urlFragmentEscaper()
                .escape(managerPathPrefixWithPrependedSlash + "/index.html?v=" + hash),
              StatusCodes.MovedPermanently
            )
          } else {
            if (v.get.equals(hash)) {
              getFromResource("/index.html")
            } else {
              logger.info("Previous version hash: {}", v.get)
              logger.info("Current version hash: {}", hash)
              redirectMe(
                UrlEscapers
                  .urlFragmentEscaper()
                  .escape(managerPathPrefixWithPrependedSlash + "/index.html?v=" + hash),
                StatusCodes.MovedPermanently
              )
            }
          }
        }
      } ~
      path("favicon.ico") {
        Utils.respondWithWebServerHeaders(isStaticResource = true) {
          complete(StatusCodes.NotFound)
        }
      } ~
      path(Remaining) { path =>
        if (isDev) {
          Utils.respondWithWebServerHeaders(isStaticResource = true) {
            getFromResource(UrlEscapers.urlFragmentEscaper().escape(s"root/$path"))
          }
        } else {
          if (path.endsWith(".js")) {
            Utils.respondWithWebServerHeaders(isStaticResource = true) {
              respondWithHeader(RawHeader("Content-Type", "application/javascript")) {
                encodeResponse {
                  getFromResource(
                    UrlEscapers.urlFragmentEscaper().escape(s"root/$path.gz")
                  )
                }
              }
            }
          } else {
            Utils.respondWithWebServerHeaders(isStaticResource = true) {
              getFromResource(UrlEscapers.urlFragmentEscaper().escape(s"root/$path"))
            }
          }
        }
      }
    }
  }
}
