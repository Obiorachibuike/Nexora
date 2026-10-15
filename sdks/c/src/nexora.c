#include "../include/nexora.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define HEADER_LEN 24

struct nexora_client {
    int sock_fd;
    uint64_t correlation_id;
};

static uint16_t crc16(const uint8_t* data, size_t len) {
    uint16_t crc = 0xFFFF;
    for (size_t i = 0; i < len; i++) {
        crc ^= ((uint16_t)data[i]) << 8;
        for (int j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    return crc;
}

nexora_client_t* nexora_connect(const char* host, uint16_t port, const char* api_key) {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0) return NULL;

    struct sockaddr_in serv_addr;
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(port);

    if (inet_pton(AF_INET, host, &serv_addr.sin_addr) <= 0) {
        close(sock);
        return NULL;
    }

    if (connect(sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
        close(sock);
        return NULL;
    }

    nexora_client_t* client = (nexora_client_t*)malloc(sizeof(nexora_client_t));
    client->sock_fd = sock;
    client->correlation_id = 1;

    if (api_key != NULL && strlen(api_key) > 0) {
        char auth_payload[256];
        snprintf(auth_payload, sizeof(auth_payload), "{\"api_key\":\"%s\"}", api_key);
        // send auth command 0x0001
        uint32_t plen = strlen(auth_payload);
        uint8_t hdr[HEADER_LEN];
        memcpy(hdr, "NEXO", 4);
        hdr[4] = 1; // version
        hdr[5] = 1; // req
        hdr[6] = 0; hdr[7] = 0; // flags
        // correlation_id
        for (int i = 0; i < 8; i++) hdr[8+i] = (client->correlation_id >> (56 - 8*i)) & 0xFF;
        hdr[16] = 0x00; hdr[17] = 0x01; // CmdAuth
        hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
        hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
        uint16_t c = crc16(hdr, 22);
        hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

        send(sock, hdr, HEADER_LEN, 0);
        send(sock, auth_payload, plen, 0);

        uint8_t resp_hdr[HEADER_LEN];
        recv(sock, resp_hdr, HEADER_LEN, MSG_WAITALL);
        uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
        if (rplen > 0) {
            char* tmp = (char*)malloc(rplen);
            recv(sock, tmp, rplen, MSG_WAITALL);
            free(tmp);
        }
    }

    return client;
}

void nexora_disconnect(nexora_client_t* client) {
    if (client) {
        if (client->sock_fd >= 0) close(client->sock_fd);
        free(client);
    }
}

nexora_status_t nexora_ping(nexora_client_t* client) {
    if (!client) return NEXORA_CONNECTION_ERROR;
    uint8_t hdr[HEADER_LEN];
    memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    client->correlation_id++;
    for (int i = 0; i < 8; i++) hdr[8+i] = (client->correlation_id >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x02; // CmdPing
    hdr[18] = 0; hdr[19] = 0; hdr[20] = 0; hdr[21] = 0;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client->sock_fd, hdr, HEADER_LEN, 0);

    uint8_t resp_hdr[HEADER_LEN];
    if (recv(client->sock_fd, resp_hdr, HEADER_LEN, MSG_WAITALL) != HEADER_LEN) return NEXORA_CONNECTION_ERROR;
    uint32_t plen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (plen > 0) {
        char* tmp = (char*)malloc(plen);
        recv(client->sock_fd, tmp, plen, MSG_WAITALL);
        free(tmp);
    }
    return NEXORA_OK;
}

nexora_status_t nexora_set(nexora_client_t* client, const char* key, const char* value, uint64_t ttl_ms) {
    if (!client) return NEXORA_CONNECTION_ERROR;
    char payload[1024];
    if (ttl_ms > 0) {
        snprintf(payload, sizeof(payload), "{\"key\":\"%s\",\"value\":\"%s\",\"ttl_ms\":%lu}", key, value, ttl_ms);
    } else {
        snprintf(payload, sizeof(payload), "{\"key\":\"%s\",\"value\":\"%s\"}", key, value);
    }
    uint32_t plen = strlen(payload);

    uint8_t hdr[HEADER_LEN];
    memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    client->correlation_id++;
    for (int i = 0; i < 8; i++) hdr[8+i] = (client->correlation_id >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x10; // CmdSet
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client->sock_fd, hdr, HEADER_LEN, 0);
    send(client->sock_fd, payload, plen, 0);

    uint8_t resp_hdr[HEADER_LEN];
    recv(client->sock_fd, resp_hdr, HEADER_LEN, MSG_WAITALL);
    uint16_t status = (resp_hdr[16] << 8) | resp_hdr[17];
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        char* tmp = (char*)malloc(rplen);
        recv(client->sock_fd, tmp, rplen, MSG_WAITALL);
        free(tmp);
    }
    return (nexora_status_t)status;
}

nexora_status_t nexora_get(nexora_client_t* client, const char* key, char* out_buf, size_t out_buf_len) {
    if (!client) return NEXORA_CONNECTION_ERROR;
    char payload[512];
    snprintf(payload, sizeof(payload), "{\"key\":\"%s\"}", key);
    uint32_t plen = strlen(payload);

    uint8_t hdr[HEADER_LEN];
    memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    client->correlation_id++;
    for (int i = 0; i < 8; i++) hdr[8+i] = (client->correlation_id >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x11; // CmdGet
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client->sock_fd, hdr, HEADER_LEN, 0);
    send(client->sock_fd, payload, plen, 0);

    uint8_t resp_hdr[HEADER_LEN];
    recv(client->sock_fd, resp_hdr, HEADER_LEN, MSG_WAITALL);
    uint16_t status = (resp_hdr[16] << 8) | resp_hdr[17];
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        char* tmp = (char*)malloc(rplen + 1);
        recv(client->sock_fd, tmp, rplen, MSG_WAITALL);
        tmp[rplen] = '\0';
        if (out_buf && out_buf_len > 0) {
            strncpy(out_buf, tmp, out_buf_len - 1);
            out_buf[out_buf_len - 1] = '\0';
        }
        free(tmp);
    }
    return (nexora_status_t)status;
}

