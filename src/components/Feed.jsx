import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import PostCard from './PostCard'
import PostForm from './PostForm'
import PostModal from './PostModal'
import { FeedSkeleton } from './LoadingSkeleton'
import SEO from './SEO'

const fetchConfessions = async ({ pageParam = 0 }) => {
    const { data, error } = await supabase
        .from('confessions')
        .select(`
            *,
            reactions ( emoji, count ),
            events ( * ),
            polls ( * ),
            lost_and_found ( * )
        `)
        .eq('approved', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam * 10, (pageParam + 1) * 10 - 1);

    if (error) {
        console.error("Fetch error:", error.message);
        throw new Error(error.message);
    }
    return data || [];
};

export default function Feed() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { id: modalPostId } = useParams();
    const [replyingTo, setReplyingTo] = useState(null);
    const [newPostsQueue, setNewPostsQueue] = useState([]);

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
            return lastPage?.length === 10 ? allPages.length : undefined;
        },
        staleTime: 1000 * 60 * 5,
        retry: 3,
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
    });

    const allPosts = useMemo(() => {
        return data?.pages?.flatMap(page => page || []) || [];
    }, [data]);

    useEffect(() => {
        const channel = supabase
            .channel('global-feed-updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                if (payload.new.approved) {
                    const myAnonId = localStorage.getItem('anonId');
                    if (myAnonId && String(payload.new.author_id) === String(myAnonId)) {
                        return;
                    }

                    setNewPostsQueue(prev => {
                        if (prev.some(p => p.id === payload.new.id)) return prev;
                        return [payload.new, ...prev];
                    });
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'confessions'
            }, (payload) => {
                queryClient.setQueryData(['confessions'], (oldData) => {
                    if (!oldData || !oldData.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map(page =>
                            (page || []).map(post =>
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

    function handleLoadNewPosts() {
        queryClient.setQueryData(['confessions'], (oldData) => {
            if (!oldData || !oldData.pages) return oldData;

            const firstPage = oldData.pages[0] ? [...oldData.pages[0]] : [];
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
            if (!oldData || !oldData.pages) return oldData;
            const formattedPost = {
                ...newPost,
                reactions: [],
                events: [],
                polls: [],
                lost_and_found: []
            };
            const newFirstPage = [formattedPost, ...(oldData.pages[0] || [])];
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

            <div className="max-w-2xl mx-auto px-4 py-4 min-h-screen">
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
                        <div className="text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 mt-4 shadow-sm">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-1">Connection Error</h3>
                            <p className="text-red-600 dark:text-red-500 mb-6 text-sm">{error?.message || 'Failed to load posts.'}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition shadow-md active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                        </div>
                    ) : status === 'success' && allPosts.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-4">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Confessions Found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Server might be busy processing your requests.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-md hover:shadow-lg active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                        </div>
                    ) : (
                        <Virtuoso
                            useWindowScroll
                            data={allPosts}
                            computeItemKey={(index, post) => post.id || index}
                            endReached={() => {
                                if (hasNextPage && !isFetchingNextPage) {
                                    fetchNextPage();
                                }
                            }}
                            overscan={500}
                            itemContent={(index, post) => (
                                <div className="pb-2">
                                    <PostCard
                                        post={post}
                                        onOpen={(p) => navigate(`/post/${p.id}`)}
                                        onQuote={handleQuote}
                                        priority={index < 2}
                                    />
                                </div>
                            )}
                            components={{
                                Footer: () => (
                                    <div className="py-8 flex justify-center">
                                        {isFetchingNextPage ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        ) : !hasNextPage && allPosts.length > 0 ? (
                                            <p className="text-gray-400 text-sm font-medium bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                                                You've reached the end.
                                            </p>
                                        ) : null}
                                    </div>
                                )
                            }}
                        />
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