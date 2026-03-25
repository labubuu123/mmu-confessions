import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Loader2, Coins, ShoppingBag, Activity, Users, RefreshCw, ArrowDown, ArrowUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KarmaMonitor() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'current_balance', direction: 'desc' });

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_karma_ledger');
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            toast.error(`Failed to fetch data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.user_id && user.user_id.toLowerCase().includes(filterQuery.toLowerCase())
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
    };

    const totalCirculation = users.reduce((acc, curr) => acc + (curr.current_balance || 0), 0);
    const totalSpent = users.reduce((acc, curr) => acc + (curr.total_spent || 0), 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Total Tracked</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{users.length}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                            <Coins className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Karma in Circulation</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{totalCirculation.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">Total Karma Spent</h3>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{totalSpent.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[calc(100vh-250px)]">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" /> Karma Ledger
                    </h2>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter by User ID..."
                                value={filterQuery}
                                onChange={(e) => setFilterQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={fetchAllUsers}
                            disabled={loading}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => handleSort('user_id')}>
                                    <div className="flex items-center gap-1">User ID <SortIcon columnKey="user_id" /></div>
                                </th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => handleSort('post_count')}>
                                    <div className="flex items-center justify-center gap-1">Posts <SortIcon columnKey="post_count" /></div>
                                </th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => handleSort('comment_count')}>
                                    <div className="flex items-center justify-center gap-1">Comments <SortIcon columnKey="comment_count" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition text-green-600 dark:text-green-400" onClick={() => handleSort('total_earned')}>
                                    <div className="flex items-center justify-end gap-1">Total Earned <SortIcon columnKey="total_earned" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition text-red-600 dark:text-red-400" onClick={() => handleSort('total_spent')}>
                                    <div className="flex items-center justify-end gap-1">Spent <SortIcon columnKey="total_spent" /></div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10" onClick={() => handleSort('current_balance')}>
                                    <div className="flex items-center justify-end gap-1">Balance <SortIcon columnKey="current_balance" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {loading && users.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                            <p>Fetching ledger data...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && sortedUsers.map((user) => (
                                <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[150px]" title={user.user_id}>{user.user_id}</span>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(user.user_id); toast.success('Copied!'); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                            >
                                                <span className="text-[10px] font-bold uppercase">Copy</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                                        {user.post_count}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                                        {user.comment_count}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                                        +{user.total_earned}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600 dark:text-red-400">
                                        {user.total_spent > 0 ? `-${user.total_spent}` : '0'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        {user.current_balance}
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