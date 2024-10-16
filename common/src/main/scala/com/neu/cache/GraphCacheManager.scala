package com.neu.cache

import com.neu.model.Position
import com.neu.model.UserGraphLayout
import net.sf.ehcache.CacheManager

/**
 * Created by bxu on 2/2/18. Manager graph layout for node and group view.
 * [[com.neu.model.Position]] saved in cache which is disk backed, check the ehcache.xml for disk
 * store.
 */
object GraphCacheManager {
  given cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  given cacheManager: CacheManager                        = CacheManager.getInstance()

  val cacheName = "posCache"

  val cache: Cache[String, Map[String, Position]] =
    Ehcache[String, Map[String, Position]](cacheName)

  /**
   * Save graph layout for each user
   * @param layout
   *   the [[com.neu.model.UserGraphLayout]]
   */
  def saveNodeLayout(layout: UserGraphLayout): Unit =
    if (layout.nodePositions.nonEmpty) cache.put(layout.user + "node", layout.nodePositions.get)

  /**
   * Get node graph layout for user
   * @param user
   *   the user
   * @return
   *   [[com.neu.model.Position]]
   */
  def getNodeLayout(user: String): Option[Map[String, Position]] = cache.get(user + "node")

  /**
   * Get group layout for user
   * @param user
   *   the user
   * @return
   *   [[com.neu.model.Position]]
   */
  def getGroupLayout(user: String): Option[Map[String, Position]] = cache.get(user + "group")
}
