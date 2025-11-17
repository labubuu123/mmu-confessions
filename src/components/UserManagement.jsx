import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AnonAvatar from './AnonAvatar'
import UserPostList from './UserPostList'
import { ChevronLeft, User, MessageSquare, Heart, Loader2 } from 'lucide-react'

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
                    className="flex items-center gap-2 mb-4 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                User List ({users.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <div
                        key={user.author_id}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <AnonAvatar authorId={user.author_id} size="md" />
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">User ID</span>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">
                                    {user.author_id}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <span className="flex items-center gap-1.5" title="Total Posts">
                                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                                    <span className="font-medium">{user.post_count}</span> Posts
                                </span>
                                <span className="flex items-center gap-1.5" title="Total Comments">
                                    <User className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">{user.comment_count}</span> Comments
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <span className="flex items-center gap-1.5" title="Post Reactions Received">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    <span className="font-medium">{user.post_reactions_received_count}</span> Post Reactions
                                </span>
                                <span className="flex items-center gap-1.5" title="Comment Reactions Received">
                                    <Heart className="w-4 h-4 text-pink-500" />
                                    <span className="font-medium">{user.comment_reactions_received_count}</span> Comment Reactions
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedUser(user)}
                            className="w-full mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            View All Posts
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}