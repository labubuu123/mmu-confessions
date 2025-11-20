import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2, RefreshCw, Flag, AlertTriangle, Trash2, Clock, AtSign, User, Search, Hash, MapPin } from 'lucide-react';

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

export default function MatchmakerAdmin() {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [loves, setLoves] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => { refreshAll(); }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchPending(),
                fetchApproved(),
                fetchRejected(),
                fetchLoves(),
                fetchReports()
            ]);
        } catch (error) {
            console.error("Error refreshing admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'pending').order('updated_at', { ascending: true });
        setPending(data || []);
    };
    const fetchApproved = async () => {
        const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'approved').order('updated_at', { ascending: false });
        setApproved(data || []);
    };
    const fetchRejected = async () => {
        const { data } = await supabase.from('matchmaker_profiles').select('*').eq('status', 'rejected').order('updated_at', { ascending: false });
        setRejected(data || []);
    };
    const fetchLoves = async () => {
        const { data } = await supabase.from('matchmaker_loves').select('*, from:from_user_id(nickname), to:to_user_id(nickname)').order('created_at', { ascending: false }).limit(50);
        setLoves(data || []);
    };
    const fetchReports = async () => {
        const { data } = await supabase.from('matchmaker_reports').select('*, reporter:reporter_id(nickname), reported:reported_id(nickname, warning_count, status)').order('created_at', { ascending: false });
        setReports(data || []);
    };

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return;
        setProcessingId(id);
        try {
            const updates = { status, updated_at: new Date().toISOString() };
            if (reason) updates.rejection_reason = reason;
            if (status === 'rejected' || status === 'banned') updates.is_visible = false;

            const { error } = await supabase.from('matchmaker_profiles').update(updates).eq('author_id', id);
            if (error) throw error;
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const handleReject = async (id, currentNickname) => {
        const reason = window.prompt(`Enter rejection reason for ${currentNickname}:`, "Profile info incomplete");
        if (reason?.trim()) await updateStatus(id, 'rejected', reason);
    };

    const handleBan = async (id, nickname) => {
        const reason = window.prompt(`BAN ${nickname}? Message:`, "Violation of Terms of Service");
        if (!reason) return;
        if (processingId) return;
        setProcessingId(id);
        try {
            const { error } = await supabase.from('matchmaker_profiles').update({ status: 'banned', rejection_reason: reason, is_visible: false }).eq('author_id', id);
            if (error) throw error;
            await supabase.from('matchmaker_reports').delete().eq('reported_id', id);
            await refreshAll();
        } catch (err) { alert(`Error banning: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const handleWarnAndRevoke = async (userId, currentCount, reportReason) => {
        if (processingId) return;
        const newCount = (currentCount || 0) + 1;
        const customReason = window.prompt("Warning message:", `Community Warning #${newCount}: ${reportReason || 'Violation'}.`);
        if (!customReason) return;

        setProcessingId(userId);
        try {
            const { error } = await supabase.from('matchmaker_profiles').update({ status: 'rejected', warning_count: newCount, rejection_reason: customReason, is_visible: false }).eq('author_id', userId);
            if (error) throw error;
            await supabase.from('matchmaker_reports').delete().eq('reported_id', userId);
            await refreshAll();
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const handleDismissReport = async (reportId) => {
        if (processingId) return;
        if (!window.confirm("Dismiss report?")) return;
        setProcessingId(reportId);
        try {
            await supabase.from('matchmaker_reports').delete().eq('id', reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setProcessingId(null); }
    };

    const AdminProfileCard = ({ p, actions }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 text-center relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 md:mb-4 shadow-sm border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-900">
                    <AvatarGenerator nickname={p.nickname} gender={p.gender} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{p.nickname}</h3>
                <div className="flex flex-wrap justify-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <span className="capitalize px-2 py-0.5 bg-white dark:bg-gray-800 rounded border dark:border-gray-700">{p.gender}, {p.age}</span>
                    <span className="flex items-center justify-center gap-1 px-2 py-0.5"><MapPin className="w-3 h-3" /> {p.city}</span>
                </div>
                <div className="mt-4 md:mt-6 w-full p-3 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center justify-center gap-1"> Contact</div>
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all text-sm select-all">
                        {p.contact_info}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 md:p-6 space-y-4 md:space-y-6">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><User className="w-4 h-4" /> About User</h4>
                    <p className="bg-gray-50 dark:bg-gray-900 p-3 md:p-4 rounded-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-100 dark:border-gray-700 text-sm">{p.self_intro}</p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center gap-2"><Search className="w-4 h-4" /> Looking For</h4>
                    <p className="bg-indigo-50 dark:bg-indigo-900/20 p-3 md:p-4 rounded-xl text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-indigo-100 dark:border-indigo-900/50 text-sm">{p.looking_for}</p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2"><Hash className="w-4 h-4" /> Interests</h4>
                    <div className="flex flex-wrap gap-2">
                        {p.interests?.map(i => (
                            <span key={i} className="px-2 md:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs md:text-sm font-bold rounded-lg border border-gray-200 dark:border-gray-600">
                                {i}
                            </span>
                        ))}
                    </div>
                </div>
                {p.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30">
                        <strong>Status Reason:</strong> {p.rejection_reason}
                    </div>
                )}
            </div>

            <div className="w-full md:w-48 bg-gray-50 dark:bg-gray-900/50 p-4 md:p-6 flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700">
                {actions}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 md:space-y-10 pb-20 p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-row justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                    <span className="hidden md:inline">Matchmaker Admin</span>
                    <span className="md:hidden">Admin</span>
                </h1>
                <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2 md:px-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors text-sm font-medium">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                    <span className="hidden md:inline">Refresh</span>
                </button>
            </div>

            {reports.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 md:p-6 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Flag size={20} /></div>
                        <h2 className="text-lg md:text-xl font-bold text-red-900 dark:text-red-100">Active Reports ({reports.length})</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map(r => (
                            <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{r.reported?.nickname || 'Unknown User'}</div>
                                        <div className="text-xs text-gray-500">Reported by: {r.reporter?.nickname}</div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-600 dark:text-gray-300">
                                        Warnings: {r.reported?.warning_count || 0}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-red-500 uppercase mb-1">Reason</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{r.reason}"</p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                    <button onClick={() => handleDismissReport(r.id)} disabled={processingId === r.id} className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Dismiss</button>
                                    <button onClick={() => handleWarnAndRevoke(r.reported_id, r.reported?.warning_count, r.reason)} disabled={processingId === r.reported_id} className="flex-1 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 rounded-lg text-xs font-bold text-yellow-700 dark:text-yellow-400">Warn</button>
                                    <button onClick={() => handleBan(r.reported_id, r.reported?.nickname)} disabled={processingId === r.reported_id} className="flex-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 rounded-lg text-xs font-bold text-red-700 dark:text-red-400">Ban</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <div className="flex gap-2 mb-6 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-1 no-scrollbar">
                    {['pending', 'approved', 'rejected'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 md:px-6 py-3 font-bold text-base md:text-lg border-b-4 transition-all capitalize whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            {tab === 'pending' && <ShieldAlert size={18} />}
                            {tab === 'approved' && <UserCheck size={18} />}
                            {tab === 'rejected' && <Ban size={18} />}
                            {tab}
                            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${activeTab === tab ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                {tab === 'pending' ? pending.length : tab === 'approved' ? approved.length : rejected.length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 md:gap-8">
                    {loading && <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>}

                    {!loading && activeTab === 'pending' && pending.map(p => (
                        <AdminProfileCard key={p.author_id} p={p} actions={
                            <>
                                <button onClick={() => updateStatus(p.author_id, 'approved')} className="flex-1 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <Check className="w-5 h-5" /> <span className="md:hidden lg:inline">Approve</span>
                                </button>
                                <button onClick={() => handleReject(p.author_id, p.nickname)} className="flex-1 w-full py-3 bg-white dark:bg-gray-800 border-2 border-red-100 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                    <X className="w-5 h-5" /> <span className="md:hidden lg:inline">Reject</span>
                                </button>
                            </>
                        } />
                    ))}

                    {!loading && activeTab === 'approved' && approved.map(p => (
                        <AdminProfileCard key={p.author_id} p={p} actions={
                            <>
                                <button onClick={() => updateStatus(p.author_id, 'pending')} className="flex-1 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Ban className="w-5 h-5" /> <span className="md:hidden lg:inline">Revoke</span>
                                </button>
                                <button onClick={() => handleBan(p.author_id, p.nickname)} className="flex-1 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Trash2 className="w-5 h-5" /> <span className="md:hidden lg:inline">Ban</span>
                                </button>
                            </>
                        } />
                    ))}

                    {!loading && activeTab === 'rejected' && rejected.map(p => (
                        <AdminProfileCard key={p.author_id} p={p} actions={
                            <div className="text-center text-gray-400 text-sm italic">
                                User must edit profile to resubmit.
                            </div>
                        } />
                    ))}

                    {!loading && ((activeTab === 'pending' && pending.length === 0) || (activeTab === 'approved' && approved.length === 0) || (activeTab === 'rejected' && rejected.length === 0)) && (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <p className="text-gray-400 font-medium">No profiles in this category.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400"><Heart className="w-5 h-5" /></div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Recent Love Activity</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-3 rounded-tl-lg">From</th>
                                <th className="p-3">To</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 rounded-tr-lg text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loves.map(l => (
                                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="p-3 font-medium text-gray-900 dark:text-white">{l.from?.nickname || 'Unknown'}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{l.to?.nickname || 'Unknown'}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${l.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : l.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-gray-400 text-xs font-mono">
                                        {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                            {loves.length === 0 && (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400 italic">No activity yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}