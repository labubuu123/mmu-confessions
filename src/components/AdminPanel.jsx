import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3, Calendar, Users, Heart, MessageSquare as ChatIcon, Send,
    Megaphone, Search, Menu, X, ArrowLeft, Infinity, Briefcase, Zap, Image as ImageIcon, Link as LinkIcon, Palette, Star, ArrowUp, Filter
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import UserManagement from './UserManagement'
import MatchmakerAdmin from './matchmaker/admin/MatchmakerAdmin'
import PostModal from './PostModal'
import imageCompression from 'browser-image-compression'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from './NotificationSystem'

dayjs.extend(relativeTime)

const POSTS_PER_PAGE = 20
const ADMIN_EMAIL = 'admin@mmu.edu'

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
    const [selectedPost, setSelectedPost] = useState(null)
    const [filterStatus, setFilterStatus] = useState('pending')
    const { success: notifySuccess, error: notifyError, info: notifyInfo } = useNotifications()

    const [sponsorForm, setSponsorForm] = useState({
        brandName: '',
        content: '',
        link: '',
        whatsapp: '',
        color: '#EAB308',
        images: []
    })
    const [sponsorLoading, setSponsorLoading] = useState(false)
    const [sponsorPreviews, setSponsorPreviews] = useState([])

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
        if (!window.confirm('Are you sure want to sign out?')) return;
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
    }

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (loading && !isInitial) return;
        setLoading(true); if (isInitial) setError(null);

        const currentPage = isInitial ? 0 : page;
        let query = supabase.from('confessions').select('*, events(*)').order('created_at', { ascending: false });
        const { data, error } = await query.range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);

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

    const filteredPosts = posts.filter(p => {
        if (filterStatus === 'pending') return !p.approved;
        if (filterStatus === 'reported') return p.reported;
        return true;
    });

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
            notifySuccess('Post deleted');
        } else {
            notifyError('Failed to delete post');
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
        const successIds = results.filter(r => r.status === 'success').map(r => r.id);
        setPosts(prev => prev.filter(p => !successIds.includes(p.id)));
        setSelectedPosts(new Set());
        setBulkLoading(false);
        notifySuccess(`Deleted ${successIds.length} posts.`);
    }

    async function handleSingleAction(postId, actionType, dbAction) {
        setActionLoading(prev => ({ ...prev, [postId]: actionType }));
        try {
            await dbAction();
            notifySuccess(`Action ${actionType} successful`);
        } catch (e) {
            console.error(e);
            notifyError(e.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [postId]: null }));
        }
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

    function handleSponsorImageChange(e) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setSponsorForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
        const newPreviews = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    setSponsorPreviews(prev => [...prev, ...newPreviews]);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function removeSponsorImage(index) {
        setSponsorForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
        setSponsorPreviews(prev => prev.filter((_, i) => i !== index));
    }

    function setSponsorHero(index) {
        if (index === 0) return;
        setSponsorForm(prev => {
            const newImages = [...prev.images];
            [newImages[0], newImages[index]] = [newImages[index], newImages[0]];
            return { ...prev, images: newImages };
        });
        setSponsorPreviews(prev => {
            const newPreviews = [...prev];
            [newPreviews[0], newPreviews[index]] = [newPreviews[index], newPreviews[0]];
            return newPreviews;
        });
    }

    async function handleSponsorSubmit(e) {
        e.preventDefault();
        setSponsorLoading(true);
        try {
            let media_urls = [];
            let single_media_url = null;
            if (sponsorForm.images.length > 0) {
                for (let i = 0; i < sponsorForm.images.length; i++) {
                    const img = sponsorForm.images[i];
                    const compressed = await imageCompression(img, { maxSizeMB: 1, maxWidthOrHeight: 1600 });
                    const ext = (compressed.name || 'image.jpg').split('.').pop();
                    const path = `public/sponsored-${Date.now()}-${i}.${ext}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage.from('confessions').upload(path, compressed);
                    if (uploadError) throw uploadError;
                    const { data: publicUrlData } = supabase.storage.from('confessions').getPublicUrl(uploadData.path);
                    media_urls.push(publicUrlData.publicUrl);
                }
                single_media_url = media_urls[0];
            }
            const { error: insertError } = await supabase.from('confessions').insert([{
                text: sponsorForm.content,
                author_id: 'admin-sponsor',
                author_name: sponsorForm.brandName,
                media_url: single_media_url,
                media_urls: media_urls.length > 0 ? media_urls : null,
                media_type: media_urls.length > 0 ? 'images' : null,
                approved: true,
                is_sponsored: true,
                sponsor_url: sponsorForm.link || null,
                whatsapp_number: sponsorForm.whatsapp || null,
                brand_color: sponsorForm.color || '#EAB308',
                pinned: true
            }]);
            if (insertError) throw insertError;
            notifySuccess('Sponsored post created successfully!');
            setSponsorForm({ brandName: '', content: '', link: '', whatsapp: '', color: '#EAB308', images: [] });
            setSponsorPreviews([]);
            fetchPosts(true);
        } catch (err) {
            console.error(err);
            notifyError('Failed to create sponsored post: ' + err.message);
        } finally {
            setSponsorLoading(false);
        }
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

    async function fetchAnnouncements() {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        setAnnouncements(data || []);
    }
    async function createAnnouncement(e) {
        e.preventDefault();
        const { error } = await supabase.from('announcements').insert([newAnnouncement]);
        if (error) notifyError('Error creating announcement');
        else {
            setNewAnnouncement({ title: '', content: '', type: 'info' });
            fetchAnnouncements();
            notifySuccess('Announcement posted');
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
    async function handleDeleteComment(commentId, postId) {
        if (!window.confirm('Delete comment?')) return;
        await supabase.rpc('delete_comment_as_admin', { comment_id_in: commentId });
        await fetchCommentsForPost(postId);
        notifySuccess('Comment deleted');
    }

    if (!user) {
        return (
            <div className="flex items-start justify-center bg-gray-50 dark:bg-gray-900 px-4 pt-10 md:pt-12">
                <div className="w-full max-w-md relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-30 transform -rotate-2"></div>
                    <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Admin Portal</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Secure Access Only</p>
                        </div>
                        <form onSubmit={signIn} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white" required />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white" required />
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transform">
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Access Dashboard</>}
                            </button>
                            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-bold animate-pulse">{error}</div>}
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    const menuItems = [
        { id: 'moderation', label: 'Moderation', icon: Shield },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'matchmaker', label: 'Matchmaker', icon: Heart },
        { id: 'sponsorships', label: 'Sponsorships', icon: Briefcase },
        { id: 'support', label: 'Support', icon: ChatIcon },
        { id: 'announcements', label: 'Announcement', icon: Megaphone }
    ];

    return (
        <div className="min-30h-screen bg-gray-100 dark:bg-gray-900 flex">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"><Shield className="w-5 h-5 text-white" /></div>
                            <span className="font-bold text-lg dark:text-white tracking-tight">Admin<span className="text-indigo-500">Panel</span></span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:bg-gray-100 rounded-lg p-1"><X className="w-6 h-6" /></button>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map(item => (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <item.icon className="w-5 h-5" /> {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">A</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Admin</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-xs font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 lg:ml-64 min-w-0 flex flex-col h-screen overflow-hidden">
                <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Menu className="w-6 h-6" /></button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize tracking-tight flex items-center gap-2">
                            {menuItems.find(m => m.id === activeTab)?.icon && React.createElement(menuItems.find(m => m.id === activeTab).icon, { className: "w-5 h-5 text-indigo-500" })}
                            {activeTab}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'moderation' && (
                            <button onClick={() => fetchPosts(true)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition" title="Refresh">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button onClick={signOut} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Sign Out">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'moderation' && (
                            <div className="space-y-6">
                                <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur pb-2">
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl">
                                            {['pending', 'reported', 'all'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => { setFilterStatus(status); setSelectedPosts(new Set()); }}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === status ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {selectedPosts.size > 0 && (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    onClick={handleBulkDelete}
                                                    disabled={bulkLoading}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-700 shadow-md transition"
                                                >
                                                    {bulkLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                    Delete ({selectedPosts.size})
                                                </motion.button>
                                            )}
                                            <button onClick={() => setSelectedPosts(selectedPosts.size === filteredPosts.length ? new Set() : new Set(filteredPosts.map(p => p.id)))}
                                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Select All">
                                                {selectedPosts.size > 0 && selectedPosts.size === filteredPosts.length ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {filteredPosts.map(p => {
                                            const isSelected = selectedPosts.has(p.id);
                                            return (
                                                <motion.div
                                                    key={p.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className={`group bg-white dark:bg-gray-800 rounded-2xl border transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'}`}
                                                >
                                                    <div className="p-5 flex gap-4">
                                                        <div className="pt-1 cursor-pointer" onClick={() => { const s = new Set(selectedPosts); s.has(p.id) ? s.delete(p.id) : s.add(p.id); setSelectedPosts(s); }}>
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <AnonAvatar authorId={p.author_id} size="sm" isSponsored={p.is_sponsored} />
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`font-bold text-sm ${p.is_sponsored ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>{p.author_name || 'Anonymous'}</span>
                                                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded font-mono">#{p.id}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{dayjs(p.created_at).fromNow()}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {p.is_sponsored && <Badge color="yellow" icon={Zap} label="Sponsored" />}
                                                                    {p.approved ? <Badge color="green" icon={CheckCircle} label="Approved" /> : <Badge color="yellow" icon={AlertTriangle} label="Pending" />}
                                                                    {p.pinned && <Badge color="blue" icon={Pin} label="Pinned" />}
                                                                    {p.reported && <Badge color="red" icon={AlertTriangle} label={`Reported (${p.report_count})`} />}
                                                                </div>
                                                            </div>

                                                            <div className="prose dark:prose-invert max-w-none mb-4 text-sm text-gray-800 dark:text-gray-200">
                                                                <p className="whitespace-pre-wrap leading-relaxed">{p.text}</p>
                                                            </div>

                                                            {(p.media_url || polls[p.id] || p.events?.length > 0) && (
                                                                <div className="mb-4 p-2 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                                                    {p.media_url && (
                                                                        <div className="rounded-lg overflow-hidden max-h-64 flex justify-center bg-gray-100 dark:bg-gray-800">
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
                                                                <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDelete(p.id)} loading={actionLoading[p.id] === 'delete-post'}>Delete</Button>
                                                                {p.reported ?
                                                                    <Button size="sm" variant="warning" icon={ShieldOff} onClick={() => handleClearReport(p.id)} loading={actionLoading[p.id] === 'clear-report'}>Clear Report</Button> :
                                                                    <Button size="sm" variant="ghost" icon={AlertTriangle} onClick={() => handleMarkReview(p.id)} loading={actionLoading[p.id] === 'review'} className="text-yellow-600 hover:bg-yellow-50">Flag</Button>
                                                                }
                                                                <div className="flex-1" />
                                                                <button onClick={() => { setVisibleComments(prev => ({ ...prev, [p.id]: !prev[p.id] })); if (!visibleComments[p.id] && !comments[p.id]) fetchCommentsForPost(p.id); }}
                                                                    className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                                                                    <MessageCircle className="w-3.5 h-3.5" /> {p.comments_count} {visibleComments[p.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                </button>
                                                            </div>

                                                            <AnimatePresence>
                                                                {visibleComments[p.id] && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="mt-4 pt-2 space-y-3">
                                                                            {commentsLoading[p.id] && <div className="text-center py-2"><RefreshCw className="w-4 h-4 animate-spin inline text-indigo-500" /></div>}
                                                                            {comments[p.id]?.map(c => (
                                                                                <div key={c.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-sm border border-gray-100 dark:border-gray-800 flex gap-3">
                                                                                    <div className="w-1 bg-indigo-200 dark:bg-indigo-900 rounded-full shrink-0"></div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex justify-between items-center mb-1">
                                                                                            <span className="font-bold text-gray-900 dark:text-gray-100 text-xs">{c.author_name || 'Anonymous'}</span>
                                                                                            <button onClick={() => handleDeleteComment(c.id, p.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                                                                        </div>
                                                                                        <p className="text-gray-600 dark:text-gray-300">{c.text}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>

                                    {!loading && filteredPosts.length === 0 && (
                                        <div className="text-center py-20 text-gray-400">
                                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>No posts found for this filter.</p>
                                        </div>
                                    )}

                                    {hasMore && (
                                        <button onClick={() => fetchPosts()} disabled={loading} className="w-full py-4 bg-white dark:bg-gray-800 text-indigo-600 font-bold rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition shadow-sm">
                                            {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Load More Posts'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'support' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-[calc(100vh-8rem)] flex">
                                <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col ${selectedSupportUser ? 'hidden md:flex' : 'flex'}`}>
                                    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Inbox</h3>
                                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{supportUsers.filter(u => u.has_unread).length} New</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {supportUsers.map(u => (
                                            <button key={u.user_id} onClick={() => { setSelectedSupportUser(u.user_id); fetchAdminChatHistory(u.user_id); }}
                                                className={`w-full p-4 text-left border-b border-gray-50 dark:border-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition group ${selectedSupportUser === u.user_id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-mono font-bold text-gray-500 group-hover:text-indigo-600">{u.user_id.slice(0, 8)}...</span>
                                                    {u.has_unread && <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" />}
                                                </div>
                                                <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200 mb-1">{u.last_message}</p>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{dayjs(u.last_active).fromNow()}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 ${!selectedSupportUser ? 'hidden md:flex' : 'flex'}`}>
                                    {selectedSupportUser ? (
                                        <>
                                            <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between shadow-sm z-10">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => setSelectedSupportUser(null)} className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft className="w-5 h-5" /></button>
                                                    <div>
                                                        <span className="font-mono text-xs text-gray-400 block uppercase tracking-wider">Chat with</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">{selectedSupportUser}</span>
                                                    </div>
                                                </div>
                                                <button onClick={handleDeleteConversation} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                {adminChatHistory.map(msg => (
                                                    <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${msg.sender_role === 'admin' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none text-gray-800 dark:text-gray-200'}`}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={adminChatEndRef} />
                                            </div>
                                            <form onSubmit={sendAdminReply} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2">
                                                <input value={adminMessageInput} onChange={e => setAdminMessageInput(e.target.value)} placeholder="Type a reply..." className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                                                <button type="submit" disabled={!adminMessageInput.trim()} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-500/20"><Send className="w-5 h-5" /></button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                <ChatIcon className="w-10 h-10 opacity-30" />
                                            </div>
                                            <p className="font-bold text-lg">Select a conversation</p>
                                            <p className="text-sm">View user reports and messages here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'sponsorships' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                                        <Briefcase className="w-6 h-6" /> Create Sponsored Post
                                    </h3>
                                    <form onSubmit={handleSponsorSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Brand Name</label>
                                                <input type="text" value={sponsorForm.brandName} onChange={e => setSponsorForm({ ...sponsorForm, brandName: e.target.value })} className="w-full p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none" placeholder="e.g. Star Coffee" required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2"><Palette className="w-4 h-4" /> Brand Theme Color</label>
                                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border dark:border-gray-600">
                                                    <input type="color" value={sponsorForm.color} onChange={(e) => setSponsorForm({ ...sponsorForm, color: e.target.value })} className="w-10 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                                                    <span className="text-xs text-gray-500 font-mono">{sponsorForm.color}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Ad Copy</label>
                                            <textarea value={sponsorForm.content} onChange={e => setSponsorForm({ ...sponsorForm, content: e.target.value })} className="w-full p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none h-32 resize-none" placeholder="Write engaging promotional content here..." required />
                                        </div>
                                        <div className="flex justify-end pt-4">
                                            <button type="submit" disabled={sponsorLoading} className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl transition shadow-lg flex items-center gap-2">
                                                {sponsorLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Launch Campaign</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'matchmaker' && <MatchmakerAdmin />}
                        {activeTab === 'announcements' && (
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-500" /> New Announcement</h3>
                                    <form onSubmit={createAnnouncement} className="space-y-4">
                                        <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="w-full p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Title" required />
                                        <textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="w-full p-3 rounded-xl border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none h-24" placeholder="Content..." required />
                                        <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition">Post</button>
                                    </form>
                                </div>
                                <div className="space-y-4">
                                    {announcements.map(a => (
                                        <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 p-5 shadow-sm flex justify-between items-start gap-4 ${a.type === 'alert' ? 'border-red-500' : 'border-indigo-500'}`}>
                                            <div>
                                                <h4 className="font-bold text-lg dark:text-white">{a.title}</h4>
                                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{a.content}</p>
                                                <p className="text-xs text-gray-400 mt-2">{dayjs(a.created_at).format('MMM D, YYYY')}</p>
                                            </div>
                                            <button onClick={() => deleteAnnouncement(a.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            {selectedPost && (
                <PostModal
                    postId={selectedPost.id}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    )
}

function Badge({ color, icon: Icon, label }) {
    const colors = {
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colors[color]}`}>
            <Icon className="w-3 h-3" /> {label}
        </span>
    )
}

function Button({ children, onClick, disabled, loading, icon: Icon, variant = 'primary', size = 'md', className = '' }) {
    const base = "inline-flex items-center justify-center gap-1.5 font-bold transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 hover:dark:bg-red-900/30',
        success: 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 hover:dark:bg-green-900/30',
        warning: 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 hover:dark:bg-orange-900/30',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
    }

    return (
        <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : Icon && <Icon className="w-3.5 h-3.5" />}
            {children}
        </button>
    )
}