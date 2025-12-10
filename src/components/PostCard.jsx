import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Heart, MessageCircle, Volume2, TrendingUp, Clock, AlertTriangle, BarChart3, Calendar, Link as LinkIcon, Check, Zap, Ghost, ExternalLink, Sparkles, Star, MessageSquare } from 'lucide-react'
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

export default function PostCard({ post, onOpen }) {
    const [reactions, setReactions] = useState({})
    const [isReported, setIsReported] = useState(post.reported || false)
    const [poll, setPoll] = useState(null)
    const [event, setEvent] = useState(null)
    const [lostFound, setLostFound] = useState(null)
    const [zoomedImage, setZoomedImage] = useState(null)
    const [showHeartAnimation, setShowHeartAnimation] = useState(false)

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

    async function fetchReactions() {
        const { data } = await supabase.from('reactions').select('emoji, count').eq('post_id', post.id)
        if (data) {
            const reactionsMap = {}; data.forEach(r => { reactionsMap[r.emoji] = r.count }); setReactions(reactionsMap)
        }
    }

    async function fetchAttachments() {
        const { data: eventData } = await supabase.from('events').select('*').eq('confession_id', post.id).maybeSingle()
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

    const containerStyle = post.is_sponsored ? {
        borderColor: brandColor,
        boxShadow: `0 8px 32px -8px rgba(${brandRgb}, 0.25)`,
    } : {};

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

            <div
                onClick={() => onOpen && onOpen(post)}
                style={containerStyle}
                className={`
                    relative isolate mb-6 overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer group
                    ${post.is_sponsored
                        ? 'bg-white dark:bg-gray-800 border-2 transform hover:-translate-y-1'
                        : 'bg-white dark:bg-gray-800 shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700'}
                `}
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
                        {poll && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><BarChart3 className="w-3 h-3" /> POLL</div>}
                        {event && <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"><Calendar className="w-3 h-3" /> EVENT</div>}
                        {lostFound && <div className={`px-2 sm:px-3 py-0.5 sm:py-1 ${lostFound.type === 'lost' ? 'bg-red-500' : 'bg-green-500'} text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1`}><AlertTriangle className="w-3 h-3" /> {lostFound.type.toUpperCase()}</div>}
                    </div>
                )}

                <div className="p-4 flex items-start gap-3 relative z-10">
                    <AnonAvatar authorId={post.author_id} size="md" isSponsored={post.is_sponsored} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0">
                                <div
                                    className="font-bold text-base truncate flex items-center gap-1.5"
                                    style={{ color: post.is_sponsored ? brandColor : undefined }}
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
                            ) : dayjs(post.created_at).fromNow()}
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

                <div className="px-4 pb-3 relative z-10">
                    <p className={`text-sm sm:text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed ${post.is_sponsored ? 'font-medium' : ''}`}>
                        {renderedText}
                    </p>
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
                                    className={`w-full transition-transform group-hover/img:scale-105 ${displayImages.length === 1 ? 'max-h-[75vh]' : 'object-cover h-40 sm:h-48'}`}
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
                    <div className="w-full relative z-0"><video src={post.media_url} className="w-full max-h-64 sm:max-h-96" controls preload="metadata" onClick={(e) => e.stopPropagation()} /></div>
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(post) }} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                        <Heart className="w-5 h-5" /> <span className="font-medium">React</span>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen(post) }} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                        <MessageCircle className="w-5 h-5" /> <span className="font-medium">{post.comments_count || 0}</span>
                                    </button>
                                    <ShareButton post={post} />
                                </div>
                                <button onClick={handleReport} disabled={isReported} className={`p-2 rounded-lg transition-all ${isReported ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {zoomedImage && <ImageGalleryModal images={displayImages} initialIndex={displayImages.indexOf(zoomedImage)} onClose={() => setZoomedImage(null)} />}
        </>
    )
}