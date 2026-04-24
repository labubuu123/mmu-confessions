import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

webpush.setVapidDetails(
  'mailto:admin@mmuconfessions.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { table, record } = payload;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let targetUserId = null;
    let title = "MMU Confessions";
    let body = "You have a new notification.";
    let url = "/";
    let tag = "general";

    if (table === 'whisper_messages') {
      targetUserId = record.receiver_id;
      title = "New Whisper 🤫";
      body = record.content ? `${record.content.substring(0, 40)}...` : "Someone sent you a secret message.";
      url = `/whisper?chat=${record.sender_id}`;
      tag = `whisper-${record.sender_id}`;
    }
    
    else if (table === 'matchmaker_matches') {
      targetUserId = record.matched_user_id;
      title = "It's a Match! 💘";
      body = "Someone matched with your profile in the Matchmaker.";
      url = `/matchmaker/connections`;
      tag = "new-match";
    }

    else if (table === 'comments') {
      const { data: post } = await supabase
        .from('confessions')
        .select('author_id')
        .eq('id', record.post_id)
        .single();
        
      if (post && post.author_id !== record.user_id) {
        targetUserId = post.author_id;
        title = "New Reply 💬";
        body = "Someone replied to your confession.";
        url = `/post/${record.post_id}`;
        tag = `comment-${record.post_id}`;
      }
    }

    else if (table === 'marketplace_offers') {
      targetUserId = record.seller_id;
      title = "New Offer on Marketplace 🛒";
      body = `Someone is interested in your item!`;
      url = `/marketplace/item/${record.item_id}`;
      tag = `offer-${record.item_id}`;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ message: 'Ignored: No target user identified' }), { headers: corsHeaders });
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'User has no active subscriptions' }), { headers: corsHeaders });
    }

    const SITE_URL = 'https://mmuconfessions.fun';

    const pushPayload = JSON.stringify({
      title: title,
      body: body,
      url: `${SITE_URL}${url}`,
      tag: tag
    });

    const promises = subscriptions.map((sub) => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        pushPayload
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true, notified: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});