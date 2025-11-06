import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ theme, setTheme }) {
    return (
    <header className="py-5 px-6 sticky top-0 z-30 shadow-sm card">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold">MMU Confessions</Link>
            <nav className="hidden md:flex gap-3 text-sm small-muted">
            <Link to="/">Home</Link>
            <Link to="/top">Top</Link>
            <Link to="/admin">Admin</Link>
            </nav>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => { const t = theme === 'light' ? 'dark' : 'light'; setTheme(t); document.documentElement.classList.toggle('dark', t === 'dark') }} className="px-3 py-1 border rounded">
            {theme === 'light' ? 'Dark' : 'Light'}
            </button>
        </div>
        </div>
    </header>
    )
}
