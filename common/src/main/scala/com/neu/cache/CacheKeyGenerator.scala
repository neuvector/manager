package com.neu.cache

import scala.collection.immutable.ArraySeq

/**
 * @tparam A type of cache key
 */
trait CacheKeyGenerator[A] {
  def generate(data: Any*): A
}

object NoOpCacheKeyGenerator extends CacheKeyGenerator[Any] {
  def generate(data: Any*): Any = data
}

object ToStringCacheKeyGenerator extends CacheKeyGenerator[String] {
  def generate(data: Any*): String = flattenAndJoin(ArraySeq.unsafeWrapArray(data.toArray))

  private def flattenAndJoin(arr: ArraySeq[Any]): String =
    arr.map {
      case a: ArraySeq[_] => flattenAndJoin(a)
      case x              => x.toString
    }.mkString(",")
}
