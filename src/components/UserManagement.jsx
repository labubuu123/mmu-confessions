import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AnonAvatar from './AnonAvatar'
import UserPostList from './UserPostList'
import { ChevronLeft, User, MessageSquare, Heart, Loader2, ThumbsUp } from 'lucide-react'

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedUser, setSelectedUser] = useState(null)

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
        <div className="space-y-4 pb-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="w-5 h-5" />
                User Database ({users.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <div
                        key={user.author_id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                            <AnonAvatar authorId={user.author_id} size="md" />
                            <div className="min-w-0">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">User ID</span>
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate w-full" title={user.author_id}>
                                    {user.author_id.substring(0, 12)}...
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

                        <button
                            onClick={() => setSelectedUser(user)}
                            className="w-full mt-5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-sm active:scale-95 transform"
                        >
                            View Full History
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}