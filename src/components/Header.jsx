import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, Shield, Sun, Moon, MessageSquare, FileText } from 'lucide-react'

export default function Header({ theme, setTheme }) {
    const location = useLocation()
    
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true
        if (path !== '/' && location.pathname.startsWith(path)) return true
        return false
    }

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="">
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                MMU Confessions
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                Share Anonymously
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                isActive('/')
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Home className="w-4 h-4" />
                            <span className="font-medium">Home</span>
                        </Link>
                        <Link
                            to="/top"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                isActive('/top')
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Top</span>
                        </Link>
                        <Link
                            to="/policy"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                isActive('/policy')
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Policy</span>
                        </Link>
                        <Link
                            to="/admin"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                                isActive('/admin')
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-medium">Admin</span>
                        </Link>
                    </nav>

                    <button
                        onClick={() => {
                            const newTheme = theme === 'light' ? 'dark' : 'light';
                            setTheme(newTheme);
                            document.documentElement.classList.toggle('dark', newTheme === 'dark');
                        }}
                        className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                    </button>
                </div>

                <nav className="md:hidden grid grid-cols-4 items-center justify-around mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                        to="/"
                        className={`flex flex-col items-center gap-1 transition ${
                            isActive('/')
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link
                        to="/top"
                        className={`flex flex-col items-center gap-1 transition ${
                            isActive('/top')
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-xs font-medium">Top</span>
                    </Link>
                    <Link
                        to="/policy"
                        className={`flex flex-col items-center gap-1 transition ${
                            isActive('/policy')
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="text-xs font-medium">Policy</span>
                    </Lgink>
                    <Link
                        to="/admin"
                        className={`flex flex-col items-center gap-1 transition ${
                            isActive('/admin')
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }`}
                    >
                        <Shield className="w-5 h-5" />
                        <span className="text-xs font-medium">Admin</span>
                    </Link>
                </nav>
            </div>
        </header>
    )
}