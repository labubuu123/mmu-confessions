import React from 'react'
import { Link } from 'react-router-dom'
import { Home, TrendingUp, Shield, Sun, Moon } from 'lucide-react'

export default function Header({ theme, setTheme }) {
    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            MMU Confessions
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                            <Home className="w-4 h-4" />
                            <span className="font-medium">Home</span>
                        </Link>
                        <Link
                            to="/top"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Top</span>
                        </Link>
                        <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="font-medium">Admin</span>
                        </Link>
                    </nav>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => {
                            const newTheme = theme === 'light' ? 'dark' : 'light';
                            setTheme(newTheme);
                            document.documentElement.classList.toggle('dark', newTheme === 'dark');
                        }}
                        className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        ) : (
                            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden flex items-center justify-around mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                        to="/"
                        className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-xs font-medium">Home</span>
                    </Link>
                    <Link
                        to="/top"
                        className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-xs font-medium">Top</span>
                    </Link>
                    <Link
                        to="/admin"
                        className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                        <Shield className="w-5 h-5" />
                        <span className="text-xs font-medium">Admin</span>
                    </Link>
                </nav>
            </div>
        </header>
    )
}