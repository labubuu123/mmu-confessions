import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Flame, Info } from 'lucide-react';
import AdultPolicyGate from './AdultPolicyGate';
import AdultPostForm from './AdultPostForm';
import AdultPostCard from './AdultPostCard';

export default function AdultSection() {
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

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
        const { data, error } = await supabase
            .from('adult_confessions')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching posts:", error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    if (!policyAccepted) {
        return <AdultPolicyGate onAgree={handleAgree} onDecline={handleDecline} />;
    }

    return (
        <div className="min-h-screen bg-black text-zinc-300 font-sans pb-24 selection:bg-red-900 selection:text-white">
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900 mb-6">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-950 to-black flex items-center justify-center border border-red-900 group-hover:border-red-600 transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                                <Flame className="w-5 h-5 text-red-600 fill-red-900/50" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black tracking-tighter text-xl text-white leading-none">
                                MY<span className="text-red-600"> 西斯</span>
                            </span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">
                                MY NSFW · Late Night
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4">
                
                <AdultPostForm onSuccess={fetchPosts} />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-2 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
                        <p className="text-zinc-600 text-xs animate-pulse font-mono uppercase tracking-widest">Loading Secrets...</p>
                    </div>
                ) : (
                    <>
                        {posts.length === 0 ? (
                            <div className="text-center py-24 border border-zinc-900 border-dashed rounded-xl bg-zinc-950/50">
                                <h3 className="text-zinc-400 font-serif text-lg mb-1">The Room is Empty</h3>
                                <p className="text-zinc-600 text-sm">Be the first to turn off the lights.</p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {posts.map(post => <AdultPostCard key={post.id} post={post} />)}
                            </div>
                        )}
                    </>
                )}
            </main>

            <div className="text-center pb-8 pt-4 opacity-30 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-zinc-600 flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" /> All content is anonymous & AI moderated. 18+ Only.
                </p>
            </div>
        </div>
    );
}