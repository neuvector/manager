package com.neu.cache
import net.sf.ehcache.CacheManager

/**
 * Created by bxu on 2/2/18. Manager graph layout for node and group view.
 * [[com.neu.model.Position]] saved in cache which is disk backed, check the ehcache.xml for disk
 * store.
 */
object JsonStringCacheManager {
  given cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  given cacheManager: CacheManager                        = CacheManager.getInstance()

  val cacheName = "jsonCache"

  val cache: Cache[String, String] =
    Ehcache[String, String](cacheName)

  def saveJson(key: String, json: String): Unit =
    cache.put(key, json)

  def getJson(key: String): Option[String] = cache.get(key)

}
