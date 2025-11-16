import React, { useState, useEffect } from 'react';
import { Trophy, Heart, MessageCircle, Star, Crown, Medal } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AnonAvatar from './AnonAvatar';
import { BADGE_DEFINITIONS, calculateUserBadges } from '../utils/badges';

export default function Leaderboard() {
    const [timeframe, setTimeframe] = useState('month');
    const [category, setCategory] = useState('reactions');
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, [timeframe, category]);

    async function fetchLeaderboard() {
        setLoading(true);

        try {
            let dateFilter = null;
            const now = new Date();

            if (timeframe === 'week') {
                dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
            } else if (timeframe === 'month') {
                dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
            }

            let postsQuery = supabase
                .from('confessions')
                .select('author_id, likes_count, comments_count, created_at')
                .eq('approved', true);

            if (dateFilter) {
                postsQuery = postsQuery.gte('created_at', dateFilter);
            }

            const { data: posts } = await postsQuery;

            let commentsQuery = supabase
                .from('comments')
                .select('author_id, created_at, reactions')

            if (dateFilter) {
                commentsQuery = commentsQuery.gte('created_at', dateFilter);
            }

            const { data: comments } = await commentsQuery;
            const userStats = {};

            posts?.forEach(post => {
                if (!post.author_id) return;

                if (!userStats[post.author_id]) {
                    userStats[post.author_id] = {
                        userId: post.author_id,
                        posts: 0,
                        reactions: 0,
                        comments: 0,
                        totalPostComments: 0
                    };
                }

                userStats[post.author_id].posts++;
                userStats[post.author_id].reactions += (post.likes_count || 0);
                userStats[post.author_id].totalPostComments += (post.comments_count || 0);
            });

            comments?.forEach(comment => {
                if (!comment.author_id) return;

                if (!userStats[comment.author_id]) {
                    userStats[comment.author_id] = {
                        userId: comment.author_id,
                        posts: 0,
                        reactions: 0,
                        comments: 0,
                        totalPostComments: 0
                    };
                }

                userStats[comment.author_id].comments++;

                if (comment.reactions) {
                    const reactionCount = Object.values(comment.reactions).reduce((sum, count) => sum + count, 0);
                    userStats[comment.author_id].reactions += reactionCount;
                }
            });

            const sorted = Object.values(userStats).sort((a, b) => {
                if (category === 'reactions') {
                    return b.reactions - a.reactions;
                } else if (category === 'comments') {
                    return b.comments - a.comments;
                } else if (category === 'posts') {
                    return b.posts - a.posts;
                }
                return 0;
            });

            const withRanksAndBadges = sorted.slice(0, 20).map((user, index) => ({
                ...user,
                rank: index + 1,
                badges: calculateUserBadges({
                    posts: user.posts,
                    comments: user.comments,
                    total_reactions: user.reactions,
                    total_post_comments: user.totalPostComments,
                })
            }));

            setLeaderboard(withRanksAndBadges);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h2>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="reactions">Most Reactions</option>
                        <option value="comments">Most Helpful</option>
                        <option value="posts">Most Active</option>
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No data available for this timeframe
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.userId}
                                className={`p-3 sm:p-4 rounded-xl border-2 transition ${entry.rank === 1
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400'
                                    : entry.rank === 2
                                        ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-400'
                                        : entry.rank === 3
                                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-400'
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' :
                                        entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                                            entry.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-md' :
                                                'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}>
                                        {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                    </div>

                                    <AnonAvatar
                                        authorId={entry.userId}
                                        size="lg"
                                        showBadge
                                        badges={entry.badges}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                                                Anonymous User
                                            </span>
                                            {entry.badges.slice(0, 3).map((badge, i) => (
                                                <span key={i} className="text-sm" title={badge.description}>
                                                    {badge.icon}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {entry.reactions}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {entry.comments}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {entry.posts}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}