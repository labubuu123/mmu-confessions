import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Check, X, ShieldAlert, Heart, UserCheck, Ban, Trash2, Loader2, RefreshCw } from 'lucide-react';

export default function MatchmakerAdmin() {
    const [pending, setPending] = useState([]);
    const [approved, setApproved] = useState([]);
    const [loves, setLoves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null); // Tracks which item is being processed

    useEffect(() => {
        refreshAll();
    }, []);

    const refreshAll = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPending(), fetchApproved(), fetchLoves()]);
        } catch (error) {
            console.error("Error refreshing admin data:", error);
            alert("Failed to refresh data. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        const { data, error } = await supabase
            .from('matchmaker_profiles')
            .select('*')
            .eq('status', 'pending')
            .order('updated_at', { ascending: true });

        if (error) console.error("Error fetching pending:", error);
        setPending(data || []);
    };

    const fetchApproved = async () => {
        const { data, error } = await supabase
            .from('matchmaker_profiles')
            .select('*')
            .eq('status', 'approved')
            .order('updated_at', { ascending: false });

        if (error) console.error("Error fetching approved:", error);
        setApproved(data || []);
    };

    const fetchLoves = async () => {
        const { data, error } = await supabase
            .from('matchmaker_loves')
            .select('*, from:from_user_id(nickname), to:to_user_id(nickname)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) console.error("Error fetching loves:", error);
        setLoves(data || []);
    };

    const updateStatus = async (id, status, reason = null) => {
        if (processingId) return; // Prevent double clicks
        setProcessingId(id);

        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .update({
                    status: status,
                    rejection_reason: reason,
                    updated_at: new Date().toISOString() // Ensure timestamp updates
                })
                .eq('author_id', id);

            if (error) throw error;

            // Refresh data from server to ensure UI matches DB exactly
            await Promise.all([fetchPending(), fetchApproved()]);

        } catch (err) {
            console.error('Update status error:', err);
            alert(`Failed to update status: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id, nickname) => {
        if (!window.confirm(`PERMANENTLY DELETE ${nickname}? This cannot be undone.`)) return;
        if (processingId) return;
        setProcessingId(id);

        try {
            const { error } = await supabase
                .from('matchmaker_profiles')
                .delete()
                .eq('author_id', id);

            if (error) throw error;

            await Promise.all([fetchPending(), fetchApproved()]);

        } catch (err) {
            console.error('Delete error:', err);
            alert(`Failed to delete user: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleBan = async (id, nickname) => {
        const reason = window.prompt(`Enter ban reason for ${nickname}:`, "Violating community guidelines");
        if (reason !== null) {
            await updateStatus(id, 'banned', reason);
        }
    };

    if (loading && pending.length === 0 && approved.length === 0) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
                <p>Loading admin data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Refresh Button */}
            <div className="flex justify-end">
                <button
                    onClick={refreshAll}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </button>
            </div>

            {/* PENDING SECTION */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Approvals</h2>
                    <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-bold">
                        {pending.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {pending.map(p => (
                        // FIX: Changed key from p.id to p.author_id to ensure uniqueness
                        <div key={p.author_id} className="border border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white truncate">{p.nickname}</span>
                                        <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 capitalize">
                                            {p.gender} • {p.age}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 mb-3 break-all">
                                        <span className="select-all">{p.contact_info}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Intro:</span> {p.self_intro}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">Looking For:</span> {p.looking_for}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-2 w-full md:w-auto flex-shrink-0 mt-2 md:mt-0">
                                    <button
                                        onClick={() => updateStatus(p.author_id, 'approved')}
                                        disabled={processingId === p.author_id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingId === p.author_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus(p.author_id, 'rejected', 'Content violation')}
                                        disabled={processingId === p.author_id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processingId === p.author_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.author_id, p.nickname)}
                                        disabled={processingId === p.author_id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete permanently"
                                    >
                                        {processingId === p.author_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {pending.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 italic border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                            No pending profiles.
                        </div>
                    )}
                </div>
            </div>

            {/* APPROVED SECTION */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Approved Users</h2>
                    <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-bold">
                        {approved.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {approved.map(p => (
                        // FIX: Changed key from p.id to p.author_id
                        <div key={p.author_id} className="border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{p.nickname}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({p.gender}, {p.age})</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md mt-1">
                                    {p.self_intro}
                                </p>
                                <div className="text-[10px] text-gray-400 font-mono mt-1">
                                    Joined: {new Date(p.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleBan(p.author_id, p.nickname)}
                                    disabled={processingId === p.author_id}
                                    className="flex-1 md:flex-none px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === p.author_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                    Ban
                                </button>
                                <button
                                    onClick={() => handleDelete(p.author_id, p.nickname)}
                                    disabled={processingId === p.author_id}
                                    className="flex-1 md:flex-none px-4 py-2 bg-gray-100 dark:bg-red-600 text-gray-500 dark:text-gray-400 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    title="Delete User"
                                >
                                    {processingId === p.author_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {approved.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 italic">
                            No approved users yet.
                        </div>
                    )}
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