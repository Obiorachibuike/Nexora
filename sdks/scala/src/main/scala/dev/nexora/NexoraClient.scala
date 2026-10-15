package dev.nexora

import java.net.Socket
import java.io.{InputStream, OutputStream}
import java.nio.ByteBuffer

class NexoraClient(host: String = "127.0.0.1", port: Int = 6380, apiKey: Option[String] = None) extends AutoCloseable:
  private var socket: Socket = _
  private var out: OutputStream = _
  private var in: InputStream = _

  def connect(): Unit =
    socket = new Socket(host, port)
    out = socket.getOutputStream
    in = socket.getInputStream

  def ping(): Boolean =
    true

  def close(): Unit =
    if socket != null then socket.close()
