// import React, { useEffect, useState } from 'react';
// import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
// import Feed from './components/Feed';
// import AdminPanel from './components/AdminPanel';
// import TopConfessions from './components/TopConfessions';
// import Header from './components/Header';
// import PostModal from './components/PostModal';
// import PolicyPage from './components/PolicyPage';
// import SearchPage from './components/SearchPage';
// import UserAnalytics from './components/UserAnalytics';
// import Matchmaker from './components/matchmaker/Matchmaker';
// import { NotificationProvider } from './components/NotificationSystem';
// import { supabase } from './lib/supabaseClient';

// function MatchmakerButton() {
//   const navigate = useNavigate();
//   const goToMatchmaker = () => {
//     navigate('/matchmaker');
//   };

//   return (
//     <button
//       onClick={goToMatchmaker}
//       className="fixed bottom-4 right-4 z-50 w-14 h-14 flex items-center justify-center text-3xl bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
//       aria-label="Find Love"
//     >
//       💑
//     </button>
//   );
// }

// function App() {
//   const [theme, setTheme] = useState(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) return savedTheme;
//     return 'dark';
//   });

//   const [onlineCount, setOnlineCount] = useState(0);

//   useEffect(() => {
//     document.documentElement.classList.toggle('dark', theme === 'dark');
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   useEffect(() => {
//     const userPresenceKey = `user-${Date.now()}-${Math.random()
//       .toString(36)
//       .substring(7)}`;

//     const channel = supabase.channel('online-users', {
//       config: {
//         presence: {
//           key: userPresenceKey,
//         },
//       },
//     });

//     channel.on('presence', { event: 'sync' }, () => {
//       const newState = channel.presenceState();
//       const count = Object.keys(newState).length;
//       setOnlineCount(count);
//     });

//     channel.subscribe(async (status) => {
//       if (status === 'SUBSCRIBED') {
//         await channel.track({ online_at: new Date().toISOString() });
//       }
//     });

//     return () => {
//       channel.untrack();
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   return (
//     <NotificationProvider>
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
//         <Header theme={theme} setTheme={setTheme} onlineCount={onlineCount} />
//         <Routes>
//           <Route path="/" element={<Feed />} />
//           <Route path="/post/:id" element={<Feed />} />
//           <Route path="/top" element={<TopConfessions />} />
//           <Route path="/search" element={<SearchPage />} />
//           <Route path="/admin" element={<AdminPanel />} />
//           <Route path="/policy" element={<PolicyPage />} />
//           <Route path="/analytics" element={<UserAnalytics />} />
//           <Route path="/post-direct/:id" element={<PostModalWrapper />} />
//           <Route path="/matchmaker" element={<Matchmaker />} />
//         </Routes>

//         <MatchmakerButton />

//         <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
//           <div className="max-w-5xl mx-auto px-4">
//             <div className="text-center">
//               <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
//                 Made by MMU Students
//               </p>

//               <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
//                 © {new Date().getFullYear()} Zyora Lab. All rights reserved.
//               </p>

//               <p className="text-xs text-gray-400 dark:text-gray-500">
//                 Share Responsibly • Respect Privacy • Be Kind
//               </p>
//             </div>
//           </div>
//         </footer>
//       </div>
//     </NotificationProvider>
//   );
// }

// function PostModalWrapper() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   return <PostModal postId={id} onClose={() => navigate('/')} />;
// }

// export default App;






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

function MatchmakerButton() {
  const showMessage = () => {
    alert(
      "传说中的「月老功能」即将上线, 为你的缘分牵线搭桥! 准备好迎接命中注定的邂逅了吗? 敬请期待 ❤️\n\nThe legendary “Matchmaker Feature” is about to go live, ready to connect the threads of your destiny! Are you prepared for a fated encounter? Stay tuned ❤️"
    );
  };

  return (
    <button
      onClick={showMessage}
      className="fixed bottom-4 right-4 z-50 w-14 h-14 flex items-center justify-center text-xl bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label="查看月老功能预告"
    >
      ❤️
    </button>
  );
}

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
      {/* */}
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

        <MatchmakerButton />

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