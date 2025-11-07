const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function verifyAdmin(accessToken) {
    if (!accessToken) return null;
    try {
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
    } catch (err) {
        return null;
    }
}

exports.handler = async function(event) {
    try {
        if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Only POST' };
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (!match) return { statusCode: 401, body: 'Missing token' };
        
        const adminUid = await verifyAdmin(match[1]);
        if (!adminUid) return { statusCode: 403, body: 'Not admin' };

        const body = JSON.parse(event.body || '{}');
        const { action, postId } = body;
        if (!action || !postId) return { statusCode: 400, body: 'Missing data' };

        const url = `${SUPABASE_URL}/rest/v1/confessions?id=eq.${postId}`;
        
        if (action === 'delete') {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            });
            if (!res.ok) return { statusCode: 500, body: 'Delete failed' };
            return { statusCode: 200, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'report') {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reported: true })
            });
            if (!res.ok) return { statusCode: 500, body: 'Report failed' };
            return { statusCode: 200, body: JSON.stringify({ ok: true }) };
        }

        return { statusCode: 400, body: 'Unknown action' };
    } catch (err) {
        return { statusCode: 500, body: err.message };
    }
};