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
    const { record } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscribers' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = JSON.stringify({
      title: 'New Confession! 📢',
      body: record.text ? `${record.text.substring(0, 50)}...` : 'Someone posted a new confession.',
      url: window.location.origin + `/post/${record.id}`,
      icon: '/favicon.svg'
    });

    const promises = subscriptions.map((sub) => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      });
    });

    await Promise.all(promises);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});