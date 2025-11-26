import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3, Calendar, Users, Heart, MessageSquare, Send,
    Megaphone, Search, Menu, X, ArrowLeft, Infinity
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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [posts, setPosts] = useState([])
    const [polls, setPolls] = useState({})
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [activeTab, setActiveTab] = useState('moderation')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState({})
    const [selectedPosts, setSelectedPosts] = useState(new Set())
    const [bulkLoading, setBulkLoading] = useState(false)
    const [comments, setComments] = useState({})
    const [commentsLoading, setCommentsLoading] = useState({})
    const [visibleComments, setVisibleComments] = useState({})
    const [supportUsers, setSupportUsers] = useState([])
    const [selectedSupportUser, setSelectedSupportUser] = useState(null)
    const [adminChatHistory, setAdminChatHistory] = useState([])
    const [adminMessageInput, setAdminMessageInput] = useState('')
    const adminChatEndRef = useRef(null)
    const selectedUserRef = useRef(null)
    const [announcements, setAnnouncements] = useState([])
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' })

    useEffect(() => {
        checkSession()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null); setPosts([]); setSelectedPosts(new Set());
                } else if (event === 'SIGNED_IN') {
                    setUser(session.user); fetchPosts(true);
                }
            }
        )
        return () => subscription?.unsubscribe()
    }, [])

    useEffect(() => {
        if (activeTab === 'moderation' && posts.length > 0) fetchPollsForPosts();
        if (activeTab === 'support') fetchSupportUsers();
        if (activeTab === 'announcements') fetchAnnouncements();
    }, [posts, activeTab])

    useEffect(() => {
        selectedUserRef.current = selectedSupportUser;
        if (selectedSupportUser) setTimeout(() => adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, [selectedSupportUser, adminChatHistory])

    useEffect(() => {
        if (activeTab === 'support') {
            const channel = supabase.channel('admin-support-global')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
                    fetchSupportUsers()
                    if (selectedUserRef.current && payload.new.user_id === selectedUserRef.current) {
                        setAdminChatHistory(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
                        if (payload.new.sender_role === 'user') supabase.from('support_messages').update({ is_read: true }).eq('id', payload.new.id).then()
                    }
                }).subscribe()
            return () => supabase.removeChannel(channel)
        }
    }, [activeTab])

    async function checkSession() { await supabase.auth.signOut(); setUser(null); }
    async function signIn(e) {
        e.preventDefault(); setLoading(true); setError(null);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) return setError('Sign-in error: ' + error.message);
        if (data.user?.email !== ADMIN_EMAIL) { setError('Access Denied'); supabase.auth.signOut(); }
    }
    async function signOut() {
        if (!window.confirm('Sign out?')) return;
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
    }

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (loading && !isInitial) return;
        setLoading(true); if (isInitial) setError(null);
        const currentPage = isInitial ? 0 : page;
        const { data, error } = await supabase.from('confessions').select('*, events(*)').order('created_at', { ascending: false }).range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);
        setLoading(false);
        if (error) return setError(error.message);
        setHasMore(data.length === POSTS_PER_PAGE);
        setPosts(prev => {
            const newPosts = data.filter(d => !prev.some(p => p.id === d.id));
            return isInitial ? data : [...prev, ...newPosts];
        });
        setPage(isInitial ? 1 : currentPage + 1);
        if (isInitial) setSelectedPosts(new Set());
    }, [page, loading])

    async function fetchPollsForPosts() {
        const postIds = posts.map(p => p.id);
        const { data } = await supabase.from('polls').select('*').in('confession_id', postIds);
        if (data) {
            const pollMap = {}; data.forEach(p => pollMap[p.confession_id] = p);
            setPolls(prev => ({ ...prev, ...pollMap }));
        }
    }

    async function fetchCommentsForPost(postId) {
        setCommentsLoading(prev => ({ ...prev, [postId]: true }));
        const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
        setComments(prev => ({ ...prev, [postId]: data || [] }));
        setCommentsLoading(prev => ({ ...prev, [postId]: false }));
    }

    async function handleDelete(postId) {
        if (!window.confirm('Delete post? Cannot be undone.')) return;
        setActionLoading(prev => ({ ...prev, [postId]: 'delete-post' }));
        const { error } = await supabase.rpc('delete_post_and_storage', { post_id_in: postId });
        if (!error) {
            setPosts(prev => prev.filter(p => p.id !== postId));
            setSelectedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
        }
        setActionLoading(prev => ({ ...prev, [postId]: null }));
    }

    async function handleBulkDelete() {
        if (!window.confirm(`Delete ${selectedPosts.size} posts?`)) return;
        setBulkLoading(true);
        const ids = Array.from(selectedPosts);
        const results = [];
        for (const id of ids) {
            const { error } = await supabase.rpc('delete_post_and_storage', { post_id_in: id });
            results.push({ id, status: error ? 'error' : 'success' });
        }
        const success = results.filter(r => r.status === 'success').map(r => r.id);
        setPosts(prev => prev.filter(p => !success.includes(p.id)));
        setSelectedPosts(new Set());
        setBulkLoading(false);
        alert(`Deleted ${success.length} posts.`);
    }

    async function handleSingleAction(postId, actionType, dbAction) {
        setActionLoading(prev => ({ ...prev, [postId]: actionType }));
        try { await dbAction(); } catch (e) { console.error(e); alert(e.message); }
        finally { setActionLoading(prev => ({ ...prev, [postId]: null })); }
    }

    const handleApprove = (id) => handleSingleAction(id, 'approve', async () => {
        await supabase.from('confessions').update({ approved: true, reported: false, report_count: 0 }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, approved: true, reported: false, report_count: 0 } : p));
    });
    const handleMarkReview = (id) => handleSingleAction(id, 'review', async () => {
        await supabase.from('confessions').update({ reported: true }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, reported: true } : p));
    });
    const handleTogglePin = (id, current) => handleSingleAction(id, 'pin', async () => {
        await supabase.from('confessions').update({ pinned: !current }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, pinned: !current } : p));
    });
    const handleTogglePermanent = (id, current) => handleSingleAction(id, 'permanent', async () => {
        await supabase.from('confessions').update({ is_permanent: !current }).eq('id', id);
        setPosts(prev => prev.map(p => p.id === id ? { ...p, is_permanent: !current } : p));
    });
    const handleClearReport = (id) => handleSingleAction(id, 'clear-report', async () => {
        await supabase.rpc('clear_report_status', { post_id_in: id });
        setPosts(prev => prev.map(p => p.id === id ? { ...p, reported: false, report_count: 0 } : p));
    });

    async function handleDeleteComment(commentId, postId) {
        if (!window.confirm('Delete comment?')) return;
        setActionLoading(prev => ({ ...prev, [commentId]: 'delete-comment' }));
        await supabase.rpc('delete_comment_as_admin', { comment_id_in: commentId });
        await fetchCommentsForPost(postId);
        setActionLoading(prev => ({ ...prev, [commentId]: null }));
    }

    async function fetchAnnouncements() {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        setAnnouncements(data || []);
    }
    async function createAnnouncement(e) {
        e.preventDefault();
        const { error } = await supabase.from('announcements').insert([newAnnouncement]);
        if (error) alert('Error creating announcement');
        else {
            setNewAnnouncement({ title: '', content: '', type: 'info' });
            fetchAnnouncements();
        }
    }
    async function toggleAnnouncement(id, currentState) {
        await supabase.from('announcements').update({ is_active: !currentState }).eq('id', id);
        fetchAnnouncements();
    }
    async function deleteAnnouncement(id) {
        if (!window.confirm("Delete announcement?")) return;
        await supabase.from('announcements').delete().eq('id', id);
        fetchAnnouncements();
    }

    async function fetchSupportUsers() {
        const { data } = await supabase.from('support_messages').select('user_id, created_at, content, is_read, sender_role').order('created_at', { ascending: false });
        if (data) {
            const unique = {};
            data.forEach(m => { if (!unique[m.user_id]) unique[m.user_id] = { user_id: m.user_id, last_message: m.content, last_active: m.created_at, has_unread: !m.is_read && m.sender_role === 'user' }; });
            setSupportUsers(Object.values(unique));
        }
    }
    async function fetchAdminChatHistory(userId) {
        const { data } = await supabase.from('support_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        setAdminChatHistory(data || []);
        await supabase.from('support_messages').update({ is_read: true }).eq('user_id', userId).eq('sender_role', 'user').eq('is_read', false);
    }
    async function sendAdminReply(e) {
        e.preventDefault();
        if (!adminMessageInput.trim() || !selectedSupportUser) return;
        await supabase.from('support_messages').insert({ user_id: selectedSupportUser, sender_role: 'admin', content: adminMessageInput.trim() });
        setAdminMessageInput(''); fetchSupportUsers();
    }
    async function handleDeleteConversation() {
        if (!selectedSupportUser || !window.confirm('Delete conversation?')) return;
        await supabase.from('support_messages').delete().eq('user_id', selectedSupportUser);
        setSupportUsers(prev => prev.filter(u => u.user_id !== selectedSupportUser));
        setSelectedSupportUser(null);
    }

    if (!user) {
        return (
            <div className="flex items-start justify-center bg-gray-50 dark:bg-gray-900 px-4 pt-10 md:pt-12">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
                            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Access</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Authorized personnel only</p>
                    </div>
                    <form onSubmit={signIn} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
                        </button>
                        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-medium">{error}</div>}
                    </form>
                </div>
            </div>
        )
    }

    const menuItems = [
        { id: 'moderation', label: 'Moderation', icon: Shield },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'matchmaker', label: 'Matchmaker', icon: Heart },
        { id: 'support', label: 'Support', icon: MessageSquare },
        { id: 'announcements', label: 'Announcements', icon: Megaphone }
    ];

    return (
        <div className="min-30h-screen bg-gray-100 dark:bg-gray-900 flex">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-lg"><Shield className="w-5 h-5 text-white" /></div>
                            <span className="font-bold text-lg dark:text-white">Admin</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X className="w-6 h-6" /></button>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map(item => (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <item.icon className="w-5 h-5" /> {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="mb-4 px-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">Logged in as</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={user.email}>{user.email}</p>
                        </div>
                        <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                            <LogOut className="w-5 h-5" /> Are you sure to sign out?
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 lg:ml-64 min-w-0">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300"><Menu className="w-6 h-6" /></button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{activeTab}</h1>
                    </div>
                    {activeTab === 'moderation' && (
                        <div className="flex gap-2">
                            <button onClick={() => fetchPosts(true)} className="p-2 text-gray-500 hover:text-indigo-600 transition"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        </div>
                    )}
                </header>

                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                    {activeTab === 'moderation' && (
                        <div className="space-y-6">
                            {posts.length > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setSelectedPosts(selectedPosts.size === posts.length ? new Set() : new Set(posts.map(p => p.id)))}
                                            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition">
                                            {selectedPosts.size === posts.length ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                            Select All ({selectedPosts.size})
                                        </button>
                                    </div>
                                    {selectedPosts.size > 0 && (
                                        <button onClick={handleBulkDelete} disabled={bulkLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 transition">
                                            {bulkLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Delete Selected
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                {posts.map(p => {
                                    const isSelected = selectedPosts.has(p.id);
                                    return (
                                        <div key={p.id} className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'}`}>
                                            <div className="p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="pt-1"><input type="checkbox" checked={isSelected} onChange={() => { const s = new Set(selectedPosts); s.has(p.id) ? s.delete(p.id) : s.add(p.id); setSelectedPosts(s); }} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <AnonAvatar authorId={p.author_id} size="sm" />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-gray-900 dark:text-white text-sm">{p.author_name || 'Anonymous'}</span>
                                                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded font-mono">#{p.id}</span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">{dayjs(p.created_at).fromNow()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {p.approved ? <Badge color="green" icon={CheckCircle} label="Approved" /> : <Badge color="yellow" icon={AlertTriangle} label="Pending" />}
                                                                {p.pinned && <Badge color="blue" icon={Pin} label="Pinned" />}
                                                                {p.is_permanent && <Badge color="purple" icon={Infinity} label="Perm" />}
                                                                {p.reported && <Badge color="red" icon={AlertTriangle} label="Reported" />}
                                                            </div>
                                                        </div>

                                                        <div className="prose dark:prose-invert max-w-none mb-4 text-sm">
                                                            <p className="whitespace-pre-wrap">{p.text}</p>
                                                        </div>

                                                        {(p.media_url || polls[p.id] || p.events?.length > 0) && (
                                                            <div className="mb-4 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                                                {p.media_url && (
                                                                    <div className="rounded-lg overflow-hidden max-h-64 bg-black/5 flex justify-center">
                                                                        {p.media_type === 'video' ? <video controls src={p.media_url} className="h-full" /> :
                                                                            p.media_type === 'audio' ? <audio controls src={p.media_url} className="w-full mt-2" /> :
                                                                                <img src={p.media_url} alt="content" className="object-contain h-full" />}
                                                                    </div>
                                                                )}
                                                                {polls[p.id] && <div className="p-2"><PollDisplay poll={polls[p.id]} confessionId={p.id} isAdminReview={true} /></div>}
                                                                {p.events?.[0] && <div className="p-2"><EventDisplay {...p.events[0]} /></div>}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                            {!p.approved && <Button size="sm" variant="success" icon={CheckCircle} onClick={() => handleApprove(p.id)} loading={actionLoading[p.id] === 'approve'}>Approve</Button>}
                                                            <Button size="sm" variant="secondary" icon={p.pinned ? PinOff : Pin} onClick={() => handleTogglePin(p.id, p.pinned)} loading={actionLoading[p.id] === 'pin'}>{p.pinned ? 'Unpin' : 'Pin'}</Button>
                                                            <Button size="sm" variant="secondary" icon={Infinity} onClick={() => handleTogglePermanent(p.id, p.is_permanent)} loading={actionLoading[p.id] === 'permanent'}>{p.is_permanent ? 'Make Temp' : 'Make Perm'}</Button>
                                                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(p.id)} loading={actionLoading[p.id] === 'delete-post'}>Delete</Button>
                                                            {p.reported ?
                                                                <Button size="sm" variant="warning" icon={ShieldOff} onClick={() => handleClearReport(p.id)} loading={actionLoading[p.id] === 'clear-report'}>Clear Report</Button> :
                                                                <Button size="sm" variant="ghost" icon={AlertTriangle} onClick={() => handleMarkReview(p.id)} loading={actionLoading[p.id] === 'review'} className="text-yellow-600">Flag</Button>
                                                            }
                                                            <div className="flex-1" />
                                                            <button onClick={() => { setVisibleComments(prev => ({ ...prev, [p.id]: !prev[p.id] })); if (!visibleComments[p.id] && !comments[p.id]) fetchCommentsForPost(p.id); }}
                                                                className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                                                                <MessageCircle className="w-4 h-4" /> {p.comments_count} Comments {visibleComments[p.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </button>
                                                        </div>

                                                        {visibleComments[p.id] && (
                                                            <div className="mt-4 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 space-y-3">
                                                                {commentsLoading[p.id] && <div className="text-center py-2"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" /></div>}
                                                                {comments[p.id]?.map(c => (
                                                                    <div key={c.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm group/comment relative">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="font-bold text-gray-700 dark:text-gray-300">{c.author_name}</span>
                                                                            <button onClick={() => handleDeleteComment(c.id, p.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                        </div>
                                                                        <p className="text-gray-600 dark:text-gray-400">{c.text}</p>
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
                                {hasMore && <button onClick={() => fetchPosts()} disabled={loading} className="w-full py-4 bg-white dark:bg-gray-800 text-indigo-600 font-bold rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition">{loading ? 'Loading...' : 'Load More Posts'}</button>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'matchmaker' && <MatchmakerAdmin />}

                    {activeTab === 'support' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-[calc(100vh-8rem)] flex">
                            <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col ${selectedSupportUser ? 'hidden md:flex' : 'flex'}`}>
                                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"><h3 className="font-bold">Inbox</h3></div>
                                <div className="flex-1 overflow-y-auto">
                                    {supportUsers.map(u => (
                                        <button key={u.user_id} onClick={() => { setSelectedSupportUser(u.user_id); fetchAdminChatHistory(u.user_id); }}
                                            className={`w-full p-4 text-left border-b border-gray-50 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition ${selectedSupportUser === u.user_id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : ''}`}>
                                            <div className="flex justify-between mb-1"><span className="text-xs font-mono text-gray-500">{u.user_id.slice(0, 8)}</span>{u.has_unread && <span className="w-2 h-2 bg-red-500 rounded-full" />}</div>
                                            <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">{u.last_message}</p>
                                            <span className="text-xs text-gray-400">{dayjs(u.last_active).fromNow()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 ${!selectedSupportUser ? 'hidden md:flex' : 'flex'}`}>
                                {selectedSupportUser ? (
                                    <>
                                        <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setSelectedSupportUser(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft className="w-5 h-5" /></button>
                                                <span className="font-mono text-sm font-bold">{selectedSupportUser}</span>
                                            </div>
                                            <button onClick={handleDeleteConversation} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {adminChatHistory.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender_role === 'admin' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none shadow-sm'}`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={adminChatEndRef} />
                                        </div>
                                        <form onSubmit={sendAdminReply} className="p-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
                                            <input value={adminMessageInput} onChange={e => setAdminMessageInput(e.target.value)} placeholder="Type a reply..." className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            <button type="submit" disabled={!adminMessageInput.trim()} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"><Send className="w-5 h-5" /></button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                                        <p>Select a conversation</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcements' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-500" /> Create Announcement</h3>
                                <form onSubmit={createAnnouncement} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3 space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                                            <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="w-full p-2.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Server Maintenance" required />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                            <select value={newAnnouncement.type} onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })} className="w-full p-2.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                                                <option value="info">Info (Blue)</option>
                                                <option value="alert">Alert (Red)</option>
                                                <option value="success">Success (Green)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Content</label>
                                        <textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="w-full p-2.5 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" placeholder="Announcement details..." required />
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-sm">Post Announcement</button>
                                    </div>
                                </form>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-600 dark:text-gray-400 uppercase text-sm">Active Announcements</h3>
                                {announcements.length === 0 && <p className="text-gray-400 italic">No announcements found.</p>}
                                {announcements.map(a => (
                                    <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 p-5 shadow-sm flex justify-between items-start gap-4 ${a.type === 'alert' ? 'border-red-500' : a.type === 'success' ? 'border-green-500' : 'border-indigo-500'}`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg dark:text-white">{a.title}</h4>
                                                {!a.is_active && <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400">Inactive</span>}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{a.content}</p>
                                            <p className="text-xs text-gray-400 mt-2">{dayjs(a.created_at).format('MMM D, YYYY h:mm A')}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => toggleAnnouncement(a.id, a.is_active)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={a.is_active ? 'Deactivate' : 'Activate'}>
                                                {a.is_active ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function Badge({ color, icon: Icon, label }) {
    const colors = {
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${colors[color]}`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    )
}

function Button({ children, onClick, disabled, loading, icon: Icon, variant = 'primary', size = 'md', className = '' }) {
    const base = "inline-flex items-center justify-center gap-1.5 font-bold transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400',
        success: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400',
        warning: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
    }

    return (
        <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
            {loading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
        </button>
    )
}