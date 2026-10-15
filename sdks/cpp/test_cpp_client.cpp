#include "include/nexora/client.hpp"
#include <iostream>
#include <cassert>

int main() {
    std::cout << "Testing C++ SDK client..." << std::endl;
    nexora::Client client("127.0.0.1", 6480, "nexora_test_secret_key_889");
    bool connected = client.connect();
    assert(connected);
    std::cout << "✓ C++ SDK: Connected" << std::endl;

    assert(client.ping());
    std::cout << "✓ C++ SDK: ping() succeeded" << std::endl;

    auto store = client.store();
    assert(store.set("cpp:key", "CppNativeValue"));
    std::cout << "✓ C++ SDK: set() succeeded" << std::endl;

    auto val = store.get("cpp:key");
    assert(val.has_value());
    std::cout << "✓ C++ SDK: get() succeeded: " << *val << std::endl;

    assert(store.del("cpp:key"));
    std::cout << "✓ C++ SDK: del() succeeded" << std::endl;

    std::cout << "ALL C++ SDK INTEGRATION TESTS PASSED!" << std::endl;
    return 0;
}
