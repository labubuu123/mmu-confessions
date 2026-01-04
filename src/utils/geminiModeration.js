import { supabase } from '../lib/supabaseClient';

export async function checkContentSafety(text) {
  if (!text || text.trim().length === 0) {
    return { safe: false, reason: "Empty content" };
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-moderation', {
      body: { text: text }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      throw error;
    }

    return data;

  } catch (error) {
    console.error("Moderation Service Failed:", error);
    return {
      safe: false,
      reason: "Security check unavailable. Please try again.",
    };
  }
}