import React, { useEffect } from 'react'

export default function AdBanner({ slot, format = 'auto', style = {} }) {
    useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch (e) {}
    }, [slot])

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    const bg = theme === 'dark' ? '#0f1724' : '#ffffff'
    const border = theme === 'dark' ? '#1f2937' : '#e5e7eb'

    return (
    <div style={{ background: bg, border: `1px solid ${border}`, padding: 8, borderRadius: 12 }} className="flex justify-center my-4">
        <ins className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center', ...style }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-2917238367872551'}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"></ins>
    </div>
    )
}
