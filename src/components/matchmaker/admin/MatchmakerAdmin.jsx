import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Loader2, RefreshCw, Flag, AlertTriangle, Trash2, Clock, AtSign } from 'lucide-react';

export default function MatchmakerAdmin() {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [rejected, setRejected] = useState([]);
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
        const { data } = await supabase.from('matchmaker_reports')
            .select('*, reporter:reporter_id(nickname), reported:reported_id(nickname, warning_count, status)')
            .order('created_at', { ascending: false });
        setReports(data || []);
    };

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return;
        setProcessingId(id);
        try {
            const updates = {
                status: status,
                updated_at: new Date().toISOString()
            };
            if (reason) updates.rejection_reason = reason;
            if (status === 'rejected' || status === 'banned') updates.is_visible = false;

            const { error } = await supabase
                .from('matchmaker_profiles')
                .update(updates)
                .eq('author_id', id);

            if (error) throw error;
            await refreshAll();
        } catch (err) {
            alert(`Error updating status: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id, currentNickname) => {
        const reason = window.prompt(`Enter rejection reason for ${currentNickname} (User can edit & resubmit):`, "Profile info incomplete");
        if (reason !== null && reason.trim() !== "") {
            await updateStatus(id, 'rejected', reason);
        }
    };

    const handleBan = async (id, nickname) => {
        const reason = window.prompt(`BAN ${nickname}? \n\nEnter the message they will see on the blocked screen:`, "Violation of Terms of Service");

        if (reason === null) return;

        if (processingId) return;
        setProcessingId(id);

        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .update({
                    status: 'banned',
                    rejection_reason: reason,
                    is_visible: false
                })
                .eq('author_id', id);

            if (error) throw error;

            await supabase.from('matchmaker_reports').delete().eq('reported_id', id);

            await refreshAll();
        } catch (err) {
            alert(`Error banning user: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleWarnAndRevoke = async (userId, currentCount, reportReason) => {
        if (processingId) return;

        const newCount = (currentCount || 0) + 1;
        const defaultMessage = `Community Warning #${newCount}: ${reportReason || 'Violation'}. Please review guidelines.`;

        const customReason = window.prompt("Enter warning message for user:", defaultMessage);
        if (customReason === null) return;

        setProcessingId(userId);
        try {
            const { error: updateError } = await supabase
                .from('matchmaker_profiles')
                .update({
                    status: 'rejected',
                    warning_count: newCount,
                    rejection_reason: customReason,
                    is_visible: false
                })
                .eq('author_id', userId);

            if (updateError) throw updateError;

            const { error: deleteError } = await supabase
                .from('matchmaker_reports')
                .delete()
                .eq('reported_id', userId);

            if (deleteError) throw deleteError;

            await refreshAll();
        } catch (err) {
            console.error(err);
            alert(`Error processing warning: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDismissReport = async (reportId) => {
        if (processingId) return;
        if (!window.confirm("Dismiss this report? It will be removed from the list.")) return;

        setProcessingId(reportId);
        try {
            const { error } = await supabase.from('matchmaker_reports').delete().eq('id', reportId);
            if (error) throw error;
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            alert(`Error dismissing report: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && pending.length === 0) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-indigo-500" /></div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-end">
                <button onClick={refreshAll} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} /> Refresh
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Flag size={20} /></div>
                    <h2 className="text-xl font-bold dark:text-white">Reports ({reports.length})</h2>
                </div>
                <div className="space-y-3">
                    {reports.map(r => (
                        <div key={r.id} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex flex-col gap-3">
                            <div className="flex justify-between">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">
                                        {r.reported?.nickname || 'Unknown'}
                                        <span className="text-sm font-normal text-gray-500 ml-2">reported by {r.reporter?.nickname}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Status: {r.reported?.status} • Warnings: {r.reported?.warning_count || 0}</div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                                <p className="text-xs font-bold text-red-500 uppercase mb-1">Reason:</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{r.reason}"</p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <button
                                    onClick={() => handleDismissReport(r.id)}
                                    disabled={processingId === r.id}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    {processingId === r.id ? '...' : 'Dismiss'}
                                </button>
                                <button
                                    onClick={() => handleWarnAndRevoke(r.reported_id, r.reported?.warning_count, r.reason)}
                                    disabled={processingId === r.reported_id}
                                    className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-bold hover:bg-yellow-200 flex gap-2 items-center border border-yellow-200 dark:border-yellow-800 disabled:opacity-50"
                                >
                                    <AlertTriangle size={14} /> Warn & Revoke
                                </button>
                                <button
                                    onClick={() => handleBan(r.reported_id, r.reported?.nickname)}
                                    disabled={processingId === r.reported_id}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 flex gap-2 items-center ml-auto border border-red-200 dark:border-red-800 disabled:opacity-50"
                                >
                                    <Ban size={14} /> Ban
                                </button>
                            </div>
                        </div>
                    ))}
                    {reports.length === 0 && <div className="text-center text-gray-400 italic py-4">No active reports</div>}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><ShieldAlert size={20} /></div>
                    <h2 className="text-xl font-bold dark:text-white">Pending Approvals ({pending.length})</h2>
                </div>
                <div className="grid gap-3">
                    {pending.map(p => (
                        <div key={p.author_id} className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white">{p.nickname} <span className="text-xs font-normal text-gray-500">({p.gender}, {p.age})</span></div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{p.self_intro}</p>
                                <div className="flex items-center gap-2 mt-2.5 text-xs">
                                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider"><AtSign size={12} /> Contact:</div>
                                    <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-indigo-100 dark:border-indigo-900 font-mono text-gray-800 dark:text-gray-200 select-all">{p.contact_info}</code>
                                </div>
                            </div>
                            <div className="flex gap-2 items-start">
                                <button onClick={() => updateStatus(p.author_id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"><Check size={16} /> Approve</button>
                                <button onClick={() => handleReject(p.author_id, p.nickname)} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-red-50"><X size={16} /> Reject</button>
                            </div>
                        </div>
                    ))}
                    {pending.length === 0 && <div className="text-center text-gray-400 italic py-4">No pending profiles</div>}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><Clock size={20} /></div>
                    <h2 className="text-xl font-bold dark:text-white">Requires User Action ({rejected.length})</h2>
                </div>
                <div className="grid gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {rejected.map(p => (
                        <div key={p.author_id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2 opacity-75">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold dark:text-white text-gray-700">{p.nickname}</div>
                                    <div className="text-xs text-gray-400">Warnings: {p.warning_count || 0}</div>
                                </div>
                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase rounded flex items-center gap-1"><Clock size={10} /> Waiting</span>
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30"><span className="font-bold">Reason:</span> "{p.rejection_reason}"</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><UserCheck className="text-green-500" /> Approved Users</h2>
                <div className="grid gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {approved.map(p => (
                        <div key={p.author_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <div>
                                <div className="font-bold dark:text-white text-sm">{p.nickname}</div>
                                <div className="text-xs text-gray-500">Warnings: {p.warning_count || 0}</div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleReject(p.author_id, p.nickname)} className="p-2 text-orange-600 hover:bg-orange-100 rounded" title="Revoke"><X size={16} /></button>
                                <button onClick={() => handleBan(p.author_id, p.nickname)} className="p-2 text-red-600 hover:bg-red-100 rounded" title="Ban & Message"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400"><Heart className="w-5 h-5" /></div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Love Activity</h2>
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
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${l.status === 'accepted' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-gray-400 text-xs font-mono">
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