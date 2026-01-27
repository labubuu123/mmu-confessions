import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Smile, MessageSquare, ChevronDown, ChevronUp, Globe, Sparkles, Loader2 } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import CommentForm from './CommentForm'
import { useUserBadges } from '../hooks/useUserBadges'
import { GoogleGenerativeAI } from "@google/generative-ai";

dayjs.extend(relativeTime)

const COMMENT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🤔', '🙏', '👏', '🤯', '😍', '🧐']
const LANGUAGES = [
    { code: 'English', label: 'English' },
    { code: 'Malay', label: 'Malay' },
    { code: 'Chinese', label: 'Chinese' },
    { code: 'Tamil', label: 'Tamil' },
];

export default function Comment({ comment, postId, depth = 0 }) {
    const [isReplying, setIsReplying] = useState(false)
    const [reactionLoading, setReactionLoading] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showReplies, setShowReplies] = useState(true)
    const [internalComment, setInternalComment] = useState(comment)
    const [translation, setTranslation] = useState(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [showTranslation, setShowTranslation] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState('English')
    const [showLangMenu, setShowLangMenu] = useState(false)
    const [replies, setReplies] = useState(comment.children || [])
    const langMenuRef = useRef(null)
    const { badges } = useUserBadges(internalComment.author_id)
    const isNested = depth > 0
    const maxMobileDepth = 2
    const currentMargin = depth > maxMobileDepth ? 'ml-2' : 'ml-3 sm:ml-8'

    useEffect(() => {
        const channel = supabase
            .channel(`comment-sync-${comment.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'comments',
                filter: `id=eq.${comment.id}`
            }, payload => {
                setInternalComment(prev => ({ ...prev, ...payload.new }))
            })
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [comment.id])

    async function handleReaction(emoji) {
        if (reactionLoading) return
        setReactionLoading(true)
        try {
            const currentReactions = internalComment.reactions || {}
            const newCount = (currentReactions[emoji] || 0) + 1
            const updatedReactions = { ...currentReactions, [emoji]: newCount }

            const { error } = await supabase
                .from('comments')
                .update({ reactions: updatedReactions })
                .eq('id', comment.id)

            if (error) throw error

            setInternalComment(prev => ({ ...prev, reactions: updatedReactions }))
            setShowEmojiPicker(false)
        } catch (err) {
            console.error('Reaction error:', err)
        } finally {
            setReactionLoading(false)
        }
    }

    const performTranslation = async (lang) => {
        if (isTranslating) return;
        setIsTranslating(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Translate to ${lang}: "${internalComment.text}". Return only the translation.`;
            const result = await model.generateContent(prompt);
            setTranslation(result.response.text());
            setShowTranslation(true);
            setTargetLanguage(lang);
        } catch (err) {
            console.error("Translation error:", err);
        } finally {
            setIsTranslating(false);
        }
    };

    const toggleTranslation = () => {
        if (translation) setShowTranslation(!showTranslation);
        else performTranslation(targetLanguage);
    };

    const totalReactions = internalComment.reactions
        ? Object.values(internalComment.reactions).reduce((sum, count) => sum + count, 0)
        : 0

    return (
        <div className={`relative ${isNested ? 'mt-4' : 'mt-6'}`}>
            {isNested && (
                <div className="absolute -left-3 sm:-left-6 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
            )}

            <div className="flex items-start gap-2 sm:gap-4">
                <div className="flex-shrink-0">
                    <AnonAvatar
                        authorId={internalComment.author_id}
                        size={isNested ? 'sm' : 'md'}
                        showBadge={true}
                        badges={badges}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all hover:bg-white dark:hover:bg-gray-800">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {internalComment.author_name || 'Anonymous'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {dayjs(internalComment.created_at).fromNow(true)}
                                </span>
                            </div>
                        </div>

                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                            {showTranslation && translation ? translation : internalComment.text}
                        </p>

                        {showTranslation && translation && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase">
                                <Sparkles className="w-3 h-3" /> AI Translated to {targetLanguage}
                            </div>
                        )}

                        {totalReactions > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {Object.entries(internalComment.reactions || {})
                                    .filter(([_, count]) => count > 0)
                                    .map(([emoji, count]) => (
                                        <div key={emoji} className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-[11px] shadow-sm">
                                            <span>{emoji}</span>
                                            <span className="font-bold text-gray-600 dark:text-gray-300">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 px-1">
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="flex items-center px-2 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Smile className="w-4 h-4" />
                            </button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 grid grid-cols-6 gap-1 w-max">
                                    {COMMENT_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(emoji)}
                                            className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-transform active:scale-75"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center px-2 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        <div className="relative flex items-center" ref={langMenuRef}>
                            <button
                                onClick={toggleTranslation}
                                disabled={isTranslating}
                                className={`flex items-center px-2 py-2 rounded-l-xl text-xs font-bold transition-colors ${showTranslation ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="px-2 py-2 rounded-r-xl border-l border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showLangMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => { performTranslation(lang.code); setShowLangMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${targetLanguage === lang.code ? 'text-indigo-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {replies.length > 0 && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="ml-auto flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                            >
                                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span>{replies.length}</span>
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-4">
                            <CommentForm
                                postId={postId}
                                parentId={comment.id}
                                onCommentPosted={(newReply) => {
                                    setReplies(prev => [newReply, ...prev]);
                                    setIsReplying(false);
                                    setShowReplies(true);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {replies.length > 0 && showReplies && (
                <div className={`${currentMargin} border-l-2 border-gray-100 dark:border-gray-800/50 mt-2`}>
                    {replies.map(reply => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}