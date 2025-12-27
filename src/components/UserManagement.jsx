import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AnonAvatar from './AnonAvatar'
import UserPostList from './UserPostList'
import { ChevronLeft, User, Heart, Loader2, Ban, CheckCircle, Search, X, ShieldAlert, Filter } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('all')

    useEffect(() => {
        fetchUsers()
    }, [])

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

    async function toggleBlockUser(userId, currentStatus) {
        if (!window.confirm(currentStatus
            ? "Are you sure you want to UNBLOCK this user? They will be able to post and comment again."
            : "Are you sure you want to BLOCK this user? They will be restricted from posting, commenting, or reacting.")) {
            return;
        }

        setActionLoading(userId);
        try {
            const { error } = await supabase
                .from('user_reputation')
                .update({ is_blocked: !currentStatus })
                .eq('author_id', userId);

            if (error) throw error;

            setUsers(prev => prev.map(u =>
                u.author_id === userId ? { ...u, is_blocked: !currentStatus } : u
            ));

        } catch (err) {
            alert('Failed to update block status: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.author_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesView = viewMode === 'all' ? true : user.is_blocked;
        return matchesSearch && matchesView;
    });

    const blockedCount = users.filter(u => u.is_blocked).length;

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
                    <button
                        onClick={() => toggleBlockUser(selectedUser.author_id, selectedUser.is_blocked)}
                        disabled={actionLoading === selectedUser.author_id}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${selectedUser.is_blocked
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
                <UserPostList authorId={selectedUser.author_id} user={selectedUser} />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {error}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        User Database
                    </h2>

                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search User ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition sm:text-sm text-gray-900 dark:text-white"
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
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-start">
                    <button
                        onClick={() => setViewMode('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${viewMode === 'all'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        All Users
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                            {users.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setViewMode('blocked')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${viewMode === 'blocked'
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                            }`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        Blocked List
                        <span className={`px-1.5 py-0.5 rounded text-xs ${viewMode === 'blocked' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {blockedCount}
                        </span>
                    </button>
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                    {viewMode === 'blocked' ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map(user => (
                        <div
                            key={user.author_id}
                            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border p-5 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden ${user.is_blocked
                                    ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500 bg-red-50/50 dark:bg-red-900/10'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {user.is_blocked && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> BLOCKED
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <AnonAvatar authorId={user.author_id} size="md" />
                                <div className="min-w-0">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">User ID</span>
                                    <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate w-full" title={user.author_id}>
                                        {user.author_id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-center">
                                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{user.post_count}</div>
                                        <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Posts</div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{user.comment_count}</div>
                                        <div className="text-xs text-blue-800 dark:text-blue-300 font-medium">Comments</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-pink-500" />
                                        <span>Received:</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {(user.post_reactions_received_count || 0) + (user.comment_reactions_received_count || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-5">
                                <button
                                    onClick={() => toggleBlockUser(user.author_id, user.is_blocked)}
                                    disabled={actionLoading === user.author_id}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${user.is_blocked
                                            ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                        }`}
                                >
                                    {actionLoading === user.author_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : user.is_blocked ? (
                                        <>Unblock</>
                                    ) : (
                                        <>Block</>
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedUser(user)}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm active:scale-95 transform"
                                >
                                    View History
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}