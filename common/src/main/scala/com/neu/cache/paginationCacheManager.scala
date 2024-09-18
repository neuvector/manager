package com.neu.cache

import net.sf.ehcache.CacheManager

trait PaginationCacheManagerImpl[T] {
  implicit val cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  implicit val cacheManager: CacheManager                        = CacheManager.getInstance()

  val cacheName = "pgCache"

  val cache: Cache[String, T] =
    Ehcache[String, T](cacheName)

  def savePagedData(userToken: String, data: T): Unit =
    if (data != null) cache.put(userToken, data)

  def getPagedData(userToken: String): Option[T] = cache.get(userToken)

  def removePagedData(userToken: String): Unit =
    cache.remove(userToken);
}

object paginationCacheManager extends PaginationCacheManagerImpl[Nothing] {
  def apply[T]: PaginationCacheManagerImpl[T] = this.asInstanceOf[PaginationCacheManagerImpl[T]]
}
