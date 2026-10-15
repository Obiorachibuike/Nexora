#pragma once

#include <string>
#include <memory>
#include <optional>
#include <cstdint>

namespace nexora {

class Store {
public:
    explicit Store(class Client& client) : client_(client) {}
    bool set(const std::string& key, const std::string& value, uint64_t ttl_ms = 0);
    std::optional<std::string> get(const std::string& key);
    bool del(const std::string& key);
private:
    class Client& client_;
};

class Client {
public:
    Client(std::string host, uint16_t port, std::string api_key = "");
    ~Client();

    bool connect();
    void disconnect();
    bool ping();

    Store store() { return Store(*this); }

    int socket_fd() const { return sock_fd_; }
    uint64_t next_correlation_id() { return ++correlation_id_; }

private:
    std::string host_;
    uint16_t port_;
    std::string api_key_;
    int sock_fd_{-1};
    uint64_t correlation_id_{0};
};

} // namespace nexora
