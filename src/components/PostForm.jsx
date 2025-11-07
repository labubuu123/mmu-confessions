import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import { extractTags } from '../utils/hashtags'
import { Camera, Image, Film, Mic, Send, X, Volume2 } from 'lucide-react'

const MAX_VIDEO_SIZE_MB = 25
const MAX_IMAGES = 5
const MAX_AUDIO_SIZE_MB = 10

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

    async function handleSubmit(e) {
        e.preventDefault()
        if (!text.trim() && images.length === 0 && !video && !audio) {
            setMsg('Write something or attach media')
            return
        }
        
        setLoading(true)
        setMsg('')
        setUploadProgress(0)

        try {
            // Rate limit check
            try {
                const rateLimitRes = await fetch('/.netlify/functions/rate-limit', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'post' }),
                    headers: { 'Content-Type': 'application/json' }
                })
                if (!rateLimitRes.ok) {
                    const data = await rateLimitRes.json()
                    throw new Error(data.reason || 'Rate limit exceeded')
                }
            } catch (e) {
                if (e.message.includes('slow down')) throw e
                console.warn('Rate-limit check skipped:', e)
            }

            let media_urls = []
            let media_type = null

            // Upload images
            if (images.length > 0) {
                setMsg('Uploading images...')
                for (let i = 0; i < images.length; i++) {
                    const img = images[i]
                    const compressed = await imageCompression(img, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1600
                    })

                    const ext = (compressed.name || 'image.jpg').split('.').pop()
                    const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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
            }

            // Upload video
            if (video) {
                setMsg('Uploading video...')
                const ext = (video.name || 'video.mp4').split('.').pop()
                const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, video)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path)

                media_urls = [publicUrlData.publicUrl]
                media_type = 'video'
            }

            // Upload audio
            if (audio) {
                setMsg('Uploading audio...')
                const ext = (audio.name || 'audio.mp3').split('.').pop()
                const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, audio)

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path)

                media_urls = [publicUrlData.publicUrl]
                media_type = 'audio'
            }

            setMsg('Posting...')
            const tags = extractTags(text)

            const { data, error } = await supabase.from('confessions')
                .insert([{
                    text,
                    media_url: media_urls.length > 0 ? media_urls[0] : null,
                    media_urls: media_urls.length > 1 ? media_urls : null,
                    media_type,
                    tags,
                    approved: true
                }])
                .select()

            if (error) {
                console.error('Insert error:', error)
                throw error
            }

            if (onPosted && data && data.length > 0) {
                onPosted(data[0])
            }

            // Reset form
            setText('')
            setImages([])
            setVideo(null)
            setAudio(null)
            setPreviews([])
            setVideoPreview(null)
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

        // Clear other media
        setVideo(null)
        setVideoPreview(null)
        setAudio(null)

        setImages(files)
        setMsg('')

        // Create previews
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

        // Clear other media
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

        // Clear other media
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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        A
                    </div>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="What's on your mind? Share anonymously..."
                        className="flex-1 p-4 border-0 rounded-xl resize-none bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        rows="3"
                    />
                </div>

                {/* Image Previews */}
                {previews.length > 0 && (
                    <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
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

                {/* Video Preview */}
                {videoPreview && (
                    <div className="mb-4 relative">
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

                {/* Audio Preview */}
                {audio && (
                    <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center gap-3">
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

                {/* Upload Progress */}
                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
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
                                disabled={loading || video || audio}
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
                                disabled={loading || images.length > 0 || audio}
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
                                disabled={loading || images.length > 0 || video}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || (!text.trim() && images.length === 0 && !video && !audio)}
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
                        msg.includes('Failed') || msg.includes('large') || msg.includes('Maximum')
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