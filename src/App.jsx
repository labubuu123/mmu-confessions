import React, { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import Feed from "./components/Feed";
import AdminPanel from "./components/AdminPanel";
import TopConfessions from "./components/TopConfessions";
import Header from "./components/Header";
import PostModal from "./components/PostModal";
import PolicyPage from "./components/PolicyPage";

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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/post-direct/:id" element={<PostModalWrapper />} />
      </Routes>
    </div>
  );
}

function PostModalWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <PostModal postId={id} onClose={() => navigate("/")} />;
}

export default App;