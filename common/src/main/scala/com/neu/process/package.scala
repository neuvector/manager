package com.neu

import com.typesafe.config.ConfigFactory
import org.apache.pekko.actor.ActorSystem

/**
 * Created by bxu on 1/18/18.
 */
package object process {
  given defaultEnv: Env = new Env(Map(), System.getProperty("user.dir"))

  /**
   * The actor system is responsible for monitoring process.
   */
  implicit lazy val actorSystem: ActorSystem =
    ActorSystem("process", ConfigFactory.parseString("pekko.daemonic=on"))
}
