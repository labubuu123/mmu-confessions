import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Flame, Info, RefreshCcw, Filter, ArrowDown } from 'lucide-react';
import AdultPolicyGate, { ADULT_GATE_KEY, ADULT_GATE_VALUE } from './AdultPolicyGate';
import AdultPostForm from './AdultPostForm';
import AdultPostCard from './AdultPostCard';
import { useParams } from 'react-router-dom';

const FILTERS = ['All', 'Confession', 'Thirsty', 'Curious', 'Rant', 'Story'];
const PAGE_SIZE = 50;

export default function AdultSection() {
    const { id } = useParams();
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState('All');
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const hasAgreed = localStorage.getItem(ADULT_GATE_KEY);
        if (hasAgreed === ADULT_GATE_VALUE) {
            setPolicyAccepted(true);
        }
    }, []);

    useEffect(() => {
        if (policyAccepted) {
            fetchPosts(true);
        }
    }, [policyAccepted, id, filter]);

    const handleAgree = () => {
        localStorage.setItem(ADULT_GATE_KEY, ADULT_GATE_VALUE);
        setPolicyAccepted(true);
    };

    const handleDecline = () => {
        window.location.href = '/';
    };

    const fetchPosts = async (reset = false) => {
        if (reset) {
            setRefreshing(true);
            setPage(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        let query = supabase
            .from('adult_confessions')
            .select('*')
            .eq('is_approved', true);

        const now = new Date().toISOString();
        query = query.or(`expires_at.is.null,expires_at.gt.${now}`);

        if (id) {
            query = query.eq('id', id);
        } else {
            query = query.order('created_at', { ascending: false });
            const currentPage = reset ? 0 : page;
            const from = currentPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching posts:", error);
        } else {
            if (id) {
                setPosts(data || []);
                setHasMore(false);
            } else {
                if (reset) {
                    setPosts(data || []);
                } else {
                    setPosts(prev => [...prev, ...data]);
                }

                if (data.length < PAGE_SIZE) {
                    setHasMore(false);
                }

                if (!reset) setPage(prev => prev + 1);
            }
        }

        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
    };

    const handleRoulette = () => {
        if (posts.length < 2) return;
        setRefreshing(true);
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        setPosts([randomPost]);
        setHasMore(false);
        setTimeout(() => setRefreshing(false), 500);
    };

    const filteredPosts = filter === 'All'
        ? posts
        : posts.filter(p => p.tags?.some(t => t.includes(filter)));

    if (!policyAccepted) {
        return <AdultPolicyGate onAgree={handleAgree} onDecline={handleDecline} />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans pb-24 selection:bg-rose-900 selection:text-white">
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 mb-6 transition-all shadow-lg shadow-black/20">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/adult'}>
                        <div className="relative">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-black flex items-center justify-center border border-slate-800 group-hover:border-rose-900 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <Flame className="w-5 h-5 text-rose-600 fill-rose-900/20" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black tracking-tighter text-xl text-slate-100 leading-none">
                                MY<span className="text-rose-600"> NSFW</span>
                            </span>
                            <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase group-hover:text-rose-500/50 transition-colors">
                                18+ Confessions
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4">

                {!id && <AdultPostForm onSuccess={() => fetchPosts(true)} />}

                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(0); }}
                            className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap border transition-all ${filter === f
                                ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl h-48 animate-pulse p-6"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {filteredPosts.length === 0 ? (
                            <div className="text-center py-24 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
                                <Info className="w-6 h-6 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-slate-400 font-serif text-lg mb-1">
                                    {id ? "Confession not found or removed" : "The Room is Quiet"}
                                </h3>
                                {id && (
                                    <button
                                        onClick={() => window.location.href = '/adult'}
                                        className="mt-4 text-xs text-rose-500 hover:underline"
                                    >
                                        Return to Feed
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                                {filteredPosts.map(post => <AdultPostCard key={post.id} post={post} />)}
                            </div>
                        )}

                        {!id && hasMore && posts.length > 0 && (
                            <div className="pt-4 pb-8 flex justify-center">
                                <button
                                    onClick={() => fetchPosts(false)}
                                    disabled={loadingMore}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-all font-medium text-sm disabled:opacity-50"
                                >
                                    {loadingMore ? (
                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4" />
                                    )}
                                    {loadingMore ? 'Loading...' : 'Load More Secrets'}
                                </button>
                            </div>
                        )}

                        {!id && !hasMore && posts.length > 0 && (
                            <div className="text-center py-8 text-slate-600 text-xs italic">
                                You have reached the end of the void.
                            </div>
                        )}
                    </>
                )}
            </main>

            <div className="text-center pb-8 pt-8 opacity-30 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" /> Anonymous & AI Moderated • 18+ Only
                </p>
            </div>
        </div>
    );
}