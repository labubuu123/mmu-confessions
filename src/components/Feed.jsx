import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PostModal from './PostModal'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { FeedSkeleton } from './LoadingSkeleton'
import SEO from './SEO'

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export default function Feed() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const [newPostsAvailable, setNewPostsAvailable] = useState(false)

    const [replyingTo, setReplyingTo] = useState(null)

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
        const handleScroll = debounce(() => {
            const isNearBottom = window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100;

            if (isNearBottom && !loading && hasMore) {
                fetchPosts();
            }
        }, 200);

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);

    }, [loading, hasMore, fetchPosts]);

    useEffect(() => {
        const channel = supabase
            .channel('global-feed-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                if (payload.new.approved && !posts.some(p => p.id === payload.new.id)) {
                    setNewPostsAvailable(true)
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                setPosts(currentPosts =>
                    currentPosts.map(post =>
                        post.id === payload.new.id ? { ...post, ...payload.new } : post
                    )
                )
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

    function handleQuote(post) {
        setReplyingTo(post)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleCancelReply() {
        setReplyingTo(null)
    }

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "MMU Confessions",
        "url": "https://mmuconfessions.fun/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://mmuconfessions.fun/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <>
            <SEO
                title="Home"
                description="The #1 anonymous confession platform for MMU students. Share secrets, read stories, and connect with your campus community."
                url="https://mmuconfessions.fun/"
                schema={websiteSchema}
            />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <PostForm
                    onPosted={handlePosted}
                    replyingTo={replyingTo}
                    onCancelReply={handleCancelReply}
                />

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
                        <PostCard
                            key={post.id}
                            post={post}
                            onOpen={handleOpenModal}
                            onQuote={handleQuote}
                        />
                    ))}
                </div>

                {loading && posts.length === 0 && <FeedSkeleton count={3} />}

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
        </>
    )
}