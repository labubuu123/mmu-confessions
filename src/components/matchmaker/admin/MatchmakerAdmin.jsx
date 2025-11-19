import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2, RefreshCw, Flag, AlertTriangle } from 'lucide-react';

export default function MatchmakerAdmin() {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [loves, setLoves] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        refreshAll();
    }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPending(), fetchApproved(), fetchLoves(), fetchReports()]);
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

    const fetchLoves = async () => {
        const { data } = await supabase.from('matchmaker_loves').select('*, from:from_user_id(nickname), to:to_user_id(nickname)').order('created_at', { ascending: false }).limit(50);
        setLoves(data || []);
    };

    const fetchReports = async () => {
        const { data } = await supabase.from('matchmaker_reports')
            .select('*, reporter:reporter_id(nickname), reported:reported_id(nickname, warning_count, status)')
            .order('created_at', { ascending: false });
        setReports(data || []);
    };

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return;
        setProcessingId(id);
        try {
            await supabase
                .from('matchmaker_profiles')
                .update({ status: status, rejection_reason: reason, updated_at: new Date().toISOString() })
                .eq('author_id', id);
            await refreshAll();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    // Ban now performs a PERMANENT DELETE
    const handleBan = async (id, nickname) => {
        if (!window.confirm(`CONFIRM BAN: Are you sure you want to BAN ${nickname}?\n\nThis will PERMANENTLY DELETE their identity from the database.`)) return;
        
        if (processingId) return;
        setProcessingId(id);
        
        try {
            const { error } = await supabase.from('matchmaker_profiles').delete().eq('author_id', id);
            if (error) throw error;
            await refreshAll();
        } catch (err) {
            alert(`Error banning user: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleWarnUser = async (userId, currentCount) => {
        if (processingId) return;
        setProcessingId(userId);
        try {
            const newCount = (currentCount || 0) + 1;
            await supabase
                .from('matchmaker_profiles')
                .update({ warning_count: newCount })
                .eq('author_id', userId);
            await fetchReports();
            await fetchApproved();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDismissReport = async (reportId) => {
        if (processingId) return;
        setProcessingId(reportId);
        try {
            await supabase.from('matchmaker_reports').delete().eq('id', reportId);
            await fetchReports();
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && pending.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-indigo-500"/></div>;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-end">
                <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Refresh
                </button>
            </div>

            {/* REPORTS SECTION */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Flag size={20} /></div>
                    <h2 className="text-xl font-bold dark:text-white">Reports ({reports.length})</h2>
                </div>
                <div className="space-y-3">
                    {reports.map(r => (
                        <div key={r.id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white">{r.reported?.nickname || 'Unknown'} <span className="font-normal text-gray-500">reported by {r.reporter?.nickname}</span></div>
                                <p className="text-sm bg-white dark:bg-gray-900 p-2 rounded mt-1 border border-gray-200 dark:border-gray-700">"{r.reason}"</p>
                                <div className="text-xs text-gray-500 mt-1">Status: {r.reported?.status} • Warnings: {r.reported?.warning_count || 0}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleDismissReport(r.id)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600">Dismiss</button>
                                <button onClick={() => handleWarnUser(r.reported_id, r.reported?.warning_count)} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-bold hover:bg-yellow-200 dark:hover:bg-yellow-900/50 flex gap-1 items-center"><AlertTriangle size={12}/> Warn</button>
                                <button onClick={() => handleBan(r.reported_id, r.reported?.nickname)} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 flex gap-1 items-center"><Ban size={12}/> Ban (Delete)</button>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-center text-gray-400 italic py-4">No active reports</div>}
                </div>
            </div>

            {/* PENDING SECTION */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><ShieldAlert size={20} /></div>
                    <h2 className="text-xl font-bold dark:text-white">Pending ({pending.length})</h2>
                </div>
                <div className="grid gap-3">
                    {pending.map(p => (
                        <div key={p.author_id} className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white">{p.nickname} <span className="text-xs font-normal text-gray-500">({p.gender}, {p.age})</span></div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{p.self_intro}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => updateStatus(p.author_id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1"><Check size={16}/> Approve</button>
                                <button onClick={() => updateStatus(p.author_id, 'rejected', 'Content violation')} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20"><X size={16}/> Reject</button>
                                <button onClick={() => handleBan(p.author_id, p.nickname)} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"><Ban size={16}/> Ban</button>
                            </div>
                        </div>
                    ))}
                    {pending.length === 0 && <div className="text-center text-gray-400 italic py-4">No pending profiles</div>}
                </div>
            </div>

            {/* APPROVED USERS */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><UserCheck className="text-green-500"/> Approved Users</h2>
                <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                    {approved.map(p => (
                        <div key={p.author_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div>
                                <div className="font-bold dark:text-white">{p.nickname}</div>
                                <div className="text-xs text-gray-500">Warnings: {p.warning_count || 0}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleWarnUser(p.author_id, p.warning_count)} className="p-2 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded" title="Warn"><AlertTriangle size={16}/></button>
                                <button onClick={() => handleBan(p.author_id, p.nickname)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Ban (Delete)"><Ban size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* LOVE ACTIVITY SECTION */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                        <Heart className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Love Activity</h2>
                </div>

                <div className="overflow-x-auto -mx-4 md:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 md:px-0">
                        <table className="min-w-full text-sm text-left rounded-lg overflow-hidden">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-3 md:p-4 rounded-tl-lg">From</th>
                                    <th className="p-3 md:p-4">To</th>
                                    <th className="p-3 md:p-4">Status</th>
                                    <th className="p-3 md:p-4 rounded-tr-lg text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loves.map(l => (
                                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-3 md:p-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {l.from?.nickname || 'Unknown'}
                                        </td>
                                        <td className="p-3 md:p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            {l.to?.nickname || 'Unknown'}
                                        </td>
                                        <td className="p-3 md:p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${l.status === 'accepted'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
                                                    : l.status === 'rejected'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                                }`}>
                                                {l.status === 'pending_sent' ? 'Pending' : l.status}
                                            </span>
                                        </td>
                                        <td className="p-3 md:p-4 text-right text-gray-400 dark:text-gray-500 font-mono text-xs whitespace-nowrap">
                                            {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                                {loves.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-400 dark:text-gray-500 italic">
                                            No recent activity.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}