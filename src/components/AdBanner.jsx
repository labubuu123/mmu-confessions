import React, { useEffect, useRef } from 'react'

export default function AdBanner({ slot, format = 'auto', style = {} }) {
    const adRef = useRef(null)
    const isAdPushed = useRef(false)

    useEffect(() => {
        // Only push ad once per mount
        if (!isAdPushed.current && adRef.current) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({})
                isAdPushed.current = true
            } catch (e) {
                console.error('AdSense error:', e)
            }
        }
    }, [])

    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    const bg = theme === 'dark' ? '#1f2937' : '#f9fafb'
    const border = theme === 'dark' ? '#374151' : '#e5e7eb'

    return (
        <div
            className="flex justify-center my-4 p-3 rounded-xl"
            style={{
                background: bg,
                border: `1px solid ${border}`,
                minHeight: '100px'
            }}
        >
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                    display: 'block',
                    textAlign: 'center',
                    ...style
                }}
                data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-2917238367872551'}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    )
}