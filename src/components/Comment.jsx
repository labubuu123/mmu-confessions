import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Smile, MessageSquare, ChevronDown, ChevronUp, MoreVertical, Globe, Sparkles, Loader2 } from 'lucide-react'
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
    const [showActions, setShowActions] = useState(false)

    const [replies, setReplies] = useState(comment.children || [])
    const [internalComment, setInternalComment] = useState(comment)

    const [translation, setTranslation] = useState(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [showTranslation, setShowTranslation] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState('English')
    const [showLangMenu, setShowLangMenu] = useState(false)
    const langMenuRef = useRef(null)

    const { badges } = useUserBadges(internalComment.author_id)

    const isNested = depth > 0
    const hasReplies = replies.length > 0

    useEffect(() => {
        const channel = supabase
            .channel(`comment-${comment.id}`)
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [langMenuRef]);

    async function handleReaction(emoji) {
        if (reactionLoading) return
        setReactionLoading(true)

        try {
            const reactions = internalComment.reactions || {}
            const newCount = (reactions[emoji] || 0) + 1
            const updatedReactions = { ...reactions, [emoji]: newCount }

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

    function handleReplyPosted(newReply) {
        setReplies(currentReplies => [newReply, ...currentReplies])
        setIsReplying(false)
    }

    const performTranslation = async (lang) => {
        setIsTranslating(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Translate the following text to ${lang}. Keep the tone, slang, and humor if possible: "${internalComment.text}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            setTranslation(response.text());
            setShowTranslation(true);
        } catch (err) {
            console.error("Translation error:", err);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslate = (e) => {
        if (showTranslation && !translation) {
            performTranslation(targetLanguage);
        } else if (showTranslation) {
            setShowTranslation(false);
        } else if (translation) {
            setShowTranslation(true);
        } else {
            performTranslation(targetLanguage);
        }
    };

    const handleLanguageSelect = (langCode) => {
        setTargetLanguage(langCode);
        setShowLangMenu(false);
        performTranslation(langCode);
    };

    const totalReactions = internalComment.reactions
        ? Object.values(internalComment.reactions).reduce((sum, count) => sum + count, 0)
        : 0

    return (
        <div className={`${isNested ? 'ml-2 sm:ml-6' : ''}`}>
            <div className="flex items-start gap-2 sm:gap-3 mb-2">
                <AnonAvatar
                    authorId={internalComment.author_id}
                    size={isNested ? 'sm' : 'md'}
                    showBadge={true}
                    badges={badges}
                />

                <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className={`text-sm sm:text-base font-semibold truncate ${internalComment.author_name
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                    {internalComment.author_name || 'Anonymous'}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {dayjs(internalComment.created_at).fromNow()}
                            </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                            {internalComment.text}
                        </p>

                        {showTranslation && translation && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 animate-in fade-in">
                                <div className="flex items-center gap-1 mb-1 text-[10px] font-bold text-indigo-500 uppercase">
                                    <Sparkles className="w-3 h-3" /> Translated to {targetLanguage}
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 italic">
                                    {translation}
                                </p>
                            </div>
                        )}

                        {totalReactions > 0 && (
                            <div className="flex flex-col gap-1 sm:gap-1.5 mt-2.5">
                                {Object.entries(internalComment.reactions)
                                    .filter(([_, count]) => count > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([emoji, count]) => (
                                        <div
                                            key={emoji}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-xs"
                                        >
                                            <span className="text-sm">{emoji}</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {count}
                                            </span>
                                        </div>
                                    ))}
                                {Object.keys(internalComment.reactions || {}).length > 4 && (
                                    <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                        +{Object.keys(internalComment.reactions).length - 4}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 mt-1.5 px-1 flex-wrap">
                        <div className="relative">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                            >
                                <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">React</span>
                            </button>

                            {showEmojiPicker && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setShowEmojiPicker(false)}
                                    />
                                    <div className="absolute top-0 left-full ml-2 z-40 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 w-fit">
                                        <div className="flex flex-nowrap gap-1">
                                            {COMMENT_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(emoji)}
                                                    disabled={reactionLoading}
                                                    className="text-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-90 transition-all disabled:opacity-50 touch-manipulation"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                        >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Reply</span>
                        </button>

                        <div className="relative flex items-center" ref={langMenuRef}>
                            <button
                                onClick={handleTranslate}
                                disabled={isTranslating}
                                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-l-lg text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all touch-manipulation"
                            >
                                {isTranslating ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                <span className="hidden xs:inline">{showTranslation ? 'Original' : 'Translate'}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                                className="px-1 py-1.5 rounded-r-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                title="Select Language"
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showLangMenu && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={(e) => { e.stopPropagation(); handleLanguageSelect(lang.code); }}
                                            className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${targetLanguage === lang.code ? 'text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="ml-auto flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all touch-manipulation"
                            >
                                {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{replies.length}</span>
                            </button>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-2.5">
                            <CommentForm
                                postId={postId}
                                parentId={comment.id}
                                onCommentPosted={handleReplyPosted}
                            />
                        </div>
                    )}
                </div>
            </div>

            {hasReplies && showReplies && (
                <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-2 sm:pl-4 ml-3 sm:ml-6 mt-1 space-y-2">
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