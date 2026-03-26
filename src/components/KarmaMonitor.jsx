import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
    Search, Loader2, Coins, Activity,
    Trophy, Users, RefreshCw, ArrowDown, ArrowUp, X, Star
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const fmt = (n) => Number(n ?? 0).toLocaleString();

function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between h-full">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 ${iconBg} ${iconColor} rounded-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{label}</h3>
            </div>
            <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function SortIcon({ sortConfig, columnKey }) {
    if (sortConfig.key !== columnKey) return <div className="w-4 h-4 opacity-0" />;
    return sortConfig.direction === 'asc'
        ? <ArrowUp className="w-4 h-4" />
        : <ArrowDown className="w-4 h-4" />;
}

function SortableHeader({ sortConfig, columnKey, onSort, children, className = '' }) {
    const isActive = sortConfig.key === columnKey;
    return (
        <th
            className={`px-6 py-4 cursor-pointer select-none transition hover:bg-gray-100 dark:hover:bg-gray-800 ${className} ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20' : ''}`}
            onClick={() => onSort(columnKey)}
        >
            <div className="flex items-center gap-1 whitespace-nowrap">
                {children}
                <SortIcon sortConfig={sortConfig} columnKey={columnKey} />
            </div>
        </th>
    );
}

export default function KarmaMonitor() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'total_earned', direction: 'desc' });
    const filterRef = useRef(null);

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_karma_ledger');
            if (rpcError) throw rpcError;
            setUsers(data ?? []);
        } catch (err) {
            console.error('[KarmaMonitor] fetch error:', err);
            setError(err?.message ?? 'Failed to fetch karma data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
                filterRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const stats = useMemo(() => {
        let totalKarma = 0, topBalance = 0;
        users.forEach((u) => {
            totalKarma += (u.total_earned ?? 0);
            if ((u.total_earned ?? 0) > topBalance) topBalance = u.total_earned;
        });
        return { totalUsers: users.length, totalKarma, topBalance };
    }, [users]);

    const processedUsers = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        const filtered = q
            ? users.filter((u) => u.user_id?.toLowerCase().includes(q))
            : users;

        return [...filtered].sort((a, b) => {
            const aVal = a[sortConfig.key] ?? 0;
            const bVal = b[sortConfig.key] ?? 0;
            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [users, filterQuery, sortConfig]);

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    }, []);

    const handleCopy = useCallback((text) => {
        navigator.clipboard.writeText(text).catch(() => { });
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                    icon={Users}
                    iconBg="bg-indigo-100 dark:bg-indigo-900/30"
                    iconColor="text-indigo-600"
                    label="Total Users Tracked"
                    value={fmt(stats.totalUsers)}
                />
                <StatCard
                    icon={Star}
                    iconBg="bg-green-100 dark:bg-green-900/30"
                    iconColor="text-green-600"
                    label="Total Points Awarded"
                    value={fmt(stats.totalKarma)}
                    sub={`Top user holds: ${fmt(stats.topBalance)} pts`}
                />
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm">
                    <span className="flex-1">{error}</span>
                    <button onClick={fetchAllUsers} className="font-bold underline hover:opacity-80">Retry</button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[calc(100vh-260px)] min-h-[400px]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-3 justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 shrink-0">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Reputation Ledger
                    </h2>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                ref={filterRef}
                                type="text"
                                placeholder='Filter by User ID… ("/" to focus)'
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            {filterQuery && (
                                <button
                                    onClick={() => setFilterQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                                    aria-label="Clear filter"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={fetchAllUsers}
                            disabled={loading}
                            title="Refresh data"
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition disabled:opacity-40"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                            <tr>
                                <SortableHeader sortConfig={sortConfig} columnKey="user_id" onSort={handleSort}>User ID</SortableHeader>
                                <SortableHeader sortConfig={sortConfig} columnKey="post_count" onSort={handleSort} className="text-center justify-center">Posts</SortableHeader>
                                <SortableHeader sortConfig={sortConfig} columnKey="comment_count" onSort={handleSort} className="text-center justify-center">Comments</SortableHeader>
                                <SortableHeader sortConfig={sortConfig} columnKey="likes_received" onSort={handleSort} className="text-center justify-center">Likes</SortableHeader>
                                <SortableHeader sortConfig={sortConfig} columnKey="total_earned" onSort={handleSort} className="text-right justify-end text-green-600 dark:text-green-400">Total Points</SortableHeader>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {loading && users.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                            <p className="text-sm">Calculating reputation points…</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && processedUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <Trophy className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                                        <p className="text-gray-400 italic text-sm">
                                            {filterQuery ? `No users matching "${filterQuery}"` : 'No users found.'}
                                        </p>
                                        {filterQuery && (
                                            <button onClick={() => setFilterQuery('')} className="text-xs text-indigo-500 mt-2 hover:underline">
                                                Clear filter
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}

                            {processedUsers.map((user) => (
                                <tr
                                    key={user.user_id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                                >
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span
                                                title={user.user_id}
                                                className="truncate max-w-[140px] inline-block"
                                            >
                                                {user.user_id}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(user.user_id)}
                                                className="opacity-0 group-hover:opacity-100 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-gray-500 hover:text-indigo-600 transition-opacity"
                                                title="Copy User ID"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white tabular-nums">
                                        {fmt(user.post_count)}
                                        <span className="text-[10px] text-gray-400 ml-0.5">×10</span>
                                    </td>

                                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white tabular-nums">
                                        {fmt(user.comment_count)}
                                        <span className="text-[10px] text-gray-400 ml-0.5">×5</span>
                                    </td>

                                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white tabular-nums">
                                        {fmt(user.likes_received)}
                                        <span className="text-[10px] text-gray-400 ml-0.5">×2</span>
                                    </td>

                                    <td className="px-6 py-4 text-right bg-indigo-50/50 dark:bg-indigo-900/10 font-bold text-green-600 dark:text-green-400 tabular-nums">
                                        {fmt(user.total_earned)} pts
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl text-xs text-center text-gray-400 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                    Showing {processedUsers.length} of {users.length} users
                    {filterQuery && ` · filtered by "${filterQuery}"`}
                </div>
            </div>
        </div>
    );
}