import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Flame, Info, RefreshCcw, Filter, Shuffle } from 'lucide-react';
import AdultPolicyGate from './AdultPolicyGate';
import AdultPostForm from './AdultPostForm';
import AdultPostCard from './AdultPostCard';

const FILTERS = ['All', 'Confession', 'Thirsty', 'Curious', 'Rant', 'Story'];

export default function AdultSection() {
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const hasAgreed = localStorage.getItem('adult_policy_agreed');
        if (hasAgreed === 'true') {
            setPolicyAccepted(true);
            fetchPosts();
        }
    }, []);

    const handleAgree = () => {
        localStorage.setItem('adult_policy_agreed', 'true');
        setPolicyAccepted(true);
        fetchPosts();
    };

    const handleDecline = () => {
        window.location.href = '/';
    };

    const fetchPosts = async () => {
        setRefreshing(true);
        const { data, error } = await supabase
            .from('adult_confessions')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching posts:", error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleRoulette = () => {
        if (posts.length < 2) return;
        setRefreshing(true);
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        setPosts([randomPost]);
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
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
                                Late Night Confessions
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleRoulette}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-900 rounded-full transition-all active:scale-95"
                            title="Random Secret"
                        >
                            <Shuffle className="w-5 h-5" />
                        </button>
                        <button
                            onClick={fetchPosts}
                            disabled={refreshing}
                            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-slate-900 rounded-full transition-all active:scale-95"
                        >
                            <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4">

                <AdultPostForm onSuccess={fetchPosts} />

                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); if (posts.length === 1) fetchPosts(); }}
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
                                <h3 className="text-slate-400 font-serif text-lg mb-1">The Room is Quiet</h3>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {filteredPosts.map(post => <AdultPostCard key={post.id} post={post} />)}
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