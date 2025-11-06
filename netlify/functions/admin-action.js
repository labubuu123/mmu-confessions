const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function verifyAdmin(accessToken) {
    if (!accessToken) return null;
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!userRes.ok) return null;
    const user = await userRes.json();
    const uid = user?.id;
    if (!uid) return null;
    const adminsRes = await fetch(`${SUPABASE_URL}/rest/v1/admins?id=eq.${uid}&select=id`, {
    method: 'GET',
    headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
    });
    if (!adminsRes.ok) return null;
    const data = await adminsRes.json();
    return Array.isArray(data) && data.length > 0 ? uid : null;
    }

    exports.handler = async function(event) {
    try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Only POST' };
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return { statusCode: 401, body: 'Missing Bearer token' };
    const accessToken = match[1];
    const adminUid = await verifyAdmin(accessToken);
    if (!adminUid) return { statusCode: 403, body: 'Forbidden' };

    const body = JSON.parse(event.body || '{}');
    const { action, postId } = body;
    if (!action || !postId) return { statusCode: 400, body: 'Missing action or postId' };

    if (action === 'delete') {
        const url = `${SUPABASE_URL}/rest/v1/confessions?id=eq.${postId}`;
        const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: 'return=representation'
        }
        });
        if (!res.ok) return { statusCode: 500, body: `Failed to delete: ${await res.text()}` };
        const json = await res.json();
        return { statusCode: 200, body: JSON.stringify({ ok: true, rows: json }) };
    }

    if (action === 'report') {
        const url = `${SUPABASE_URL}/rest/v1/confessions?id=eq.${postId}`;
        const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
        },
        body: JSON.stringify({ reported: true })
        });
        if (!res.ok) return { statusCode: 500, body: `Failed to report: ${await res.text()}` };
        const json = await res.json();
        return { statusCode: 200, body: JSON.stringify({ ok: true, rows: json }) };
    }

    return { statusCode: 400, body: 'Unknown action' };
    } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
    }
}
