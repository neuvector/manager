package com.neu.cache

import net.sf.ehcache.{ Cache as ECache, CacheManager, Element }

/**
 * Cache implementation using Ehcache
 */
private class EhcacheCache[K, V](
  underlying: ECache,
  override val cacheKeyGenerator: CacheKeyGenerator[?]
) extends Cache[K, V] {
  def doGet(key: Any): Option[V] = {
    val e = underlying.get(key)
    if (e != null && e.getObjectValue != null) Some(e.getObjectValue.asInstanceOf[V]) else None
  }

  def doPut(key: Any, value: V): Unit = {
    underlying.put(new Element(key, value))
    underlying.flush()
  }

  def doRemove(key: Any): Unit = {
    underlying.remove(key)
    underlying.flush()
  }
}

/**
 * Cache factory using Ehcache
 */
object Ehcache {

  /**
   * Returns Cache instance
   *
   * @tparam K
   *   type of key
   * @tparam V
   *   type of value
   * @param name
   *   the cache name
   */
  def apply[K, V](name: String)(implicit
    cacheManager: CacheManager,
    cacheKeyGenerator: CacheKeyGenerator[?] = NoOpCacheKeyGenerator
  ): Cache[K, V] = {
    val c = cacheManager.getCache(name)
    if (c == null) throw new IllegalArgumentException("no cache %s found".format(name))
    else new EhcacheCache(c, cacheKeyGenerator)
  }
}
