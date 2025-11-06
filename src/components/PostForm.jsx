import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import imageCompression from 'browser-image-compression'
import { extractTags } from '../utils/hashtags'

export default function PostForm({ onPosted }) {
    const [text, setText] = useState('')
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const maxFileMB = 20
    const RATE_LIMIT_MIN = 2

    function canPost() {
    const last = localStorage.getItem('last_post_ts')
    if (!last) return true
    const diff = (Date.now() - Number(last)) / 1000 / 60
    return diff >= RATE_LIMIT_MIN
    }

    async function handleFileChange(e) { setFile(e.target.files[0]) }

    async function handleSubmit(e) {
    e.preventDefault()
    if (!canPost()) { setMessage(`Please wait ${RATE_LIMIT_MIN} minutes between posts.`); return }
    if (!text.trim() && !file) { setMessage('Please write something or attach a file.'); return }
    setLoading(true); setMessage('')
    try {
        // call netlify rate-limit
        const rate = await fetch('/.netlify/functions/rate-limit', { method: 'POST' })
        if (!rate.ok) { setMessage('Posting too fast — slow down'); setLoading(false); return }

        let media_url = null
        let media_type = null
        let fileToUpload = file

        if (file) {
        if (file.size > maxFileMB * 1024 * 1024) { setMessage(`File too large. Max ${maxFileMB}MB.`); setLoading(false); return }
        if (file.type.startsWith('image')) fileToUpload = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1600 })
        if (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET) {
            const fd = new FormData(); fd.append('file', fileToUpload); fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
            const r = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`, { method: 'POST', body: fd })
            const jd = await r.json(); media_url = jd.secure_url; media_type = file.type
        } else {
            const ext = fileToUpload.name?.split('.').pop() || 'bin'
            const path = `confessions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const upload = await supabase.storage.from('confessions').upload(path, fileToUpload, { cacheControl: '3600', upsert: false })
            if (upload.error) throw upload.error
            const { publicURL } = supabase.storage.from('confessions').getPublicUrl(path)
            media_url = publicURL; media_type = file.type
        }
        }

        const tags = extractTags(text)
        const { error } = await supabase.from('confessions').insert([{ text, media_url, media_type, tags, approved: false }])
        if (error) throw error
        localStorage.setItem('last_post_ts', String(Date.now()))
        setText(''); setFile(null); setMessage('Posted — awaiting approval')
        onPosted && onPosted()
    } catch (err) { console.error(err); setMessage('Upload failed: ' + (err.message || err)) }
    finally { setLoading(false) }
    }

    return (
    <form onSubmit={handleSubmit} className="card p-6 rounded-lg shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Share anonymously</h2>
        <textarea className="w-full p-3 border rounded-md resize-none h-28 bg-gray-50 dark:bg-gray-900" placeholder="Write your confession... Use #tags" value={text} onChange={e => setText(e.target.value)} />
        <div className="mt-3 flex items-center gap-3">
        <label className="cursor-pointer inline-flex items-center gap-2 text-sm">
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
            <span className="px-3 py-2 rounded-md border">Attach image/video</span>
        </label>
        <div className="text-xs small-muted">Max {maxFileMB}MB • Images & MP4</div>
        </div>
        {file && (<div className="mt-3 text-sm small-muted">Selected: {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</div>)}
        <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-green-600">{message}</div>
        <button type="submit" className="btn-accent px-4 py-2 rounded-md disabled:opacity-60" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
        </div>
    </form>
    )
}
