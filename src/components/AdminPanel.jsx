import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminPanel() {
    const [posts, setPosts] = useState([]);

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

    async function handleDelete(id) {
    await supabase.from("confessions").delete().eq("id", id);
    fetchPosts();
    }

    return (
    <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        {posts.map((p) => (
        <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 flex justify-between items-center">
            <p className="truncate max-w-[70%]">{p.content}</p>
            <button
            onClick={() => handleDelete(p.id)}
            className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
            >
            Delete
            </button>
        </div>
        ))}
    </div>
    );
}
