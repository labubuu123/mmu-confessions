export async function handler(event) {
    const { action, postId, secret } = JSON.parse(event.body);

    // Simple admin auth check (replace with environment variable later)
    if (secret !== process.env.ADMIN_SECRET) {
    return {
        statusCode: 403,
        body: JSON.stringify({ message: "Forbidden" }),
    };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    if (action === "delete") {
    await supabase.from("confessions").delete().eq("id", postId);
    }

    return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
    };
}