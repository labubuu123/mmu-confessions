import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Loader2 } from 'lucide-react'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PostModal from './PostModal'
import { FeedSkeleton } from './LoadingSkeleton'
import SEO from './SEO'

const fetchConfessions = async ({ pageParam = 0 }) => {
    const { data, error } = await supabase
        .from('confessions')
        .select('*')
        .eq('approved', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam * 10, (pageParam + 1) * 10 - 1);

    if (error) throw new Error(error.message);
    return data;
};

export default function Feed() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id: modalPostId } = useParams();
    const [replyingTo, setReplyingTo] = useState(null);
    const [newPostsQueue, setNewPostsQueue] = useState([]);
    const loadMoreRef = useRef(null);

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useInfiniteQuery({
        queryKey: ['confessions'],
        queryFn: fetchConfessions,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 10 ? allPages.length : undefined;
        },
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        const channel = supabase
            .channel('global-feed-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                if (payload.new.approved) {
                    setNewPostsQueue(prev => [payload.new, ...prev]);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                queryClient.setQueryData(['confessions'], (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page =>
                            page.map(post =>
                                post.id === payload.new.id ? { ...post, ...payload.new } : post
                            )
                        )
                    };
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.5 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    function handleLoadNewPosts() {
        queryClient.setQueryData(['confessions'], (oldData) => {
            if (!oldData) return oldData;

            const firstPage = [...oldData.pages[0]];
            const newFirstPage = [...newPostsQueue, ...firstPage];
            const uniqueFirstPage = Array.from(new Map(newFirstPage.map(item => [item.id, item])).values());

            return {
                ...oldData,
                pages: [uniqueFirstPage, ...oldData.pages.slice(1)]
            };
        });

        setNewPostsQueue([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handlePosted(newPost) {
        queryClient.setQueryData(['confessions'], (oldData) => {
            if (!oldData) return oldData;
            const newFirstPage = [newPost, ...oldData.pages[0]];
            return {
                ...oldData,
                pages: [newFirstPage, ...oldData.pages.slice(1)]
            };
        });
    }

    function handleQuote(post) {
        setReplyingTo(post);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                description="The #1 anonymous confession platform for MMU students."
                url="https://mmuconfessions.fun/"
                schema={websiteSchema}
            />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <PostForm
                    onPosted={handlePosted}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                />

                {newPostsQueue.length > 0 && (
                    <button
                        onClick={handleLoadNewPosts}
                        className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg animate-fade-in-down"
                    >
                        <ArrowUp className="w-5 h-5" />
                        {newPostsQueue.length} New Confession{newPostsQueue.length > 1 ? 's' : ''} - Click to Load
                    </button>
                )}

                <div className="space-y-6">
                    {status === 'loading' ? (
                        <FeedSkeleton count={3} />
                    ) : status === 'error' ? (
                        <p className="text-red-500 text-center">Error: {error.message}</p>
                    ) : (
                        <>
                            {data?.pages.map((page, i) => (
                                <React.Fragment key={i}>
                                    {page.map(post => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            onOpen={(p) => navigate(`/post/${p.id}`)}
                                            onQuote={handleQuote}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </div>

                <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-gray-400" />}
                    {!hasNextPage && status === 'success' && (
                        <p className="text-gray-400 text-sm">You've reached the end.</p>
                    )}
                </div>

                {modalPostId && (
                    <PostModal
                        postId={modalPostId}
                        onClose={() => navigate('/')}
                    />
                )}
            </div>
        </>
    );
}