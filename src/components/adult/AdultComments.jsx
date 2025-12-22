import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Send, Ghost } from 'lucide-react';

const RANDOM_ALIASES = [
    'Night Owl 🦉', 'Lonely Wolf 🐺', 'Ghost 👻', 'Vampire 🧛',
    'Insomniac 🥱', 'Dreamer 🌙', 'Shadow 👥', 'Stranger 🎩',
    'Cat 🐈‍⬛', 'Bat 🦇'
];

export default function AdultComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        const { data } = await supabase
            .from('adult_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        setComments(data || []);
        setLoading(false);
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);

        const randomAlias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];

        const { error } = await supabase.from('adult_comments').insert({
            post_id: postId,
            text: newComment,
            author_id: anonId,
            author_alias: randomAlias
        });

        if (!error) {
            setNewComment("");
            fetchComments();
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-zinc-900/50 bg-black/20 -mx-6 px-6 pb-2">
            {loading ? <p className="text-xs text-zinc-600 py-2">Loading...</p> : (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {comments.length === 0 && (
                        <div className="text-center py-4">
                            <Ghost className="w-6 h-6 text-zinc-800 mx-auto mb-1" />
                            <p className="text-[10px] text-zinc-600">It's quiet in here...</p>
                        </div>
                    )}
                    {comments.map(c => (
                        <div key={c.id} className="group">
                            <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-300 transition-colors">
                                    {c.author_alias}
                                </span>
                                <span className="text-[9px] text-zinc-700">
                                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-zinc-300 text-sm leading-snug bg-zinc-900/50 p-2 rounded-r-lg rounded-bl-lg border border-zinc-800/50">
                                {c.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handlePostComment} className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                    <span className="text-xs">🤫</span>
                </div>
                <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Whisper a reply..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all placeholder-zinc-700"
                />
                <button type="submit" disabled={!newComment.trim()} className="p-2 text-zinc-500 hover:text-red-500 disabled:opacity-30 hover:bg-zinc-900 rounded-full transition-colors">
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}