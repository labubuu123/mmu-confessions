export async function handler(event) {
    const ip = event.headers["x-nf-client-connection-ip"] || "unknown";

    // 1. Connect to a temporary in-memory store (simple rate-limit)
    const store = globalThis.__rateLimitStore || new Map();
    globalThis.__rateLimitStore = store;

    const now = Date.now();
    const windowMs = 30 * 1000; // 30 seconds
    const lastPost = store.get(ip);

    if (lastPost && now - lastPost < windowMs) {
    return {
        statusCode: 429,
        body: JSON.stringify({ message: "Please wait before posting again." }),
    };
    }

    store.set(ip, now);

    return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
    };
}
