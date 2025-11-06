import React, { useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import CommentSection from "./CommentSection";

export default function PostCard({ post }) {
    const [likes, setLikes] = useState(post.likes || 0);
    const [showComments, setShowComments] = useState(false);

    return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow mb-6 p-4">
        <p className="whitespace-pre-wrap mb-3">{post.content}</p>

        {post.media_url && (
        <div className="mb-3">
            {post.media_url.endsWith(".mp4") ? (
            <video controls className="rounded-xl w-full">
                <source src={post.media_url} type="video/mp4" />
            </video>
            ) : (
            <img
                src={post.media_url}
                loading="lazy"
                alt="confession media"
                className="rounded-xl w-full object-cover"
            />
            )}
        </div>
        )}

        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
        <div className="flex gap-6">
            <button onClick={() => setLikes((n) => n + 1)} className="flex items-center gap-1 hover:text-red-500">
            <Heart size={18} /> {likes}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 hover:text-blue-500">
            <MessageCircle size={18} /> Comments
            </button>
        </div>
        <button
            onClick={() => navigator.share && navigator.share({ text: post.content, url: window.location.href })}
            className="flex items-center gap-1 hover:text-green-500"
        >
            <Share2 size={18} /> Share
        </button>
        </div>

        {showComments && <CommentSection postId={post.id} />}
    </div>
    );
}
