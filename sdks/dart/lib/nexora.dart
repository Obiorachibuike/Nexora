import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';

class NexoraClient {
  final String host;
  final int port;
  final String? apiKey;
  Socket? _socket;
  int _correlationId = 1;

  NexoraClient({this.host = '127.0.0.1', this.port = 6380, this.apiKey});

  Future<void> connect() async {
    _socket = await Socket.connect(host, port);
    if (apiKey != null) {
      await send(0x0001, jsonEncode({'api_key': apiKey}));
    }
  }

  Future<dynamic> send(int cmd, String payload) async {
    final payloadBytes = utf8.encode(payload);
    final plen = payloadBytes.length;
    final cid = _correlationId++;

    final bdata = ByteData(24);
    bdata.setUint8(0, 0x4E); // N
    bdata.setUint8(1, 0x45); // E
    bdata.setUint8(2, 0x58); // X
    bdata.setUint8(3, 0x4F); // O
    bdata.setUint8(4, 1);    // Version
    bdata.setUint8(5, 1);    // Request
    bdata.setUint16(6, 0);   // Flags
    bdata.setUint64(8, cid);
    bdata.setUint16(16, cmd);
    bdata.setUint32(18, plen);

    _socket!.add(bdata.buffer.asUint8List());
    _socket!.add(payloadBytes);
    await _socket!.flush();
    return true;
  }

  Future<bool> ping() async {
    await send(0x0002, '{}');
    return true;
  }

  void close() {
    _socket?.destroy();
  }
}
