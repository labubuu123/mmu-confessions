import React, { useEffect, useState } from 'react'
import { FiSun, FiMoon } from 'react-icons/fi'

export default function ThemeToggle() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

    useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}) } catch(e) {}
    }, [theme])

    return (
    <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="fixed top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg z-40">
        {theme === 'dark' ? <FiSun /> : <FiMoon />}
    </button>
    )
}
