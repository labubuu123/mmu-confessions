import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PostModal from './PostModal'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { FeedSkeleton } from './LoadingSkeleton'

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
        if (!isInitial && loading) return;

        setLoading(true)
        setError(null)

        const currentPage = isInitial ? 0 : page
        const { data, error } = await supabase
            .from('confessions')
            .select('*')
            .eq('approved', true)
            .order('pinned', { ascending: false })
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
    }, [page, loading])

    useEffect(() => {
        fetchPosts(true)
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            const isNearBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100;

            if (isNearBottom && !loading && hasMore) {
                fetchPosts();
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);

    }, [loading, hasMore, fetchPosts]);

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
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 sm:py-8">
            <PostForm onPosted={handlePosted} />

            {newPostsAvailable && (
                <button
                    onClick={loadNewPosts}
                    className="w-full mb-3 sm:mb-6 flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg text-sm sm:text-base touch-manipulation active:scale-95"
                >
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    New Confession - Click to Load
                </button>
            )}

            <div className="space-y-3 sm:space-y-6">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onOpen={handleOpenModal} />
                ))}
            </div>

            {loading && posts.length === 0 && <FeedSkeleton count={3} />}

            {loading && posts.length > 0 && (
                <div className="flex justify-center py-6 sm:py-8">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {!loading && !hasMore && posts.length > 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 mt-6 sm:mt-8 text-sm sm:text-base">
                    You've reached the end.
                </p>
            )}

            {error && <p className="text-red-500 text-center mt-6 sm:mt-8 text-sm sm:text-base">{error}</p>}

            {modalPostId && (
                <PostModal
                    postId={modalPostId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    )
}