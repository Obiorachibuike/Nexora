#include "include/nexora.h"
#include <stdio.h>
#include <assert.h>
#include <string.h>

int main() {
    printf("Testing C SDK client...\n");
    nexora_client_t* client = nexora_connect("127.0.0.1", 6480, "nexora_test_secret_key_889");
    assert(client != NULL);
    printf("✓ C SDK: Connected to Nexora server\n");

    nexora_status_t ping_status = nexora_ping(client);
    assert(ping_status == NEXORA_OK);
    printf("✓ C SDK: ping() succeeded\n");

    nexora_status_t set_status = nexora_set(client, "c:engine", "NexoraNativeC", 60000);
    assert(set_status == NEXORA_OK);
    printf("✓ C SDK: set() succeeded\n");

    char buf[512];
    nexora_status_t get_status = nexora_get(client, "c:engine", buf, sizeof(buf));
    assert(get_status == NEXORA_OK);
    printf("✓ C SDK: get() succeeded: %s\n", buf);

    nexora_status_t del_status = nexora_delete(client, "c:engine");
    assert(del_status == NEXORA_OK);
    printf("✓ C SDK: delete() succeeded\n");

    nexora_disconnect(client);
    printf("ALL C SDK INTEGRATION TESTS PASSED!\n");
    return 0;
}