nexora_status_t nexora_delete(nexora_client_t* client, const char* key) {
    if (!client) return NEXORA_CONNECTION_ERROR;
    char payload[512];
    snprintf(payload, sizeof(payload), "{\"key\":\"%s\"}", key);
    uint32_t plen = strlen(payload);

    uint8_t hdr[HEADER_LEN];
    memcpy(hdr, "NEXO", 4);
    hdr[4] = 1; hdr[5] = 1; hdr[6] = 0; hdr[7] = 0;
    client->correlation_id++;
    for (int i = 0; i < 8; i++) hdr[8+i] = (client->correlation_id >> (56 - 8*i)) & 0xFF;
    hdr[16] = 0x00; hdr[17] = 0x12; // CmdDel
    hdr[18] = (plen >> 24) & 0xFF; hdr[19] = (plen >> 16) & 0xFF;
    hdr[20] = (plen >> 8) & 0xFF; hdr[21] = plen & 0xFF;
    uint16_t c = crc16(hdr, 22);
    hdr[22] = (c >> 8) & 0xFF; hdr[23] = c & 0xFF;

    send(client->sock_fd, hdr, HEADER_LEN, 0);
    send(client->sock_fd, payload, plen, 0);

    uint8_t resp_hdr[HEADER_LEN];
    recv(client->sock_fd, resp_hdr, HEADER_LEN, MSG_WAITALL);
    uint16_t status = (resp_hdr[16] << 8) | resp_hdr[17];
    uint32_t rplen = (resp_hdr[18] << 24) | (resp_hdr[19] << 16) | (resp_hdr[20] << 8) | resp_hdr[21];
    if (rplen > 0) {
        char* tmp = (char*)malloc(rplen);
        recv(client->sock_fd, tmp, rplen, MSG_WAITALL);
        free(tmp);
    }
    return (nexora_status_t)status;
}
