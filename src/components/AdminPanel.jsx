import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3, Calendar, User, Clock, Heart, Users, Menu, Infinity,
    MessageSquare, Send, X, ArrowLeft
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import UserManagement from './UserManagement'
import MatchmakerAdmin from './matchmaker/admin/MatchmakerAdmin'

dayjs.extend(relativeTime)

const POSTS_PER_PAGE = 10
const ADMIN_EMAIL = 'admin@mmu.edu';

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
    const [activeTab, setActiveTab] = useState('moderation')
    const [supportUsers, setSupportUsers] = useState([])
    const [selectedSupportUser, setSelectedSupportUser] = useState(null)
    const [adminChatHistory, setAdminChatHistory] = useState([])
    const [adminMessageInput, setAdminMessageInput] = useState('')
    const adminChatEndRef = useRef(null)
    const selectedUserRef = useRef(null)

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
                    setActiveTab('moderation')
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

        if (activeTab === 'moderation') {
            fetchPollsForPosts()
        }
    }, [posts, activeTab])

    useEffect(() => {
        selectedUserRef.current = selectedSupportUser;
        if (selectedSupportUser) {
            setTimeout(() => adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
    }, [selectedSupportUser]);

    useEffect(() => {
        if (activeTab === 'support' && selectedSupportUser) {
            setTimeout(() => adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
    }, [adminChatHistory, activeTab, selectedSupportUser])

    useEffect(() => {
        if (activeTab === 'support') {
            fetchSupportUsers()

            const channel = supabase
                .channel('admin-support-global')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
                    fetchSupportUsers()

                    const currentUser = selectedUserRef.current;

                    if (currentUser && payload.new.user_id === currentUser) {
                        setAdminChatHistory(prev => {
                            if (prev.some(m => m.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });

                        if (payload.new.sender_role === 'user') {
                            supabase.from('support_messages')
                                .update({ is_read: true })
                                .eq('id', payload.new.id)
                                .then()
                        }
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [activeTab])

    async function checkSession() {
        const { data } = await supabase.auth.getSession()
        const session = data?.session
        if (session && session.user.email === ADMIN_EMAIL) {
            setUser(session.user)
            fetchPosts(true)
        } else {
            if (session) {
                console.warn("Session found, but user is not the Admin. Forcing sign out.");
                supabase.auth.signOut();
            }
            setUser(null)
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

        if (data.user && data.user.email !== ADMIN_EMAIL) {
            setError('Access Denied: This account is not authorized as an administrator.')
            supabase.auth.signOut();
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

    async function handleTogglePermanent(postId, isPermanent) {
        setActionLoading(prev => ({ ...prev, [postId]: 'permanent' }))

        try {
            const { error } = await supabase
                .from('confessions')
                .update({ is_permanent: !isPermanent })
                .eq('id', postId)

            if (error) throw error

            setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_permanent: !isPermanent } : p))
        } catch (err) {
            console.error('Permanent toggle error:', err)
            alert('Failed to update permanent status: ' + err.message)
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

    async function fetchSupportUsers() {
        const { data, error } = await supabase
            .from('support_messages')
            .select('user_id, created_at, content, is_read, sender_role')
            .order('created_at', { ascending: false })

        if (data) {
            const uniqueUsers = {}
            data.forEach(msg => {
                if (!uniqueUsers[msg.user_id]) {
                    uniqueUsers[msg.user_id] = {
                        user_id: msg.user_id,
                        last_message: msg.content,
                        last_active: msg.created_at,
                        has_unread: !msg.is_read && msg.sender_role === 'user'
                    }
                }
            })
            setSupportUsers(Object.values(uniqueUsers))
        }
    }

    async function fetchAdminChatHistory(userId) {
        const { data } = await supabase
            .from('support_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

        setAdminChatHistory(data || [])

        await supabase
            .from('support_messages')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('sender_role', 'user')
            .eq('is_read', false)
    }

    async function sendAdminReply(e) {
        e.preventDefault()
        if (!adminMessageInput.trim() || !selectedSupportUser) return

        const content = adminMessageInput.trim()
        setAdminMessageInput('')

        const { error } = await supabase.from('support_messages').insert({
            user_id: selectedSupportUser,
            sender_role: 'admin',
            content: content
        })

        if (error) {
            console.error("Failed to send reply", error)
            alert("Failed to send reply")
        } else {
            fetchSupportUsers()
        }
    }

    async function handleDeleteConversation() {
        if (!selectedSupportUser) return
        if (!window.confirm('Are you sure you want to DELETE this entire conversation? This cannot be undone.')) return

        const { error } = await supabase
            .from('support_messages')
            .delete()
            .eq('user_id', selectedSupportUser)

        if (error) {
            console.error('Error deleting conversation:', error)
            alert('Failed to delete conversation. Check RLS policies.')
        } else {
            setSupportUsers(prev => prev.filter(u => u.user_id !== selectedSupportUser))
            setSelectedSupportUser(null)
            setAdminChatHistory([])
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

    const allPostsSelected = posts.length > 0 && selectedPosts.size === posts.length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-8 pb-20">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Shield className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            Admin Panel
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 break-all">
                            {user.email}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => fetchPosts(true)}
                        disabled={loading || bulkLoading}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 text-sm font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading && posts.length === 0 ? 'animate-spin' : ''}`} />
                        <span className="md:inline hidden">Refresh</span>
                    </button>

                    <button
                        onClick={signOut}
                        disabled={loading || bulkLoading}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="md:inline hidden">Log Out</span>
                    </button>
                </div>
            </div>

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 md:mx-0 md:px-0">
                <nav className="flex space-x-6 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'moderation', label: 'Moderation', icon: Shield },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'matchmaker', label: 'Matchmaker', icon: Heart },
                        { id: 'support', label: 'Support', icon: MessageSquare }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'moderation' && (
                <>
                    {posts.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <button
                                onClick={toggleSelectAll}
                                className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition disabled:opacity-50"
                                disabled={bulkLoading}
                            >
                                {allPostsSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                {allPostsSelected ? 'Deselect All' : 'Select All'}
                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                                    {selectedPosts.size}
                                </span>
                            </button>

                            <button
                                onClick={handleBulkDelete}
                                disabled={selectedPosts.size === 0 || bulkLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-bold shadow-sm"
                            >
                                {bulkLoading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete Selected
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
                                        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-colors ${isSelected
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                                            : 'border-gray-200 dark:border-gray-700'
                                            } p-4 md:p-5`}
                                    >
                                        <div className="flex items-start gap-3 md:gap-4">
                                            <div className="pt-1 shrink-0">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => togglePostSelection(p.id)}
                                                    disabled={bulkLoading}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <AnonAvatar authorId={p.author_id} size="sm" />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                                                    {p.author_name || 'Anonymous'}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    #{p.id}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(p.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {p.is_permanent && (
                                                            <Tag icon={Infinity} label="Permanent" color="purple" />
                                                        )}
                                                        {poll && <Tag icon={BarChart3} label="Poll" color="indigo" />}
                                                        {hasEvent && <Tag icon={Calendar} label="Event" color="orange" />}
                                                        {p.pinned && <Tag icon={Pin} label="Pinned" color="blue" />}
                                                        {p.approved ? (
                                                            <Tag icon={CheckCircle} label="Approved" color="green" />
                                                        ) : (
                                                            <Tag icon={AlertTriangle} label="Pending" color="yellow" />
                                                        )}
                                                        {(p.reported || p.report_count > 0) && (
                                                            <Tag icon={AlertTriangle} label={`Reported ${p.report_count > 0 ? `(${p.report_count})` : ''}`} color="red" />
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-3 text-sm md:text-base leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                    {p.text}
                                                </p>

                                                {poll && <div className="mb-3" onClick={(e) => e.stopPropagation()}><PollDisplay poll={poll} confessionId={p.id} isAdminReview={true} /></div>}
                                                {event && <div className="mb-3" onClick={(e) => e.stopPropagation()}><EventDisplay eventName={event.event_name} description={event.description} startTime={event.start_time} endTime={event.end_time} location={event.location} /></div>}
                                                {p.media_url && (
                                                    <div className="mb-3">
                                                        {p.media_type === 'images' ? <img src={p.media_url} className="max-h-48 rounded-lg object-cover w-full sm:w-auto" alt="media" /> :
                                                            p.media_type === 'video' ? <video controls className="max-h-48 w-full rounded-lg"><source src={p.media_url} /></video> :
                                                                p.media_type === 'audio' ? <audio controls className="w-full"><source src={p.media_url} /></audio> : null}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4">
                                                    <ActionButton
                                                        onClick={() => handleTogglePin(p.id, p.pinned)}
                                                        disabled={actionLoading[p.id] || bulkLoading}
                                                        isLoading={actionLoading[p.id] === 'pin'}
                                                        icon={p.pinned ? PinOff : Pin}
                                                        label={p.pinned ? 'Unpin' : 'Pin'}
                                                        variant={p.pinned ? 'blue' : 'secondary'}
                                                    />

                                                    <ActionButton
                                                        onClick={() => handleTogglePermanent(p.id, p.is_permanent)}
                                                        disabled={actionLoading[p.id] || bulkLoading}
                                                        isLoading={actionLoading[p.id] === 'permanent'}
                                                        icon={Infinity}
                                                        label={p.is_permanent ? 'Permanent' : 'Auto-Del'}
                                                        variant={p.is_permanent ? 'purple' : 'secondary'}
                                                        title={p.is_permanent ? "This post will NOT be auto-deleted" : "This post will be deleted after 15 days"}
                                                    />

                                                    <ActionButton
                                                        onClick={() => handleDelete(p.id)}
                                                        disabled={actionLoading[p.id] || bulkLoading}
                                                        isLoading={actionLoading[p.id] === 'delete-post'}
                                                        icon={Trash2}
                                                        label="Delete"
                                                        variant="danger"
                                                    />

                                                    {!p.approved && (
                                                        <ActionButton
                                                            onClick={() => handleApprove(p.id)}
                                                            disabled={actionLoading[p.id] || bulkLoading}
                                                            isLoading={actionLoading[p.id] === 'approve'}
                                                            icon={CheckCircle}
                                                            label="Approve"
                                                            variant="success"
                                                            className="col-span-2 sm:col-span-1"
                                                        />
                                                    )}

                                                    {!p.reported && p.report_count > 0 && (
                                                        <ActionButton
                                                            onClick={() => handleMarkReview(p.id)}
                                                            disabled={actionLoading[p.id] || bulkLoading}
                                                            isLoading={actionLoading[p.id] === 'review'}
                                                            icon={AlertTriangle}
                                                            label="Mark Review"
                                                            variant="warning"
                                                        />
                                                    )}

                                                    {p.reported && (
                                                        <ActionButton
                                                            onClick={() => handleClearReport(p.id)}
                                                            disabled={actionLoading[p.id] || bulkLoading}
                                                            isLoading={actionLoading[p.id] === 'clear-report'}
                                                            icon={ShieldOff}
                                                            label="Clear Report"
                                                            variant="warning_outline"
                                                        />
                                                    )}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => toggleComments(p.id)}
                                                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
                                                    >
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <MessageCircle className="w-4 h-4 text-indigo-500" />
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                                Comments
                                                            </span>
                                                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-md">
                                                                {p.comments_count || 0}
                                                            </span>
                                                        </div>
                                                        {visibleComments[p.id] ?
                                                            <ChevronUp className="w-4 h-4 text-gray-400" /> :
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        }
                                                    </button>

                                                    {visibleComments[p.id] && (
                                                        <div className="mt-3 space-y-3 pl-1 md:pl-4">
                                                            {commentsLoading[p.id] && (
                                                                <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                                                            )}

                                                            {!commentsLoading[p.id] && comments[p.id]?.length === 0 && (
                                                                <p className="text-center text-xs text-gray-400 italic py-2">No comments</p>
                                                            )}

                                                            {!commentsLoading[p.id] && comments[p.id]?.map(c => (
                                                                <div key={c.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl p-3 relative group">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <AnonAvatar authorId={c.author_id} size="xs" />
                                                                            <div className="text-xs">
                                                                                <span className="font-bold text-gray-700 dark:text-gray-300">{c.author_name || 'Anon'}</span>
                                                                                <span className="text-gray-400 mx-1">•</span>
                                                                                <span className="text-gray-400">{dayjs(c.created_at).fromNow(true)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleDeleteComment(c.id, p.id)}
                                                                            disabled={actionLoading[c.id] === 'delete-comment'}
                                                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                                                        >
                                                                            {actionLoading[c.id] === 'delete-comment' ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 break-words">{c.text}</p>
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

                    {!loading && hasMore && posts.length > 0 && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={() => fetchPosts()}
                                disabled={loading || bulkLoading}
                                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 font-medium shadow-sm w-full md:w-auto"
                            >
                                Load More Posts
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'matchmaker' && <MatchmakerAdmin />}

            {activeTab === 'support' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[80vh] md:h-[600px]">
                    <div className={`${selectedSupportUser ? 'hidden md:flex' : 'flex'} bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex-col h-full`}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Conversations</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {supportUsers.length === 0 && (
                                <div className="p-4 text-center text-sm text-gray-500">No messages yet.</div>
                            )}
                            {supportUsers.map(u => (
                                <button
                                    key={u.user_id}
                                    onClick={() => { setSelectedSupportUser(u.user_id); fetchAdminChatHistory(u.user_id); }}
                                    className={`w-full p-4 text-left border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedSupportUser === u.user_id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-mono text-gray-500 truncate w-24">User: {u.user_id.slice(0, 8)}...</span>
                                        {u.has_unread && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.last_message}</p>
                                    <span className="text-xs text-gray-400">{dayjs(u.last_active).fromNow()}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`${selectedSupportUser ? 'flex' : 'hidden md:flex'} md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex-col overflow-hidden h-full`}>
                        {selectedSupportUser ? (
                            <>
                                <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedSupportUser(null)} className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </button>
                                        <span className="font-mono text-sm text-gray-500 truncate">Chatting with: {selectedSupportUser}</span>
                                    </div>

                                    <button
                                        onClick={handleDeleteConversation}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold transition"
                                        title="Delete entire conversation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Delete Conversation</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {adminChatHistory.map(msg => (
                                        <div key={msg.id} className={`flex items-center gap-2 ${msg.sender_role === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`max-w-[85%] md:max-w-[70%] rounded-xl px-4 py-2 text-sm ${msg.sender_role === 'admin'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={adminChatEndRef} />
                                </div>

                                <form onSubmit={sendAdminReply} className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                    <input
                                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="Type a reply..."
                                        value={adminMessageInput}
                                        onChange={e => setAdminMessageInput(e.target.value)}
                                    />
                                    <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
                                Select a conversation to start chatting
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function Tag({ icon: Icon, label, color }) {
    const colors = {
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    }
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md flex items-center gap-1 ${colors[color] || colors.indigo}`}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    )
}

function ActionButton({ onClick, disabled, isLoading, icon: Icon, label, variant, className = '', title }) {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
        danger: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50',
        success: 'bg-green-600 text-white hover:bg-green-700',
        blue: 'bg-blue-600 text-white hover:bg-blue-700',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
        warning_outline: 'border border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
        purple: 'bg-purple-600 text-white hover:bg-purple-700',
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.secondary} ${className}`}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
            {label}
        </button>
    )
}