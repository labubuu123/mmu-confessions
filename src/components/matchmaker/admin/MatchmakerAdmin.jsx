import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import MatchmakerAvatar from '../MatchmakerAvatar';
import {
    Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2,
    RefreshCw, Flag, Trash2, MapPin, User, Search, Hash,
    KeyRound, MessageCircle, Megaphone, Clock, AlertTriangle,
    TrendingUp, Filter, Users
} from 'lucide-react';

// Helper component for long text
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

// Top Stats Row Component
const StatsRow = ({ pending, approved, loves, reports }) => {
    const stats = [
        { label: 'Pending', count: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        { label: 'Active', count: approved.length, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Reports', count: reports.length, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        { label: 'Total Matches', count: loves.length, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
                <div key={i} className={`${s.bg} p-4 rounded-3xl border border-white dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-top-${i + 1}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 shadow-sm">
                            <s.icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{s.count}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function MatchmakerAdmin() {
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
    const [searchTerm, setSearchTerm] = useState('');

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
                fetchFeed(),
                fetchUsernames()
            ]);
        } catch (error) { console.error("Error refreshing admin data:", error); }
        finally { setLoading(false); }
    };

    const fetchUsernames = async () => {
        const { data } = await supabase.from('matchmaker_credentials').select('user_id, username');
        if (data) {
            const map = {};
            data.forEach(u => { map[u.user_id] = u.username });
            setUsernames(map);
        }
    };

    const fetchPending = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'pending').order('updated_at', { ascending: true }); setPending(data || []); };
    const fetchApproved = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'approved').order('updated_at', { ascending: false }); setApproved(data || []); };
    const fetchRejected = async () => { const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'rejected').order('updated_at', { ascending: false }); setRejected(data || []); };
    const fetchLoves = async () => { const { data } = await supabase.from('matchmaker_loves').select('*, from:from_user_id(nickname), to:to_user_id(nickname)').order('created_at', { ascending: false }).limit(50); setLoves(data || []); };
    const fetchReports = async () => { const { data } = await supabase.from('matchmaker_reports').select('*, reporter:reporter_id(nickname), reported:reported_id(nickname, warning_count, status)').order('created_at', { ascending: false }); setReports(data || []); };
    const fetchFeed = async () => {
        const { data } = await supabase.from('matchmaker_feed').select('*, author:matchmaker_profiles(nickname)').order('created_at', { ascending: false });
        setFeed(data || []);
    };

    // Filtered Lists Logic
    const filteredList = useMemo(() => {
        let currentList = [];
        if (activeTab === 'pending') currentList = pending;
        else if (activeTab === 'approved') currentList = approved;
        else if (activeTab === 'rejected') currentList = rejected;
        else return []; // Feed has separate rendering

        if (!searchTerm) return currentList;

        const term = searchTerm.toLowerCase();
        return currentList.filter(p =>
            p.nickname?.toLowerCase().includes(term) ||
            usernames[p.author_id]?.toLowerCase().includes(term) ||
            p.contact_info?.toLowerCase().includes(term)
        );
    }, [activeTab, pending, approved, rejected, searchTerm, usernames]);

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return;
        setProcessingId(id);
        try {
            const updates = {
                status,
                updated_at: new Date().toISOString(),
                rejection_reason: reason
            };

            // Toggle visibility based on status
            updates.is_visible = status === 'approved';

            const { error } = await supabase.from('matchmaker_profiles').update(updates).eq('author_id', id);
            if (error) throw error;

            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const handleReject = async (id, currentNickname) => {
        const reason = window.prompt(`Rejection reason for ${currentNickname}:`, "Profile incomplete or invalid contact info");
        if (reason?.trim()) await updateStatus(id, 'rejected', reason);
    };

    const handleBan = async (id, nickname) => {
        const reason = window.prompt(`BAN ${nickname}? This disables the account. Message:`, "TOS Violation");
        if (reason) await updateStatus(id, 'banned', reason);
    };

    const handleWarnAndRevoke = async (userId, currentCount, reportReason) => {
        if (processingId) return;
        const newCount = (currentCount || 0) + 1;
        const customReason = window.prompt("Warning message:", `Warning #${newCount}: Reported for ${reportReason || 'Inappropriate behavior'}.`);
        if (!customReason) return;

        setProcessingId(userId);
        try {
            await supabase.from('matchmaker_profiles').update({
                status: 'rejected',
                warning_count: newCount,
                rejection_reason: customReason,
                is_visible: false
            }).eq('author_id', userId);

            await supabase.from('matchmaker_reports').delete().eq('reported_id', userId);
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const handleDismissReport = async (reportId) => {
        if (!window.confirm("Dismiss report?")) return;
        await supabase.from('matchmaker_reports').delete().eq('id', reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
    };

    const handleDeletePost = async (id) => {
        if (!confirm("Permanently delete this feed post?")) return;
        try {
            await supabase.from('matchmaker_feed').delete().eq('id', id);
            setFeed(prev => prev.filter(p => p.id !== id));
        } catch (err) { alert("Delete failed: " + err.message); }
    };

    const ProfileCard = ({ p, children }) => (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
            <div className="p-5 flex items-center gap-4 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-3xl overflow-hidden bg-white shadow-sm shrink-0 border-2 border-white dark:border-gray-700">
                    <MatchmakerAvatar config={p.avatar_config} gender={p.gender} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-black text-lg text-gray-900 dark:text-white truncate">{p.nickname}</h3>
                    <div className="flex flex-wrap gap-2 text-[10px] mt-1">
                        <span className={`capitalize px-2 py-0.5 rounded-full font-bold border ${p.gender === 'male' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>{p.gender}, {p.age}</span>
                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full"><MapPin className="w-2.5 h-2.5" /> {p.city}</span>
                        <span className="flex items-center gap-1 text-indigo-600 font-mono font-bold"><KeyRound className="w-2.5 h-2.5" /> {usernames[p.author_id] || 'unknown'}</span>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4 flex-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    {p.mbti && <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1.5 rounded-xl text-center font-black text-xs border border-blue-100 dark:border-blue-900/50">{p.mbti}</div>}
                    {p.zodiac && <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1.5 rounded-xl text-center font-black text-xs border border-purple-100 dark:border-purple-900/50">{p.zodiac}</div>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Introduction</label>
                    <ExpandableText text={p.self_intro} />
                </div>

                <div className="pt-3 border-t border-dashed border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contact Handle</label>
                    <p className="font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded-xl select-all truncate text-indigo-600 dark:text-indigo-400 font-bold border border-gray-100 dark:border-gray-800">{p.contact_info}</p>
                </div>

                {p.rejection_reason && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-1 font-bold mb-1"><AlertTriangle className="w-3 h-3" /> History:</div>
                        {p.rejection_reason}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Matchmaker Control</h1>
                    <p className="text-gray-500 font-medium">Manage profiles, reports, and social feed.</p>
                </div>
                <button onClick={refreshAll} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
                </button>
            </div>

            <StatsRow pending={pending} approved={approved} loves={loves} reports={reports} />

            {/* Reports Section */}
            {reports.length > 0 && (activeTab === 'pending' || activeTab === 'approved') && (
                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-3xl p-6">
                    <h3 className="font-black text-red-700 dark:text-red-400 flex items-center gap-2 mb-4 uppercase tracking-wider text-sm"><ShieldAlert className="w-5 h-5" /> Flagged Users ({reports.length})</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map(r => (
                            <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/20 text-sm">
                                <div className="flex justify-between font-black mb-1 dark:text-white"><span>{r.reported?.nickname}</span><span className="text-xs text-red-500">{r.reported?.warning_count || 0} Warns</span></div>
                                <div className="text-gray-400 text-[10px] font-bold uppercase mb-2">Reported by: {r.reporter?.nickname}</div>
                                <div className="bg-red-50/50 dark:bg-red-900/20 p-3 rounded-xl text-red-700 dark:text-red-300 italic mb-4 text-xs">"{r.reason}"</div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDismissReport(r.id)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase">Dismiss</button>
                                    <button onClick={() => handleWarnAndRevoke(r.reported_id, r.reported?.warning_count, r.reason)} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase">Warn</button>
                                    <button onClick={() => handleBan(r.reported_id, r.reported?.nickname)} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase">Ban</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs & Search */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <div className="flex gap-2">
                        {['pending', 'approved', 'rejected', 'feed'].map(t => (
                            <button key={t} onClick={() => { setActiveTab(t); setSearchTerm(''); }} className={`px-6 py-3 rounded-t-2xl font-black capitalize transition-all relative ${activeTab === t ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600'}`}>
                                {t} <span className="text-[10px] opacity-60 ml-1">({t === 'pending' ? pending.length : t === 'approved' ? approved.length : t === 'feed' ? feed.length : rejected.length})</span>
                                {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full" />}
                            </button>
                        ))}
                    </div>

                    {activeTab !== 'feed' && (
                        <div className="relative pb-2 md:pb-0 min-w-[280px]">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search nickname or username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 rounded-xl text-sm outline-none transition-all"
                            />
                        </div>
                    )}
                </div>

                {loading ? <div className="flex flex-col items-center justify-center py-20 gap-3"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /><p className="text-gray-400 font-bold animate-pulse">Syncing with database...</p></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Profile List Rendering */}
                        {activeTab !== 'feed' && filteredList.map(p => (
                            <ProfileCard key={p.author_id} p={p}>
                                {activeTab === 'pending' && (
                                    <>
                                        <button onClick={() => updateStatus(p.author_id, 'approved')} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Approve</button>
                                        <button onClick={() => handleReject(p.author_id, p.nickname)} className="bg-white hover:bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><X className="w-4 h-4" /> Reject</button>
                                    </>
                                )}
                                {activeTab === 'approved' && (
                                    <>
                                        <button onClick={() => updateStatus(p.author_id, 'pending')} className="bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Revoke</button>
                                        <button onClick={() => handleBan(p.author_id, p.nickname)} className="bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Ban className="w-4 h-4" /> Ban User</button>
                                    </>
                                )}
                                {activeTab === 'rejected' && (
                                    <div className="col-span-2 text-center text-xs text-gray-400 italic py-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                                        Locked: Waiting for User Fixes
                                    </div>
                                )}
                            </ProfileCard>
                        ))}

                        {/* Feed Management Rendering */}
                        {activeTab === 'feed' && feed.map(post => (
                            <div key={post.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4 animate-in fade-in zoom-in-95">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${post.gender === 'male' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'}`}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                            {post.author?.nickname || 'Unknown'}
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full text-indigo-600 font-bold uppercase tracking-tighter">{post.location_tag}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(post.created_at).toLocaleDateString()} @ {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl text-sm text-gray-700 dark:text-gray-300 italic border border-gray-100 dark:border-gray-800">
                                    "{post.content}"
                                </div>
                                <button onClick={() => handleDeletePost(post.id)} className="w-full py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all">
                                    <Trash2 className="w-4 h-4" /> Delete Post
                                </button>
                            </div>
                        ))}

                        {/* Empty States */}
                        {((activeTab !== 'feed' && !filteredList.length) || (activeTab === 'feed' && !feed.length)) && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                                <Users className="w-12 h-12 mb-4 opacity-20" />
                                <p className="font-bold italic">No records found matching your criteria.</p>
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Search</button>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Match Activity Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 font-black flex items-center gap-3 uppercase tracking-widest text-xs"><Heart className="w-4 h-4 text-pink-500" /> Match Engine Live Feed</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-800 font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">From (Initiator)</th>
                                <th className="px-6 py-4">To (Receiver)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Activity Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loves.map(l => (
                                <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{l.from?.nickname}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{l.to?.nickname}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${l.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' :
                                                l.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-400 text-xs font-mono">
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