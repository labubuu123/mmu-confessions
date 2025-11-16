import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3, Calendar, User, Clock, Heart, MinusCircle // 1. Added MinusCircle here
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import { useNotifications } from './NotificationSystem' // 2. Added useNotifications import

dayjs.extend(relativeTime)

const POSTS_PER_PAGE = 10

function UserPointsManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { success, error: notifyError } = useNotifications(); // This line will now work

    const fetchUserPoints = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_points')
            .select('user_id, total_points')
            .order('total_points', { ascending: false });

        if (error) {
            console.error('Error fetching user points:', error);
            setError(error.message);
            notifyError('Could not load user points');
        } else {
            setUsers(data);
        }
        setLoading(false);
    }, [notifyError]);

    useEffect(() => {
        fetchUserPoints();
    }, [fetchUserPoints]);

    const handleDeductPoints = async (userId) => {
        const amountStr = prompt('How many points do you want to deduct?', '10');
        if (!amountStr) return;

        const amount = parseInt(amountStr, 10);
        if (isNaN(amount) || amount <= 0) {
            notifyError('Please enter a valid positive number.');
            return;
        }

        const { error } = await supabase.rpc('admin_deduct_points', {
            p_user_id: userId,
            p_amount: amount
        });

        if (error) {
            notifyError(`Failed to deduct points: ${error.message}`);
        } else {
            success(`Deducted ${amount} points from user.`);
            fetchUserPoints();
        }
    };

    if (loading) {
        return <div className="text-center p-8">Loading user points...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-8">Error: {error}</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User /> User Points Management
            </h3>
            <div className="space-y-3">
                {users.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No users with points found.</p>
                ) : (
                    users.map(user => (
                        <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    User ID: <span className="text-xs text-gray-600 dark:text-gray-400">{user.user_id}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 font-bold text-yellow-500">
                                    <Zap className="w-4 h-4" />
                                    {user.total_points}
                                </span>
                                <button
                                    onClick={() => handleDeductPoints(user.user_id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
                                    title="Deduct points"
                                >
                                    <MinusCircle className="w-4 h-4" />
                                    Deduct
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function AdminPanel() {
    const [user, setUser] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState({})

    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const [comments, setComments] = useState({})
    const [commentsLoading, setCommentsLoading] = useState({})
    const [visibleComments, setVisibleComments] = useState({})

    const [selectedPosts, setSelectedPosts] = useState(new Set())
    const [bulkLoading, setBulkLoading] = useState(false)
    const [polls, setPolls] = useState({})

    useEffect(() => {
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setPosts([])
                    setSelectedPosts(new Set())
                    setComments({})
                    setVisibleComments({})
                    setError(null)
                    setPolls({})
                    setPage(0)
                    setHasMore(true)
                } else if (event === 'SIGNED_IN') {
                    setUser(session.user)
                    fetchPosts(true)
                }
            }
        )

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    useEffect(() => {
        async function fetchPollsForPosts() {
            if (posts.length === 0) {
                setPolls({})
                return
            }
            const postIds = posts.map(p => p.id)
            const { data, error } = await supabase
                .from('polls')
                .select('*')
                .in('confession_id', postIds)

            if (error) {
                console.error("Failed to fetch polls:", error)
                return
            }

            if (data) {
                const pollMap = {}
                data.forEach(p => {
                    pollMap[p.confession_id] = p
                })
                setPolls(prev => ({ ...prev, ...pollMap }))
            }
        }

        fetchPollsForPosts()
    }, [posts])

    async function checkSession() {
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        if (session) {
            setUser(session.user)
            fetchPosts(true)
        }
    }

    async function signIn(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        setLoading(false)

        if (error) {
            setError('Sign-in error: ' + error.message)
            return
        }
    }

    async function signOut() {
        const confirmed = window.confirm('Are you sure you want to sign out?')
        if (!confirmed) return

        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

        } catch (err) {
            console.error('Sign-out error:', err)
            alert('Failed to sign out: ' + err.message)
            setError('Sign-out error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (loading && !isInitial) return

        setLoading(true)
        if (isInitial) setError(null)

        const currentPage = isInitial ? 0 : page
        const { data, error } = await supabase
            .from('confessions')
            .select('*, events(*)')
            .order('created_at', { ascending: false })
            .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1)

        setLoading(false)

        if (error) {
            setError('Could not fetch posts: ' + error.message)
            return
        }

        if (data.length < POSTS_PER_PAGE) {
            setHasMore(false)
        } else {
            setHasMore(true)
        }

        setPosts(prev => {
            const newPosts = data.filter(d => !prev.some(p => p.id === d.id))
            return isInitial ? data : [...prev, ...newPosts]
        })

        if (!isInitial) {
            setPage(currentPage + 1)
        } else {
            setPage(1)
            setSelectedPosts(new Set())
            setHasMore(data.length === POSTS_PER_PAGE)
        }
    }, [page, loading])

    async function handleDelete(postId) {
        if (!window.confirm(`Are you sure you want to DELETE post ${postId}? This will delete the post, all comments, reactions, and associated media. This cannot be undone.`)) {
            return
        }

        setActionLoading(prev => ({ ...prev, [postId]: 'delete-post' }))

        try {
            const { error } = await supabase.rpc('delete_post_and_storage', {
                post_id_in: postId
            })

            if (error) throw error

            alert('Post deleted successfully!')
            setPosts(prev => prev.filter(p => p.id !== postId))
            setSelectedPosts(prev => {
                const newSet = new Set(prev)
                newSet.delete(postId)
                return newSet
            })
        } catch (err) {
            console.error('Delete error:', err)
            alert('Failed to delete: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function handleBulkDelete() {
        const numSelected = selectedPosts.size
        if (numSelected === 0) {
            alert('No posts selected.')
            return
        }

        if (!window.confirm(`Are you sure you want to DELETE ${numSelected} selected posts? This cannot be undone.`)) {
            return
        }

        setBulkLoading(true)
        const postIdsToDelete = Array.from(selectedPosts)
        const results = []

        for (const postId of postIdsToDelete) {
            try {
                const { error } = await supabase.rpc('delete_post_and_storage', {
                    post_id_in: postId
                })
                if (error) throw error
                results.push({ id: postId, status: 'success' })
            } catch (err) {
                console.error(`Failed to delete post ${postId}:`, err)
                results.push({ id: postId, status: 'error', message: err.message })
            }
        }

        const successfulDeletes = results.filter(r => r.status === 'success').map(r => r.id)
        const failedDeletes = results.filter(r => r.status === 'error')

        setPosts(prev => prev.filter(p => !successfulDeletes.includes(p.id)))
        setSelectedPosts(new Set())
        setBulkLoading(false)

        alert(`Bulk delete complete:
- Successfully deleted: ${successfulDeletes.length}
- Failed to delete: ${failedDeletes.length}

${failedDeletes.length > 0 ? 'Check console for error details on failed deletions.' : ''}`)
    }

    function togglePostSelection(postId) {
        setSelectedPosts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(postId)) {
                newSet.delete(postId)
            } else {
                newSet.add(postId)
            }
            return newSet
        })
    }

    function toggleSelectAll() {
        if (selectedPosts.size === posts.length) {
            setSelectedPosts(new Set())
        } else {
            setSelectedPosts(new Set(posts.map(p => p.id)))
        }
    }

    async function handleApprove(postId) {
        setActionLoading(prev => ({ ...prev, [postId]: 'approve' }))

        try {
            const { error } = await supabase
                .from('confessions')
                .update({ approved: true, reported: false, report_count: 0 })
                .eq('id', postId)

            if (error) throw error

            alert('Post approved!')
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, approved: true, reported: false, report_count: 0 } : p))
        } catch (err) {
            console.error('Approve error:', err)
            alert('Failed to approve: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function handleMarkReview(postId) {
        setActionLoading(prev => ({ ...prev, [postId]: 'review' }))

        try {
            const { error } = await supabase
                .from('confessions')
                .update({ reported: true })
                .eq('id', postId)

            if (error) throw error

            alert('Post marked for review!')
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, reported: true } : p))
        } catch (err) {
            console.error('Mark review error:', err)
            alert('Failed to mark for review: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function handleTogglePin(postId, isPinned) {
        setActionLoading(prev => ({ ...prev, [postId]: 'pin' }))

        try {
            const { error } = await supabase
                .from('confessions')
                .update({ pinned: !isPinned })
                .eq('id', postId)

            if (error) throw error

            alert(isPinned ? 'Post unpinned!' : 'Post pinned!')
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, pinned: !isPinned } : p))
        } catch (err) {
            console.error('Pin error:', err)
            alert('Failed to update pin: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function handleClearReport(postId) {
        setActionLoading(prev => ({ ...prev, [postId]: 'clear-report' }))

        try {
            const { error } = await supabase.rpc('clear_report_status', {
                post_id_in: postId
            })

            if (error) throw error

            alert('Report status cleared!')
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, reported: false, report_count: 0 } : p))
        } catch (err) {
            console.error('Clear report error:', err)
            alert('Failed to clear report: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function toggleComments(postId) {
        const isVisible = !!visibleComments[postId]
        setVisibleComments(prev => ({ ...prev, [postId]: !isVisible }))

        if (!isVisible && !comments[postId]) {
            await fetchCommentsForPost(postId)
        }
    }

    async function fetchCommentsForPost(postId) {
        setCommentsLoading(prev => ({ ...prev, [postId]: true }))
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: false })

            if (error) throw error

            setComments(prev => ({ ...prev, [postId]: data || [] }))
        } catch (err) {
            console.error('Fetch comments error:', err)
        } finally {
            setCommentsLoading(prev => ({ ...prev, [postId]: false }))
        }
    }

    async function handleDeleteComment(commentId, postId) {
        if (!window.confirm(`Are you sure you want to DELETE comment ${commentId}? This cannot be undone.`)) {
            return
        }

        setActionLoading(prev => ({ ...prev, [commentId]: 'delete-comment' }))

        try {
            const { error } = await supabase.rpc('delete_comment_as_admin', {
                comment_id_in: commentId
            })

            if (error) throw error

            alert('Comment deleted successfully!')

            await fetchCommentsForPost(postId)

            const { data: updatedPost, error: postError } = await supabase
                .from('confessions')
                .select('*')
                .eq('id', postId)
                .single()

            if (postError) console.error('Error re-fetching post:', postError)
            if (updatedPost) {
                setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p))
            }

        } catch (err) {
            console.error('Delete comment error:', err)
            alert('Failed to delete comment: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [commentId]: null }))
        }
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Admin Login
                        </h2>
                    </div>

                    <form onSubmit={signIn} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign in
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </form>
                </div>

                <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                    <p>Having issues? Contact the developer:</p>
                    <p className="font-medium">
                        Zyora Lab - <a href="mailto:zyoralab@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">zyoralab@gmail.com</a>
                    </p>
                </div>
            </div>
        )
    }

    const allPostsSelected = posts.length > 0 && selectedPosts.size === posts.length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Admin Moderation
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {posts.length} total • {user.email}
                        </p>
                    </div>
                </div>

                <div className="mb-8">
                    <UserPointsManager />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => fetchPosts(true)}
                        disabled={loading || bulkLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading && posts.length === 0 ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        onClick={signOut}
                        disabled={loading || bulkLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </div>

            {posts.length > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                            disabled={bulkLoading}
                        >
                            {allPostsSelected ? (
                                <CheckSquare className="w-5 h-5" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                            <span className="hidden sm:inline">{allPostsSelected ? 'Deselect All' : 'Select All'}</span>
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {selectedPosts.size} selected
                        </span>
                    </div>

                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedPosts.size === 0 || bulkLoading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm w-full sm:w-auto"
                    >
                        {bulkLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Selected ({selectedPosts.size})
                            </>
                        )}
                    </button>
                </div>
            )}

            {loading && posts.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(p => {
                        const isSelected = selectedPosts.has(p.id);
                        const poll = polls[p.id];
                        const hasEvent = p.events && p.events.length > 0;
                        const event = hasEvent ? p.events[0] : null;

                        return (
                            <div
                                key={p.id}
                                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border ${isSelected
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                                    : 'border-gray-200 dark:border-gray-700'
                                    } p-5`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            checked={isSelected}
                                            onChange={() => togglePostSelection(p.id)}
                                            disabled={bulkLoading}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(p.created_at).toLocaleString()} • ID: {p.id}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                                                {poll && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded flex items-center gap-1">
                                                        <BarChart3 className="w-3 h-3" />
                                                        Poll
                                                    </span>
                                                )}
                                                {hasEvent && (
                                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        Event
                                                    </span>
                                                )}
                                                {p.pinned && (
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded flex items-center gap-1">
                                                        📌 Pinned
                                                    </span>
                                                )}
                                                {p.approved ? (
                                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Pending
                                                    </span>
                                                )}
                                                {p.reported ? (
                                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Reported ({p.report_count || 0})
                                                    </span>
                                                ) : p.report_count > 0 ? (
                                                    <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {p.report_count} {p.report_count === 1 ? 'Report' : 'Reports'}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-3">
                                            {p.text}
                                        </p>

                                        {poll && (
                                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                                <PollDisplay poll={poll} confessionId={p.id} isAdminReview={true} />
                                            </div>
                                        )}

                                        {event && (
                                            <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                                                <EventDisplay
                                                    eventName={event.event_name}
                                                    description={event.description}
                                                    startTime={event.start_time}
                                                    endTime={event.end_time}
                                                    location={event.location}
                                                />
                                            </div>
                                        )}

                                        {p.media_url && (
                                            <div className="mb-3">
                                                {p.media_type === 'images' ? (
                                                    <img
                                                        src={p.media_url}
                                                        className="max-h-48 rounded-lg"
                                                        alt="media"
                                                    />
                                                ) : p.media_type === 'video' ? (
                                                    <video controls className="max-h-48 w-full rounded-lg">
                                                        <source src={p.media_url} />
                                                    </video>
                                                ) : p.media_type === 'audio' ? (
                                                    <audio controls className="w-full">
                                                        <source src={p.media_url} />
                                                    </audio>
                                                ) : null}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => handleTogglePin(p.id, p.pinned)}
                                                disabled={actionLoading[p.id] || bulkLoading}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition ${p.pinned
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                                    }`}
                                            >
                                                {actionLoading[p.id] === 'pin' ? (
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : p.pinned ? (
                                                    <PinOff className="w-4 h-4" />
                                                ) : (
                                                    <Pin className="w-4 h-4" />
                                                )}
                                                {p.pinned ? 'Unpin' : 'Pin'}
                                            </button>

                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                disabled={actionLoading[p.id] || bulkLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                {actionLoading[p.id] === 'delete-post' ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                Delete Post
                                            </button>

                                            {!p.approved && (
                                                <button
                                                    onClick={() => handleApprove(p.id)}
                                                    disabled={actionLoading[p.id] || bulkLoading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    {actionLoading[p.id] === 'approve' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4" />
                                                    )}
                                                    Approve
                                                </button>
                                            )}

                                            {!p.reported && p.report_count > 0 && (
                                                <button
                                                    onClick={() => handleMarkReview(p.id)}
                                                    disabled={actionLoading[p.id] || bulkLoading}
                                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    {actionLoading[p.id] === 'review' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        'Mark for Review'
                                                    )}
                                                </button>
                                            )}

                                            {p.reported && (
                                                <button
                                                    onClick={() => handleClearReport(p.id)}
                                                    disabled={actionLoading[p.id] || bulkLoading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    {actionLoading[p.id] === 'clear-report' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <ShieldOff className="w-4 h-4" />
                                                    )}
                                                    Clear Report
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                onClick={() => toggleComments(p.id)}
                                                className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                    <div className="text-left">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            Comments ({p.comments_count || 0})
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            {visibleComments[p.id] ? 'Click to hide' : 'Click to view all comments'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {p.comments_count > 0 && (
                                                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                                                            {p.comments_count}
                                                        </span>
                                                    )}
                                                    {visibleComments[p.id] ?
                                                        <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" /> :
                                                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
                                                    }
                                                </div>
                                            </button>

                                            {visibleComments[p.id] && (
                                                <div className="mt-4 space-y-3">
                                                    {commentsLoading[p.id] && (
                                                        <div className="flex justify-center py-8">
                                                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}

                                                    {!commentsLoading[p.id] && comments[p.id]?.length === 0 && (
                                                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                            <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                                                        </div>
                                                    )}

                                                    {!commentsLoading[p.id] && comments[p.id]?.map(c => (
                                                        <div
                                                            key={c.id}
                                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 hover:shadow-md transition"
                                                        >
                                                            <div className="flex items-start gap-2 sm:gap-3">
                                                                <AnonAvatar authorId={c.author_id} size="sm" />

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start sm:items-center gap-x-2 gap-y-1 mb-2 flex-wrap">
                                                                        <span className={`text-sm font-semibold ${c.author_name
                                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                                            : 'text-gray-800 dark:text-gray-200'
                                                                            }`}>
                                                                            {c.author_name || 'Anonymous'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">•</span>
                                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            <Clock className="w-3 h-3" />
                                                                            {dayjs(c.created_at).fromNow()}
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap break-words leading-relaxed">
                                                                        {c.text}
                                                                    </p>

                                                                    {c.reactions && Object.keys(c.reactions).length > 0 && (
                                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                            {Object.entries(c.reactions)
                                                                                .filter(([_, count]) => count > 0)
                                                                                .map(([emoji, count]) => (
                                                                                    <div
                                                                                        key={emoji}
                                                                                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full"
                                                                                    >
                                                                                        <span className="text-sm">{emoji}</span>
                                                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                                            {count}
                                                                                        </span>
                                                                                    </div>
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                                                        <div className="flex items-center gap-1">
                                                                            <User className="w-3 h-3" />
                                                                            <span>ID: {c.id}</span>
                                                                        </div>
                                                                        {c.parent_id && (
                                                                            <div className="flex items-center gap-1">
                                                                                <MessageCircle className="w-3 h-3" />
                                                                                <span>Reply to: {c.parent_id}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={() => handleDeleteComment(c.id, p.id)}
                                                                    disabled={actionLoading[c.id] === 'delete-comment' || bulkLoading}
                                                                    className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-500 hover:text-red-600 disabled:opacity-50 transition flex-shrink-0"
                                                                    title="Delete Comment"
                                                                >
                                                                    {actionLoading[c.id] === 'delete-comment' ? (
                                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {loading && posts.length > 0 && (
                <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && hasMore && posts.length > 0 && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => fetchPosts()}
                        disabled={loading || bulkLoading}
                        className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!loading && !hasMore && posts.length > 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    You've reached the end.
                </p>
            )}
        </div>
    )
}