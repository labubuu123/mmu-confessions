import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AdultComments from './AdultComments';
import { Flame, Heart, HeartCrack, MessageCircle, MoreHorizontal, User } from 'lucide-react';

export default function AdultPostCard({ post }) {
    const [showComments, setShowComments] = useState(false);
    const [reactionCounts, setReactionCounts] = useState({ like: 0, fire: 0, broken_heart: 0 });

    const identityTag = post.tags?.find(t => t.startsWith('ID:'))?.replace('ID:', '') || 'Secret';
    const moodTag = post.tags?.find(t => t.startsWith('Mood:'))?.replace('Mood:', '') || null;
    const cleanTags = post.tags?.filter(t => !t.startsWith('ID:') && !t.startsWith('Mood:') && t !== '18+');

    const handleReaction = async (type) => {
        const anonId = localStorage.getItem('anonId') || 'anon_guest';
        setReactionCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
        await supabase.from('adult_reactions').insert({
            post_id: post.id,
            user_id: anonId,
            type: type
        }).catch(err => console.error(err));
    };

    return (
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-2xl mb-6 hover:border-red-900/30 transition-all group backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-zinc-200 text-sm font-bold tracking-wide">{identityTag}</span>
                            {moodTag && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase tracking-wider font-medium">
                                    {moodTag}
                                </span>
                            )}
                        </div>
                        <span className="text-zinc-600 text-xs">
                            {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                <button className="text-zinc-700 hover:text-zinc-400 transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            <p className="text-zinc-300 text-base whitespace-pre-wrap leading-relaxed font-serif mb-6 pl-1">
                {post.content}
            </p>

            {cleanTags && cleanTags.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    {cleanTags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-zinc-800 text-zinc-600 bg-black/20">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <div className="flex gap-1">
                    <ReactionBtn icon={Heart} label={reactionCounts.like} onClick={() => handleReaction('like')} color="hover:text-pink-500" />
                    <ReactionBtn icon={Flame} label={reactionCounts.fire} onClick={() => handleReaction('fire')} color="hover:text-orange-500" />
                    <ReactionBtn icon={HeartCrack} label={reactionCounts.broken_heart} onClick={() => handleReaction('broken_heart')} color="hover:text-purple-500" />
                </div>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-900"
                >
                    <MessageCircle className="w-4 h-4" />
                    {showComments ? 'Close Talk' : 'Discussion'}
                </button>
            </div>

            {showComments && <AdultComments postId={post.id} />}
        </div>
    );
}

const ReactionBtn = ({ icon: Icon, label, onClick, color }) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-600 transition-all hover:bg-zinc-900 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label || ''}</span>
    </button>
);