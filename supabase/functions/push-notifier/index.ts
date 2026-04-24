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

    if (table === 'confessions') {
      title = 'New Confession! 📢';
      body = record.text ? `${record.text.substring(0, 50)}...` : 'Someone posted a new confession.';
      url = `/post/${record.id}`;
      tag = `confession-${record.id}`;
    }
    
    else if (table === 'whisper_messages') {
      title = `New message in ${record.room_tag} 🤫`;
      body = record.content ? `${record.author_name}: ${record.content.substring(0, 40)}...` : `Someone wrote a message in ${record.room_tag}`;
      url = `/whisper?room=${encodeURIComponent(record.room_tag)}`;
      tag = `whisper-${record.room_tag}`;
      
      if (record.reply_to_id) {
        const { data: origMsg } = await supabase.from('whisper_messages').select('author_id').eq('id', record.reply_to_id).single();
        if (origMsg && origMsg.author_id && origMsg.author_id !== record.author_id) {
            targetUserId = origMsg.author_id;
            title = `New Reply in ${record.room_tag} 💬`;
        }
      }
    }

    else if (table === 'whisper_dm_messages') {
      const { data: thread } = await supabase.from('whisper_dm_threads').select('user1_id, user2_id').eq('id', record.thread_id).single();
      if (thread) {
          targetUserId = thread.user1_id === record.sender_id ? thread.user2_id : thread.user1_id;
      }
      title = `Private Whisper from ${record.sender_name} 🤫`;
      body = record.content ? `${record.content.substring(0, 40)}...` : 'Sent you a private message.';
      url = `/whisper`;
      tag = `dm-${record.thread_id}`;
    }

    else if (table === 'comments') {
      const { data: post } = await supabase.from('confessions').select('author_id').eq('id', record.post_id).single();
      if (post && post.author_id !== record.author_id) {
        targetUserId = post.author_id;
        title = "New Reply on your Confession 💬";
        body = record.text ? `${record.text.substring(0, 40)}...` : "Someone replied to your post.";
        url = `/post/${record.post_id}`;
        tag = `comment-${record.post_id}`;
      } else {
        return new Response(JSON.stringify({ message: 'Ignored: Comment on own post' }), { headers: corsHeaders });
      }
    }

    else if (table === 'matchmaker_matches') {
      targetUserId = record.user2_id;
      title = "It's a Match! 💘";
      body = "Someone matched with your profile in the Matchmaker.";
      url = `/matchmaker/connections`;
      tag = "new-match";
    }

    else {
      return new Response(JSON.stringify({ message: 'Table not supported by push-notifier' }), { headers: corsHeaders });
    }

    let query = supabase.from('push_subscriptions').select('*');
    
    if (targetUserId) {
        query = query.eq('user_id', targetUserId);
    }

    const { data: subscriptions } = await query;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No active subscribers found for this target' }), { headers: corsHeaders });
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