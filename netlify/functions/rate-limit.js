const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args));
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 你的 Supabase REST API URL
const ACTIONS_LOG_URL = `${SUPABASE_URL}/rest/v1/actions_log`;

// 规则：{ 窗口 (毫秒), 最大请求数 }
const RULES = {
    post: { windowMs: 60_000, max: 5 },     // 1 分钟最多 5 篇
    comment: { windowMs: 60_000, max: 20 }, // 1 分钟最多 20 条评论
    reaction: { windowMs: 10_000, max: 50 }, // 10 秒最多 50 个反应
    generic: { windowMs: 10_000, max: 100 }
};

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Only POST' };

    const ip = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
    if (ip === 'unknown') return { statusCode: 400, body: 'IP not found' };

    try {
        let type = "generic";
        try {
            const body = JSON.parse(event.body || "{}");
            if (body.action === 'comment') type = 'comment';
            else if (body.action === 'react') type = 'reaction';
            else if (body.action === 'post') type = 'post';
        } catch (_) {}

        const { windowMs, max } = RULES[type] || RULES.generic;

        // 1. 检查此 IP 在时间窗口内的请求次数
        const windowStart = new Date(Date.now() - windowMs).toISOString();
        
        // 使用 REST API 查询 (count)
        // (注意：`gte` = "大于或等于")
        const checkUrl = `${ACTIONS_LOG_URL}?ip=eq.${ip}&action=eq.${type}&created_at=gte.${windowStart}&select=count`;
        
        const checkRes = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Accept': 'application/vnd.pgrst.object+json' // 只返回单个对象
            }
        });

        if (!checkRes.ok) throw new Error(`Supabase check failed: ${await checkRes.text()}`);
        
        const { count } = await checkRes.json();
        
        if (count >= max) {
            console.warn(`Rate limit hit for ${ip} (${type})`);
            return {
                statusCode: 429,
                body: JSON.stringify({ ok: false, reason: `You're doing too much (${type}) — please wait` })
            };
        }

        // 2. 如果未超限，记录本次请求
        const logRes = await fetch(ACTIONS_LOG_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal' // 不返回 body，节省流量
            },
            body: JSON.stringify({ ip, action }) // 'action' 变量来自 body parse
        });

        if (!logRes.ok) throw new Error(`Supabase log failed: ${await logRes.text()}`);
        
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };

    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ ok: false, reason: err.message }) };
    }
};