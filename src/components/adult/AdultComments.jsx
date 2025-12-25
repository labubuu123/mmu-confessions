import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Send, Ghost, MessageCircle, Heart, CornerDownRight } from 'lucide-react';
import AdultAvatar from './AdultAvatar';

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

function CommentItem({ comment, replies, allComments, myAlias, selectedGender, onReplySubmit, postId }) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const childReplies = allComments.filter(c => c.parent_id === comment.id);

    useEffect(() => {
        fetchCommentReactions();
    }, []);

    const fetchCommentReactions = async () => {
        const anonId = localStorage.getItem('anonId');

        const { count } = await supabase
            .from('adult_comment_reactions')
            .select('id', { count: 'exact' })
            .eq('comment_id', comment.id);

        setLikes(count || 0);

        if (anonId) {
            const { data } = await supabase
                .from('adult_comment_reactions')
                .select('id')
                .eq('comment_id', comment.id)
                .eq('user_id', anonId);
            if (data && data.length > 0) setIsLiked(true);
        }
    };

    const toggleLike = async () => {
        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);

        if (isLiked) {
            setIsLiked(false);
            setLikes(prev => Math.max(0, prev - 1));
            await supabase.from('adult_comment_reactions').delete().match({ comment_id: comment.id, user_id: anonId });
        } else {
            setIsLiked(true);
            setLikes(prev => prev + 1);
            await supabase.from('adult_comment_reactions').insert({ comment_id: comment.id, user_id: anonId });
        }
    };

    const handleReply = (e) => {
        e.preventDefault();
        onReplySubmit(replyText, comment.id);
        setReplyText("");
        setIsReplying(false);
    };

    return (
        <div className="mb-4">
            <div className="flex gap-3 group">
                <div className="shrink-0 pt-1">
                    <AdultAvatar gender={comment.author_alias} size="sm" />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-[11px] font-bold transition-colors ${comment.author_alias === 'Boy' ? 'text-cyan-400' : 'text-pink-400'}`}>
                            {comment.author_alias}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                            {timeAgo(comment.created_at)}
                        </span>
                    </div>

                    <div className="text-slate-300 text-sm leading-snug bg-slate-950 p-3 rounded-2xl rounded-tl-sm border border-slate-800/50 shadow-sm relative">
                        {comment.text}
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <button
                            onClick={toggleLike}
                            className={`flex items-center gap-1 text-[10px] font-bold transition-all ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-400'}`}
                        >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                            {likes > 0 && likes}
                        </button>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <MessageCircle className="w-3 h-3" />
                            Reply
                        </button>
                    </div>

                    {isReplying && (
                        <form onSubmit={handleReply} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="shrink-0">
                                <CornerDownRight className="w-4 h-4 text-slate-600 ml-2" />
                            </div>
                            <input
                                type="text"
                                autoFocus
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder={`Reply as ${selectedGender}...`}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-900"
                            />
                            <button
                                type="submit"
                                disabled={!replyText.trim()}
                                className="text-xs bg-slate-800 text-white px-3 py-1 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                            >
                                Send
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {childReplies.length > 0 && (
                <div className="ml-8 mt-2 pl-3 border-l border-slate-800 space-y-3">
                    {childReplies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            replies={[]}
                            allComments={allComments}
                            myAlias={myAlias}
                            selectedGender={selectedGender}
                            onReplySubmit={onReplySubmit}
                            postId={postId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdultComments({ postId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedGender, setSelectedGender] = useState('Boy');

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

        const anonId = localStorage.getItem('anonId') || 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonId', anonId);

        const myAlias = selectedGender;

        const tempComment = {
            id: Date.now(),
            text: text,
            author_alias: myAlias,
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
            author_alias: myAlias,
            parent_id: parentId
        });

        if (!error) {
            fetchComments();
        }
    };

    const rootComments = comments.filter(c => !c.parent_id);

    return (
        <div className="mt-4 pt-4 border-t border-slate-800 bg-black/20 -mx-6 px-6 pb-2">
            {loading ? (
                <div className="py-4 space-y-2">
                    <div className="h-4 w-1/3 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse"></div>
                </div>
            ) : (
                <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {comments.length === 0 && (
                        <div className="text-center py-6 flex flex-col items-center opacity-50">
                            <Ghost className="w-5 h-5 text-slate-600 mb-2" />
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest">No whispers yet</p>
                        </div>
                    )}

                    {rootComments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            allComments={comments}
                            replies={[]}
                            myAlias={selectedGender}
                            selectedGender={selectedGender}
                            onReplySubmit={(text, parentId) => handlePostComment(text, parentId)}
                            postId={postId}
                        />
                    ))}
                </div>
            )}

            <div className="pt-2 sticky bottom-0 bg-transparent backdrop-blur-sm pb-1">
                <div className="flex justify-start mb-2">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                            type="button"
                            onClick={() => setSelectedGender('Boy')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'Boy'
                                ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Boy ♂️
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedGender('Girl')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${selectedGender === 'Girl'
                                ? 'bg-pink-900/50 text-pink-400 border border-pink-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Girl ♀️
                        </button>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handlePostComment(newComment); }} className="flex gap-2 items-end">
                    <div className="shrink-0 mb-1">
                        <AdultAvatar gender={selectedGender} size="sm" />
                    </div>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={`Reply as ${selectedGender}...`}
                            className={`w-full bg-slate-950/50 border rounded-full px-4 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none transition-all placeholder-slate-600 ${selectedGender === 'Boy' ? 'focus:border-cyan-800 focus:ring-1 focus:ring-cyan-900/50 border-slate-800' : 'focus:border-pink-800 focus:ring-1 focus:ring-pink-900/50 border-slate-800'}`}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className={`absolute right-1 top-1 p-1.5 text-white rounded-full transition-all disabled:bg-transparent disabled:text-slate-600 ${selectedGender === 'Boy' ? 'bg-cyan-700 hover:bg-cyan-600' : 'bg-pink-700 hover:bg-pink-600'}`}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}