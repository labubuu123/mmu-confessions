import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdultComments from './AdultComments';
import AdultShareButton from './AdultShareButton';
import AdultAvatar from './AdultAvatar';
import { Flame, Heart, HeartCrack, MessageCircle, Flag, BarChart2 } from 'lucide-react';

export default function AdultPostCard({ post }) {
    const [showComments, setShowComments] = useState(false);
    const [reactionCounts, setReactionCounts] = useState({ like: 0, fire: 0, broken_heart: 0 });
    const [userReactions, setUserReactions] = useState(new Set());
    const [commentCount, setCommentCount] = useState(0);

    const [pollOptions, setPollOptions] = useState(post.poll_options || []);
    const [hasVoted, setHasVoted] = useState(false);
    const [totalVotes, setTotalVotes] = useState(0);

    const identityId = post.tags?.find(t => t.startsWith('ID:'))?.replace('ID:', '') || 'Secret';
    const genderLabel = identityId === 'M' ? 'Boy' : identityId === 'F' ? 'Girl' : 'Secret';

    const moodTag = post.tags?.find(t => t.startsWith('Mood:'))?.replace('Mood:', '') || null;
    const cleanTags = post.tags?.filter(t => !t.startsWith('ID:') && !t.startsWith('Mood:') && t !== '18+');

    useEffect(() => {
        fetchReactions();
        fetchUserReactions();
        fetchCommentCount();

        if (post.has_poll) {
            checkPollVote();
            calculateTotalVotes(post.poll_options);
        }

        const channel = supabase
            .channel(`adult-post-comments-${post.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'adult_comments',
                    filter: `post_id=eq.${post.id}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setCommentCount((prev) => prev + 1);
                    } else if (payload.eventType === 'DELETE') {
                        setCommentCount((prev) => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [post.id]);

    const calculateTotalVotes = (options) => {
        if (!options) return;
        const total = options.reduce((acc, curr) => acc + (curr.votes || 0), 0);
        setTotalVotes(total);
    };

    const checkPollVote = () => {
        const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
        if (votedPolls.includes(post.id)) {
            setHasVoted(true);
        }
    };

    const fetchCommentCount = async () => {
        const { count, error } = await supabase
            .from('adult_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        if (!error) {
            setCommentCount(count || 0);
        }
    };

    const fetchReactions = async () => {
        const { data, error } = await supabase
            .from('adult_reactions')
            .select('type')
            .eq('post_id', post.id);

        if (!error && data) {
            const counts = data.reduce((acc, curr) => {
                acc[curr.type] = (acc[curr.type] || 0) + 1;
                return acc;
            }, { like: 0, fire: 0, broken_heart: 0 });
            setReactionCounts(counts);
        }
    };

    const fetchUserReactions = async () => {
        const anonId = localStorage.getItem('anonId');
        if (!anonId) return;

        const { data, error } = await supabase
            .from('adult_reactions')
            .select('type')
            .eq('post_id', post.id)
            .eq('user_id', anonId);

        if (!error && data) {
            const myReactions = new Set(data.map(r => r.type));
            setUserReactions(myReactions);
        }
    };

    const handleReaction = async (type) => {
        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);

        const hasReacted = userReactions.has(type);

        if (hasReacted) {
            setReactionCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
            setUserReactions(prev => {
                const next = new Set(prev);
                next.delete(type);
                return next;
            });

            await supabase.from('adult_reactions')
                .delete()
                .match({ post_id: post.id, user_id: anonId, type: type });
        } else {
            setReactionCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
            setUserReactions(prev => {
                const next = new Set(prev);
                next.add(type);
                return next;
            });

            await supabase.from('adult_reactions')
                .insert({ post_id: post.id, user_id: anonId, type: type });
        }
    };

    const handleVote = async (optionId) => {
        if (hasVoted) return;

        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);

        const updatedOptions = pollOptions.map(opt =>
            opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
        );
        setPollOptions(updatedOptions);
        setTotalVotes(prev => prev + 1);
        setHasVoted(true);

        const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]');
        localStorage.setItem('voted_polls', JSON.stringify([...votedPolls, post.id]));

        await supabase.from('adult_poll_votes').insert({
            post_id: post.id,
            user_id: anonId,
            option_id: optionId
        });

        await supabase.from('adult_confessions')
            .update({ poll_options: updatedOptions })
            .eq('id', post.id);
    };

    const handleReport = () => {
        const confirmed = window.confirm("Flag this post as inappropriate?");
        if (confirmed) {
            alert("Thanks. We've flagged this for manual review.");
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mb-6 hover:shadow-lg hover:border-slate-700 transition-all group relative overflow-visible shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <AdultAvatar gender={genderLabel} size="md" />

                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold tracking-wide ${genderLabel === 'Boy' ? 'text-cyan-400' : genderLabel === 'Girl' ? 'text-pink-400' : 'text-slate-200'}`}>
                                {genderLabel}
                            </span>
                            {moodTag && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500 uppercase tracking-wider font-medium">
                                    {moodTag}
                                </span>
                            )}
                        </div>
                        <span className="text-slate-600 text-xs font-mono">
                            {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <AdultShareButton post={post} />

                    <button
                        onClick={handleReport}
                        className="text-slate-600 hover:text-rose-500 transition-colors p-2 rounded-full hover:bg-slate-800"
                        title="Report"
                    >
                        <Flag className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <p className="text-slate-300 text-base whitespace-pre-wrap leading-relaxed font-serif mb-6 pl-1 selection:bg-rose-900 selection:text-white">
                {post.content}
            </p>

            {post.has_poll && pollOptions && (
                <div className="mb-6 space-y-2 mt-2">
                    {pollOptions.map((option) => {
                        const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                        const isWinner = percentage > 50;

                        return (
                            <div
                                key={option.id}
                                onClick={() => handleVote(option.id)}
                                className={`relative h-10 rounded-lg overflow-hidden cursor-pointer transition-all border ${hasVoted ? 'border-slate-800 pointer-events-none' : 'border-slate-700 hover:border-rose-500/50'}`}
                            >
                                {hasVoted && (
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isWinner ? 'bg-rose-900/40' : 'bg-slate-800'}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                )}

                                <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                                    <span className={`text-sm font-medium ${hasVoted && isWinner ? 'text-rose-200' : 'text-slate-300'}`}>
                                        {option.text}
                                    </span>
                                    {hasVoted && (
                                        <span className="text-xs font-bold text-slate-400">
                                            {percentage}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div className="flex justify-between text-[10px] text-slate-600 px-1">
                        <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {totalVotes} votes</span>
                        {hasVoted ? <span>Thanks for voting</span> : <span>Click to vote</span>}
                    </div>
                </div>
            )}

            {cleanTags && cleanTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    {cleanTags.map((tag, i) => (
                        <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-slate-800 text-slate-500 bg-slate-950/50">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="flex gap-1">
                    <ReactionBtn
                        icon={Heart}
                        label={reactionCounts.like}
                        onClick={() => handleReaction('like')}
                        color="text-rose-500"
                        isActive={userReactions.has('like')}
                    />
                    <ReactionBtn
                        icon={Flame}
                        label={reactionCounts.fire}
                        onClick={() => handleReaction('fire')}
                        color="text-amber-500"
                        isActive={userReactions.has('fire')}
                    />
                    <ReactionBtn
                        icon={HeartCrack}
                        label={reactionCounts.broken_heart}
                        onClick={() => handleReaction('broken_heart')}
                        color="text-violet-500"
                        isActive={userReactions.has('broken_heart')}
                    />
                </div>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg border ${showComments ? 'bg-slate-800 text-slate-200 border-slate-700' : 'text-slate-500 border-transparent hover:bg-slate-800/50'}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    {showComments ? 'Hide' : Comment `${commentCount}`}
                </button>
            </div>

            {showComments && <AdultComments postId={post.id} />}
        </div>
    );
}

const ReactionBtn = ({ icon: Icon, label, onClick, color, isActive }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 group ${isActive ? 'bg-slate-800 ' + color + ' shadow-inner border border-slate-700' : 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'}`}
    >
        <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`} />
        <span className="text-xs font-medium tabular-nums">{label || 0}</span>
    </button>
);