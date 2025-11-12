import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'

dayjs.extend(relativeTime)

export default function AdminPanel() {
    const [user, setUser] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState({})

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
                } else if (event === 'SIGNED_IN') {
                    setUser(session.user)
                    fetchPosts()
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
            try {
                const { data, error } = await supabase
                    .from('polls')
                    .select('*')
                    .in('confession_id', postIds)
                
                if (error) throw error
                
                if (data) {
                    const pollMap = {}
                    data.forEach(p => {
                        pollMap[p.confession_id] = p
                    })
                    setPolls(pollMap)
                }
            } catch (err) {
                console.error("Failed to fetch polls for admin panel:", err)
            }
        }

        fetchPollsForPosts()
    }, [posts])

    async function checkSession() {
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        if (session) {
            setUser(session.user)
            fetchPosts()
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
            
            setUser(null)
            setPosts([])
            setSelectedPosts(new Set())

        } catch (err) {
            console.error('Sign-out error:', err)
            alert('Failed to sign out: ' + err.message)
            setError('Sign-out error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    async function fetchPosts() {
        setLoading(true)
        const { data } = await supabase
            .from('confessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200)
        
        setPosts(data || [])
        setLoading(false)
        setSelectedPosts(new Set())
    }

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
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Admin Moderation
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage confessions ({posts.length} total) • {user.email}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={fetchPosts}
                        disabled={loading || bulkLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={signOut}
                        disabled={loading || bulkLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {posts.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between gap-4">
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
                            {allPostsSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {selectedPosts.size} selected
                        </span>
                    </div>

                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedPosts.size === 0 || bulkLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                        return (
                            <div
                                key={p.id}
                                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border ${
                                    isSelected
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
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(p.created_at).toLocaleString()} • ID: {p.id}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                                {poll && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded flex items-center gap-1">
                                                        <BarChart3 className="w-3 h-3" />
                                                        Poll
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
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition ${
                                                    p.pinned
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
                                                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <MessageCircle className="w-4 h-4" />
                                                    Show Comments ({p.comments_count || 0})
                                                </div>
                                                {visibleComments[p.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </button>

                                            {visibleComments[p.id] && (
                                                <div className="mt-3 pl-4 space-y-3 max-h-64 overflow-y-auto">
                                                    {commentsLoading[p.id] && (
                                                        <div className="flex justify-center py-4">
                                                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    
                                                    {!commentsLoading[p.id] && comments[p.id]?.length === 0 && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">No comments found for this post.</p>
                                                    )}

                                                    {!commentsLoading[p.id] && comments[p.id]?.map(c => (
                                                        <div key={c.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                            <AnonAvatar authorId={c.author_id} size="sm" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-xs font-bold ${
                                                                        c.author_name
                                                                            ? 'text-indigo-600 dark:text-indigo-400'
                                                                            : 'text-gray-800 dark:text-gray-200'
                                                                    }`}>
                                                                        {c.author_name || 'Anonymous'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{dayjs(c.created_at).fromNow()}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                                                                    {c.text}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id, p.id)}
                                                                disabled={actionLoading[c.id] === 'delete-comment' || bulkLoading}
                                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-800/20 rounded-full text-red-500 disabled:opacity-50"
                                                                title="Delete Comment"
                                                            >
                                                                {actionLoading[c.id] === 'delete-comment' ? (
                                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </button>
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
        </div>
    )
}