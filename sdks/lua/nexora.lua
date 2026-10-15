local socket = require("socket")

local Nexora = {}
Nexora.__index = Nexora

function Nexora.new(host, port)
    local self = setmetatable({}, Nexora)
    self.host = host or "127.0.0.1"
    self.port = port or 6380
    self.sock = nil
    return self
end

function Nexora:connect()
    self.sock = socket.tcp()
    self.sock:connect(self.host, self.port)
    return true
end

function Nexora:close()
    if self.sock then
        self.sock:close()
        self.sock = nil
    end
end

return Nexora
