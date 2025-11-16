import React from 'react';
import { Sparkles, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SeriesIndicator({ post }) {
    const navigate = useNavigate();

    if (!post.series_id) return null;

    const handleNavigate = async (direction) => {
        alert(`Navigate to ${direction} part - Feature coming soon!`);
    };

    return (
        <div className="mt-3 p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                        Series: {post.series_name || 'Untitled Series'}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 rounded-full">
                        Part {post.series_part} of {post.series_total || '?'}
                    </span>
                </div>
                <div className="flex gap-2">
                    {post.series_part > 1 && (
                        <button
                            onClick={() => handleNavigate('prev')}
                            className="text-xs px-3 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition flex items-center gap-1"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Previous
                        </button>
                    )}
                    {post.series_part < post.series_total && (
                        <button
                            onClick={() => handleNavigate('next')}
                            className="text-xs px-3 py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition flex items-center gap-1"
                        >
                            Next
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
            {post.series_description && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {post.series_description}
                </p>
            )}
        </div>
    );
}