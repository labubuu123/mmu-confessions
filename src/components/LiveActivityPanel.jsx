import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, ExternalLink, Clock, MessageCircle } from 'lucide-react';

export default function LiveActivityPanel({ onClose }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const listRef = useRef(null);

    useEffect(() => {
        fetchInitialActivity();

        const channel = supabase
            .channel('public:global_comments')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments' },
                (payload) => handleNewComment(payload.new)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchInitialActivity() {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    text,
                    author_name,
                    created_at,
                    post_id,
                    confessions (
                        id,
                        text,
                        approved
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const validActivities = data.filter(item => item.confessions && item.confessions.approved);
            setActivities(validActivities);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleNewComment(newComment) {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                confessions (
                    id,
                    text,
                    approved
                )
            `)
            .eq('id', newComment.id)
            .single();

        if (!error && data && data.confessions?.approved) {
            setActivities(prev => [data, ...prev].slice(0, 50));
        }
    }

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now - date) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end sm:p-6 pointer-events-none">
            <div
                className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
                onClick={onClose}
            />

            <div className="pointer-events-auto relative w-full sm:w-96 h-[85vh] sm:h-[600px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 fade-in duration-300">

                <div className="sm:hidden absolute top-2 left-0 right-0 flex justify-center z-10 pointer-events-none">
                    <div className="w-12 h-1.5 bg-white/40 rounded-full shadow-sm backdrop-blur-md"></div>
                </div>

                <div className="p-4 pt-6 sm:pt-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shrink-0 shadow-md z-0">
                    <div className="flex items-center gap-2 text-white">
                        <MessageCircle className="w-5 h-5 animate-pulse" />
                        <div>
                            <h3 className="font-bold text-sm">Live Comments</h3>
                            <p className="text-xs text-indigo-100">Real-time discussions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-0 scroll-smooth" ref={listRef}>
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-40">
                            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
                            <p className="text-sm">Loading updates...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-6">
                            <MessageCircle className="w-12 h-12 opacity-20 mb-3" />
                            <p className="text-sm font-medium">No recent comments.</p>
                            <p className="text-xs opacity-70">Be the first to say something!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {activities.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        navigate(`/post/${item.post_id}`);
                                        if (window.innerWidth < 640) onClose();
                                    }}
                                    className="p-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition cursor-pointer group active:bg-indigo-100 dark:active:bg-indigo-900/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-1">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[60%]">
                                                    {item.author_name || 'Anonymous'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700 shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(item.created_at)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 leading-relaxed">
                                                "{item.text}"
                                            </p>

                                            <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 transition">
                                                <span className="truncate font-medium">
                                                    on: <span className="italic font-normal">{item.confessions?.text?.substring(0, 50)}...</span>
                                                </span>
                                                <ExternalLink className="w-3 h-3 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}