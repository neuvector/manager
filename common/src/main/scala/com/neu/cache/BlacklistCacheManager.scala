package com.neu.cache

import com.neu.model.Blacklist
import com.neu.model.UserBlacklist
import net.sf.ehcache.CacheManager

object BlacklistCacheManager {
  given cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  given cacheManager: CacheManager                        = CacheManager.getInstance()

  val cacheName = "blacklistCache"

  val cache: Cache[String, Blacklist] =
    Ehcache[String, Blacklist](cacheName)

  /**
   * Save blacklist for Graph.
   */
  def saveBlacklist(userBlacklist: UserBlacklist): Unit =
    userBlacklist.blacklist.foreach(cache.put(userBlacklist.user + "blacklist", _))

  /**
   * Get blacklist of user for Graph
   * @param user
   *   the user
   * @return
   *   [[com.neu.model.Blacklist]]
   */
  def getBlacklist(user: String): Option[Blacklist] = cache.get(user + "blacklist")
}
