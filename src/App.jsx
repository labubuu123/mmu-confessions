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
import FloatingActionMenu from "./components/FloatingActionMenu";
import { supabase } from "./lib/supabaseClient";
import Matchmaker from './components/matchmaker/Matchmaker';

const APP_VERSION = "1.0.1";

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    return 'dark';
  });

  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${new Date().getTime()}`);

        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;

        if (serverVersion !== APP_VERSION) {
          console.log(`New version found: ${serverVersion}. Reloading...`);

          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            } catch (err) {
              console.error("Error clearing cache", err);
            }
          }

          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to check version:", error);
      }
    };

    checkVersion();

    const interval = setInterval(checkVersion, 2 * 60 * 1000);
    const handleFocus = () => checkVersion();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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

    channel.on('broadcast', { event: 'force_refresh' }, () => {
      console.log("Force refresh signal received");
      window.location.reload();
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
          {/* <Route path="/matchmaker" element={<Matchmaker />} /> */}
        </Routes>

        <FloatingActionMenu />

        <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Made by MMU Students
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                © {new Date().getFullYear()} Zyora Lab. All rights reserved.
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