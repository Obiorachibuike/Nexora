package dev.nexora;

import java.io.*;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

public class NexoraClient implements AutoCloseable {
    private static final byte[] MAGIC = "NEXO".getBytes(StandardCharsets.US_ASCII);
    private static final int HEADER_LEN = 24;

    private final String host;
    private final int port;
    private final String apiKey;
    private Socket socket;
    private OutputStream out;
    private InputStream in;
    private long correlationId = 1;

    public NexoraClient(String host, int port, String apiKey) {
        this.host = host;
        this.port = port;
        this.apiKey = apiKey;
    }

    public synchronized void connect() throws IOException {
        if (socket != null && socket.isConnected()) return;
        socket = new Socket(host, port);
        out = socket.getOutputStream();
        in = socket.getInputStream();

        if (apiKey != null && !apiKey.isEmpty()) {
            send(0x0001, String.format("{\"api_key\":\"%s\"}", apiKey));
        }
    }

    private static int crc16(byte[] data, int len) {
        int crc = 0xFFFF;
        for (int i = 0; i < len; i++) {
            crc ^= ((data[i] & 0xFF) << 8);
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return crc;
    }

    public synchronized String send(int commandId, String payload) throws IOException {
        byte[] payloadBytes = payload != null ? payload.getBytes(StandardCharsets.UTF_8) : new byte[0];
        long cid = correlationId++;

        ByteBuffer buf = ByteBuffer.allocate(HEADER_LEN).order(ByteOrder.BIG_ENDIAN);
        buf.put(MAGIC);
        buf.put((byte) 1); // version
        buf.put((byte) 1); // req
        buf.putShort((short) 0); // flags
        buf.putLong(cid);
        buf.putShort((short) commandId);
        buf.putInt(payloadBytes.length);

        int checksum = crc16(buf.array(), 22);
        buf.putShort((short) checksum);

        out.write(buf.array());
        if (payloadBytes.length > 0) {
            out.write(payloadBytes);
        }
        out.flush();

        byte[] respHdr = in.readNBytes(HEADER_LEN);
        if (respHdr.length < HEADER_LEN) {
            throw new IOException("Connection terminated prematurely");
        }
        ByteBuffer respBuf = ByteBuffer.wrap(respHdr).order(ByteOrder.BIG_ENDIAN);
        respBuf.position(16);
        short status = respBuf.getShort();
        int respLen = respBuf.getInt();

        byte[] respPayload = in.readNBytes(respLen);
        String respStr = new String(respPayload, StandardCharsets.UTF_8);

        if (status != 0 && status != 1) {
            throw new IOException("Nexora error " + status + ": " + respStr);
        }
        return respStr;
    }

    public boolean ping() throws IOException {
        String res = send(0x0002, "{}");
        return res.contains("\"pong\":true");
    }

    public void set(String key, String value, Long ttlMs) throws IOException {
        String body = ttlMs != null
            ? String.format("{\"key\":\"%s\",\"value\":\"%s\",\"ttl_ms\":%d}", key, value, ttlMs)
            : String.format("{\"key\":\"%s\",\"value\":\"%s\"}", key, value);
        send(0x0010, body);
    }

    public String get(String key) throws IOException {
        return send(0x0011, String.format("{\"key\":\"%s\"}", key));
    }

    public boolean delete(String key) throws IOException {
        String res = send(0x0012, String.format("{\"key\":\"%s\"}", key));
        return res.contains("\"deleted\":true");
    }

    @Override
    public synchronized void close() throws IOException {
        if (socket != null) {
            socket.close();
            socket = null;
        }
    }
}
