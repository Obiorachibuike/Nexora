import Foundation
import Network

public final class NexoraClient {
    private let host: String
    private let port: UInt16
    private let apiKey: String?
    private var connection: NWConnection?
    private var correlationId: UInt64 = 1

    public init(host: String = "127.0.0.1", port: UInt16 = 6380, apiKey: String? = nil) {
        self.host = host
        self.port = port
        self.apiKey = apiKey
    }

    public func connect() async throws {
        let endpoint = NWEndpoint.hostPort(host: NWEndpoint.Host(host), port: NWEndpoint.Port(rawValue: port)!)
        connection = NWConnection(to: endpoint, using: .tcp)
        connection?.start(queue: .global())
    }

    public func ping() async throws -> Bool {
        // Ping command 0x0002
        return true
    }

    public func close() {
        connection?.cancel()
    }
}
