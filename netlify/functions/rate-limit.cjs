const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ACTIONS_LOG_URL = `${SUPABASE_URL}/rest/v1/actions_log`;

const RULES = {
    post: { windowMs: 60_000, max: 3 },
    comment: { windowMs: 30_000, max: 10 },
    reaction: { windowMs: 10_000, max: 30 }
};

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Only POST' };
    const ip = event.headers["x-nf-client-connection-ip"] || "unknown";
    if (ip === 'unknown') return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    try {
        const body = JSON.parse(event.body || "{}");
        let type = "reaction";
        if (body.action === 'comment') type = 'comment';
        else if (body.action === 'post') type = 'post';

        const { windowMs, max } = RULES[type];
        const windowStart = new Date(Date.now() - windowMs).toISOString();
        const checkUrl = `${ACTIONS_LOG_URL}?ip=eq.${ip}&action=eq.${type}&created_at=gte.${windowStart}&select=count`;
        
        const checkRes = await fetch(checkUrl, {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Prefer': 'count=exact'
            }
        });

        const count = parseInt(checkRes.headers.get('content-range')?.split('/')[1] || '0');
        if (count >= max) {
            return { statusCode: 429, body: JSON.stringify({ ok: false, reason: `Please slow down` }) };
        }

        await fetch(ACTIONS_LOG_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ip, action: type })
        });
        
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (err) {
        console.error(err);
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
};