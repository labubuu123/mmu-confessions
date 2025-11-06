import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostModal from './PostModal'
import PostForm from './PostForm'

export default function Feed({ filterTag, search }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [openPost, setOpenPost] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(-1)

    useEffect(() => { fetchLatest() }, [filterTag, search])

    useEffect(() => {
    const sub = supabase.channel('public:confessions')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confessions' }, payload => {
        if (payload.new.approved) setItems(prev => [payload.new, ...prev])
        }).subscribe()
    return () => supabase.removeChannel(sub)
    }, [])

    async function fetchLatest() {
    setLoading(true)
    const q = supabase.from('confessions').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(100)
    if (filterTag) q.contains('tags', [filterTag])
    if (search) q.ilike('text', `%${search}%`)
    const { data } = await q
    setItems(data || [])
    setLoading(false)
    }

    function openModal(post) {
    const idx = items.findIndex(i => i.id === post.id)
    setOpenPost(post)
    setCurrentIndex(idx)
    // update URL
    window.history.pushState({}, '', `/post/${post.id}`)
    }

    function closeModal() {
    setOpenPost(null); setCurrentIndex(-1)
    window.history.pushState({}, '', '/')
    }

    function navigateIndex(newIndex) {
    if (newIndex < 0 || newIndex >= items.length) return
    const next = items[newIndex]
    if (next) openModal(next)
    }

    return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <PostForm onPosted={fetchLatest} />
        <div className="mt-6 space-y-4">
        {loading && <div className="text-sm small-muted">Loading...</div>}
        {items.map(it => <PostCard key={it.id} post={it} onOpen={openModal} />)}
        </div>
        {openPost && <PostModal post={openPost} onClose={closeModal} postsList={items} currentIndex={currentIndex} onNavigate={navigateIndex} />}
    </div>
    )
}
