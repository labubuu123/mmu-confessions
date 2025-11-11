import React, { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import Feed from "./components/Feed";
import AdminPanel from "./components/AdminPanel";
import TopConfessions from "./components/TopConfessions";
import Header from "./components/Header";
import PostModal from "./components/PostModal";
import PolicyPage from "./components/PolicyPage";
import SearchPage from "./components/SearchPage";

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header theme={theme} setTheme={setTheme} />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/post/:id" element={<Feed />} />
        <Route path="/top" element={<TopConfessions />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/post-direct/:id" element={<PostModalWrapper />} />
      </Routes>

      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Made with ❤️ by MMU Students
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Share Responsibly • Respect Privacy • Be Kind
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PostModalWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <PostModal postId={id} onClose={() => navigate("/")} />;
}

export default App;