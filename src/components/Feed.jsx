import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PostModal from './PostModal'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

export default function Feed() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    
    const [newPostsAvailable, setNewPostsAvailable] = useState(false)

    const navigate = useNavigate()
    const { id: modalPostId } = useParams()

    const fetchPosts = useCallback(async (isInitial = false) => {
        setLoading(true)
        setError(null)
        
        const currentPage = isInitial ? 0 : page
        const { data, error } = await supabase
            .from('confessions')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .range(currentPage * 10, (currentPage + 1) * 10 - 1)

        setLoading(false)

        if (error) {
            setError('Could not fetch posts: ' + error.message)
            return
        }

        if (data.length < 10) {
            setHasMore(false)
        }

        setPosts(prev => {
            const newPosts = data.filter(d => !prev.some(p => p.id === d.id))
            return isInitial ? data : [...prev, ...newPosts]
        })
        
        if (!isInitial) {
            setPage(currentPage + 1)
        } else {
            setPage(1)
        }
    }, [page])

    useEffect(() => {
        fetchPosts(true)
    }, [])

    useEffect(() => {
        const channel = supabase
            .channel('new-confessions-feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                if (!posts.some(p => p.id === payload.new.id)) {
                    setNewPostsAvailable(true)
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [posts])


    function handlePosted(newPost) {
        setPosts(prev => [newPost, ...prev])
    }

    function handleOpenModal(post) {
        navigate(`/post/${post.id}`)
    }

    function handleCloseModal() {
        navigate('/')
    }

    function loadNewPosts() {
        setNewPostsAvailable(false)
        fetchPosts(true)
        window.scrollTo(0, 0)
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <PostForm onPosted={handlePosted} />

            {newPostsAvailable && (
                <button
                    onClick={loadNewPosts}
                    className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg"
                >
                    <ArrowUp className="w-5 h-5" />
                    New Confession - Click to Load
                </button>
            )}

            <div className="space-y-6">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onOpen={handleOpenModal} />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && hasMore && posts.length > 0 && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => fetchPosts()}
                        className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!loading && !hasMore && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    You've reached the end.
                </p>
            )}

            {error && <p className="text-red-500 text-center mt-8">{error}</p>}

            {modalPostId && (
                <PostModal
                    postId={modalPostId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    )
}