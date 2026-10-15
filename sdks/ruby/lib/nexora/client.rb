require "socket"
require "json"

module Nexora
  class Client
    HEADER_LEN = 24

    def initialize(host: "127.0.0.1", port: 6380, api_key: nil)
      @host = host
      @port = port
      @api_key = api_key
      @correlation_id = 1
      @socket = nil
    end

    def connect
      @socket = TCPSocket.new(@host, @port)
      authenticate(@api_key) if @api_key
      self
    end

    def crc16(data)
      crc = 0xFFFF
      data.each_byte do |b|
        crc ^= (b << 8)
        8.times do
          crc = (crc & 0x8000 != 0) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF)
        end
      end
      crc
    end

    def send_command(cmd, payload = {})
      payload_str = payload.to_json
      cid = @correlation_id
      @correlation_id += 1

      header = ["NEXO", 1, 1, 0, cid, cmd, payload_str.bytesize].pack("a4CCQ>N>n>N>")
      header_fixed = "NEXO" + [1, 1, 0].pack("CCn") + [cid].pack("Q>") + [cmd].pack("n") + [payload_str.bytesize].pack("N")
      c = crc16(header_fixed)
      full_header = header_fixed + [c].pack("n")

      @socket.write(full_header + payload_str)

      resp_header = @socket.read(HEADER_LEN)
      status = resp_header[16, 2].unpack1("n")
      plen = resp_header[18, 4].unpack1("N")

      resp_body = plen > 0 ? @socket.read(plen) : "{}"
      data = JSON.parse(resp_body) rescue {}

      raise "Nexora error #{status}" if status != 0 && status != 1
      data
    end

    def authenticate(key)
      send_command(0x0001, { api_key: key })
    end

    def ping
      send_command(0x0002)["pong"] == true
    end

    def set(key, value, ttl_ms: nil)
      req = { key: key, value: value }
      req[:ttl_ms] = ttl_ms if ttl_ms
      send_command(0x0010, req)
    end

    def get(key)
      send_command(0x0011, { key: key })["value"]
    end

    def close
      @socket&.close
    end
  end
end
