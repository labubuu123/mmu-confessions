import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2, RefreshCw, Flag, Trash2, MapPin, User, Search, Hash, KeyRound, MessageCircle, Megaphone } from 'lucide-react';

const AvatarGenerator = ({ nickname, gender }) => {
    const seed = useMemo(() => {
        const str = (nickname || 'User') + gender;
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash);
    }, [nickname, gender]);

    const pick = (options, offset = 0) => options[(seed + offset) % options.length];
    const skinColors = ['#f3d2c1', '#f5e0d7', '#e6c3b3', '#ffdfc4', '#dbb298'];
    const bgColors = gender === 'male' ? ['#e0e7ff', '#dbeafe', '#ccfbf1', '#f3f4f6'] : ['#fce7f3', '#ffe4e6', '#fef3c7', '#fae8ff'];
    const skin = pick(skinColors);
    const bg = pick(bgColors, 1);
    const eyesVariant = seed % 3;
    const mouthVariant = (seed >> 1) % 3;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full bg-white">
            <rect width="100" height="100" fill={bg} />
            <path d="M20 100 Q50 80 80 100" fill={gender === 'male' ? '#6366f1' : '#ec4899'} opacity="0.8" />
            <circle cx="50" cy="50" r="35" fill={skin} />
            <g fill="#1f2937">
                {eyesVariant === 0 && (<><circle cx="38" cy="48" r="4" /><circle cx="62" cy="48" r="4" /></>)}
                {eyesVariant === 1 && (<><path d="M34 50 Q38 42 42 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M58 50 Q62 42 66 50" stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" /></>)}
                {eyesVariant === 2 && (<><circle cx="38" cy="48" r="4" /><path d="M58 48 L66 48" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" /></>)}
            </g>
            <g stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round">
                {mouthVariant === 0 && (<path d="M42 65 Q50 70 58 65" />)}
                {mouthVariant === 1 && (<path d="M38 62 Q50 75 62 62" />)}
                {mouthVariant === 2 && (<circle cx="50" cy="66" r="4" fill="#1f2937" stroke="none" />)}
            </g>
            {gender === 'male' ? (<path d="M25 40 Q50 15 75 40" fill="#1f2937" opacity="0.1" />) : (<path d="M20 45 Q50 10 80 45" fill="#1f2937" opacity="0.1" />)}
        </svg>
    );
};

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
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-sm shrink-0">
                    <AvatarGenerator nickname={p.nickname} gender={p.gender} />
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