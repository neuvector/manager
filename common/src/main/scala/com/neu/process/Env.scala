package com.neu.process

import java.io.File

/**
 * Environment variables for running script or command.
 */
class Env(var vars: Map[String, String] = Map(), var pwd: String = System.getProperty("user.dir")) {
  implicit var self: Env = this

  override def toString: String = pwd + vars.toString

  /**
   * Change current working directory in this environment.
   */
  def cd(newPwd: String)(fun: => Unit): Unit = {
    val oldPwd = pwd
    pwd = newPwd
    try fun
    finally pwd = oldPwd
  }

  /**
   * Give more environment variables to this environment.
   */
  def env(extra: Map[String, String])(fun: => Unit): Unit = {
    val oldVars = vars
    vars ++= extra
    try fun
    finally vars = oldVars
  }

  def applyTo(pb: ProcessBuilder): Unit = {
    val env = pb.environment()
    vars.foreach { kv =>
      env.put(kv._1, kv._2)
    }
    pb.directory(new File(pwd))
  }
}
