import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminPanel() {
    const [user, setUser] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [accessToken, setAccessToken] = useState(null)
    const [posts, setPosts] = useState([])

    useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
        const session = data?.session
        if (session) { setUser(session.user); setAccessToken(session.access_token); fetchPosts() }
    })
    }, [])

    async function signIn(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert('Sign-in error: ' + error.message)
    setUser(data.user); setAccessToken(data.session.access_token); fetchPosts()
    }

    async function fetchPosts() {
    const { data } = await supabase.from('confessions').select('*').order('created_at', { ascending: false }).limit(200)
    setPosts(data || [])
    }

    async function handleAdminAction(action, postId) {
    if (!accessToken) return alert('Not authenticated')
    const res = await fetch('/.netlify/functions/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ action, postId })
    })
    const txt = await res.text()
    if (!res.ok) return alert('Action failed: ' + txt)
    alert('Action OK'); fetchPosts()
    }

    if (!user) {
    return (
        <div className="flex flex-col items-center mt-20">
        <input type="email" placeholder="Admin email" className="border p-2 rounded mb-2" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="border p-2 rounded mb-2" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={signIn} className="bg-indigo-600 text-white px-4 py-2 rounded">Sign in</button>
        </div>
    )
    }

    return (
    <div className="max-w-5xl mx-auto p-4">
        <h2 className="text-xl font-bold mb-4">Admin Moderation</h2>
        <div className="mb-4 flex gap-3">
        <button onClick={fetchPosts} className="px-3 py-1 border rounded">Refresh</button>
        </div>
        {posts.map(p => (
        <div key={p.id} className="card p-3 rounded mb-3 shadow-sm">
            <div className="text-xs small-muted">{p.created_at} • Id: {p.id}</div>
            <p className="mt-2">{p.text}</p>
            {p.media_url && (<div className="mt-2">{p.media_type?.startsWith('image') ? <img src={p.media_url} className="max-h-48 rounded" /> : <video controls className="max-h-48 w-full rounded"><source src={p.media_url} /></video>}</div>)}
            <div className="mt-2 flex gap-2">
            <button onClick={() => handleAdminAction('approve', p.id)} className="px-3 py-1 bg-green-500 text-white rounded">Approve</button>
            <button onClick={() => handleAdminAction('unapprove', p.id)} className="px-3 py-1 bg-yellow-500 text-white rounded">Unapprove</button>
            <button onClick={() => handleAdminAction('delete', p.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
            </div>
        </div>
        ))}
    </div>
    )
}
