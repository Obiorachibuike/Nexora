import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from nexora import NexoraClient, NotFoundError

def run_tests():
    print("Testing Python SDK against Nexora Server...")
    client = NexoraClient(host="127.0.0.1", port=6480, api_key="nexora_test_secret_key_889")
    client.connect()

    assert client.ping() is True, "Ping must return True"
    print("✓ Python SDK: ping() succeeded")

    store = client.store()
    store.set("py:greeting", "Hello from Python", ttl_ms=60000)
    val = store.get("py:greeting")
    assert val == "Hello from Python", f"Expected 'Hello from Python', got {val}"
    print("✓ Python SDK: store.set() and store.get() succeeded")

    # Exists check
    assert store.exists("py:greeting") is True
    print("✓ Python SDK: store.exists() succeeded")

    # TTL check
    ttl = store.ttl("py:greeting")
    assert ttl is not None and ttl > 0
    print(f"✓ Python SDK: store.ttl() succeeded ({ttl}ms)")

    # Increment
    counter = store.incr("py:counter", 10)
    assert counter == 10
    counter = store.incr("py:counter", 5)
    assert counter == 15
    print(f"✓ Python SDK: store.incr() succeeded ({counter})")

    # Queue operations
    queue = client.queue("py_tasks")
    job = queue.add("compute-analytics", {"metric": "churn_rate"}, priority=10)
    assert "id" in job
    print(f"✓ Python SDK: queue.add() succeeded (job_id: {job['id']})")

    claimed = queue.fetch_next("py-worker-1", lease_ms=5000)
    assert claimed is not None
    assert claimed["id"] == job["id"]
    print(f"✓ Python SDK: queue.fetch_next() claimed job: {claimed['id']}")

    queue.ack(claimed["id"], "py-worker-1", claimed["fencingToken"])
    inspected = queue.inspect(claimed["id"])
    assert inspected["state"] == "completed"
    print("✓ Python SDK: queue.ack() marked job completed")

    # Delete
    deleted = store.delete("py:greeting")
    assert deleted is True
    assert store.get("py:greeting") is None
    print("✓ Python SDK: store.delete() succeeded")

    client.close()
    print("\nALL PYTHON SDK INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
