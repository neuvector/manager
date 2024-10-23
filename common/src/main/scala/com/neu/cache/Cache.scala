package com.neu.cache

/**
 * @tparam K
 *   type of key
 * @tparam V
 *   type of value
 */
trait Cache[K, V] {

  protected val cacheKeyGenerator: CacheKeyGenerator[?] = NoOpCacheKeyGenerator

  /** Returns value corresponding to the given key */
  final def get(key: K): Option[V] = doGet(cacheKey(key))

  /** Sets cache value */
  final def put(key: K, value: V): Unit =
    doPut(cacheKey(key), value)

  /** Removes cache value */
  final def remove(key: K): Unit =
    doRemove(cacheKey(key))

  /** Returns cached value by using cache key */
  protected def doGet(cacheKey: Any): Option[V]

  /** Sets cache value by using cache key */
  protected def doPut(cacheKey: Any, value: V): Unit

  /** Removes cache value by using cache key */
  protected def doRemove(cacheKey: Any): Unit

  /**
   * Returns value if a corresponding value exists or returns updated value
   *
   * @param key
   *   a value which is used to generate/find return value by f.
   * @param f
   *   function to get new value
   * @return
   *   cached value or the result of given f
   */
  final def getOrElseInsert(key: K)(f: => V): V =
    get(key) match {
      case Some(value) =>
        value
      case None        =>
        val newValue = f
        put(key, newValue)
        newValue
    }

  private def cacheKey(key: K): Any = cacheKeyGenerator.generate(key)
}

private class MapCache[K, V](override val cacheKeyGenerator: CacheKeyGenerator[?])
    extends Cache[K, V] {
  private val map = scala.collection.mutable.Map.empty[Any, V]

  def doGet(key: Any): Option[V] = map.get(key)

  def doPut(key: Any, value: V): Unit =
    map += (key -> value)

  def doRemove(key: Any): Unit =
    map -= key

  override def toString: String = "MapCache(%s)".format(map)
}

object MapCache {
  def apply[K, V](implicit
    cacheKeyGenerator: CacheKeyGenerator[?] = NoOpCacheKeyGenerator
  ): Cache[K, V] =
    new MapCache[K, V](cacheKeyGenerator)
}
