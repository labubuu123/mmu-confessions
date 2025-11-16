import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    TrendingUp,
    Shield,
    Sun,
    Moon,
    MessageSquare,
    FileText,
    Search,
    Users,
    BarChart3,
    Target,
    ChevronDown
} from 'lucide-react'

const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/top', label: 'Top', icon: TrendingUp },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/analytics', label: 'Stats', icon: BarChart3, desktopLabel: 'My Stats' },
    { to: '/challenges', label: 'Challenges', icon: Target },
    { to: '/policy', label: 'Policy', icon: FileText },
    { to: '/admin', label: 'Admin', icon: Shield },
];

const mainLinks = navLinks.slice(0, 4);
const dropdownLinks = navLinks.slice(4);

export default function Header({ theme, setTheme, onlineCount }) {
    const location = useLocation()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true
        if (path !== '/' && location.pathname.startsWith(path)) return true
        return false
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        };
    }, [dropdownRef])

    useEffect(() => {
        setIsDropdownOpen(false)
    }, [location.pathname])

    return (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95">
            <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block leading-tight whitespace-nowrap">
                                MMU Confessions
                            </span>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-tight">
                                Share Anonymously
                            </p>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {mainLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg transition text-sm ${isActive(link.to)
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <link.icon className="w-4 h-4" />
                                <span className="font-medium">{link.desktopLabel || link.label}</span>
                            </Link>
                        ))}

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg transition text-sm ${isDropdownOpen
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="font-medium">More</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-40">
                                    {dropdownLinks.map(link => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className={`flex items-center gap-3 px-4 py-2.5 transition text-sm ${isActive(link.to)
                                                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <link.icon className="w-4 h-4" />
                                            <span className="font-medium">{link.desktopLabel || link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-2">
                        <div
                            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            title={`${onlineCount} users online`}
                        >
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </div>
                            <span className="text-sm font-semibold">{onlineCount}</span>
                            <Users className="w-4 h-4" />
                        </div>

                        <button
                            onClick={() => {
                                const newTheme = theme === 'light' ? 'dark' : 'light';
                                setTheme(newTheme);
                                document.documentElement.classList.toggle('dark', newTheme === 'dark');
                            }}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            ) : (
                                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                <nav className="lg:hidden grid grid-cols-4 items-center justify-around mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 gap-1">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 rounded-lg transition ${isActive(link.to)
                                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'text-gray-700 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                        >
                            <link.icon className="w-5 h-5" />
                            <span className="text-[10px] sm:text-xs font-medium">{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}