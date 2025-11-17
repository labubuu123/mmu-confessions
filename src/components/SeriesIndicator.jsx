import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function SeriesIndicator({ post }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [seriesParts, setSeriesParts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (post.series_id) {
            fetchSeriesParts();
        }
    }, [post.series_id]);

    async function fetchSeriesParts() {
        try {
            const { data, error } = await supabase
                .from('confessions')
                .select('id, series_part, series_name, created_at')
                .eq('series_id', post.series_id)
                .eq('approved', true)
                .order('series_part', { ascending: true });

            if (error) throw error;

            setSeriesParts(data || []);
        } catch (err) {
            console.error('Error fetching series parts:', err);
            setError('Failed to load series parts');
        }
    }

    const handleNavigate = async (direction) => {
        setLoading(true);
        setError(null);

        try {
            const targetPart = direction === 'prev' ? post.series_part - 1 : post.series_part + 1;
            const targetPost = seriesParts.find(p => p.series_part === targetPart);

            if (targetPost) {
                navigate(`/post/${targetPost.id}`);
            } else {
                const { data, error } = await supabase
                    .from('confessions')
                    .select('id')
                    .eq('series_id', post.series_id)
                    .eq('series_part', targetPart)
                    .eq('approved', true)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        setError(`Part ${targetPart} not found. It may not be posted yet.`);
                    } else {
                        throw error;
                    }
                } else if (data) {
                    navigate(`/post/${data.id}`);
                }
            }
        } catch (err) {
            console.error('Navigation error:', err);
            setError('Failed to navigate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!post.series_id) return null;

    const hasPrev = post.series_part > 1;
    const hasNext = post.series_part < (post.series_total || Infinity);

    return (
        <div className="mt-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-purple-900 dark:text-purple-200 truncate">
                                📖 {post.series_name || 'Untitled Series'}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full font-medium whitespace-nowrap">
                                Part {post.series_part} of {post.series_total || '?'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {hasPrev && (
                        <button
                            onClick={() => handleNavigate('prev')}
                            disabled={loading}
                            className="flex-1 sm:flex-initial text-xs px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-all flex items-center justify-center gap-1 border border-purple-200 dark:border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <ChevronLeft className="w-3 h-3" />
                            )}
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </button>
                    )}

                    {hasNext && (
                        <button
                            onClick={() => handleNavigate('next')}
                            disabled={loading}
                            className="flex-1 sm:flex-initial text-xs px-3 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-all flex items-center justify-center gap-1 border border-purple-200 dark:border-purple-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            {loading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {seriesParts.length > 1 && (
                <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                        All Parts ({seriesParts.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {seriesParts.map((part) => (
                            <button
                                key={part.id}
                                onClick={() => navigate(`/post/${part.id}`)}
                                disabled={part.id === post.id}
                                className={`px-2 py-1 text-xs rounded transition ${part.id === post.id
                                    ? 'bg-purple-600 text-white font-bold cursor-default'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                    }`}
                            >
                                {part.series_part}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}