package com.neu.web

import spray.routing.{ HttpService, Route }
import spray.http.StatusCodes
import com.neu.core.CommonSettings._
import com.neu.core.Md5
import com.typesafe.scalalogging.LazyLogging

import spray.http._
import StatusCodes._
import HttpHeaders._
import MediaTypes._
import com.neu.api.Utils
import com.google.common.net.UrlEscapers

trait StaticResources extends HttpService with LazyLogging {
  val shortPath           = 10
  val isUsingSSL: Boolean = sys.env.getOrElse("MANAGER_SSL", "on") == "on"
  val isDev: Boolean      = sys.env.getOrElse("IS_DEV", "false") == "true"

  //# Rewrite redirect-implementation base on "spray/spray-routing/src/main/scala/spray/routing/RequestContext.scala, added strict transport security header"
  def redirectMe(uri: Uri, redirectionType: Redirection) =
    complete {
      HttpResponse(
        status = redirectionType,
        headers =
          if (isUsingSSL)
            Location(uri) :: RawHeader("X-Frame-Options", "SAMEORIGIN") :: RawHeader(
              "Strict-Transport-Security",
              "max-age=31536000; includeSubDomains; preload"
            ) :: Nil
          else
            Location(uri) :: RawHeader("X-Frame-Options", "SAMEORIGIN") :: Nil,
        entity = redirectionType.htmlTemplate match {
          case ""       ⇒ HttpEntity.Empty
          case template ⇒ HttpEntity(`text/html`, template format uri)
        }
      )
    }

  val staticResources: Route = get {
    path("") {
      redirectMe(
        UrlEscapers
          .urlFragmentEscaper()
          .escape("/index.html?v=" + Md5.hash(managerVersion).take(shortPath)),
        StatusCodes.MovedPermanently
      )
    } ~
    path("index.html") {
      parameters('v.?) { v =>
        {
          val hash = Md5.hash(managerVersion).take(shortPath)
          if (v.isEmpty) {
            redirectMe(
              UrlEscapers.urlFragmentEscaper().escape("/index.html?v=" + hash),
              StatusCodes.MovedPermanently
            )
          } else {
            if (v.get.equals(hash)) {
              getFromResource("/index.html")
            } else {
              logger.info("Previous version hash: {}", v.get)
              logger.info("Current version hash: {}", hash)
              redirectMe(
                UrlEscapers.urlFragmentEscaper().escape("/index.html?v=" + hash),
                StatusCodes.MovedPermanently
              )
            }
          }
        }
      }
    } ~
    path("favicon.ico") {
      Utils.respondWithNoCacheControl(true) {
        complete(StatusCodes.NotFound)
      }

    } ~
    path(Rest) { path =>
      if (isDev) {
        Utils.respondWithNoCacheControl(true) {
          getFromResource(UrlEscapers.urlFragmentEscaper().escape(s"root/$path"))
        }
      } else {
        if (path.endsWith(".js")) {
          Utils.respondWithNoCacheControl(true, path.endsWith(".js")) {
            `Content-Type`(
              `application/javascript`
            )
            getFromResource(
              UrlEscapers.urlFragmentEscaper().escape(s"root/${path}.gz"),
              `application/javascript`
            )
          }
        } else {
          Utils.respondWithNoCacheControl(true, path.endsWith(".js")) {
            getFromResource(UrlEscapers.urlFragmentEscaper().escape(s"root/$path"))
          }
        }
      }

    }
  }
}
