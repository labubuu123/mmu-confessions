import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AnonAvatar from './AnonAvatar'
import UserPostList from './UserPostList'
import { ChevronLeft, User, Heart, Loader2, Ban, CheckCircle, Search, X, Smartphone, Trash2, Award, Wallet } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [blockedDevices, setBlockedDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('all')

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        if (viewMode === 'all' || viewMode === 'blocked_users') {
            fetchUsers()
        } else if (viewMode === 'blocked_devices') {
            fetchBlockedDevices()
        }
    }, [viewMode])

    async function fetchUsers() {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase.rpc('get_users_with_reputation_and_counts')
            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Error fetching users:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function fetchBlockedDevices() {
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase
                .from('blocked_devices')
                .select('*')
                .order('blocked_at', { ascending: false });

            if (error) throw error;
            setBlockedDevices(data || []);
        } catch (err) {
            console.error('Error fetching devices:', err);
            setError(err.message);
        } finally {
            setLoading(false)
        }
    }

    async function toggleBlockUser(userId, currentStatus) {
        if (!window.confirm(currentStatus
            ? "Are you sure you want to UNBLOCK this user?"
            : "Are you sure you want to BLOCK this user? This will also BAN THEIR DEVICE.")) {
            return;
        }

        setActionLoading(userId);
        try {
            const { data: message, error } = await supabase.rpc('ban_user_and_device', {
                target_user_id: userId,
                block_status: !currentStatus
            });

            if (error) throw error;

            setUsers(prev => prev.map(u =>
                u.author_id === userId ? { ...u, is_blocked: !currentStatus } : u
            ));

            alert(message);
        } catch (err) {
            alert('Failed to update block status: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    }

    async function unbanDevice(deviceId) {
        if (!window.confirm("Are you sure you want to UNBAN this device? Anyone using it will be able to post again.")) {
            return;
        }

        setActionLoading(deviceId);
        try {
            const { error } = await supabase
                .from('blocked_devices')
                .delete()
                .eq('device_id', deviceId);

            if (error) throw error;

            setBlockedDevices(prev => prev.filter(d => d.device_id !== deviceId));
            alert("Device unbanned successfully.");
        } catch (err) {
            alert('Error unbanning device: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    }

    const calculateKarma = (user) => {
        const pCount = parseInt(user.post_count || 0);
        const cCount = parseInt(user.comment_count || 0);
        const likes = parseInt(user.post_reactions_received_count || 0);
        const spent = parseInt(user.spent_points || 0);

        const totalEarned = (pCount * 10) + (cCount * 5) + (likes * 2);
        const balance = Math.max(0, totalEarned - spent);

        return { balance, totalEarned, spent };
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.author_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesView = viewMode === 'all' ? true : (viewMode === 'blocked_users' ? user.is_blocked : true);
        return matchesSearch && matchesView;
    });

    const blockedUserCount = users.filter(u => u.is_blocked).length;

    if (selectedUser) {
        return (
            <div>
                <button
                    onClick={() => setSelectedUser(null)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 mb-4 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium shadow-sm sticky top-0 z-10"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to User List
                </button>
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <AnonAvatar authorId={selectedUser.author_id} size="md" />
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg dark:text-white">User Actions</h3>
                            <p className="text-xs text-gray-500 font-mono truncate">{selectedUser.author_id}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center min-w-[100px]">
                            <p className="text-xs text-indigo-500 font-bold uppercase">Points</p>
                            <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                                {calculateKarma(selectedUser).balance}
                            </p>
                        </div>
                        <button
                            onClick={() => toggleBlockUser(selectedUser.author_id, selectedUser.is_blocked)}
                            disabled={actionLoading === selectedUser.author_id}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${selectedUser.is_blocked
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                                }`}
                        >
                            {actionLoading === selectedUser.author_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : selectedUser.is_blocked ? (
                                <><CheckCircle className="w-4 h-4" /> Unblock User</>
                            ) : (
                                <><Ban className="w-4 h-4" /> Block User</>
                            )}
                        </button>
                    </div>
                </div>
                <UserPostList authorId={selectedUser.author_id} user={selectedUser} />
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-20">
            <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        User Database
                    </h2>

                    {viewMode !== 'blocked_devices' && (
                        <div className="relative w-full md:w-72">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search User ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm sm:text-sm text-gray-900 dark:text-white"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap w-full md:w-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-start gap-1">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${viewMode === 'all'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        All Users
                        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px]">
                            {users.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode('blocked_users')}
                        className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${viewMode === 'blocked_users'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                            }`}
                    >
                        <Ban className="w-3.5 h-3.5" />
                        Banned Users
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${viewMode === 'blocked_users' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                            }`}>
                            {blockedUserCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode('blocked_devices')}
                        className={`flex-1 md:flex-none justify-center px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center gap-2 ${viewMode === 'blocked_devices'
                            ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        Device Bans
                        {blockedDevices.length > 0 && viewMode === 'blocked_devices' && (
                            <span className="px-1.5 py-0.5 bg-white/20 text-white dark:bg-gray-200 dark:text-gray-900 rounded text-[10px]">
                                {blockedDevices.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                </div>
            ) : viewMode === 'blocked_devices' ? (
                blockedDevices.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-900 dark:text-white font-bold">No Devices Banned</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Hardware bans will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {blockedDevices.map(device => (
                            <div key={device.device_id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">BANNED</span>
                                            <span className="text-xs text-gray-400">{new Date(device.blocked_at).toLocaleString()}</span>
                                        </div>
                                        <p className="font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 mt-1 break-all">
                                            {device.device_id}
                                        </p>
                                        <p className="text-xs text-gray-500 italic mt-0.5">
                                            Reason: {device.reason || 'No reason provided'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => unbanDevice(device.device_id)}
                                    disabled={actionLoading === device.device_id}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                    title="Unban Device"
                                >
                                    {actionLoading === device.device_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                filteredUsers.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        {viewMode === 'blocked_users' ? (
                            <>
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-900 dark:text-white font-bold">Clean Record!</p>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No users are currently blocked.</p>
                            </>
                        ) : (
                            <>
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No users found.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {filteredUsers.map(user => {
                            const karma = calculateKarma(user);
                            return (
                                <div
                                    key={user.author_id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden ${user.is_blocked
                                        ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500 bg-red-50/50 dark:bg-red-900/10'
                                        : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    {user.is_blocked && (
                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                            <Ban className="w-3 h-3" /> BLOCKED
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-3 sm:mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                        <AnonAvatar authorId={user.author_id} size="md" />
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">User ID</span>
                                            <p className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-300 truncate w-full" title={user.author_id}>
                                                {user.author_id}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl p-3 text-white flex justify-between items-center shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Award className="w-5 h-5 text-yellow-300" />
                                                <span className="font-bold text-sm">Karma</span>
                                            </div>
                                            <span className="text-xl font-black">{karma.balance}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-center">
                                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{user.post_count}</div>
                                                <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">Posts</div>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.comment_count}</div>
                                                <div className="text-[10px] text-blue-800 dark:text-blue-300 font-medium">Comments</div>
                                            </div>
                                            <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded-lg text-center">
                                                <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                                    {(user.post_reactions_received_count || 0) + (user.comment_reactions_received_count || 0)}
                                                </div>
                                                <div className="text-[10px] text-pink-800 dark:text-pink-300 font-medium">Likes</div>
                                            </div>
                                        </div>

                                        {karma.spent > 0 && (
                                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                                <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Total Spent</span>
                                                <span className="font-mono">{karma.spent} pts</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-5">
                                        <button
                                            onClick={() => toggleBlockUser(user.author_id, user.is_blocked)}
                                            disabled={actionLoading === user.author_id}
                                            className={`px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition ${user.is_blocked
                                                ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                                }`}
                                        >
                                            {actionLoading === user.author_id ? (
                                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                            ) : user.is_blocked ? (
                                                <>Unblock</>
                                            ) : (
                                                <>Block</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-2 sm:px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm active:scale-95 transform truncate"
                                        >
                                            View History
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}
        </div>
    )
}