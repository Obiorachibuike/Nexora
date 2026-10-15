import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../sdks/python')))
from nexora import NexoraClient

def main():
    print("Connecting to Nexora Server from Python Example...")
    client = NexoraClient(host="127.0.0.1", port=6380)
    client.connect()

    store = client.store()
    print("1. Setting key-value in Nexora persistent store...")
    store.set("app:maintenance", False)
    val = store.get("app:maintenance")
    print(f"Retrieved key: {val}")

    print("2. Queuing report generation job...")
    queue = client.queue("reports")
    job = queue.add("monthly-summary", {"month": "October", "year": 2026}, priority=10)
    print(f"Enqueued job: {job['id']}")

    print("3. Claiming job as worker...")
    claimed = queue.fetch_next("py-worker-demo", lease_ms=10000)
    if claimed:
        print(f"Worker claimed job: {claimed['name']}")
        queue.ack(claimed["id"], "py-worker-demo", claimed["fencingToken"])
        print("Worker acknowledged job completed.")

    client.close()
    print("Python example complete.")

if __name__ == "__main__":
    main()
