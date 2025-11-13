import React, { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import Feed from "./components/Feed";
import AdminPanel from "./components/AdminPanel";
import TopConfessions from "./components/TopConfessions";
import Header from "./components/Header";
import PostModal from "./components/PostModal";
import PolicyPage from "./components/PolicyPage";
import SearchPage from "./components/SearchPage";
import UserAnalytics from "./components/UserAnalytics";
import { NotificationProvider } from "./components/NotificationSystem";
import { supabase } from "./lib/supabaseClient";

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const userPresenceKey = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userPresenceKey,
        },
      },
    });

    channel.on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState();
      const count = Object.keys(newState).length;
      setOnlineCount(count);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Header theme={theme} setTheme={setTheme} onlineCount={onlineCount} />
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:id" element={<Feed />} />
          <Route path="/top" element={<TopConfessions />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/analytics" element={<UserAnalytics />} />
          <Route path="/post-direct/:id" element={<PostModalWrapper />} />
        </Routes>

        <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Made by MMU Students
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Share Responsibly • Respect Privacy • Be Kind
              </p>
            </div>
          </div>
        </footer>
      </div>
    </NotificationProvider>
  );
}

function PostModalWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <PostModal postId={id} onClose={() => navigate("/")} />;
}

export default App;