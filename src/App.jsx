import React, { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate, Link } from "react-router-dom";
import Feed from "./components/Feed";
import AdminPanel from "./components/AdminPanel";
import TopConfessions from "./components/TopConfessions";
import Header from "./components/Header";
import PostModal from "./components/PostModal";
import PolicyPage from "./components/PolicyPage";
import SearchPage from "./components/SearchPage";
import UserAnalytics from "./components/UserAnalytics";
import ToolsPage from "./components/ToolsPage";
import AboutUs from "./components/AboutUs";
import { NotificationProvider } from "./components/NotificationSystem";
import FloatingActionMenu from "./components/FloatingActionMenu";
import { supabase } from "./lib/supabaseClient";
import Matchmaker from './components/matchmaker/Matchmaker';
import Marketplace from "./components/Marketplace";
import { Megaphone, X } from "lucide-react";

function App() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    return 'dark';
  });

  const [onlineCount, setOnlineCount] = useState(0);
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('reply-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, (payload) => {
        const newComment = payload.new;
        const myPostsRaw = localStorage.getItem('my_posts');
        const myAnonId = localStorage.getItem('anonId');

        if (!myPostsRaw || !myAnonId) return;

        const myPosts = JSON.parse(myPostsRaw);
        const isMyPost = myPosts.some(id => String(id) === String(newComment.post_id));
        const isNotMe = String(newComment.author_id) !== String(myAnonId);

        if (isMyPost && isNotMe) {
          if (Notification.permission === 'granted') {
            const n = new Notification('New Reply! 💬', {
              body: newComment.text ? `Someone said: "${newComment.text.substring(0, 50)}..."` : 'Someone replied to your confession.',
              icon: '/favicon.svg',
              tag: `reply-${newComment.post_id}`
            });
            n.onclick = () => {
              window.focus();
              navigate(`/post/${newComment.post_id}`);
            };
          }
        }
      })
    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAnnouncement(data);
      } else {
        setAnnouncement(null);
      }
    };

    fetchAnnouncement();

    const channel = supabase.channel('public-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncement();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        <div className="sticky top-0 z-50 flex flex-col w-full">
          {announcement && (
            <div className={`px-4 py-3 text-sm font-medium flex items-center justify-between shadow-sm transition-colors ${announcement.type === 'alert' ? 'bg-red-600 text-white' :
              announcement.type === 'success' ? 'bg-green-600 text-white' :
                'bg-indigo-600 text-white'
              }`}>
              <div className="flex items-center gap-3 mx-auto max-w-5xl w-full overflow-hidden">
                <Megaphone className="w-5 h-5 shrink-0 animate-pulse z-10 relative" />
                <div className="flex-1 overflow-hidden relative">
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
                  <div className="animate-marquee whitespace-nowrap">
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
            </div>
          )}
          <Header theme={theme} setTheme={setTheme} onlineCount={onlineCount} />
        </div>

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
          <Route path="/matchmaker" element={<Matchmaker />} />
          <Route path="/marketplace" element={<Marketplace />} />
        </Routes>

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