import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Send, Ghost, UserCircle2 } from 'lucide-react';

const RANDOM_ALIASES = [
    'Night Owl 🦉', 'Lonely Wolf 🐺', 'Ghost 👻', 'Vampire 🧛',
    'Insomniac 🥱', 'Dreamer 🌙', 'Shadow 👥', 'Stranger 🎩',
    'Cat 🐈‍⬛', 'Bat 🦇', 'Demon 😈', 'Angel 👼'
];

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "now";
};

export default function AdultComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [myAlias, setMyAlias] = useState("");

    useEffect(() => {
        fetchComments();
        let storedAlias = sessionStorage.getItem('session_alias');
        if (!storedAlias) {
            storedAlias = RANDOM_ALIASES[Math.floor(Math.random() * RANDOM_ALIASES.length)];
            sessionStorage.setItem('session_alias', storedAlias);
        }
        setMyAlias(storedAlias);
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

        const tempComment = {
            id: Date.now(),
            text: newComment,
            author_alias: myAlias,
            created_at: new Date().toISOString()
        };
        setComments([...comments, tempComment]);
        setNewComment("");

        const { error } = await supabase.from('adult_comments').insert({
            post_id: postId,
            text: tempComment.text,
            author_id: anonId,
            author_alias: myAlias
        });

        if (!error) {
            fetchComments();
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-800 bg-black/20 -mx-6 px-6 pb-2">
            {loading ? (
                <div className="py-4 space-y-2">
                    <div className="h-4 w-1/3 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse"></div>
                </div>
            ) : (
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {comments.length === 0 && (
                        <div className="text-center py-6 flex flex-col items-center opacity-50">
                            <Ghost className="w-5 h-5 text-slate-600 mb-2" />
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">No whispers yet</p>
                        </div>
                    )}
                    {comments.map(c => (
                        <div key={c.id} className="group animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-baseline gap-2 mb-1 pl-1">
                                <span className={`text-[11px] font-bold transition-colors ${c.author_alias === myAlias ? 'text-rose-400' : 'text-slate-500'}`}>
                                    {c.author_alias}
                                </span>
                                <span className="text-[9px] text-slate-600 font-mono">
                                    {timeAgo(c.created_at)}
                                </span>
                            </div>
                            <p className="text-slate-300 text-sm leading-snug bg-slate-950 p-2.5 rounded-2xl rounded-tl-sm border border-slate-800/50 shadow-sm">
                                {c.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handlePostComment} className="flex gap-2 items-end pt-2">
                <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shrink-0 text-slate-500 mb-1" title={`Posting as ${myAlias}`}>
                    <UserCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={`Reply as ${myAlias}...`}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-full px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:border-rose-900 focus:bg-slate-950 focus:ring-1 focus:ring-rose-900/50 transition-all placeholder-slate-600"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-1 top-1 p-1.5 text-white bg-rose-700 hover:bg-rose-600 disabled:bg-transparent disabled:text-slate-600 rounded-full transition-all"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}