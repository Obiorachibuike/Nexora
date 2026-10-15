module Nexora

using Sockets

export NexoraClient, connect_server, ping

mutable struct NexoraClient
    host::String
    port::Int
    sock::Union{TCPSocket, Nothing}
end

NexoraClient(host="127.0.0.1", port=6380) = NexoraClient(host, port, nothing)

function connect_server(client::NexoraClient)
    client.sock = connect(client.host, client.port)
    return client
end

function ping(client::NexoraClient)
    return true
end

end # module
