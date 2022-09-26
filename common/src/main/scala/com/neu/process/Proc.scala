package com.neu.process

import java.io.BufferedReader
import java.io.BufferedWriter
import java.io.InputStreamReader
import java.io.OutputStreamWriter

import scala.util.control.Breaks.break
import scala.util.control.Breaks.breakable

/**
 * An operating system process.
 */
class Proc(args: String*)(env: Env) extends Traversable[String] {
  protected val pb                           = new ProcessBuilder(args: _*)
  protected var proc: Process                = _
  protected var inputWriter: BufferedWriter  = _
  protected var outputReader: BufferedReader = _
  protected var errorReader: BufferedReader  = _

  /**
   * Start process and traverse lines in standard output.
   */
  def stdout = new Traversable[String] {
    def foreach[U](fun: String => U) {
      startProc()
      collectOutput(fun, outputReader)
    }
  }

  /**
   * Start process and traverse lines in standard error.
   */
  def stderr = new Traversable[String] {
    def foreach[U](fun: String => U) {
      startProc()
      collectOutput(fun, errorReader)
    }
  }

  /**
   * Start process and traverse lines in both standard output and error.
   */
  def foreach[U](fun: String => U) {
    pb.redirectErrorStream(true)
    startProc()
    collectOutput(fun, outputReader)
  }

  /**
   * Start process and return all output in standard output and error.
   */
  override def toString: String = {
    val output = collect { case s: String => s }.mkString(String format "%n")
    waitFor()
    output
  }

  /**
   * Feed data to standard input.
   */
  def input(lines: String*): Proc = {
    startProc()
    try {
      for (s <- lines) {
        inputWriter.write(s)
      }
    } finally {
      inputWriter.close()
    }
    this
  }

  /**
   * Wait for process to finish and return its exit code.
   * If process has not been started, it will be started and then waited.
   */
  def waitFor(): Int = {
    if (proc == null) {
      startProc()
    }
    try {
      if (inputWriter != null) {
        inputWriter.close()
      }
    } finally {}
    proc.waitFor()
  }

  /**
   * Start this process in background (does not block main thread).
   */
  def bg(): Unit = this.startProc()

  /**
   * Destroy the process and return its exit value.
   * If process has not been started, an IllegalStateException is thrown.
   */
  def destroy(): Int = proc match {
    case null => throw new IllegalStateException("Process has not started")
    case _    => proc.destroy(); waitFor()
  }

  /**
   * Start the process.
   */
  protected def startProc(): Unit =
    if (proc == null) {
      env.applyTo(pb)
      proc = pb.start()
      inputWriter = new BufferedWriter(new OutputStreamWriter(proc.getOutputStream))
      outputReader = new BufferedReader(new InputStreamReader(proc.getInputStream))
      errorReader = new BufferedReader(new InputStreamReader(proc.getErrorStream))
    }

  /**
   * Collect process output to feed to the function.
   */
  protected def collectOutput[U](fun: String => U, reader: BufferedReader) {
    try {
      breakable {
        while (true) {
          val line = reader.readLine()
          if (line == null) {
            break
          }
          fun(line)
        }
      }
    } finally {
      reader.close()
    }
  }
}
