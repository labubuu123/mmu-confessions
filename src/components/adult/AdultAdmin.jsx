import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Shield, Trash2, CheckCircle, AlertTriangle, Search,
    MessageCircle, ChevronDown, ChevronUp, XCircle,
    Flame, Lock, RefreshCw, Tag
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const POSTS_PER_PAGE = 20;

export default function AdultAdmin() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [comments, setComments] = useState({});
    const [loadingComments, setLoadingComments] = useState({});
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchPosts();
    }, [filter, page]);

    const fetchPosts = async () => {
        setLoading(true);
        let query = supabase
            .from('adult_confessions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1);

        if (filter === 'pending') query = query.eq('is_approved', false);
        if (filter === 'approved') query = query.eq('is_approved', true);
        if (filter === 'flagged') query = query.eq('ai_flagged', true);

        if (searchQuery) {
            query = query.ilike('content', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) console.error('Error fetching adult posts:', error);
        else setPosts(data || []);
        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchPosts();
    };

    const fetchComments = async (postId) => {
        if (comments[postId]) return;
        setLoadingComments(prev => ({ ...prev, [postId]: true }));

        const { data, error } = await supabase
            .from('adult_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (!error) {
            setComments(prev => ({ ...prev, [postId]: data }));
        }
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
    };

    const toggleExpand = (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
        } else {
            setExpandedPostId(postId);
            fetchComments(postId);
        }
    };

    const handleAction = async (id, action, payload = {}) => {
        setActionLoading(prev => ({ ...prev, [id]: action }));
        try {
            if (action === 'delete') {
                if (!window.confirm("Permanently delete this confession?")) return;
                const { error } = await supabase.from('adult_confessions').delete().eq('id', id);
                if (!error) setPosts(prev => prev.filter(p => p.id !== id));
            }
            else if (action === 'approve') {
                const { error } = await supabase.from('adult_confessions').update({ is_approved: true }).eq('id', id);
                if (!error) updateLocalPost(id, { is_approved: true });
            }
            else if (action === 'reject') {
                const { error } = await supabase.from('adult_confessions').update({ is_approved: false }).eq('id', id);
                if (!error) updateLocalPost(id, { is_approved: false });
            }
        } catch (error) {
            console.error(error);
            alert("Action failed");
        } finally {
            setActionLoading(prev => ({ ...prev, [id]: null }));
        }
    };

    const handleDeleteComment = async (commentId, postId) => {
        if (!window.confirm("Delete this comment?")) return;
        const { error } = await supabase.from('adult_comments').delete().eq('id', commentId);
        if (!error) {
            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
        }
    };

    const updateLocalPost = (id, updates) => {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    return (
        <div className="space-y-6 p-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="All Posts" />
                    <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Pending" icon={AlertTriangle} color="yellow" />
                    <FilterButton active={filter === 'approved'} onClick={() => setFilter('approved')} label="Live" icon={CheckCircle} color="green" />
                    <FilterButton active={filter === 'flagged'} onClick={() => setFilter('flagged')} label="Flagged" icon={Shield} color="red" />
                </div>

                <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search content or ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                        />
                    </div>
                    <button type="submit" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button type="button" onClick={fetchPosts} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                        <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                {posts.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-400">
                        <p>No adult confessions found for this filter.</p>
                    </div>
                )}

                {posts.map(post => (
                    <div key={post.id} className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all ${post.ai_flagged ? 'border-red-300 dark:border-red-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 text-xs">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-gray-500">#{post.id}</span>
                                <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                                    {post.author_alias}
                                </span>
                                <span className="text-gray-400">{dayjs(post.created_at).format('MMM D, h:mm A')}</span>
                            </div>
                            <div className="flex gap-2">
                                {post.is_approved
                                    ? <Badge color="green" label="Approved" />
                                    : <Badge color="yellow" label="Pending Approval" />
                                }
                                {post.ai_flagged && <Badge color="red" label="AI Flagged" icon={Shield} />}
                            </div>
                        </div>

                        <div className="p-4 md:p-6">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {post.tags?.map((tag, i) => (
                                    <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4">
                                {post.content}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                {!post.is_approved && (
                                    <ActionButton
                                        onClick={() => handleAction(post.id, 'approve')}
                                        loading={actionLoading[post.id] === 'approve'}
                                        color="green"
                                        icon={CheckCircle}
                                        label="Approve"
                                    />
                                )}
                                {post.is_approved && (
                                    <ActionButton
                                        onClick={() => handleAction(post.id, 'reject')}
                                        loading={actionLoading[post.id] === 'reject'}
                                        color="orange"
                                        icon={XCircle}
                                        label="Unpublish"
                                    />
                                )}
                                <ActionButton
                                    onClick={() => handleAction(post.id, 'delete')}
                                    loading={actionLoading[post.id] === 'delete'}
                                    color="red"
                                    icon={Trash2}
                                    label="Delete"
                                />

                                <div className="flex-1"></div>

                                <button
                                    onClick={() => toggleExpand(post.id)}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    Comments {expandedPostId === post.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>

                            {expandedPostId === post.id && (
                                <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">User Comments</h4>

                                    {loadingComments[post.id] && <div className="text-center text-xs text-gray-400 py-2">Loading comments...</div>}

                                    {!loadingComments[post.id] && comments[post.id]?.length === 0 && (
                                        <div className="text-center text-xs text-gray-400 py-2 italic">No comments yet.</div>
                                    )}

                                    <div className="space-y-3">
                                        {comments[post.id]?.map(comment => (
                                            <div key={comment.id} className="flex justify-between items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                                <div>
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{comment.author_alias}</span>
                                                        <span className="text-[10px] text-gray-400">{dayjs(comment.created_at).fromNow()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-700 dark:text-gray-300">{comment.text}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                                    className="text-gray-400 hover:text-red-500 p-1"
                                                    title="Delete Comment"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                >
                    Load More
                </button>
            </div>
        </div>
    );
}

function FilterButton({ active, onClick, label, icon: Icon, color }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${active
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
        >
            {Icon && <Icon className={`w-3.5 h-3.5 ${color === 'red' ? 'text-red-500' : color === 'green' ? 'text-green-500' : 'text-yellow-500'}`} />}
            {label}
        </button>
    );
}

function Badge({ color, label, icon: Icon }) {
    const colors = {
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors[color] || 'bg-gray-100 text-gray-600'}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>
    );
}

function ActionButton({ onClick, loading, icon: Icon, label, color }) {
    const colors = {
        green: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
        red: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30',
        orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30',
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${colors[color]}`}
        >
            {loading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
        </button>
    );
}