import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostForm from './PostForm'
import PostCard from './PostCard'
import PostModal from './PostModal'
import { useNavigate, useParams } from 'react-router-dom'

export default function Feed() {
    const [posts, setPosts] = useState([])
    const [openPost, setOpenPost] = useState(null)
    const [loading, setLoading] = useState(true)
    
    const navigate = useNavigate()
    const { id: urlPostId } = useParams()

    useEffect(() => {
        fetchPosts()
    }, [])
    
    useEffect(() => {
        const channel = supabase
            .channel('public:confessions')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'confessions'
            }, payload => {
                if (payload.new.approved) {
                    setPosts(prev => {
                        // Prevent duplicates
                        if (prev.find(p => p.id === payload.new.id)) return prev
                        return [payload.new, ...prev]
                    })
                }
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'confessions'
            }, payload => {
                setPosts(prev => prev.filter(p => p.id !== payload.old.id))
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions'
            }, payload => {
                setPosts(prev => prev.map(p =>
                    p.id === payload.new.id ? payload.new : p
                ))
            })
            .subscribe()
        
        return () => supabase.removeChannel(channel)
    }, [])

    useEffect(() => {
        if (urlPostId && posts.length > 0) {
            const postFromUrl = posts.find(p => p.id == urlPostId)
            if (postFromUrl) {
                setOpenPost(postFromUrl)
            }
        }
    }, [urlPostId, posts])

    async function fetchPosts() {
        setLoading(true)
        const { data } = await supabase
            .from('confessions')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .limit(200)
        
        setPosts(data || [])
        setLoading(false)
    }

    function handleNewPost(newPost) {
        setPosts(prev => {
            // Prevent duplicates
            if (prev.find(p => p.id === newPost.id)) return prev
            return [newPost, ...prev]
        })
    }

    function openModal(post) {
        setOpenPost(post)
        navigate(`/post/${post.id}`)
    }

    function closeModal() {
        setOpenPost(null)
        navigate('/')
    }

    function handleNavigate(direction) {
        if (!openPost) return
        const currentIndex = posts.findIndex(p => p.id === openPost.id)
        if (currentIndex === -1) return
        
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
        
        if (newIndex >= 0 && newIndex < posts.length) {
            const newPost = posts[newIndex]
            setOpenPost(newPost)
            navigate(`/post/${newPost.id}`)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <PostForm onPosted={handleNewPost} />
            
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No confessions yet. Be the first to share!
                    </p>
                </div>
            ) : (
                <div>
                    {posts.map(p => (
                        <PostCard key={p.id} post={p} onOpen={() => openModal(p)} />
                    ))}
                </div>
            )}
            
            {openPost && (
                <PostModal 
                    key={openPost.id}
                    post={openPost} 
                    onClose={closeModal}
                    onNavigate={handleNavigate}
                />
            )}
        </div>
    )
}