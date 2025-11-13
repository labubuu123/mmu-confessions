import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import { extractTags, extractHashtagsForPreview } from '../utils/hashtags'
import { Image, Film, Mic, Send, X, Volume2, Sparkles, FileText, Tag, BarChart3, CalendarPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import PollCreator from '../components/PollCreator'
import EventCreator from '../components/EventCreator'


const MAX_VIDEO_SIZE_MB = 25
const MAX_IMAGES = 3
const MAX_AUDIO_SIZE_MB = 10
const MAX_TEXT_LENGTH = 5000

function getAnonId() {
    let anonId = localStorage.getItem('anonId')
    if (!anonId) {
        anonId = crypto.randomUUID()
        localStorage.setItem('anonId', anonId)
    }
    return anonId
}

export default function PostForm({ onPosted }) {
    const [text, setText] = useState('')
    const [images, setImages] = useState([])
    const [video, setVideo] = useState(null)
    const [audio, setAudio] = useState(null)
    const [previews, setPreviews] = useState([])
    const [videoPreview, setVideoPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [policyAccepted, setPolicyAccepted] = useState(false)
    const detectedTags = extractHashtagsForPreview(text);
    const [showPollCreator, setShowPollCreator] = useState(false)
    const [pollData, setPollData] = useState(null)
    const [showEventCreator, setShowEventCreator] = useState(false)
    const [eventData, setEventData] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()

        if (showEventCreator && (!eventData || !eventData.event_name || !eventData.start_time)) {
            setMsg('Please fill in all required event fields (Event Name and Start Time).')
            return
        }
        
        if (!text.trim() && images.length === 0 && !video && !audio && !eventData) {
            setMsg('Write something or attach media')
            return
        }

        if (text.length > MAX_TEXT_LENGTH) {
            setMsg(`Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.`)
            return
        }

        if (!policyAccepted) {
            setMsg('You must accept the policy to post.')
            return
        }
        
        setLoading(true)
        setMsg('')
        setUploadProgress(0)
        const { data: { session } } = await supabase.auth.getSession()
        const anonId = getAnonId()

        try {
            setMsg('Checking cooldown...')
            const { error: cooldownError } = await supabase.rpc('check_post_cooldown', {
                author_id_in: anonId
            })

            if (cooldownError) {
                throw new Error(cooldownError.message)
            }
            let media_urls = []
            let media_type = null
            let single_media_url = null

            if (images.length > 0) {
                setMsg('Uploading images...')
                for (let i = 0; i < images.length; i++) {
                    const img = images[i]
                    const compressed = await imageCompression(img, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1600
                    })

                    const ext = (compressed.name || 'image.jpg').split('.').pop()
                    const path = `public/${Date.now()}-${anonId.substring(0, 8)}-${i}.${ext}`

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('confessions')
                        .upload(path, compressed)

                    if (uploadError) throw uploadError

                    const { data: publicUrlData } = supabase.storage
                        .from('confessions')
                        .getPublicUrl(uploadData.path)

                    media_urls.push(publicUrlData.publicUrl)
                    setUploadProgress(((i + 1) / images.length) * 100)
                }
                media_type = 'images'
                single_media_url = media_urls[0]
            }

            if (video) {
                setMsg('Uploading video...')
                const ext = (video.name || 'video.mp4').split('.').pop()
                const path = `public/${Date.now()}-${anonId.substring(0, 8)}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, video)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path)

                media_urls = [publicUrlData.publicUrl]
                single_media_url = publicUrlData.publicUrl
                media_type = 'video'
            }

            if (audio) {
                setMsg('Uploading audio...')
                const ext = (audio.name || 'audio.mp3').split('.').pop()
                const path = `public/${Date.now()}-${anonId.substring(0, 8)}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, audio)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path)

                media_urls = [publicUrlData.publicUrl]
                single_media_url = publicUrlData.publicUrl
                media_type = 'audio'
            }

            setMsg('Posting...')
            const tags = extractTags(text)

            const { data, error } = await supabase.from('confessions')
                .insert([{
                    text: text.trim(),
                    author_id: anonId,
                    author_name: session ? 'Admin' : null,
                    media_url: single_media_url,
                    media_urls: media_urls.length > 0 ? media_urls : null,
                    media_type,
                    tags,
                    approved: true,
                    likes_count: 0,
                    comments_count: 0,
                    reported: false
                }])
                .select()

            if (error) {
                console.error('Insert error:', error)
                throw error
            }

            const postId = data[0].id

            if (pollData && pollData.question && pollData.options.length >= 2) {
                setMsg('Creating poll...')
                
                const endsAt = pollData.duration > 0
                    ? new Date(Date.now() + pollData.duration * 24 * 60 * 60 * 1000).toISOString()
                    : null

                const { error: pollError } = await supabase
                    .from('polls')
                    .insert([{
                        confession_id: postId,
                        question: pollData.question,
                        options: pollData.options,
                        ends_at: endsAt,
                        total_votes: 0
                    }])

                if (pollError) {
                    console.error('Poll creation error:', pollError)
                }
            }

            if (eventData && eventData.event_name && eventData.start_time) {
                setMsg('Creating event...')
                
                const { error: eventError } = await supabase
                    .from('events')
                    .insert([{
                        confession_id: postId,
                        event_name: eventData.event_name,
                        description: eventData.description || null,
                        start_time: eventData.start_time,
                        end_time: eventData.end_time || null,
                        location: eventData.location || null
                    }])

                if (eventError) {
                    console.error('Event creation error:', eventError)
                    alert('Post created, but event failed to save: ' + eventError.message)
                }
            }

            if (onPosted && data && data.length > 0) {
                onPosted(data[0])
            }

            setText('')
            setImages([])
            setVideo(null)
            setAudio(null)
            setPreviews([])
            setVideoPreview(null)
            setPolicyAccepted(false)
            setPollData(null)
            setShowPollCreator(false)
            setEventData(null)
            setShowEventCreator(false)
            setUploadProgress(0)
            setMsg('Posted successfully! ✓')
            
            setTimeout(() => setMsg(''), 3000)
        } catch (err) {
            console.error('Post error:', err)
            setMsg('Failed to post: ' + (err.message || err))
        } finally {
            setLoading(false)
        }
    }

    function handleImageChange(e) {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (files.length > MAX_IMAGES) {
            setMsg(`Maximum ${MAX_IMAGES} images allowed`)
            return
        }

        setVideo(null)
        setVideoPreview(null)
        setAudio(null)

        setImages(files)
        setMsg('')

        const newPreviews = []
        files.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                newPreviews.push(reader.result)
                if (newPreviews.length === files.length) {
                    setPreviews(newPreviews)
                }
            }
            reader.readAsDataURL(file)
        })
    }

    function handleVideoChange(e) {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setMsg(`Video must be under ${MAX_VIDEO_SIZE_MB}MB`)
            e.target.value = null
            return
        }

        setImages([])
        setPreviews([])
        setAudio(null)

        setVideo(file)
        setMsg('')

        const reader = new FileReader()
        reader.onloadend = () => {
            setVideoPreview(reader.result)
        }
        reader.readAsDataURL(file)
    }

    function handleAudioChange(e) {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
            setMsg(`Audio must be under ${MAX_AUDIO_SIZE_MB}MB`)
            e.target.value = null
            return
        }

        setImages([])
        setPreviews([])
        setVideo(null)
        setVideoPreview(null)

        setAudio(file)
        setMsg('')
    }

    function removeImage(index) {
        setImages(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    function removeVideo() {
        setVideo(null)
        setVideoPreview(null)
    }

    function removeAudio() {
        setAudio(null)
    }

    const charCount = text.length
    const isNearLimit = charCount > MAX_TEXT_LENGTH * 0.9

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Share Your Confession
                </h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        A
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="What's on your mind? Share anonymously... (Use #hashtags to categorize)"
                            className="w-full p-4 border-0 rounded-xl resize-none bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                            rows="4"
                            maxLength={MAX_TEXT_LENGTH}
                        />
                        <div className={`text-xs text-right mt-1 ${isNearLimit ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                            {charCount} / {MAX_TEXT_LENGTH}
                        </div>
                    </div>
                </div>

                {detectedTags.length > 0 && (
                    <div className="mb-4 ml-14 -mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Tag className="w-4 h-4" />
                            Detected Tags
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {detectedTags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full"
                            >
                                {tag}
                            </span>
                            ))}
                        </div>
                    </div>
                )}

                {previews.length > 0 && (
                    <div className="my-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {previews.map((preview, idx) => (
                            <div key={idx} className="relative group">
                                <img
                                    src={preview}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {videoPreview && (
                    <div className="my-4 relative">
                        <video src={videoPreview} className="w-full max-h-96 rounded-xl" controls />
                        <button
                            type="button"
                            onClick={removeVideo}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {audio && (
                    <div className="my-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center gap-3">
                        <Volume2 className="w-6 h-6 text-indigo-600" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {audio.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(audio.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={removeAudio}
                            className="text-red-500 hover:text-red-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {showPollCreator && (
                    <div className="my-4">
                        <PollCreator
                            onPollData={setPollData}
                            onRemovePoll={() => {
                                setShowPollCreator(false)
                                setPollData(null)
                            }}
                        />
                    </div>
                )}

                {showEventCreator && (
                    <div className="my-4">
                        <EventCreator
                            onEventData={setEventData}
                            onRemoveEvent={() => {
                                setShowEventCreator(false)
                                setEventData(null)
                            }}
                        />
                    </div>
                )}

                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Uploading...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={policyAccepted}
                            onChange={(e) => setPolicyAccepted(e.target.checked)}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            I have read and agree to the{' '}
                            <Link
                                to="/policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Community Guidelines
                            </Link>
                            .
                        </span>
                    </label>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <Image className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                Photos
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={loading || !!video || !!audio}
                            />
                        </label>

                        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <Film className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                Video
                            </span>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                className="hidden"
                                disabled={loading || images.length > 0 || !!audio}
                            />
                        </label>

                        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <Mic className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                Audio
                            </span>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioChange}
                                className="hidden"
                                disabled={loading || images.length > 0 || !!video}
                            />
                        </label>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setShowPollCreator(!showPollCreator)
                                setShowEventCreator(false)
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                                showPollCreator
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            disabled={loading || showEventCreator}
                        >
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                Poll
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowEventCreator(!showEventCreator)
                                setShowPollCreator(false)
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                                showEventCreator
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            disabled={loading || showPollCreator}
                        >
                            <CalendarPlus className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                                Event
                            </span>
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!text.trim() && images.length === 0 && !video && !audio && !eventData) || charCount > MAX_TEXT_LENGTH || !policyAccepted}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span className="hidden sm:inline">Posting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline">Post</span>
                            </>
                        )}
                    </button>
                </div>

                {msg && (
                    <div className={`mt-3 text-sm px-4 py-2 rounded-lg ${
                        msg.includes('Failed') || msg.includes('large') || msg.includes('Maximum') || msg.includes('too long') || msg.includes('must accept')
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                        {msg}
                    </div>
                )}
            </form>
        </div>
    )
}