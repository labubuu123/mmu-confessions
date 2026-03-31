import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Home,
    TrendingUp,
    Shield,
    MessageSquare,
    FileText,
    Search,
    Users,
    BarChart3,
    Bell,
    Ghost
} from 'lucide-react'
import { motion } from 'framer-motion'
import { usePushSubscription } from '../hooks/usePushSubscription'

const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/top', label: 'Top', icon: TrendingUp },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/analytics', label: 'Stats', icon: BarChart3, desktopLabel: 'My Stats' },
    { to: '/policy', label: 'Policy', icon: FileText },
    { to: '/admin', label: 'Admin', icon: Shield },
];

export default function Header({ onlineCount }) {
    const location = useLocation()
    const { toggleSubscription, loading, isSubscribed } = usePushSubscription()

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true
        if (path !== '/' && location.pathname.startsWith(path)) return true
        return false
    }

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b-0 transition-all duration-300 shadow-sm dark:shadow-slate-900/20">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center justify-between">

                    <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"
                        >
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </motion.div>
                        <div className="flex flex-col justify-center min-w-0">
                            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent block leading-none whitespace-nowrap drop-shadow-sm pb-0.5 pr-1">
                                MMU Confessions
                            </span>
                            <span className="text-[9px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider leading-tight mt-0.5 flex items-center gap-1 truncate">
                                The Voice of Campus <span className="text-amber-500 text-[10px] sm:text-xs">✨</span>
                            </span>
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${isActive(link.to)
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 shadow-sm'
                                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <link.icon className={`w-4 h-4 ${isActive(link.to) ? 'stroke-[2.5px]' : ''}`} />
                                <span>{link.desktopLabel || link.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        <div
                            className="flex items-center gap-1 sm:gap-1.5 text-gray-700 dark:text-slate-200 px-2 py-1 sm:px-2.5 sm:py-1.5 bg-gray-100/80 dark:bg-slate-800/80 rounded-full border border-gray-200 dark:border-slate-700 backdrop-blur-sm shadow-inner"
                            title={`${onlineCount} users online`}
                        >
                            <div className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold tracking-wide">{onlineCount}</span>
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:block opacity-70" />
                        </div>

                        <Link
                            to="/whisper"
                            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-all border backdrop-blur-sm relative group shadow-sm ${isActive('/whisper')
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 shadow-indigo-500/20'
                                : 'bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700'
                                }`}
                            title="Live Whisper Rooms"
                        >
                            <Ghost
                                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive('/whisper')
                                    ? 'text-indigo-600 dark:text-indigo-400 animate-pulse'
                                    : 'text-gray-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:rotate-12'
                                    }`}
                            />
                            {!isActive('/whisper') && (
                                <span className="absolute top-0 right-0 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={toggleSubscription}
                            disabled={loading}
                            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-all border backdrop-blur-sm relative overflow-hidden group shadow-sm ${isSubscribed
                                ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 shadow-blue-500/20'
                                : loading
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
                                    : 'bg-white/80 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700'
                                }`}
                            title={isSubscribed ? "Tap to disable notifications" : "Enable Notifications"}
                        >
                            <Bell
                                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${isSubscribed
                                    ? 'fill-blue-500 text-blue-600 dark:text-blue-400'
                                    : loading
                                        ? 'text-indigo-500 animate-pulse'
                                        : 'text-gray-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:rotate-[15deg]'
                                    }`}
                            />
                            {isSubscribed && (
                                <span className="absolute inset-0 bg-blue-400/10 dark:bg-blue-400/5 animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>

                <nav className="lg:hidden mt-3 pt-1 pb-1 border-t border-gray-200/50 dark:border-slate-700/50">
                    <div className="flex justify-between items-center px-1 sm:px-6">
                        {navLinks.map(link => {
                            const active = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className="relative flex flex-col items-center justify-center w-12 sm:w-16 group"
                                >
                                    <div className="flex flex-col items-center justify-center transition-all duration-300">
                                        <div className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/40' : 'text-gray-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
                                            <link.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                        </div>
                                        <span className={`text-[9px] sm:text-[10px] font-bold tracking-wide transition-all duration-300 mt-1 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                            {link.label}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </header>
    )
}