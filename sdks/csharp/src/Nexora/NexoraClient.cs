using System;
using System.Buffers.Binary;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Nexora
{
    public class NexoraClient : IAsyncDisposable
    {
        private static readonly byte[] Magic = Encoding.ASCII.GetBytes("NEXO");
        private const int HeaderLen = 24;

        private readonly string _host;
        private readonly int _port;
        private readonly string? _apiKey;
        private TcpClient? _client;
        private NetworkStream? _stream;
        private long _correlationId = 1;

        public NexoraClient(string host = "127.0.0.1", int port = 6380, string? apiKey = null)
        {
            _host = host;
            _port = port;
            _apiKey = apiKey;
        }

        public async Task ConnectAsync(CancellationToken cancellationToken = default)
        {
            _client = new TcpClient();
            await _client.ConnectAsync(_host, _port, cancellationToken);
            _stream = _client.GetStream();

            if (!string.IsNullOrEmpty(_apiKey))
            {
                await SendAsync(0x0001, $"{{\"api_key\":\"{_apiKey}\"}}", cancellationToken);
            }
        }

        private static ushort Crc16(byte[] data, int length)
        {
            ushort crc = 0xFFFF;
            for (int i = 0; i < length; i++)
            {
                crc ^= (ushort)(data[i] << 8);
                for (int j = 0; j < 8; j++)
                {
                    if ((crc & 0x8000) != 0)
                        crc = (ushort)((crc << 1) ^ 0x1021);
                    else
                        crc = (ushort)(crc << 1);
                }
            }
            return crc;
        }

        public async Task<string> SendAsync(ushort commandId, string payload, CancellationToken cancellationToken = default)
        {
            if (_stream == null) throw new InvalidOperationException("Client is not connected.");

            byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);
            long cid = Interlocked.Increment(ref _correlationId);

            byte[] header = new byte[HeaderLen];
            Buffer.BlockCopy(Magic, 0, header, 0, 4);
            header[4] = 1; // version
            header[5] = 1; // req
            BinaryPrimitives.WriteUInt64BigEndian(header.AsSpan(8, 8), (ulong)cid);
            BinaryPrimitives.WriteUInt16BigEndian(header.AsSpan(16, 2), commandId);
            BinaryPrimitives.WriteUInt32BigEndian(header.AsSpan(18, 4), (uint)payloadBytes.Length);

            ushort checksum = Crc16(header, 22);
            BinaryPrimitives.WriteUInt16BigEndian(header.AsSpan(22, 2), checksum);

            await _stream.WriteAsync(header, cancellationToken);
            if (payloadBytes.Length > 0)
            {
                await _stream.WriteAsync(payloadBytes, cancellationToken);
            }
            await _stream.FlushAsync(cancellationToken);

            byte[] respHeader = new byte[HeaderLen];
            await _stream.ReadExactlyAsync(respHeader, 0, HeaderLen, cancellationToken);

            ushort status = BinaryPrimitives.ReadUInt16BigEndian(respHeader.AsSpan(16, 2));
            uint respLen = BinaryPrimitives.ReadUInt32BigEndian(respHeader.AsSpan(18, 4));

            byte[] respBody = new byte[respLen];
            if (respLen > 0)
            {
                await _stream.ReadExactlyAsync(respBody, 0, (int)respLen, cancellationToken);
            }

            string resultStr = Encoding.UTF8.GetString(respBody);
            if (status != 0 && status != 1)
            {
                throw new Exception($"Nexora error status {status}: {resultStr}");
            }

            return resultStr;
        }

        public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
        {
            var res = await SendAsync(0x0002, "{}", cancellationToken);
            return res.Contains("\"pong\":true");
        }

        public async Task SetAsync(string key, string value, ulong? ttlMs = null, CancellationToken cancellationToken = default)
        {
            string payload = ttlMs.HasValue
                ? $"{{\"key\":\"{key}\",\"value\":\"{value}\",\"ttl_ms\":{ttlMs}}}"
                : $"{{\"key\":\"{key}\",\"value\":\"{value}\"}}";
            await SendAsync(0x0010, payload, cancellationToken);
        }

        public async ValueTask DisposeAsync()
        {
            _stream?.Dispose();
            _client?.Dispose();
            await Task.CompletedTask;
        }
    }
}
