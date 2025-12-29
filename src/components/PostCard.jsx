import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Heart, MessageCircle, Volume2, TrendingUp, Clock, AlertTriangle, BarChart3, Calendar, Link as LinkIcon, Check, Zap, Ghost, ExternalLink, Sparkles, Star, MessageSquare, Globe, Loader2, ChevronDown, Quote, Scale } from 'lucide-react'
import AnonAvatar from './AnonAvatar'
import PollDisplay from './PollDisplay'
import EventDisplay from './EventDisplay'
import LostFoundDisplay from './LostFoundDisplay'
import ImageGalleryModal from './ImageGalleryModal'
import ReactionTooltip from './ReactionToolTip'
import ShareButton from './ShareButton'
import { MoodBadge } from './MoodSelector'
import { CampusBadge } from './CampusSelector'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { renderTextWithHashtags } from '../utils/hashtags'
import SeriesIndicator from './SeriesIndicator';
import { GoogleGenerativeAI } from "@google/generative-ai";

dayjs.extend(relativeTime)

const WhatsAppIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
)

const getOptimizedUrl = (url, width = null, quality = 65) => {
    if (!url || typeof url !== 'string') return url;

    if (url.includes('/storage/v1/object/public')) {
        let optimized = url.replace('/object/public', '/render/image/public');
        const params = [`quality=${quality}`];

        if (width) {
            params.push(`width=${width}`);
            params.push('resize=contain');
        }

        return `${optimized}?${params.join('&')}`;
    }

    return url;
};

const generateSrcSet = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('/storage/v1/object/public')) return undefined;

    return `
        ${getOptimizedUrl(url, 400)} 400w,
        ${getOptimizedUrl(url, 800)} 800w,
        ${getOptimizedUrl(url, 1200)} 1200w
    `;
};

const LANGUAGES = [
    { code: 'English', label: 'English' },
    { code: 'Malay', label: 'Malay' },
    { code: 'Chinese', label: 'Chinese' },
    { code: 'Tamil', label: 'Tamil' },
];

