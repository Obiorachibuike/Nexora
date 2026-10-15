#ifndef NEXORA_H
#define NEXORA_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct nexora_client nexora_client_t;

typedef enum {
    NEXORA_OK = 0,
    NEXORA_CREATED = 1,
    NEXORA_NOT_FOUND = 2,
    NEXORA_UNAUTHORIZED = 3,
    NEXORA_BAD_REQUEST = 4,
    NEXORA_CONFLICT = 5,
    NEXORA_SERVER_ERROR = 6,
    NEXORA_LEASE_EXPIRED = 7,
    NEXORA_CONNECTION_ERROR = 100,
    NEXORA_TIMEOUT = 101,
} nexora_status_t;

nexora_client_t* nexora_connect(const char* host, uint16_t port, const char* api_key);
void nexora_disconnect(nexora_client_t* client);

nexora_status_t nexora_ping(nexora_client_t* client);
nexora_status_t nexora_set(nexora_client_t* client, const char* key, const char* value, uint64_t ttl_ms);
nexora_status_t nexora_get(nexora_client_t* client, const char* key, char* out_buf, size_t out_buf_len);
nexora_status_t nexora_delete(nexora_client_t* client, const char* key);

#ifdef __cplusplus
}
#endif

#endif // NEXORA_H
