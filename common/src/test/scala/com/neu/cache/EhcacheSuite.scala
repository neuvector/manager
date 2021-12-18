package com.neu.cache

import net.sf.ehcache.CacheManager
import org.scalatest.{BeforeAndAfterAll, FunSuite}

class EhcacheSuite extends FunSuite with BeforeAndAfterAll {

  implicit val cacheKeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
  implicit val cacheManager: CacheManager = CacheManager.getInstance()

  val cacheName = "posCache"



  test("caches value if there's no cache") {
    val cache = Ehcache[String, String](cacheName)
    cache.getOrElseInsert("key1")("value1")
    val result = cache.get("key1").get
    assert(result === "value1")
  }

  test("getOrElseInsert returns new value if no match") {
    val cache = Ehcache[String, String](cacheName)
    val result = cache.getOrElseInsert("key2")("value27")
    assert(result === "value2")
  }

  test("getOrElseInsert returns cached value matched") {
    val cache = Ehcache[String, String](cacheName)
    cache.put("key3", "value31")
    val result = cache.getOrElseInsert("key3")("value32")
    assert(result === "value31")
  }

  override protected def afterAll(): Unit =  {
//    cacheManager.shutdown()
  }
}
