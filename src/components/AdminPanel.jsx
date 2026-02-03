import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
    Shield, Trash2, RefreshCw, LogIn, LogOut, AlertTriangle, CheckCircle,
    MessageCircle, ChevronDown, ChevronUp, Pin, PinOff, CheckSquare, Square,
    ShieldOff, BarChart3, Calendar, Users, Heart, MessageSquare, Send,
    Megaphone, Search, Menu, X, ArrowLeft, Infinity, Briefcase, Zap,
    Image as ImageIcon, Link as LinkIcon, Palette, Star, ArrowUp, ShoppingBag, Tag, Quote,
    Activity, MapPin, ClipboardList, Check, Search as SearchIcon, FileText,
    Flame, XCircle, CornerDownRight, ShieldAlert, UserCheck, Ban, Loader2, Flag,
    User, Hash, KeyRound
} from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import UserManagement from './UserManagement'
import PostModal from './PostModal'
import MatchmakerAvatar from './matchmaker/MatchmakerAvatar'
import imageCompression from 'browser-image-compression';

dayjs.extend(relativeTime)

const POSTS_PER_PAGE = 10

export default function AdminPanel() {
    const [user, setUser] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [posts, setPosts] = useState([])
    const [polls, setPolls] = useState({})
    const [parentPosts, setParentPosts] = useState({})
    const [lostFoundItems, setLostFoundItems] = useState([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
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
    const [sponsorForm, setSponsorForm] = useState({
        brandName: '',
        content: '',
        link: '',
        whatsapp: '',
        color: '#EAB308',
        images: []
    });
    const [sponsorLoading, setSponsorLoading] = useState(false);
    const [sponsorPreviews, setSponsorPreviews] = useState([]);
    const [marketItems, setMarketItems] = useState([]);
    const [marketLoading, setMarketLoading] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const verifyAdminStatus = async () => {
        try {
            const { data: isAdmin, error } = await supabase.rpc('is_admin');

            if (error || !isAdmin) {
                console.warn("Security check failed: User is not an admin.");
                await supabase.auth.signOut();
                setUser(null);
                setError('Access Denied: Insufficient Permissions');
                return false;
            }
            return true;
        } catch (err) {
            console.error("Admin verification error:", err);
            await supabase.auth.signOut();
            return false;
        }
    };

    useEffect(() => {
        checkSession()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setUser(null); setPosts([]); setSelectedPosts(new Set());
                } else if (event === 'SIGNED_IN') {
                    const isVerified = await verifyAdminStatus();
                    if (isVerified) {
                        setUser(session.user);
                        fetchPosts(true);
                    }
                }
            }
        )
        return () => subscription?.unsubscribe()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== debouncedSearch) {
                setDebouncedSearch(searchQuery);
                if (activeTab === 'moderation') {
                    setPage(0);
                    fetchPosts(true, searchQuery);
                }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!user) return;
        if (activeTab === 'moderation' && posts.length > 0) {
            fetchPollsForPosts();
            fetchParentsForPosts();
        }
        if (activeTab === 'support') fetchSupportUsers();
        if (activeTab === 'announcements') fetchAnnouncements();
        if (activeTab === 'marketplace') fetchMarketItems();
        if (activeTab === 'analytics') fetchAnalyticsData();
        if (activeTab === 'lostfound') fetchLostFound();
    }, [posts, activeTab, user])

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
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setLoading(false);
            return setError('Sign-in error: ' + error.message);
        }

        const isVerified = await verifyAdminStatus();
        setLoading(false);

        if (!isVerified) {
            setError('Access Denied: You do not have administrator privileges.');
        } else {
            setUser(data.user);
        }
    }
    async function signOut() {
        if (!window.confirm('Are you sure want to sign out?')) return;
        setLoading(true);
        await supabase.auth.signOut();
        setLoading(false);
    }

    const fetchPosts = useCallback(async (isInitial = false, search = debouncedSearch) => {
        if (loading && !isInitial) return;
        setLoading(true); if (isInitial) setError(null);

        const currentPage = isInitial ? 0 : page;

        let query = supabase.from('confessions')
            .select('*, events(*)', { count: 'exact' });

        if (search) {
            if (!isNaN(search)) {
                query = query.eq('id', search);
            } else {
                query = query.ilike('text', `%${search}%`);
            }
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);

        setLoading(false);
        if (error) return setError(error.message);

        setHasMore(data.length === POSTS_PER_PAGE);
        setPosts(prev => {
            if (isInitial) return data;
            const newPosts = data.filter(d => !prev.some(p => p.id === d.id));
            return [...prev, ...newPosts];
        });
        setPage(isInitial ? 1 : currentPage + 1);
        if (isInitial) setSelectedPosts(new Set());
    }, [page, loading, debouncedSearch])

    async function fetchPollsForPosts() {
        const postIds = posts.map(p => p.id);
        const { data } = await supabase.from('polls').select('*').in('confession_id', postIds);
        if (data) {
            const pollMap = {}; data.forEach(p => pollMap[p.confession_id] = p);
            setPolls(prev => ({ ...prev, ...pollMap }));
        }
    }

    async function fetchParentsForPosts() {
        const parentIds = posts.filter(p => p.reply_to_id).map(p => p.reply_to_id);
        if (parentIds.length === 0) return;

        const { data } = await supabase.from('confessions').select('id, text, author_name').in('id', parentIds);
        if (data) {
            const parentMap = {};
            data.forEach(p => parentMap[p.id] = p);
            setParentPosts(prev => ({ ...prev, ...parentMap }));
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

        if (error) {
            console.error("Deletion failed:", error);
            alert(`Failed to delete post: ${error.message}`);
        } else {
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
        setSponsorForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
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

            alert('Sponsored post created successfully!');
            setSponsorForm({ brandName: '', content: '', link: '', whatsapp: '', color: '#EAB308', images: [] });
            setSponsorPreviews([]);
            fetchPosts(true);

        } catch (err) {
            console.error(err);
            alert('Failed to create sponsored post: ' + err.message);
        } finally {
            setSponsorLoading(false);
        }
    }

    async function fetchMarketItems() {
        setMarketLoading(true);
        const { data, error } = await supabase
            .from('marketplace_items')
            .select('*')
            .order('report_count', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching market items:", error);
        else setMarketItems(data);
        setMarketLoading(false);
    }

    async function handleDeleteMarketItem(itemId) {
        if (!window.confirm("Delete this marketplace item permanently?")) return;

        try {
            const { error } = await supabase.from('marketplace_items').delete().eq('id', itemId);
            if (error) throw error;

            setMarketItems(prev => prev.filter(item => item.id !== itemId));
        } catch (err) {
            alert("Failed to delete item: " + err.message);
        }
    }

    async function handleClearMarketReports(itemId) {
        try {
            const { error } = await supabase.rpc('clear_marketplace_reports', { item_id_input: itemId });
            if (error) throw error;

            setMarketItems(prev => prev.map(item => item.id === itemId ? { ...item, report_count: 0 } : item));
        } catch (err) {
            alert("Failed to clear reports: " + err.message);
        }
    }

    async function fetchAnalyticsData() {
        setAnalyticsLoading(true);
        try {
            const sevenDaysAgo = dayjs().subtract(7, 'days').toISOString();

            const { data: postsData } = await supabase
                .from('confessions')
                .select('id, created_at, author_id')
                .gte('created_at', sevenDaysAgo);

            const { data: commentsData } = await supabase
                .from('comments')
                .select('id, created_at, author_id')
                .gte('created_at', sevenDaysAgo);

            const { count: totalProfiles } = await supabase
                .from('matchmaker_profiles')
                .select('*', { count: 'exact', head: true });

            const dailyStats = {};
            const todayKey = dayjs().format('YYYY-MM-DD');

            for (let i = 0; i < 7; i++) {
                const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
                dailyStats[d] = {
                    date: d,
                    activeUsers: new Set(),
                    posts: 0,
                    comments: 0
                };
            }

            postsData?.forEach(p => {
                const date = dayjs(p.created_at).format('YYYY-MM-DD');
                if (dailyStats[date]) {
                    dailyStats[date].posts++;
                    if (p.author_id) dailyStats[date].activeUsers.add(p.author_id);
                }
            });

            commentsData?.forEach(c => {
                const date = dayjs(c.created_at).format('YYYY-MM-DD');
                if (dailyStats[date]) {
                    dailyStats[date].comments++;
                    if (c.author_id) dailyStats[date].activeUsers.add(c.author_id);
                }
            });

            const statsArray = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
            const todayStats = dailyStats[todayKey] || { activeUsers: new Set(), posts: 0, comments: 0 };

            setAnalyticsData({
                todayActive: todayStats.activeUsers.size,
                todayPosts: todayStats.posts,
                todayComments: todayStats.comments,
                totalProfiles: totalProfiles || 0,
                weeklyData: statsArray.map(s => ({
                    ...s,
                    activeCount: s.activeUsers.size
                }))
            });

        } catch (err) {
            console.error("Analytics Error:", err);
        } finally {
            setAnalyticsLoading(false);
        }
    }

    async function fetchLostFound() {
        const { data } = await supabase.from('lost_and_found').select('*').order('created_at', { ascending: false });
        setLostFoundItems(data || []);
    }

    async function toggleLostFoundStatus(id, current) {
        await supabase.from('lost_and_found').update({ is_resolved: !current }).eq('id', id);
        fetchLostFound();
    }

    async function deleteLostFound(id) {
        if (!window.confirm("Delete this listing?")) return;
        await supabase.from('lost_and_found').delete().eq('id', id);
        fetchLostFound();
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
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'moderation', label: 'Moderation', icon: Shield },
        { id: 'adult', label: 'Adult/NSFW', icon: Flame },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
        { id: 'lostfound', label: 'Lost & Found', icon: ClipboardList },
        { id: 'matchmaker', label: 'Matchmaker', icon: Heart },
        { id: 'sponsorships', label: 'Sponsorships', icon: Briefcase },
        { id: 'support', label: 'Support', icon: MessageSquare },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
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
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <main className="flex-1 lg:ml-64 min-w-0">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300"><Menu className="w-6 h-6" /></button>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{activeTab === 'adult' ? 'Adult/NSFW' : activeTab.replace('lostfound', 'Lost & Found')}</h1>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'moderation' && (
                            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mr-2">
                                <SearchIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search content or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm w-48 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                        {activeTab === 'moderation' && (
                            <button onClick={() => fetchPosts(true)} className="p-2 text-gray-500 hover:text-indigo-600 transition" title="Refresh">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        {activeTab === 'marketplace' && (
                            <button onClick={() => fetchMarketItems()} className="p-2 text-gray-500 hover:text-indigo-600 transition" title="Refresh">
                                <RefreshCw className={`w-5 h-5 ${marketLoading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        {activeTab === 'analytics' && (
                            <button onClick={() => fetchAnalyticsData()} className="p-2 text-gray-500 hover:text-indigo-600 transition" title="Refresh">
                                <RefreshCw className={`w-5 h-5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                        <button onClick={signOut} className="p-2 text-gray-500 hover:text-red-600 transition" title="Sign Out">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="p-4 md:p-6 max-w-7xl mx-auto">
                    {activeTab === 'adult' && <AdultAdmin />}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Platform Activity</h2>
                                <span className="text-xs text-gray-500">Last 7 days</span>
                            </div>

                            {analyticsLoading && !analyticsData ? (
                                <div className="text-center py-20">
                                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                </div>
                            ) : analyticsData ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Live</span>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.todayActive}</p>
                                            <p className="text-sm text-gray-500 mt-1">Daily Active Devices (Interactions)</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.todayPosts}</p>
                                            <p className="text-sm text-gray-500 mt-1">Posts Created Today</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                                                    <MessageCircle className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.todayComments}</p>
                                            <p className="text-sm text-gray-500 mt-1">Comments Posted Today</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-pink-600 dark:text-pink-400">
                                                    <Heart className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{analyticsData.totalProfiles}</p>
                                            <p className="text-sm text-gray-500 mt-1">Total Matchmaker Profiles</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-6">User Activity Trends (7 Days)</h3>
                                            <div className="h-64 flex items-end gap-2 sm:gap-4">
                                                {analyticsData.weeklyData.map((day, idx) => {
                                                    const max = Math.max(...analyticsData.weeklyData.map(d => d.activeCount), 1);
                                                    const height = Math.max((day.activeCount / max) * 100, 5);
                                                    return (
                                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                            <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                                                {day.activeCount} Users
                                                            </div>
                                                            <div
                                                                className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50"
                                                                style={{ height: `${height}%` }}
                                                            >
                                                                <div
                                                                    className="absolute bottom-0 left-0 right-0 bg-indigo-500 opacity-20"
                                                                    style={{ height: `${(day.posts + day.comments) / (max * 2) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs text-gray-400 font-mono rotate-0 truncate w-full text-center">
                                                                {dayjs(day.date).format('ddd D')}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Daily Device Stats</h3>
                                            <div className="flex-1 overflow-y-auto">
                                                <div className="space-y-3">
                                                    {[...analyticsData.weeklyData].reverse().map((day, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                                    {dayjs(day.date).format('MMM D, YYYY')}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {day.posts} posts · {day.comments} comments
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                                    {day.activeCount}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                                                    Online
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

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
                                        <div
                                            key={p.id}
                                            onClick={() => setSelectedPost(p)}
                                            className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'}`}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start gap-4">
                                                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                                        <input type="checkbox" checked={isSelected} onChange={() => { const s = new Set(selectedPosts); s.has(p.id) ? s.delete(p.id) : s.add(p.id); setSelectedPosts(s); }} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <AnonAvatar authorId={p.author_id} size="sm" isSponsored={p.is_sponsored} />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-bold text-sm ${p.is_sponsored ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>{p.author_name || 'Anonymous'}</span>
                                                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded font-mono">#{p.id}</span>
                                                                    </div>
                                                                    <span className="text-xs text-gray-500">{dayjs(p.created_at).fromNow()}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {p.is_sponsored && <Badge color="yellow" icon={Zap} label="Sponsored" />}
                                                                {p.approved ? <Badge color="green" icon={CheckCircle} label="Approved" /> : <Badge color="yellow" icon={AlertTriangle} label="Pending" />}
                                                                {p.pinned && <Badge color="blue" icon={Pin} label="Pinned" />}
                                                                {p.reported && <Badge color="red" icon={AlertTriangle} label="Reported" />}
                                                            </div>
                                                        </div>

                                                        {p.reply_to_id && parentPosts[p.reply_to_id] && (
                                                            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-indigo-500 text-sm">
                                                                <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                                                    <Quote className="w-3 h-3" />
                                                                    <span>Replying to #{p.reply_to_id} ({parentPosts[p.reply_to_id].author_name || 'Anonymous'})</span>
                                                                </div>
                                                                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                                                                    "{parentPosts[p.reply_to_id].text}"
                                                                </p>
                                                            </div>
                                                        )}
                                                        {p.reply_to_id && !parentPosts[p.reply_to_id] && (
                                                            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-gray-300 text-sm">
                                                                <span className="text-xs text-gray-400">Replying to Post #{p.reply_to_id} (Not found or deleted)</span>
                                                            </div>
                                                        )}

                                                        <div className="prose dark:prose-invert max-w-none mb-4 text-sm">
                                                            <p className="whitespace-pre-wrap">{p.text}</p>
                                                        </div>

                                                        {(p.media_url || polls[p.id] || p.events?.length > 0) && (
                                                            <div className="mb-4 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700/50" onClick={(e) => e.stopPropagation()}>
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

                                                        {p.is_sponsored && p.sponsor_url && (
                                                            <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-xs text-yellow-700 dark:text-yellow-500 flex items-center gap-2">
                                                                <LinkIcon className="w-4 h-4" />
                                                                Link: <a href={p.sponsor_url} target="_blank" rel="noreferrer" className="underline truncate">{p.sponsor_url}</a>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                                                            {!p.approved && <Button size="sm" variant="success" icon={CheckCircle} onClick={() => handleApprove(p.id)} loading={actionLoading[p.id] === 'approve'}>Approve</Button>}
                                                            <Button size="sm" variant="secondary" icon={p.pinned ? PinOff : Pin} onClick={() => handleTogglePin(p.id, p.pinned)} loading={actionLoading[p.id] === 'pin'}>{p.pinned ? 'Unpin' : 'Pin'}</Button>
                                                            <Button size="sm" variant="secondary" icon={Infinity} onClick={() => handleTogglePermanent(p.id, p.is_permanent)} loading={actionLoading[p.id] === 'permanent'}>{p.is_permanent ? 'Make Temporary' : 'Make Permanent'}</Button>
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
                                                            <div className="mt-4 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 space-y-3" onClick={(e) => e.stopPropagation()}>
                                                                {commentsLoading[p.id] && (
                                                                    <div className="text-center py-2">
                                                                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                                                                    </div>
                                                                )}

                                                                {comments[p.id]?.length === 0 && (
                                                                    <p className="text-xs text-gray-400 italic">No comments yet.</p>
                                                                )}

                                                                {comments[p.id]?.map(c => (
                                                                    <div key={c.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm border border-gray-100 dark:border-gray-700/50">
                                                                        <div className="flex justify-between items-start mb-2 gap-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                                                                    {c.author_name || 'Anonymous'}
                                                                                </span>
                                                                                <span className="text-xs text-gray-400">
                                                                                    • {dayjs(c.created_at).fromNow()}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleDeleteComment(c.id, p.id)}
                                                                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                                                title="Delete Comment"
                                                                            >
                                                                                {actionLoading[c.id] === 'delete-comment' ? (
                                                                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                                ) : (
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                                                            {c.text}
                                                                        </p>
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

                    {activeTab === 'marketplace' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-600 dark:text-gray-400 uppercase text-sm">Active Listings</h3>
                                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold">{marketItems.length} items</span>
                            </div>

                            {marketLoading && (
                                <div className="text-center py-10">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block"></div>
                                </div>
                            )}

                            {!marketLoading && marketItems.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No marketplace items found.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {marketItems.map(item => (
                                    <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 flex gap-4 ${item.report_count > 0 ? 'border-red-300 dark:border-red-900 shadow-red-100 dark:shadow-none' : 'border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                                        <div className="w-24 h-24 shrink-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                                            {item.images?.[0] ? (
                                                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400"><Tag className="w-6 h-6" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">RM{item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>
                                                    <span>{dayjs(item.created_at).fromNow()}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                {item.report_count > 0 ? (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                                        <AlertTriangle className="w-3 h-3" /> Reported ({item.report_count})
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Clean
                                                    </span>
                                                )}

                                                <div className="flex gap-2">
                                                    {item.report_count > 0 && (
                                                        <button
                                                            onClick={() => handleClearMarketReports(item.id)}
                                                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                                            title="Clear Reports"
                                                        >
                                                            <ShieldOff className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteMarketItem(item.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'sponsorships' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                                    <Briefcase className="w-5 h-5" /> Create Sponsored Post
                                </h3>
                                <form onSubmit={handleSponsorSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Brand Name</label>
                                            <input
                                                type="text"
                                                value={sponsorForm.brandName}
                                                onChange={e => setSponsorForm({ ...sponsorForm, brandName: e.target.value })}
                                                className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none"
                                                placeholder="e.g. Star Coffee"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                                                <Palette className="w-4 h-4" /> Brand Theme Color
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={sponsorForm.color}
                                                    onChange={(e) => setSponsorForm({ ...sponsorForm, color: e.target.value })}
                                                    className="w-12 h-10 rounded cursor-pointer border-0 p-0"
                                                />
                                                <span className="text-xs text-gray-500">Post will glow in this color</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border dark:border-gray-700">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Website Link</label>
                                            <input
                                                type="url"
                                                value={sponsorForm.link}
                                                onChange={e => setSponsorForm({ ...sponsorForm, link: e.target.value })}
                                                className="w-full p-2.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp (Optional)</label>
                                            <input
                                                type="text"
                                                value={sponsorForm.whatsapp}
                                                onChange={e => setSponsorForm({ ...sponsorForm, whatsapp: e.target.value })}
                                                className="w-full p-2.5 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                                                placeholder="e.g. 60123456789"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ad Copy</label>
                                        <textarea
                                            value={sponsorForm.content}
                                            onChange={e => setSponsorForm({ ...sponsorForm, content: e.target.value })}
                                            className="w-full p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-yellow-500 outline-none h-32 resize-none"
                                            placeholder="Write engaging promotional content here..."
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                            <span>Visual Assets</span>
                                            <span className="text-xs font-normal lowercase opacity-75">
                                                {sponsorForm.images.length > 0 ? `${sponsorForm.images.length} files selected` : 'Max 5 images'}
                                            </span>
                                        </label>

                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleSponsorImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="text-sm font-medium">
                                                    {sponsorForm.images.length > 0 ? 'Add More Images' : 'Upload Images'}
                                                </span>
                                            </div>
                                        </div>

                                        {sponsorPreviews.length > 0 && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="relative rounded-xl overflow-hidden h-48 w-full border border-gray-200 dark:border-gray-700 shadow-sm group/preview">
                                                    <img src={sponsorPreviews[0]} alt="Hero" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover/preview:opacity-100 transition-opacity pointer-events-none">
                                                        <span className="text-xs font-bold uppercase tracking-widest border px-2 py-1 rounded">Main Display</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSponsorImage(0)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition z-20"
                                                        title="Delete Hero"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded backdrop-blur-sm pointer-events-none">
                                                        HERO
                                                    </div>
                                                </div>

                                                {sponsorPreviews.length > 1 && (
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {sponsorPreviews.slice(1).map((src, idx) => {
                                                            const realIndex = idx + 1;
                                                            return (
                                                                <div key={realIndex} className="relative h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group/thumb">
                                                                    <img src={src} alt={`Gallery ${realIndex}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSponsorHero(realIndex)}
                                                                            className="p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                                                                            title="Make Hero"
                                                                        >
                                                                            <ArrowUp className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSponsorImage(realIndex)}
                                                                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-center pt-4 border-t dark:border-gray-700">
                                        <button
                                            type="submit"
                                            disabled={sponsorLoading}
                                            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold rounded-xl transition shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                                        >
                                            {sponsorLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                                            Launch Campaign
                                        </button>
                                    </div>
                                </form>
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

                    {activeTab === 'lostfound' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-600 dark:text-gray-400 uppercase text-sm">Lost & Found Listings</h3>
                                <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold">{lostFoundItems.length} items</span>
                            </div>

                            {lostFoundItems.length === 0 ? (
                                <p className="text-gray-400 text-center py-10 italic">No lost & found items recorded.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {lostFoundItems.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${item.type === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                        {item.type}
                                                    </span>
                                                    {item.is_resolved && <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Check className="w-3 h-3" /> Resolved</span>}
                                                </div>
                                                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{item.item_name}</h4>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-3">
                                                    <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {item.location}</p>
                                                    {item.contact_info && <p className="text-xs italic opacity-75">{item.contact_info}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => toggleLostFoundStatus(item.id, item.is_resolved)}
                                                    className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition"
                                                >
                                                    {item.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                                                </button>
                                                <button
                                                    onClick={() => deleteLostFound(item.id)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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
        green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${colors[color]}`}>
            {Icon && <Icon className="w-3 h-3" />} {label}
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

function AdultAdmin() {
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
        if (!window.confirm("Delete this comment? (Any replies to it will also be deleted)")) return;

        const { error } = await supabase.from('adult_comments').delete().eq('id', commentId);

        if (!error) {
            setComments(prev => {
                const postComments = prev[postId] || [];

                const getDescendants = (parentId, all) => {
                    const children = all.filter(c => c.parent_id === parentId);
                    let ids = children.map(c => c.id);
                    children.forEach(child => {
                        ids = [...ids, ...getDescendants(child.id, all)];
                    });
                    return ids;
                };

                const idsToDelete = [commentId, ...getDescendants(commentId, postComments)];

                return {
                    ...prev,
                    [postId]: postComments.filter(c => !idsToDelete.includes(c.id))
                };
            });
        } else {
            alert("Failed to delete comment");
        }
    };

    const updateLocalPost = (id, updates) => {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const renderComments = (postComments) => {
        if (!postComments) return null;

        return postComments.map(comment => {
            const isReply = !!comment.parent_id;
            const aliasColor = comment.author_alias === 'Boy' ? 'text-cyan-600 dark:text-cyan-400' : 'text-pink-600 dark:text-pink-400';

            return (
                <div
                    key={comment.id}
                    className={`flex justify-between items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 ${isReply ? 'ml-8 border-l-4 border-l-gray-300 dark:border-l-gray-600' : ''}`}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isReply && <CornerDownRight className="w-3 h-3 text-gray-400" />}
                            <span className={`text-xs font-bold ${aliasColor}`}>
                                {comment.author_alias}
                            </span>
                            <span className="text--[10px] text-gray-400 font-mono">
                                {dayjs(comment.created_at).format('MMM D, h:mm A')}
                            </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comment.text}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDeleteComment(comment.id, comment.post_id)}
                        className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Comment"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            );
        });
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
                                <span className={`flex items-center gap-1 font-bold ${post.author_alias === 'Boy' ? 'text-cyan-600' : post.author_alias === 'Girl' ? 'text-pink-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {post.author_alias}
                                </span>
                                <span className="text-gray-400">{dayjs(post.created_at).format('MMM D, h:mm A')}</span>
                            </div>
                            <div className="flex gap-2">
                                {post.is_approved
                                    ? <AdultBadge color="green" label="Approved" />
                                    : <AdultBadge color="yellow" label="Pending Approval" />
                                }
                                {post.ai_flagged && <AdultBadge color="red" label="AI Flagged" icon={Shield} />}
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
                                        {renderComments(comments[post.id])}
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

function AdultBadge({ color, label, icon: Icon }) {
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

const ExpandableText = ({ text, limit = 100 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    return (
        <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="whitespace-pre-wrap">{expanded ? text : text.slice(0, limit) + (text.length > limit ? '...' : '')}</span>
            {text.length > limit && (
                <button onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }} className="text-indigo-500 font-bold ml-1 text-xs hover:underline">
                    {expanded ? 'less' : 'more'}
                </button>
            )}
        </div>
    );
};

function MatchmakerAdmin() {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [loves, setLoves] = useState([]);
    const [reports, setReports] = useState([]);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [usernames, setUsernames] = useState({});

    useEffect(() => { refreshAll(); }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPending(),
                fetchApproved(),
                fetchRejected(),
                fetchLoves(),
                fetchReports(),
                fetchFeed()
            ]);
            await fetchUsernames();
        } catch (error) { console.error("Error refreshing admin data:", error); }
        finally { setLoading(false); }
    };

    const fetchUsernames = async () => { const { data } = await supabase.from('matchmaker_credentials').select('user_id, username'); if (data) { const map = {}; data.forEach(u => { map[u.user_id] = u.username }); setUsernames(map); } };
    const fetchPending = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'pending').order('updated_at', { ascending: true }); setPending(data || []); };
    const fetchApproved = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'approved').order('updated_at', { ascending: false }); setApproved(data || []); };
    const fetchRejected = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'rejected').order('updated_at', { ascending: false }); setRejected(data || []); };
    const fetchLoves = async () => { const { data } = await supabase.from('matchmaker_loves').select('*, from:from_user_id(nickname), to:to_user_id(nickname)').order('created_at', { ascending: false }).limit(50); setLoves(data || []); };
    const fetchReports = async () => { const { data } = await supabase.from('matchmaker_reports').select('*, reporter:reporter_id(nickname), reported:reported_id(nickname, warning_count, status)').order('created_at', { ascending: false }); setReports(data || []); };

    const fetchFeed = async () => {
        const { data, error } = await supabase
            .from('matchmaker_feed')
            .select('*, author:matchmaker_profiles(nickname)')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching feed:", error);
        setFeed(data || []);
    };

    const handleDeletePost = async (id) => {
        if (!confirm("Permanently delete this feed post?")) return;
        try {
            const { error } = await supabase.from('matchmaker_feed').delete().eq('id', id);
            if (error) throw error;

            setFeed(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert("Failed to delete post: " + err.message);
        }
    };

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return; setProcessingId(id);
        try {
            const updates = { status, updated_at: new Date().toISOString() };
            if (reason) updates.rejection_reason = reason;

            if (status === 'rejected' || status === 'banned') {
                updates.is_visible = false;
            } else if (status === 'approved') {
                updates.is_visible = true;
                updates.rejection_reason = null;
            }

            await supabase.from('matchmaker_profiles').update(updates).eq('author_id', id);
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); } finally { setProcessingId(null); }
    };

    const handleReject = async (id, currentNickname) => {
        const reason = window.prompt(`Rejection reason for ${currentNickname}:`, "Profile incomplete");
        if (reason?.trim()) await updateStatus(id, 'rejected', reason);
    };

    const handleBan = async (id, nickname) => {
        const reason = window.prompt(`BAN ${nickname}? Message:`, "TOS Violation");
        if (reason) await updateStatus(id, 'banned', reason);
    };

    const handleWarnAndRevoke = async (userId, currentCount, reportReason) => {
        if (processingId) return;
        const newCount = (currentCount || 0) + 1;
        const customReason = window.prompt("Warning message:", `Community Warning #${newCount}: ${reportReason || 'Violation'}.`);
        if (!customReason) return;
        setProcessingId(userId);
        try {
            await supabase.from('matchmaker_profiles').update({ status: 'rejected', warning_count: newCount, rejection_reason: customReason, is_visible: false }).eq('author_id', userId);
            await supabase.from('matchmaker_reports').delete().eq('reported_id', userId);
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); } finally { setProcessingId(null); }
    };

    const handleDismissReport = async (reportId) => {
        if (!window.confirm("Dismiss report?")) return;
        await supabase.from('matchmaker_reports').delete().eq('id', reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
    };

    const ProfileCard = ({ p, children }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-4 flex items-center gap-4 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-3xl overflow-hidden bg-white shadow-sm shrink-0 border-2 border-white dark:border-gray-700">
                    <MatchmakerAvatar config={p.avatar_config} gender={p.gender} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{p.nickname}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                        <span className="capitalize bg-white dark:bg-gray-700 px-2 py-0.5 rounded border dark:border-gray-600">{p.gender}, {p.age}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</span>
                        <span className="flex items-center gap-1 text-indigo-500"><KeyRound className="w-3 h-3" /> {usernames[p.author_id]}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3 flex-1 text-sm">
                {p.red_flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {p.red_flags.map((f, i) => <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded border border-red-100 font-bold">{f}</span>)}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {p.mbti && <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-center font-bold">{p.mbti}</div>}
                    {p.zodiac && <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-center font-bold">{p.zodiac}</div>}
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Self Intro</span>
                    <ExpandableText text={p.self_intro} />
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Looking For</span>
                    <ExpandableText text={p.looking_for} />
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400 uppercase">Contact</span>
                    <p className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded select-all truncate text-indigo-600 dark:text-indigo-400">{p.contact_info}</p>
                </div>
                {p.rejection_reason && p.status !== 'approved' && (
                    <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-100">
                        <strong>Reason:</strong> {p.rejection_reason}
                    </div>
                )}
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {reports.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3"><ShieldAlert className="w-5 h-5" /> Active Reports ({reports.length})</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {reports.map(r => (
                            <div key={r.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-sm">
                                <div className="flex justify-between font-bold mb-1 dark:text-white"><span>{r.reported?.nickname}</span><span className="text-xs text-red-500">{r.reported?.warning_count} Warns</span></div>
                                <div className="text-gray-500 text-xs mb-2">Reporter: {r.reporter?.nickname}</div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300 italic mb-3">"{r.reason}"</div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDismissReport(r.id)} className="flex-1 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold">Dismiss</button>
                                    <button onClick={() => handleWarnAndRevoke(r.reported_id, r.reported?.warning_count, r.reason)} className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-bold">Warn</button>
                                    <button onClick={() => handleBan(r.reported_id, r.reported?.nickname)} className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold">Ban</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1">
                {['pending', 'approved', 'rejected', 'feed'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-t-lg font-bold capitalize transition-colors ${activeTab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
                        {t} ({t === 'pending' ? pending.length : t === 'approved' ? approved.length : t === 'feed' ? feed.length : rejected.length})
                    </button>
                ))}
            </div>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeTab === 'pending' && pending.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <button onClick={() => updateStatus(p.author_id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Approve</button>
                            <button onClick={() => handleReject(p.author_id, p.nickname)} className="bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><X className="w-3 h-3" /> Reject</button>
                        </ProfileCard>
                    ))}
                    {activeTab === 'approved' && approved.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <button onClick={() => updateStatus(p.author_id, 'pending')} className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> Revoke</button>
                            <button onClick={() => handleBan(p.author_id, p.nickname)} className="bg-gray-800 hover:bg-black text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Ban</button>
                        </ProfileCard>
                    ))}
                    {activeTab === 'rejected' && rejected.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <div className="col-span-2 text-center text-xs text-gray-400 italic py-2">Waiting for user update...</div>
                        </ProfileCard>
                    ))}

                    {activeTab === 'feed' && feed.map(post => (
                        <div key={post.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${post.gender === 'male' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                            {post.author?.nickname || 'Unknown'}
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">{post.location_tag}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 italic">
                                "{post.content}"
                            </div>
                            <button
                                onClick={() => handleDeletePost(post.id)}
                                className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Post
                            </button>
                        </div>
                    ))}

                    {((activeTab === 'pending' && !pending.length) || (activeTab === 'approved' && !approved.length) || (activeTab === 'feed' && !feed.length)) && (
                        <div className="col-span-full py-12 text-center text-gray-400 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">No content found.</div>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 font-bold flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Recent Love Activity</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700"><tr><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Time</th></tr></thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loves.map(l => (
                                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2 font-medium">{l.from?.nickname}</td>
                                    <td className="px-4 py-2">{l.to?.nickname}</td>
                                    <td className="px-4 py-2">
                                        <span className={`text-xs font-bold ${l.status === 'accepted' ? 'text-green-500' :
                                            l.status === 'rejected' ? 'text-red-500' :
                                                'text-gray-500 dark:text-gray-400'
                                            }`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-400 text-xs">
                                        {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}