import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Send, Ghost, MessageCircle, Heart, Loader2 } from 'lucide-react';

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "now";
};

const MarsIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 3h5v5" />
        <path d="M21 3L13.5 10.5" />
        <circle cx="10" cy="14" r="6" />
    </svg>
);

const VenusIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 15v7" />
        <path d="M9 19h6" />
        <circle cx="12" cy="9" r="6" />
    </svg>
);

const CommentItem = React.memo(({ comment, allComments, myAlias, selectedGender, onReplySubmit }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const childReplies = useMemo(() =>
        allComments.filter(c => c.parent_id === comment.id),
        [allComments, comment.id]);

    useEffect(() => {
        fetchCommentReactions();
    }, []);

    const fetchCommentReactions = async () => {
        const anonId = localStorage.getItem('anonId');

        const [countResult, userLikeResult] = await Promise.all([
            supabase.from('adult_comment_reactions').select('id', { count: 'exact' }).eq('comment_id', comment.id),
            anonId ? supabase.from('adult_comment_reactions').select('id').eq('comment_id', comment.id).eq('user_id', anonId) : { data: [] }
        ]);

        setLikes(countResult.count || 0);
        if (userLikeResult.data?.length > 0) setIsLiked(true);
    };

    const toggleLike = async () => {
        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);

        const previousLiked = isLiked;
        const previousLikes = likes;

        setIsLiked(!previousLiked);
        setLikes(prev => previousLiked ? prev - 1 : prev + 1);

        try {
            if (previousLiked) {
                await supabase.from('adult_comment_reactions').delete().match({ comment_id: comment.id, user_id: anonId });
            } else {
                await supabase.from('adult_comment_reactions').insert({ comment_id: comment.id, user_id: anonId });
            }
        } catch (error) {
            setIsLiked(previousLiked);
            setLikes(previousLikes);
        }
    };

    const handleReply = (e) => {
        e.preventDefault();
        onReplySubmit(replyText, comment.id);
        setReplyText("");
        setIsReplying(false);
    };

    const isBoy = comment.author_alias === 'Boy';
    const accentColor = isBoy ? 'text-cyan-400' : 'text-pink-400';
    const borderColor = isBoy ? 'border-cyan-500/30' : 'border-pink-500/30';

    return (
        <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex gap-3">
                <div className="shrink-0 pt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${borderColor} bg-slate-900 shadow-sm`}>
                        {isBoy ? <MarsIcon className="w-4 h-4 text-cyan-400" /> : <VenusIcon className="w-4 h-4 text-pink-400" />}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[11px] font-bold ${accentColor}`}>
                            {comment.author_alias}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                            • {timeAgo(comment.created_at)}
                        </span>
                    </div>

                    <div className="text-slate-200 text-sm leading-relaxed bg-slate-900/50 p-2.5 rounded-2xl rounded-tl-none border border-slate-800">
                        {comment.text}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 ml-1">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-1.5 text-[10px] font-bold transition-all px-2 py-1 rounded-full hover:bg-slate-900 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}
                        >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            {likes > 0 ? likes : 'Like'}
                        </button>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-full hover:bg-slate-900"
                        >
                            <MessageCircle className="w-3 h-3" />
                            Reply
                        </button>
                    </div>

                    {isReplying && (
                        <form onSubmit={handleReply} className="mt-2 flex gap-2 animate-in fade-in zoom-in-95">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    autoFocus
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder={`Replying as ${selectedGender}...`}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-900 focus:ring-1 focus:ring-rose-900/50 pr-10"
                                />
                                <button
                                    type="submit"
                                    disabled={!replyText.trim()}
                                    className="absolute right-1 top-1 bottom-1 px-2 text-rose-500 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {childReplies.length > 0 && (
                <div className="flex mt-2">
                    <div className="w-8 flex justify-center shrink-0">
                        <div className="w-0.5 bg-slate-800 rounded-full h-full mb-4"></div>
                    </div>
                    <div className="flex-1 space-y-3 pt-1">
                        {childReplies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                allComments={allComments}
                                myAlias={myAlias}
                                selectedGender={selectedGender}
                                onReplySubmit={onReplySubmit}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

export default function AdultComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedGender, setSelectedGender] = useState('Boy');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        const { data } = await supabase
            .from('adult_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        setComments(data || []);
        setLoading(false);
    };

    const handlePostComment = async (text, parentId = null) => {
        if (!text.trim()) return;

        if (!parentId) setIsSubmitting(true);

        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);

        const tempId = Date.now();
        const tempComment = {
            id: tempId,
            text: text,
            author_alias: selectedGender,
            created_at: new Date().toISOString(),
            parent_id: parentId,
            post_id: postId
        };

        setComments(prev => [...prev, tempComment]);
        if (!parentId) setNewComment("");

        const { error } = await supabase.from('adult_comments').insert({
            post_id: postId,
            text: text,
            author_id: anonId,
            author_alias: selectedGender,
            parent_id: parentId
        });

        if (error) {
            console.error(error);
        }

        if (!parentId) setIsSubmitting(false);
    };

    const rootComments = useMemo(() => comments.filter(c => !c.parent_id), [comments]);
    const genderColor = selectedGender === 'Boy' ? 'text-cyan-400' : 'text-pink-400';
    const inputBorder = selectedGender === 'Boy' ? 'focus:border-cyan-800 focus:ring-cyan-900/50' : 'focus:border-pink-800 focus:ring-pink-900/50';
    const buttonBg = selectedGender === 'Boy' ? 'bg-cyan-700 hover:bg-cyan-600' : 'bg-pink-700 hover:bg-pink-600';

    return (
        <div className="mt-4 pt-1 border-t border-slate-800/50 bg-slate-950/30 -mx-6 px-6 pb-2">
            <div className="flex items-center justify-between mb-4 pt-4">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" />
                    Whispers ({comments.length})
                </div>
            </div>

            {loading ? (
                <div className="py-8 space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-slate-900 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-slate-900 rounded"></div>
                                <div className="h-10 w-full bg-slate-900 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 mb-6">
                    {comments.length === 0 && (
                        <div className="text-center py-8 flex flex-col items-center justify-center opacity-60">
                            <Ghost className="w-8 h-8 text-slate-700 mb-2" />
                            <p className="text-xs text-slate-500 font-medium">Be the first to whisper...</p>
                        </div>
                    )}

                    {rootComments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            allComments={comments}
                            myAlias={selectedGender}
                            selectedGender={selectedGender}
                            onReplySubmit={(text, parentId) => handlePostComment(text, parentId)}
                        />
                    ))}
                </div>
            )}

            {/* Static Form for All Views */}
            <div className="pt-2">
                <div className="flex justify-start mb-3">
                    <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setSelectedGender('Boy')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'Boy'
                                ? 'bg-cyan-950 text-cyan-400 shadow-sm ring-1 ring-cyan-800'
                                : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <MarsIcon className="w-3 h-3" /> Boy
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedGender('Girl')}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'Girl'
                                ? 'bg-pink-950 text-pink-400 shadow-sm ring-1 ring-pink-800'
                                : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <VenusIcon className="w-3 h-3" /> Girl
                        </button>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handlePostComment(newComment); }} className="flex gap-2 items-end">
                    <div className="shrink-0 mb-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border bg-slate-900 ${selectedGender === 'Boy' ? 'border-cyan-500/30' : 'border-pink-500/30'}`}>
                            {selectedGender === 'Boy' ? <MarsIcon className="w-4 h-4 text-cyan-400" /> : <VenusIcon className="w-4 h-4 text-pink-400" />}
                        </div>
                    </div>
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={`Whisper as ${selectedGender}...`}
                            className={`w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 pr-12 text-sm text-slate-200 focus:outline-none transition-all placeholder-slate-600 focus:ring-1 shadow-inner ${inputBorder}`}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-slate-800 ${buttonBg}`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}