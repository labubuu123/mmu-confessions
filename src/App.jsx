import React, { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import Feed from "./components/Feed";
import AdminPanel from "./components/AdminPanel";
import Header from "./components/Header";
import PostModal from "./components/PostModal";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <Header theme={theme} setTheme={setTheme} />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/post/:id" element={<PostModalWrapper />} />
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

