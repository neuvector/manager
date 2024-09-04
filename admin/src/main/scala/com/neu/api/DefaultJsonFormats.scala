package com.neu.api

import org.apache.pekko.http.scaladsl.marshalling.{
  Marshaller,
  ToEntityMarshaller,
  ToResponseMarshaller
}
import org.apache.pekko.http.scaladsl.model.{ ContentTypes, HttpEntity, HttpResponse, StatusCode }
import org.apache.pekko.http.scaladsl.unmarshalling.{ FromEntityUnmarshaller, Unmarshaller }
import org.apache.pekko.util.ByteString
import spray.json.{
  deserializationError,
  enrichAny,
  DefaultJsonProtocol,
  JsObject,
  JsString,
  JsValue,
  JsonParser,
  RootJsonFormat
}

import java.util.UUID
import scala.reflect.ClassTag

/**
 * Contains useful JSON formats: ``j.u.Date``, ``j.u.UUID`` and others; it is useful
 * when creating traits that contain the ``JsonReader`` and ``JsonWriter`` instances
 * for types that contain ``Date``s, ``UUID``s and such like.
 */
trait DefaultJsonFormats extends DefaultJsonProtocol {

  // JSON marshalling and unmarshalling support
  implicit def sprayJsonUnmarshaller[T](
    implicit reader: spray.json.JsonReader[T]
  ): FromEntityUnmarshaller[T] =
    Unmarshaller.byteStringUnmarshaller.forContentTypes(ContentTypes.`application/json`).map {
      data =>
        JsonParser(data.utf8String).convertTo[T]
    }

  implicit def sprayJsonMarshaller[T](
    implicit writer: spray.json.JsonWriter[T]
  ): ToEntityMarshaller[T] =
    Marshaller.withFixedContentType(ContentTypes.`application/json`) { value =>
      HttpEntity(ContentTypes.`application/json`, ByteString(value.toJson.toString()))
    }

  /**
   * Computes ``RootJsonFormat`` for type ``A`` if ``A`` is object
   */
  def jsonObjectFormat[A: ClassTag]: RootJsonFormat[A] = new RootJsonFormat[A] {
    val ct: ClassTag[A]        = implicitly[ClassTag[A]]
    def write(obj: A): JsValue = JsObject("value" -> JsString(ct.runtimeClass.getSimpleName))
    def read(json: JsValue): A =
      ct.runtimeClass.getDeclaredConstructor().newInstance().asInstanceOf[A]
  }

  /**
   * Instance of the ``RootJsonFormat`` for the ``j.u.UUID``
   */
  implicit object UuidJsonFormat extends RootJsonFormat[UUID] {
    def write(x: UUID): JsValue = JsString(x.toString)
    def read(value: JsValue): UUID = value match {
      case JsString(x) => UUID.fromString(x)
      case x: JsValue  => deserializationError("Expected UUID as JsString, but got " + x)
    }
  }

  type ErrorSelector[A] = A => StatusCode

  /**
   * Marshals instances of ``Either[A, B]`` into appropriate HTTP responses by marshalling the values
   * in the left or right projections; and by selecting the appropriate HTTP status code for the
   * values in the left projection.
   *
   * @param ma marshaller for the left projection
   * @param mb marshaller for the right projection
   * @param esa the selector converting the left projection to HTTP status code
   * @tparam A the left projection
   * @tparam B the right projection
   * @return marshaller
   */
  implicit def errorSelectingEitherMarshaller[A, B](
    implicit ma: ToEntityMarshaller[A],
    mb: ToResponseMarshaller[B],
    esa: ErrorSelector[A]
  ): ToResponseMarshaller[Either[A, B]] =
    Marshaller { implicit ec =>
      {
        case Left(a) =>
          ma(a).map { marshallings =>
            marshallings.map { marshalling =>
              marshalling.map { entity =>
                HttpResponse(status = esa(a), entity = entity)
              }
            }
          }
        case Right(b) =>
          mb(b)
      }
    }
}
