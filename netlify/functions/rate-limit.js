export async function handler(event) {
    const ip = event.headers["x-nf-client-connection-ip"] || "unknown";

    const store = globalThis.__rateLimitStore || new Map();
    globalThis.__rateLimitStore = store;

    const now = Date.now();
    const windowMs = 3 * 1000;
    const lastPost = store.get(ip);

    if (lastPost && now - lastPost < windowMs) {
    const secondsLeft = Math.ceil((windowMs - (now - lastPost)) / 1000);
    return {
        statusCode: 429,
        body: JSON.stringify({
        message: `Please wait ${secondsLeft}s before posting again.`,
        }),
    };
    }

    store.set(ip, now);
    return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
    };
}
