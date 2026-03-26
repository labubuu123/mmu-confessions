import React, { useEffect, useState, lazy, Suspense } from "react";
import { Routes, Route, useParams, useNavigate, Link } from "react-router-dom";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Header from "./components/Header";
import FloatingActionMenu from "./components/FloatingActionMenu";
import PostModal from "./components/PostModal";
import { NotificationProvider } from "./components/NotificationSystem";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { supabase } from "./lib/supabaseClient";
import ReloadPrompt from "./components/ReloadPrompt";

const Feed = lazy(() => import("./components/Feed"));
const TopConfessions = lazy(() => import("./components/TopConfessions"));
const PolicyPage = lazy(() => import("./components/PolicyPage"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const UserAnalytics = lazy(() => import("./components/UserAnalytics"));
const ToolsPage = lazy(() => import("./components/ToolsPage"));
const AboutUs = lazy(() => import("./components/AboutUs"));
const Matchmaker = lazy(() => import('./components/matchmaker/Matchmaker'));
const Marketplace = lazy(() => import("./components/Marketplace"));
const AdultSection = lazy(() => import("./components/adult/AdultSection"));
const KarmaShop = lazy(() => import("./components/KarmaShop"));
const WhisperChat = lazy(() => import("./components/WhisperChat"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AppContent = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || 'dark');
  const [onlineCount, setOnlineCount] = useState(0);
  const [announcement, setAnnouncement] = useState(null);

  useRealtimeNotifications();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setAnnouncement(data || null);
    };

    fetchAnnouncement();
    const channel = supabase.channel('public-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchAnnouncement)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const userPresenceKey = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel('online-users', {
      config: { presence: { key: userPresenceKey } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      setOnlineCount(Object.keys(channel.presenceState()).length);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });
    return () => { channel.untrack(); supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-50 flex flex-col w-full">
        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-4 py-3 text-sm font-medium flex items-center justify-between shadow-sm transition-colors ${announcement.type === 'alert' ? 'bg-red-600 text-white' :
                announcement.type === 'success' ? 'bg-green-600 text-white' :
                  'bg-indigo-600 text-white'
                }`}
            >
              <div className="flex items-center gap-3 mx-auto max-w-5xl w-full overflow-hidden">
                <Megaphone className="w-5 h-5 shrink-0 animate-pulse z-10 relative" />
                <div className="flex-1 overflow-hidden relative h-5">
                  <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-100%); }
                    }
                    .animate-marquee {
                        display: inline-block;
                        padding-left: 100%;
                        animation: marquee 20s linear infinite;
                    }
                  `}</style>
                  <div className="animate-marquee whitespace-nowrap absolute">
                    <span className="font-bold mr-2 text-sm opacity-90 tracking-wider">{announcement.title}:</span>
                    <span>{announcement.content}</span>
                  </div>
                </div>
                <button
                  onClick={() => setAnnouncement(null)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors z-10 relative"
                  aria-label="Close announcement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Header theme={theme} setTheme={setTheme} onlineCount={onlineCount} />
      </header>

      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/post/:id" element={<Feed />} />
            <Route path="/top" element={<TopConfessions />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/analytics" element={<UserAnalytics />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/post-direct/:id" element={<PostModalWrapper />} />
            <Route path="/matchmaker/*" element={<Matchmaker />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/adult/*" element={<AdultSection />} />
            <Route path="/karma-shop" element={<KarmaShop />} />
            <Route path="/whisper" element={<WhisperChat />} />
          </Routes>
        </Suspense>
      </main>

      <FloatingActionMenu />

      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Made by MMU Students
            </p>
            <div className="flex justify-center space-x-4 mb-4 text-sm">
              <Link to="/about" className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                About Us
              </Link>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <Link to="/policy" className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
                Privacy Policy
              </Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
              © {new Date().getFullYear()} Zyora Lab. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Share Responsibly • Respect Privacy • Be Kind
            </p>
          </div>
        </div>
      </footer>
      <ReloadPrompt />
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

function PostModalWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <PostModal postId={id} onClose={() => navigate("/")} />;
}

export default App;