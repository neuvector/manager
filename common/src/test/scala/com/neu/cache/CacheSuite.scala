package com.neu.cache

import org.scalatest.FunSuite

class CacheSuite extends FunSuite {
  test("caches value if there's no cache") {
    val KeyGenerator = ToStringCacheKeyGenerator
    val cache = MapCache[String, String](KeyGenerator)
    cache.getOrElseInsert("key1")("value1")
    val result = cache.get("key1").get
    assert(result === "value1")
  }

  test("returns new value if there's no cache") {
    val KeyGenerator = ToStringCacheKeyGenerator
    val cache = MapCache[String, String](KeyGenerator)
    val result = cache.getOrElseInsert("key2")("value2")
    assert(result === "value2")
  }

  test("returns cached value if there's cached one") {
    val KeyGenerator = ToStringCacheKeyGenerator
    val cache = MapCache[String, String](KeyGenerator)
    cache.put("key3", "value31")
    val result = cache.getOrElseInsert("key3")("value32")
    assert(result === "value31")
  }

  test("works fine with implicit CacheKeyGenerator") {
    implicit val KeyGenerator: ToStringCacheKeyGenerator.type = ToStringCacheKeyGenerator
    val cache = MapCache[String, String]
    cache.put("key4", "value4")
    cache.put("key5", "value5")
    val result = cache.get("key4").get
    assert(result === "value4")
  }

  test("works fine with default NoOpCacheKeyGenerator") {
    val cache = MapCache[String, String]
    cache.put("key6", "value6")
    cache.put("key7", "value7")
    val result = cache.get("key6").get
    assert(result === "value6")
  }
}
