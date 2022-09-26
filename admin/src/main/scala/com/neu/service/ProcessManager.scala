package com.neu.service

import java.io._

import akka.actor.{ Actor, ActorLogging }
import scala.collection.mutable.ListBuffer
import scala.util.control.Breaks.{ break, breakable }

/**
 * Created by bxu on 1/18/18.
 * Manage process life cycle, including start, interact, close the process
 * Client interact this manage by sending commands, the actor will response with output by
 * running the command
 */
class ProcessManager extends Actor with ActorLogging {
  val builder = new ProcessBuilder("bash", "-i")
  builder.redirectErrorStream(true)
  val proc: Process = builder.start()
  val inputWriter   = new BufferedWriter(new OutputStreamWriter(proc.getOutputStream))
  val outputReader  = new BufferedReader(new InputStreamReader(proc.getInputStream))

  /**
   * Destroy the process and return its exit value.
   * If process has not been started, an IllegalStateException is thrown.
   */
  def destroy(): Int = {
    proc.destroy()
    proc.waitFor()
  }

  def collectOutput(): List[String] = {
    var lines = new ListBuffer[String]()
    try {
      breakable {
        while (true) {
          val line = outputReader.readLine()
          log.info(line)
          if (line == null) break
          lines += line
        }
      }
      lines.toList
    } finally {}
  }

  override def receive: Receive = {
    case ReadOutput =>
      sender ! collectOutput()
    case s: String =>
      log.info("get command: {}", s)
      inputWriter.write(s)
      inputWriter.flush()
    case "exit" => destroy()
  }
}

case object ReadOutput
