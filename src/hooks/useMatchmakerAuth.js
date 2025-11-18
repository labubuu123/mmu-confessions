import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useMatchmakerAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matchmaker_profiles")
        .select("*")
        .eq("author_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  return { session, user, profile, loading, refreshProfile };
}
