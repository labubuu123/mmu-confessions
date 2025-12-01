import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2, RefreshCw, Flag, Trash2, MapPin, User, Search, Hash, KeyRound, MessageCircle, AlertTriangle } from 'lucide-react';

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
        <svg viewBox="0 0 100 100" className="w-full h-full bg-gray-50">
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

const ExpandableText = ({ text, limit = 80 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return <span className="text-gray-400 italic">No text provided</span>;
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
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [usernames, setUsernames] = useState({});

    useEffect(() => { refreshAll(); }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPending(), fetchApproved(), fetchRejected(), fetchLoves(), fetchReports()]);
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

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return; setProcessingId(id);
        try {
            const updates = { status, updated_at: new Date().toISOString() };
            if (reason) updates.rejection_reason = reason;
            if (status === 'rejected' || status === 'banned') updates.is_visible = false;
            await supabase.from('matchmaker_profiles').update(updates).eq('author_id', id);
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); } finally { setProcessingId(null); }
    };

    const handleReject = async (id, currentNickname) => {
        const reason = window.prompt(`Rejection reason for ${currentNickname}:`, "Profile incomplete or invalid info.");
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 relative">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white shadow-sm shrink-0 border-2 border-white dark:border-gray-700">
                    <AvatarGenerator nickname={p.nickname} gender={p.gender} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{p.nickname}</h3>
                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${p.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{p.gender}</span>
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300">{p.age}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city || 'Unknown'}</span>
                        <span className="flex items-center gap-1 text-indigo-500 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-1.5 rounded"><KeyRound className="w-3 h-3" /> {usernames[p.author_id] || 'Guest'}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3 flex-1 text-sm">
                {p.red_flags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {p.red_flags.map((f, i) => <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-[10px] rounded border border-red-100 dark:border-red-900 font-bold uppercase">{f}</span>)}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded text-center">
                        <span className="text-gray-400 font-bold block text-[10px] uppercase">MBTI</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{p.mbti || '-'}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded text-center">
                        <span className="text-gray-400 font-bold block text-[10px] uppercase">Zodiac</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{p.zodiac?.split(' ')[0] || '-'}</span>
                    </div>
                </div>

                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self Intro</span>
                    <ExpandableText text={p.self_intro} />
                </div>
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Looking For</span>
                    <ExpandableText text={p.looking_for} />
                </div>

                <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact (Private)</span>
                    <p className="font-mono bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1.5 rounded select-all truncate text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 mt-1">{p.contact_info}</p>
                </div>

                {p.rejection_reason && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs rounded border border-red-200 dark:border-red-800">
                        <strong>Rejection Reason:</strong> {p.rejection_reason}
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {reports.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-4 text-lg">
                        <ShieldAlert className="w-6 h-6 animate-pulse" /> Active Reports ({reports.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map(r => (
                            <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900 text-sm flex flex-col">
                                <div className="flex justify-between font-bold mb-2 dark:text-white">
                                    <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> {r.reported?.nickname}</span>
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{r.reported?.warning_count} Warns</span>
                                </div>
                                <div className="text-gray-500 text-xs mb-2">Reported by: <strong>{r.reporter?.nickname}</strong></div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-gray-700 dark:text-gray-300 italic mb-4 flex-1 border border-gray-100 dark:border-gray-700">
                                    "{r.reason}"
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-auto">
                                    <button onClick={() => handleDismissReport(r.id)} className="py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-xs font-bold transition">Dismiss</button>
                                    <button onClick={() => handleWarnAndRevoke(r.reported_id, r.reported?.warning_count, r.reason)} className="py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-xs font-bold transition">Warn</button>
                                    <button onClick={() => handleBan(r.reported_id, r.reported?.nickname)} className="py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition">Ban</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full md:w-auto self-start overflow-x-auto">
                {['pending', 'approved', 'rejected'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold capitalize transition-all text-sm ${activeTab === t ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                        {t} <span className="ml-1 opacity-60 text-xs bg-gray-200 dark:bg-gray-900 px-1.5 py-0.5 rounded-full">{t === 'pending' ? pending.length : t === 'approved' ? approved.length : rejected.length}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeTab === 'pending' && pending.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <button onClick={() => updateStatus(p.author_id, 'approved')} className="bg-green-100 hover:bg-green-200 text-green-700 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition"><Check className="w-3.5 h-3.5" /> Approve</button>
                            <button onClick={() => handleReject(p.author_id, p.nickname)} className="bg-red-100 hover:bg-red-200 text-red-700 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition"><X className="w-3.5 h-3.5" /> Reject</button>
                        </ProfileCard>
                    ))}
                    {activeTab === 'approved' && approved.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <button onClick={() => updateStatus(p.author_id, 'pending')} className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition"><Ban className="w-3.5 h-3.5" /> Revoke</button>
                            <button onClick={() => handleBan(p.author_id, p.nickname)} className="bg-gray-800 hover:bg-black text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition"><Trash2 className="w-3.5 h-3.5" /> Ban</button>
                        </ProfileCard>
                    ))}
                    {activeTab === 'rejected' && rejected.map(p => (
                        <ProfileCard key={p.author_id} p={p}>
                            <div className="col-span-2 text-center text-xs text-gray-400 italic py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">Waiting for user update...</div>
                        </ProfileCard>
                    ))}
                    {((activeTab === 'pending' && !pending.length) || (activeTab === 'approved' && !approved.length) || (activeTab === 'rejected' && !rejected.length)) && (
                        <div className="col-span-full py-12 text-center text-gray-400 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center">
                            <Search className="w-10 h-10 mb-2 opacity-20" />
                            <p>No profiles found in this category.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Heart className="w-5 h-5 text-pink-500 fill-current" /> Recent Connections
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 font-bold">From</th>
                                <th className="px-6 py-3 font-bold">To</th>
                                <th className="px-6 py-3 font-bold">Status</th>
                                <th className="px-6 py-3 text-right font-bold">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loves.map(l => (
                                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                            {l.from?.nickname?.substring(0, 1)}
                                        </div>
                                        {l.from?.nickname}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{l.to?.nickname}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${l.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                            l.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-400 text-xs font-mono">
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