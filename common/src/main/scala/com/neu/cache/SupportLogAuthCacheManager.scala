package com.neu.cache
import net.sf.ehcache.CacheManager

object SupportLogAuthCacheManager {
  given cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  given cacheManager: CacheManager                        = CacheManager.getInstance()

  val cacheName = "supportLogAuthCache"

  val cache: Cache[String, String] =
    Ehcache[String, String](cacheName)

  /**
   * Save supportLogAuth for support log
   */
  def saveSupportLogAuth(token: String, filename: String): Unit =
    cache.put(token, filename)

  /**
   * Get supportLogAuth for support log
   * @param token
   * @return
   *   [[String]]
   */
  def getSupportLogAuth(token: String): Option[String] = cache.get(token)

  /**
   * Remove supportLogAuth for support log
   */
  def removeSupportLogAuth(token: String): Unit = cache.remove(token)
}
