#include "../include/nexora/client.hpp"
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <cstring>
#include <vector>

namespace nexora {

static uint16_t crc16(const uint8_t* data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; ++i) {
        crc ^= (static_cast<uint16_t>(data[i])) << 8;
        for (int j = 0; j < 8; ++j) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc;
}

Client::Client(std::string host, uint16_t port, std::string api_key)
    : host_(std::move(host)), port_(port), api_key_(std::move(api_key)) {}

Client::~Client() {
    disconnect();
}

bool Client::connect() {
    sock_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (sock_fd_ < 0) return false;

    struct sockaddr_in serv_addr{};
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port_);

    if (inet_pton(AF_INET, host_.c_str(), &serv_addr.sin_addr) <= 0) {
        disconnect();
        return false;
    }

    if (::connect(sock_fd_, reinterpret_cast<struct sockaddr*>(&serv_addr), sizeof(serv_addr)) < 0) {
        disconnect();
        return false;
    }

    if (!api_key_.empty()) {
        std::string payload = "{\"api_key\":\"" + api_key_ + "\"}";
        uint32_t plen = payload.size();
        uint8_t hdr[24];
        std::memcpy(hdr, "NEXO", 4);
        hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
        uint64_t cid = next_correlation_id();
        for (int i = 0; i < 8; ++i) hdr[8+i] = (cid >> (56 - 8*i)) & 0xFF;
        hdr[16] = 0x00; hdr[17] = 0x01; // Auth
        hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
        hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
        uint16_t c = crc16(hdr, 22);
        hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

        send(sock_fd_, hdr, 24, 0);
        send(sock_fd_, payload.data(), plen, 0);

        uint8_t resp_hdr[24];
        recv(sock_fd_, resp_hdr, 24, MSG_WAITALL);
        uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
        if (rplen > 0) {
            std::vector<char> tmp(rplen);
            recv(sock_fd_, tmp.data(), rplen, MSG_WAITALL);
        }
    }

    return true;
}

void Client::disconnect() {
    if (sock_fd_ >= 0) {
        close(sock_fd_);
        sock_fd_ = -1;
    }
}

bool Client::ping() {
    if (sock_fd_ < 0) return false;
    uint8_t hdr[24];
    std::memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    uint64_t cid = next_correlation_id();
    for (int i = 0; i < 8; ++i) hdr[8+i] = (cid >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x02; // Ping
    hdr[18] = 0; hdr[19] = 0; hdr[20] = 0; hdr[21] = 0;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(sock_fd_, hdr, 24, 0);

    uint8_t resp_hdr[24];
    if (recv(sock_fd_, resp_hdr, 24, MSG_WAITALL) != 24) return false;
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        std::vector<char> tmp(rplen);
        recv(sock_fd_, tmp.data(), rplen, MSG_WAITALL);
    }
    return true;
}

bool Store::set(const std::string& key, const std::string& value, uint64_t ttl_ms) {
    if (client_.socket_fd() < 0) return false;
    std::string payload = "{\"key\":\"" + key + "\",\"value\":\"" + value + "\"}";
    uint32_t plen = payload.size();

    uint8_t hdr[24];
    std::memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    uint64_t cid = client_.next_correlation_id();
    for (int i = 0; i < 8; ++i) hdr[8+i] = (cid >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x10; // Set
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client_.socket_fd(), hdr, 24, 0);
    send(client_.socket_fd(), payload.data(), plen, 0);

    uint8_t resp_hdr[24];
    recv(client_.socket_fd(), resp_hdr, 24, MSG_WAITALL);
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        std::vector<char> tmp(rplen);
        recv(client_.socket_fd(), tmp.data(), rplen, MSG_WAITALL);
    }
    return true;
}

std::optional<std::string> Store::get(const std::string& key) {
    if (client_.socket_fd() < 0) return std::nullopt;
    std::string payload = "{\"key\":\"" + key + "\"}";
    uint32_t plen = payload.size();

    uint8_t hdr[24];
    std::memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    uint64_t cid = client_.next_correlation_id();
    for (int i = 0; i < 8; ++i) hdr[8+i] = (cid >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x11; // Get
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client_.socket_fd(), hdr, 24, 0);
    send(client_.socket_fd(), payload.data(), plen, 0);

    uint8_t resp_hdr[24];
    recv(client_.socket_fd(), resp_hdr, 24, MSG_WAITALL);
    uint16_t status = (resp_hdr[16] << 8) | resp_hdr[17];
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (status != 0) {
        if (rplen > 0) {
            std::vector<char> tmp(rplen);
            recv(client_.socket_fd(), tmp.data(), rplen, MSG_WAITALL);
        }
        return std::nullopt;
    }
    std::vector<char> tmp(rplen + 1, 0);
    recv(client_.socket_fd(), tmp.data(), rplen, MSG_WAITALL);
    return std::string(tmp.data());
}

bool Store::del(const std::string& key) {
    if (client_.socket_fd() < 0) return false;
    std::string payload = "{\"key\":\"" + key + "\"}";
    uint32_t plen = payload.size();

    uint8_t hdr[24];
    std::memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    uint64_t cid = client_.next_correlation_id();
    for (int i = 0; i < 8; ++i) hdr[8+i] = (cid >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x12; // Del
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client_.socket_fd(), hdr, 24, 0);
    send(client_.socket_fd(), payload.data(), plen, 0);

    uint8_t resp_hdr[24];
    recv(client_.socket_fd(), resp_hdr, 24, MSG_WAITALL);
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        std::vector<char> tmp(rplen);
        recv(client_.socket_fd(), tmp.data(), rplen, MSG_WAITALL);
    }
    return true;
}

} // namespace nexora
