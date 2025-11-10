import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

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

    useEffect(() => {
        checkSession()
    }, [])

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
        
        setUser(data.user)
        fetchPosts()
    }

    async function signOut() {
        const confirmed = window.confirm('Are you sure you want to sign out?')
        if (!confirmed) return

        setLoading(true)
        await supabase.auth.signOut()
        setUser(null)
        setPosts([])
        setLoading(false)
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
        } catch (err) {
            console.error('Delete error:', err)
            alert('Failed to delete: ' + err.message)
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }))
        }
    }

    async function handleApprove(postId) {
        setActionLoading(prev => ({ ...prev, [postId]: 'approve' }))

        try {
            const { error } = await supabase
                .from('confessions')
                .update({ approved: true, reported: false })
                .eq('id', postId)

            if (error) throw error

            alert('Post approved!')
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, approved: true, reported: false } : p))
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

            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }))

            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
            ))
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
            </div>
        )
    }

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
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button
                        onClick={signOut}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </div>

            {loading && posts.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(p => (
                        <div
                            key={p.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(p.created_at).toLocaleString()} • ID: {p.id}
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                            {p.reported && (
                                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Reported
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-3">
                                        {p.text}
                                    </p>

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
                                            onClick={() => handleDelete(p.id)}
                                            disabled={actionLoading[p.id]}
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
                                                disabled={actionLoading[p.id]}
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

                                        {!p.reported && (
                                            <button
                                                onClick={() => handleMarkReview(p.id)}
                                                disabled={actionLoading[p.id]}
                                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                {actionLoading[p.id] === 'review' ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    'Mark for Review'
                                                )}
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
                                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Anonymous</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{dayjs(c.created_at).fromNow()}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                                                                {c.text}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteComment(c.id, p.id)}
                                                            disabled={actionLoading[c.id] === 'delete-comment'}
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
                    ))}
                </div>
            )}
        </div>
    )
}