export default function PostCard({ post, onOpen, onQuote }) {
    const [reactions, setReactions] = useState({})
    const [isReported, setIsReported] = useState(post.reported || false)
    const [poll, setPoll] = useState(null)
    const [event, setEvent] = useState(null)
    const [lostFound, setLostFound] = useState(null)
    const [zoomedImage, setZoomedImage] = useState(null)
    const [showHeartAnimation, setShowHeartAnimation] = useState(false)
    const [translation, setTranslation] = useState(null)
    const [isTranslating, setIsTranslating] = useState(false)
    const [showTranslation, setShowTranslation] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState('English')
    const [showLangMenu, setShowLangMenu] = useState(false)
    const langMenuRef = useRef(null)

    const getTotalReactions = useCallback((reactionsObj) => {
        if (!reactionsObj) return 0
        return Object.values(reactionsObj).reduce((sum, count) => sum + count, 0)
    }, [])

    const excerpt = useMemo(() => post.text?.length > 280 ? post.text.slice(0, 280) + '...' : post.text, [post.text])
    const renderedText = useMemo(() => renderTextWithHashtags(excerpt), [excerpt])

    const displayImages = useMemo(() => {
        if (Array.isArray(post.media_urls) && post.media_urls.length > 0) return post.media_urls
        else if (post.media_url) return [post.media_url]
        return []
    }, [post.media_urls, post.media_url])

    const currentTotalReactions = useMemo(() => getTotalReactions(reactions), [reactions, getTotalReactions])

    const getEngagementScore = useCallback(() => {
        const age = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60)
        const score = (currentTotalReactions * 2 + (post.comments_count || 0) * 3) / (age + 2)
        return score
    }, [post.created_at, post.comments_count, currentTotalReactions])

    const isHotPost = useMemo(() => getEngagementScore() > 5, [getEngagementScore])
    const isTrendingPost = useMemo(() => currentTotalReactions > 20 || (post.comments_count || 0) > 10, [currentTotalReactions, post.comments_count])

    const moodData = useMemo(() => { try { return post.mood ? JSON.parse(post.mood) : null; } catch (e) { return null; } }, [post.mood]);

    useEffect(() => { fetchReactions(); fetchAttachments(); }, [post.id])

    useEffect(() => {
        function handleClickOutside(event) {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [langMenuRef]);

    async function fetchReactions() {
        const { data } = await supabase.from('reactions').select('emoji, count').eq('post_id', post.id)
        if (data) {
            const reactionsMap = {}; data.forEach(r => { reactionsMap[r.emoji] = r.count }); setReactions(reactionsMap)
        }
    }

    async function fetchAttachments() {
        const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('confession_id', post.id)
            .limit(1)
            .maybeSingle()
        if (eventData) {
            setEvent(eventData)
            return;
        }

        const { data: pollData } = await supabase.from('polls').select('*').eq('confession_id', post.id).maybeSingle()
        if (pollData) {
            setPoll(pollData)
            return;
        }

        const { data: lfData } = await supabase.from('lost_and_found').select('*').eq('confession_id', post.id).maybeSingle()
        if (lfData) {
            setLostFound(lfData)
        }
    }

    async function handleReport(e) {
        e.stopPropagation()
        if (isReported) { alert('You have already reported this post.'); return }
        if (!window.confirm('Are you sure you want to report this post?')) return
        try {
            const { error } = await supabase.rpc('increment_report_count', { post_id_in: post.id })
            if (error) throw error; setIsReported(true); alert('Post reported successfully.')
        } catch (err) { console.error('Report error:', err); alert('Failed to report post.') }
    }

    const performTranslation = async (lang) => {
        setIsTranslating(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `Translate the following text to ${lang}. Keep the tone, slang, and humor if possible: "${post.text}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            setTranslation(response.text());
            setShowTranslation(true);
        } catch (err) {
            console.error("Translation error:", err);
            alert("Failed to translate. Please try again later.");
        } finally {
            setIsTranslating(false);
        }
    };

    const handleTranslate = (e) => {
        e.stopPropagation();
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

    function handleImageClick(e, url) { e.stopPropagation(); setZoomedImage(url); }

    const getPostAge = useCallback(() => {
        const hours = dayjs().diff(dayjs(post.created_at), 'hour')
        if (hours < 1) return { label: 'NEW', color: 'green' }
        return null
    }, [post.created_at])

    const postAge = useMemo(() => getPostAge(), [getPostAge])

    const triggerHeartExplosion = (e) => {
        e.stopPropagation();
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1200);
    };

    const handleSponsorClick = (url) => {
        if (url) window.open(url, '_blank');
    }

    const brandColor = post.brand_color || '#EAB308';
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '234, 179, 8';
    }
    const brandRgb = hexToRgb(brandColor);

    const getPostStyle = () => {
        if (post.is_sponsored) {
            return {
                borderColor: brandColor,
                boxShadow: `0 8px 32px -8px rgba(${brandRgb}, 0.25)`,
            };
        }

        const shadow = (r, g, b) => `0 4px 20px -5px rgba(${r}, ${g}, ${b}, 0.2)`;

        if (post.is_debate) {
            return { borderColor: '#f97316', boxShadow: shadow(249, 115, 22) };
        }
        if (event) {
            return { borderColor: '#fbbf24', boxShadow: shadow(251, 191, 36) };
        }
        if (poll) {
            return { borderColor: '#6366f1', boxShadow: shadow(99, 102, 241) };
        }
        if (lostFound) {
            if (lostFound.type === 'lost') {
                return { borderColor: '#ef4444', boxShadow: shadow(239, 68, 68) };
            } else {
                return { borderColor: '#22c55e', boxShadow: shadow(34, 197, 94) };
            }
        }
        if (post.series_id) {
            return { borderColor: '#a855f7', boxShadow: shadow(168, 85, 247) };
        }

        return {};
    };

    const containerStyle = getPostStyle();
    const isSpecialPost = post.is_sponsored || post.is_debate || !!event || !!poll || !!lostFound || !!post.series_id;

    const shimmerStyle = post.is_sponsored ? {
        background: `linear-gradient(110deg, transparent 30%, rgba(${brandRgb}, 0.15) 50%, transparent 70%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 4s infinite linear'
    } : {};

    const getImageSizes = () => {
        const count = displayImages.length;
        if (count === 1) return "(max-width: 640px) 100vw, 640px";
        if (count === 2) return "(max-width: 640px) 50vw, 320px";
        if (count === 3) return "(max-width: 640px) 33vw, 213px";
        return "(max-width: 640px) 50vw, 320px";
    };

    return (
        <>
            <style>{`
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                @keyframes floatUp { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 20% { opacity: 1; transform: scale(1.2); } 100% { transform: translateY(-100px) scale(1); opacity: 0; } }
            `}</style>

            <article
                onClick={() => onOpen && onOpen(post)}
                style={containerStyle}
                className={`
                    relative mb-6 rounded-2xl transition-all duration-300 cursor-pointer group w-full overflow-hidden
                    ${showLangMenu ? 'z-30' : 'z-0'}
                    ${post.is_sponsored ? 'transform hover:-translate-y-1' : ''}
                    ${isSpecialPost
                        ? 'bg-white dark:bg-gray-800 border-2'
                        : 'bg-white dark:bg-gray-800 shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700'}
                `}
                itemScope
                itemType="http://schema.org/SocialMediaPosting"
            >
                {post.is_sponsored && (
                    <div className="absolute inset-0 pointer-events-none z-0" style={shimmerStyle} />
                )}

                {showHeartAnimation && (
                    <div className="absolute inset-0 z-50 pointer-events-none flex justify-center items-center overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <Heart
                                key={i}
                                className="absolute text-red-500 fill-red-500"
                                style={{
                                    left: `${50 + (Math.random() * 60 - 30)}%`,
                                    bottom: '30%',
                                    animation: `floatUp ${0.8 + Math.random() * 0.6}s ease-out forwards`,
                                    width: `${24 + Math.random() * 24}px`,
                                    height: `${24 + Math.random() * 24}px`,
                                    animationDelay: `${Math.random() * 0.2}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {!post.is_sponsored && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex flex-col items-end gap-1.5 sm:gap-2 max-w-[calc(100%-4rem)] pointer-events-none">
                        {postAge && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full font-medium flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" /> {postAge.label}
                            </span>
                        )}
                        {post.pinned && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">📌 PINNED</div>}
                        {isHotPost && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1 animate-pulse">🔥 HOT</div>}
                        {isTrendingPost && !isHotPost && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><TrendingUp className="w-3 h-3" /> TRENDING</div>}
                        {post.is_debate && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><Scale className="w-3 h-3" /> DEBATE</div>}
                        {poll && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><BarChart3 className="w-3 h-3" /> POLL</div>}
                        {event && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><Calendar className="w-3 h-3" /> EVENT</div>}
                        {lostFound && <div className={`px-2 sm:px-3 py-0.5 sm:py-1 ${lostFound.type === 'lost' ? 'bg-red-500' : 'bg-green-500'} text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1`}><AlertTriangle className="w-3 h-3" /> {lostFound.type.toUpperCase()}</div>}
                    </div>
                )}

                <div className="p-4 flex items-start gap-3 relative z-10 w-full">
                    <AnonAvatar authorId={post.author_id} size="md" isSponsored={post.is_sponsored} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0 w-full">
                                <div
                                    className="font-bold text-base truncate flex items-center gap-1.5 max-w-full"
                                    style={{ color: post.is_sponsored ? brandColor : undefined }}
                                    itemProp="author"
                                >
                                    {post.author_name || 'Anonymous'}
                                </div>
                                {(moodData || post.campus) && (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {moodData && <MoodBadge mood={moodData} />}
                                        {post.campus && <CampusBadge campus={post.campus} />}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {post.is_sponsored ? (
                                <span className="tracking-widest font-bold text-[12px] opacity-80">
                                    Ads
                                </span>
                            ) : (
                                <time itemProp="datePublished" dateTime={post.created_at}>
                                    {dayjs(post.created_at).fromNow()}
                                </time>
                            )}
                        </div>
                    </div>

                    {post.is_sponsored && (
                        <div
                            className="px-3 py-1 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1"
                            style={{ backgroundColor: brandColor }}
                        >
                            <Star className="w-3 h-3 fill-white" /> Sponsored
                        </div>
                    )}
                </div>

                <div className="px-4 pb-3 relative z-10 w-full">
                    {post.reply_to_id && (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-indigo-500 text-sm opacity-90 transition-opacity hover:opacity-100 max-w-full">
                            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                <Quote className="w-3 h-3" />
                                <span>Replying to a Confession</span>
                            </div>
                            <div
                                className="text-gray-700 dark:text-gray-300 italic cursor-pointer hover:underline hover:text-indigo-600 dark:hover:text-indigo-300 truncate"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpen) onOpen({ id: post.reply_to_id });
                                }}
                            >
                                Click to view original...
                            </div>
                        </div>
                    )}

                    <p className={`text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words w-full leading-relaxed ${post.is_sponsored ? 'font-medium' : ''}`} itemProp="articleBody">
                        {renderedText}
                    </p>

                    {showTranslation && translation && (
                        <div className="mt-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2 w-full">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3" /> Translated to {targetLanguage}
                                </div>
                            </div>
                            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words w-full leading-relaxed italic">
                                {translation}
                            </p>
                        </div>
                    )}
                </div>

                {lostFound && (
                    <div className="px-3 sm:px-4 pb-3 relative z-0" onClick={(e) => e.stopPropagation()}>
                        <LostFoundDisplay {...lostFound} />
                    </div>
                )}

                {post.is_sponsored && displayImages.length > 0 && (
                    <div className="w-full relative z-10 cursor-pointer group/img mb-2" onClick={(e) => { e.stopPropagation(); handleSponsorClick(post.sponsor_url); }}>
                        <img
                            src={getOptimizedUrl(displayImages[0], 800, 80)}
                            srcSet={generateSrcSet(displayImages[0])}
                            sizes="(max-width: 640px) 100vw, 640px"
                            alt="Sponsored Content"
                            className="w-full h-auto max-h-[80vh] object-contain bg-black/5 dark:bg-black/20 shadow-inner transition-transform duration-700 group-hover/img:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                            <span className="text-white font-bold bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                                View Offer
                            </span>
                        </div>
                    </div>
                )}

                {!post.is_sponsored && post.media_type === 'images' && displayImages.length > 0 && (
                    <div className={`w-full relative z-0 ${displayImages.length === 1 ? '' : displayImages.length === 2 ? 'grid grid-cols-2' : displayImages.length === 3 ? 'grid grid-cols-3' : 'grid grid-cols-2'} gap-0.5`}>
                        {displayImages.slice(0, 4).map((url, idx) => (
                            <div key={idx} className="relative cursor-pointer group/img" onClick={(e) => handleImageClick(e, url)}>
                                <img
                                    loading="lazy"
                                    src={getOptimizedUrl(url, 800)}
                                    srcSet={generateSrcSet(url)}
                                    sizes={getImageSizes()}
                                    alt={`media ${idx + 1}`}
                                    className={`w-full transition-transform group-hover/img:scale-105 ${displayImages.length === 1 ? 'max-h-[75vh]' : 'object-cover h-40 sm:h-48 rounded-lg'}`}
                                    itemProp="image"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition" />
                                {idx === 3 && displayImages.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white text-xl sm:text-2xl font-bold">+{displayImages.length - 4}</span></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {post.media_type === 'video' && post.media_url && (
                    <div className="w-full relative z-0"><video src={post.media_url} className="w-full max-h-64 sm:max-h-96 rounded-xl" controls preload="metadata" onClick={(e) => e.stopPropagation()} /></div>
                )}
                {post.media_type === 'audio' && post.media_url && (
                    <div className="px-3 sm:px-4 pb-3 relative z-0">
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">Voice Message {moodData?.voice_effect && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border">{moodData.voice_effect}</span>}</p>
                                <audio controls className="w-full h-8" onClick={(e) => e.stopPropagation()}><source src={post.media_url} /></audio>
                            </div>
                        </div>
                    </div>
                )}

                {post.series_id && <div className="px-3 sm:px-4 pb-3 relative z-0"><SeriesIndicator post={post} /></div>}
                {event && <div className="px-3 sm:px-4 pb-3 relative z-0" onClick={(e) => e.stopPropagation()}><EventDisplay {...event} /></div>}
                {poll && !event && <div className="px-3 sm:px-4 pb-3 relative z-0" onClick={(e) => e.stopPropagation()}><PollDisplay poll={poll} confessionId={post.id} /></div>}

                <div className="px-4 py-3 relative z-10">
                    {post.is_sponsored ? (
                        <div className="flex items-stretch gap-2 sm:gap-3 mt-3">
                            <button
                                onClick={triggerHeartExplosion}
                                className="flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-white shadow-lg transform transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap min-w-0"
                                style={{ backgroundColor: brandColor }}
                            >
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-pulse" />
                                <span>Send Love</span>
                            </button>

                            {post.sponsor_url && (
                                <a
                                    href={post.sponsor_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap min-w-0"
                                >
                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Visit Site
                                </a>
                            )}

                            {post.whatsapp_number && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://wa.me/${post.whatsapp_number}`, '_blank');
                                    }}
                                    className="flex-none py-2 sm:py-2.5 px-3 sm:px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-sm transition flex items-center justify-center"
                                    title="Chat on WhatsApp"
                                >
                                    <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {(currentTotalReactions > 0) && <div className="mb-2"><ReactionTooltip reactions={reactions} /></div>}
                            <div className="flex items-center justify-between w-full sm:justify-start sm:gap-3">
                                <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(post) }} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                    <Heart className="w-5 h-5" /> <span className="font-medium hidden sm:inline">React</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(post) }} className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                    <MessageCircle className="w-5 h-5" /> <span className="font-medium">{post.comments_count || 0}</span>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onQuote) onQuote(post);
                                    }}
                                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                    title="Quote this confession"
                                >
                                    <Quote className="w-5 h-5" />
                                    <span className="font-medium hidden sm:inline">Quote</span>
                                </button>

                                <div className="relative flex items-center" ref={langMenuRef}>
                                    <button
                                        onClick={handleTranslate}
                                        className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-l-lg transition-all ${isTranslating ? 'opacity-50' : ''}`}
                                        disabled={isTranslating}
                                    >
                                        {isTranslating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                                        <span className="font-medium hidden sm:inline">
                                            {showTranslation ? 'Original' : 'Translate'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowLangMenu(!showLangMenu); }}
                                        className="px-1.5 py-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-r-lg border-l border-gray-200 dark:border-gray-700/50"
                                        title="Select Language"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    {showLangMenu && (
                                        <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
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

                                <ShareButton post={post} />

                                <button onClick={handleReport} disabled={isReported} className={`p-2 rounded-lg transition-all sm:ml-auto ${isReported ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </article>

            {zoomedImage && <ImageGalleryModal images={displayImages} initialIndex={displayImages.indexOf(zoomedImage)} onClose={() => setZoomedImage(null)} />}
        </>
    )
}