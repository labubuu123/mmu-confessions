import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Shield, Trash2, RefreshCw, LogIn } from 'lucide-react'

export default function AdminPanel() {
    const [user, setUser] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [accessToken, setAccessToken] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            const session = data?.session
            if (session) {
                setUser(session.user)
                setAccessToken(session.access_token)
                fetchPosts()
            }
        })
    }, [])

    async function signIn(e) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email,
            password
        })
        
        setLoading(false)
        
        if (error) {
            setError('Sign-in error: ' + error.message)
            return
        }
        
        setUser(data.user)
        setAccessToken(data.session.access_token)
        fetchPosts()
    }

    async function fetchPosts() {
        setLoading(true)
        const { data } = await supabase
            .from('confessions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200)
        
        setPosts(data || [])
        setLoading(false)
    }

    async function handleAdminAction(action, postId) {
        if (!accessToken) {
            alert('Not authenticated')
            return
        }

        if (action === 'delete') {
            if (!window.confirm(`Are you sure you want to DELETE post ${postId}? This cannot be undone.`)) {
                return
            }
        }

        setLoading(true)
        
        const res = await fetch('/.netlify/functions/admin-action', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ action, postId })
        })

        const txt = await res.text()
        setLoading(false)

        if (!res.ok) {
            alert('Action failed: ' + txt)
            return
        }

        alert('Action completed successfully')
        fetchPosts()
    }

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Admin Login
                        </h2>
                    </div>

                    <form onSubmit={signIn} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign in
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Admin Moderation
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage confessions ({posts.length} total)
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchPosts}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading && posts.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(p => (
                        <div
                            key={p.id}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(p.created_at).toLocaleString()} • ID: {p.id}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {p.approved ? (
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded">
                                                    Pending
                                                </span>
                                            )}
                                            {p.reported && (
                                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded">
                                                    Reported
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap mb-3">
                                        {p.text}
                                    </p>

                                    {p.media_url && (
                                        <div className="mb-3">
                                            {p.media_type?.startsWith('image') ? (
                                                <img
                                                    src={p.media_url}
                                                    className="max-h-48 rounded-lg"
                                                    alt="media"
                                                />
                                            ) : (
                                                <video controls className="max-h-48 w-full rounded-lg">
                                                    <source src={p.media_url} />
                                                </video>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleAdminAction('delete', p.id)}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>

                                        {!p.reported && (
                                            <button
                                                onClick={() => handleAdminAction('report', p.id)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                            >
                                                Mark for Review
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}