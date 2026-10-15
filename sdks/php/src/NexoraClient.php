<?php

namespace Nexora;

class NexoraClient
{
    private const HEADER_LEN = 24;
    private $socket;
    private int $correlationId = 1;

    public function __construct(
        private string $host = '127.0.0.1',
        private int $port = 6380,
        private ?string $apiKey = null
    ) {}

    public function connect(): void
    {
        $this->socket = fsockopen($this->host, $this->port, $errno, $errstr, 5);
        if (!$this->socket) {
            throw new \RuntimeException("Failed to connect: $errstr ($errno)");
        }
        if ($this->apiKey) {
            $this->send(0x0001, json_encode(['api_key' => $this->apiKey]));
        }
    }

    private static function crc16(string $data): int
    {
        $crc = 0xFFFF;
        $len = strlen($data);
        for ($i = 0; $i < $len; $i++) {
            $crc ^= (ord($data[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = (($crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    $crc = ($crc << 1) & 0xFFFF;
                }
            }
        }
        return $crc;
    }

    public function send(int $cmd, string $payload = ''): array
    {
        $cid = $this->correlationId++;
        $plen = strlen($payload);

        $hdr = "NEXO\x01\x01\x00\x00";
        $hdr .= pack('J', $cid); // 8 bytes u64
        $hdr .= pack('n', $cmd); // 2 bytes u16
        $hdr .= pack('N', $plen); // 4 bytes u32

        $c = self::crc16($hdr);
        $hdr .= pack('n', $c);

        fwrite($this->socket, $hdr . $payload);

        $respHdr = fread($this->socket, self::HEADER_LEN);
        $status = unpack('n', substr($respHdr, 16, 2))[1];
        $respLen = unpack('N', substr($respHdr, 18, 4))[1];

        $body = $respLen > 0 ? fread($this->socket, $respLen) : '';
        $data = json_decode($body, true) ?? [];

        if ($status !== 0 && $status !== 1) {
            throw new \RuntimeException($data['error'] ?? "Nexora error $status");
        }
        return $data;
    }

    public function ping(): bool
    {
        $res = $this->send(0x0002, '{}');
        return !empty($res['pong']);
    }

    public function set(string $key, mixed $value, ?int $ttlMs = null): void
    {
        $req = ['key' => $key, 'value' => $value];
        if ($ttlMs) $req['ttl_ms'] = $ttlMs;
        $this->send(0x0010, json_encode($req));
    }

    public function get(string $key): mixed
    {
        $res = $this->send(0x0011, json_encode(['key' => $key]));
        return $res['value'] ?? null;
    }

    public function close(): void
    {
        if ($this->socket) {
            fclose($this->socket);
            $this->socket = null;
        }
    }
}
