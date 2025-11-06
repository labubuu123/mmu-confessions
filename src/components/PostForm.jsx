import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import { extractTags } from '../utils/hashtags'
import { Camera, Image, Film, Send } from 'lucide-react'

const MAX_VIDEO_SIZE_MB = 25;

export default function PostForm({ onPosted }) {
    const [text, setText] = useState('')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    async function handleSubmit(e) {
        e.preventDefault()
        if (!text.trim() && !file) {
            setMsg('Write something or attach a file');
            return
        }
        setLoading(true);
        setMsg('')
        
        try {
            // Rate limit check
            try {
                const rateLimitRes = await fetch('/.netlify/functions/rate-limit', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'post' }),
                    headers: { 'Content-Type': 'application/json' }
                })
                if (!rateLimitRes.ok) {
                    const { reason } = await rateLimitRes.json();
                    throw new Error(reason || 'Rate limit exceeded');
                }
            } catch(e) {
                console.warn('Rate-limit call failed', e);
            }

            let media_url = null, media_type = null
            if (file) {
                let fileToUpload = file
                if (file.type.startsWith('image')) {
                    fileToUpload = await imageCompression(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1600
                    })
                }
                
                const ext = (fileToUpload.name || 'upload').split('.').pop()
                const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('confessions')
                    .upload(path, fileToUpload)
                
                if (uploadError) throw uploadError
                
                const { data: publicUrlData } = supabase.storage
                    .from('confessions')
                    .getPublicUrl(uploadData.path)
                
                media_url = publicUrlData.publicUrl
                media_type = file.type
            }

            const tags = extractTags(text)
            
            const { data, error } = await supabase.from('confessions')
                .insert([{
                    text,
                    media_url,
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

            setText('')
            setFile(null)
            setPreview(null)
            setMsg('Posted successfully! ✓')
            setTimeout(() => setMsg(''), 3000)
        } catch (err) {
            console.error('Post error:', err)
            setMsg('Failed to post: ' + (err.message || err))
        } finally {
            setLoading(false)
        }
    }
    
    function handleFileChange(e) {
        const f = e.target.files[0];
        if (!f) return;
        
        if (f.type.startsWith('video') && f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setMsg(`Video file is too large (max ${MAX_VIDEO_SIZE_MB}MB)`);
            setFile(null);
            setPreview(null);
            e.target.value = null;
            return;
        }
        
        setFile(f);
        setMsg('');
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(f);
    }

    function removeFile() {
        setFile(null);
        setPreview(null);
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                    <textarea
                        value={text}
                        onChange={e=>setText(e.target.value)}
                        placeholder="What's on your mind? Share anonymously..."
                        className="flex-1 p-4 border-0 rounded-xl resize-none bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        rows="3"
                    />
                </div>

                {preview && (
                    <div className="mb-4 relative">
                        {file.type.startsWith('image') ? (
                            <img src={preview} alt="Preview" className="w-full max-h-96 object-cover rounded-xl" />
                        ) : (
                            <video src={preview} className="w-full max-h-96 rounded-xl" controls />
                        )}
                        <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <Image className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Photo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                            <Film className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video</span>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading || (!text.trim() && !file)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Post
                            </>
                        )}
                    </button>
                </div>
                
                {msg && (
                    <div className={`mt-3 text-sm px-4 py-2 rounded-lg ${msg.includes('Failed') || msg.includes('large') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {msg}
                    </div>
                )}
            </form>
        </div>
    )
}