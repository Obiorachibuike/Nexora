package dev.nexora

import java.io.InputStream
import java.io.OutputStream
import java.net.Socket
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets

class NexoraClient(
    val host: String = "127.0.0.1",
    val port: Int = 6380,
    val apiKey: String? = null
) : AutoCloseable {
    private var socket: Socket? = null
    private var out: OutputStream? = null
    private var inStream: InputStream? = null
    private var correlationId = 1L

    fun connect() {
        socket = Socket(host, port)
        out = socket!!.getOutputStream()
        inStream = socket!!.getInputStream()
        if (!apiKey.isNullOrEmpty()) {
            send(0x0001, "{\"api_key\":\"$apiKey\"}")
        }
    }

    private fun crc16(data: ByteArray, len: Int): Short {
        var crc = 0xFFFF
        for (i in 0 until len) {
            crc = crc xor ((data[i].toInt() and 0xFF) shl 8)
            for (j in 0 until 8) {
                crc = if ((crc and 0x8000) != 0) {
                    ((crc shl 1) xor 0x1021) and 0xFFFF
                } else {
                    (crc shl 1) and 0xFFFF
                }
            }
        }
        return crc.toShort()
    }

    fun send(commandId: Int, payload: String): String {
        val payloadBytes = payload.toByteArray(StandardCharsets.UTF_8)
        val cid = correlationId++

        val buf = ByteBuffer.allocate(24).order(ByteOrder.BIG_ENDIAN)
        buf.put("NEXO".toByteArray(StandardCharsets.US_ASCII))
        buf.put(1.toByte())
        buf.put(1.toByte())
        buf.putShort(0.toShort())
        buf.putLong(cid)
        buf.putShort(commandId.toShort())
        buf.putInt(payloadBytes.size)
        val chk = crc16(buf.array(), 22)
        buf.putShort(chk)

        out!!.write(buf.array())
        if (payloadBytes.isNotEmpty()) {
            out!!.write(payloadBytes)
        }
        out!!.flush()

        val respHdr = inStream!!.readNBytes(24)
        val respBuf = ByteBuffer.wrap(respHdr).order(ByteOrder.BIG_ENDIAN)
        respBuf.position(16)
        val status = respBuf.short.toInt()
        val rlen = respBuf.int

        val bodyBytes = inStream!!.readNBytes(rlen)
        val bodyStr = String(bodyBytes, StandardCharsets.UTF_8)
        if (status != 0 && status != 1) {
            throw RuntimeException("Nexora status $status: $bodyStr")
        }
        return bodyStr
    }

    fun ping(): Boolean = send(0x0002, "{}").contains("\"pong\":true")

    fun set(key: String, value: String, ttlMs: Long? = null) {
        val json = if (ttlMs != null) {
            "{\"key\":\"$key\",\"value\":\"$value\",\"ttl_ms\":$ttlMs}"
        } else {
            "{\"key\":\"$key\",\"value\":\"$value\"}"
        }
        send(0x0010, json)
    }

    override fun close() {
        socket?.close()
    }
}
