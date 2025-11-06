import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CommentSection({ postId }) {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState("");

    useEffect(() => {
    fetchComments();
    }, []);

    async function fetchComments() {
    const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
    if (!error) setComments(data || []);
    }

    async function handleSubmit(e) {
    e.preventDefault();
    const { error } = await supabase
        .from("comments")
        .insert([{ post_id: postId, text }]);
    if (!error) {
        setText("");
        fetchComments();
    }
    }

    return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
        <ul className="space-y-2 mb-2">
        {comments.map((c) => (
            <li key={c.id} className="text-sm dark:text-gray-300">
            {c.text}
            </li>
        ))}
        </ul>
        <form onSubmit={handleSubmit} className="flex gap-2">
        <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            required
        />
        <button
            type="submit"
            className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700"
        >
            Send
        </button>
        </form>
    </div>
    );
}
