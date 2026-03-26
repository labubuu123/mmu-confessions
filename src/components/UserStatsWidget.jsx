import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Coins, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useKarmaProfile } from '../hooks/useKarma';

const fmt = (n) => Number(n ?? 0).toLocaleString();

function AnimatedNumber({ value }) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!value) { setDisplay(0); return; }
        const start  = performance.now();
        const from   = 0;
        const to     = value;
        const duration = 600;

        const step = (now) => {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (to - from) * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [value]);

    return <>{fmt(display)}</>;
}

function StatItem({ label, value, multiplier, borderLeft = false, loading }) {
    return (
        <div className={`text-center flex-1 min-w-0 ${borderLeft ? 'border-l border-white/10 pl-3' : ''}`}>
            {loading ? (
                <div className="h-7 w-12 mx-auto bg-white/10 rounded animate-pulse mb-1" />
            ) : (
                <p className="text-xl font-black truncate tabular-nums">
                    <AnimatedNumber value={value} />
                </p>
            )}
            <p className="text-[10px] text-gray-300 uppercase tracking-wide">{label}</p>
            {multiplier && (
                <p className="text-[9px] text-indigo-300/60 mt-0.5">×{multiplier} karma</p>
            )}
        </div>
    );
}

function UserStatsWidget({ userId, fetchKey }) {
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState(null);
    const abortRef = useRef(null);
    const { data: karmaProfile } = useKarmaProfile(userId);

    useEffect(() => {
        if (!userId) { setLoading(false); setStats(null); return; }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);

        const run = async () => {
            try {
                const { data, error: rpcErr } = await supabase
                    .from('confessions')
                    .select('likes_count', { count: 'exact' })
                    .eq('author_id', userId)
                    .eq('approved', true)
                    .abortSignal(controller.signal);

                if (rpcErr) throw rpcErr;

                const postCount  = data?.length ?? 0;
                const totalLikes = data?.reduce((acc, r) => acc + (r.likes_count ?? 0), 0) ?? 0;

                const { count: commentCount, error: cErr } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('author_id', userId)
                    .abortSignal(controller.signal);

                if (cErr) throw cErr;

                if (!controller.signal.aborted) {
                    setStats({ postCount, commentCount: commentCount ?? 0, totalLikes });
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('[UserStatsWidget]', err);
                    setError('Failed to load stats.');
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        run();
        return () => controller.abort();
    }, [userId, fetchKey]);

    const estimatedKarma = stats
        ? (stats.postCount * 10) + (stats.commentCount * 5) + (stats.totalLikes * 2)
        : 0;
    const liveKarma = karmaProfile?.karma_points ?? estimatedKarma;

    if (!userId && !loading) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-10 -mr-6 -mt-6 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">My Impact</span>
                    </div>
                    {!loading && (
                        <div className="flex items-center gap-1 bg-yellow-400/20 text-yellow-300 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Coins className="w-3 h-3" />
                            <AnimatedNumber value={liveKarma} />
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-red-400 text-xs text-center py-2">{error}</p>
                )}

                {!error && (
                    <div className="flex justify-between items-end">
                        <StatItem label="Posts"    value={stats?.postCount}    multiplier={10} loading={loading} />
                        <StatItem label="Comments" value={stats?.commentCount} multiplier={5}  loading={loading} borderLeft />
                        <StatItem label="Likes"    value={stats?.totalLikes}   multiplier={2}  loading={loading} borderLeft />
                    </div>
                )}

                {!loading && karmaProfile?.current_streak > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 justify-center bg-orange-500/20 text-orange-300 rounded-lg py-1.5 px-3 text-xs font-bold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {karmaProfile.current_streak}-day login streak 🔥
                    </div>
                )}

                <Link
                    to="/stats"
                    className="block mt-3 text-center text-xs font-bold bg-white/10 hover:bg-white/20 py-2 rounded-lg transition active:scale-95"
                >
                    View Full Analytics →
                </Link>
            </div>
        </div>
    );
}

export default UserStatsWidget;