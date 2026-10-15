import dev.nexora.NexoraClient;

public class Example {
    public static void main(String[] args) throws Exception {
        System.out.println("Connecting to Nexora from Java Example...");
        try (var client = new NexoraClient("127.0.0.1", 6380, null)) {
            client.connect();
            System.out.println("Ping: " + client.ping());
            client.set("java:user", "Duke", 60000L);
            System.out.println("Retrieved: " + client.get("java:user"));
        }
    }
}
