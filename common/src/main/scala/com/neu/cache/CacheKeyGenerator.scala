package com.neu.cache

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
  def generate(data: Any*): String = data.toArray.deep.mkString(",")
}
