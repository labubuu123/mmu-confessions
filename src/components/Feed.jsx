import React, { useState, useEffect } from "react";
import PostCard from "./PostCard";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";

export default function Feed() {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
    fetchPosts();
    }, []);

    async function fetchPosts() {
    const { data, error } = await supabase
        .from("confessions")
        .select("*")
        .order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
    }

    async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    let mediaUrl = null;
    if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);
        if (!uploadError) {
        mediaUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
        }
    }

    const { error } = await supabase
        .from("confessions")
        .insert([{ content, media_url: mediaUrl }]);

    setLoading(false);
    setContent("");
    setFile(null);
    fetchPosts();
    }

    return (
    <div className="max-w-2xl mx-auto py-8">
        <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-8"
        >
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your confession anonymously..."
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            rows={3}
            required
        />
        <div className="flex justify-between mt-3">
            <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setFile(e.target.files[0])}
            />
            <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
            {loading ? "Posting..." : "Post"}
            </button>
        </div>
        </form>

        {posts.map((post) => (
        <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <PostCard post={post} />
        </motion.div>
        ))}
    </div>
    );
}
