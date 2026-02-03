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
    Bell
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
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b-0 transition-all duration-300">
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
                        >
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </motion.div>
                        <div>
                            <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 dark:from-indigo-400 dark:via-purple-400 dark:to-purple-400 bg-clip-text text-transparent block leading-tight whitespace-nowrap">
                                MMU Confessions
                            </span>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-tight">
                                Share Anonymously
                            </p>
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

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div
                            className="flex items-center gap-1.5 text-gray-600 dark:text-slate-300 px-2 py-1 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700 backdrop-blur-sm"
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
                            onClick={toggleSubscription}
                            disabled={loading}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all border backdrop-blur-sm relative overflow-hidden group ${isSubscribed
                                ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700'
                                : loading
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
                                    : 'bg-white/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700'
                                }`}
                            title={isSubscribed ? "Tap to disable notifications" : "Enable Notifications"}
                        >
                            <Bell
                                className={`w-5 h-5 transition-all ${isSubscribed
                                    ? 'fill-blue-500 text-blue-600 dark:text-blue-400' // Blue icon
                                    : loading
                                        ? 'text-indigo-500 animate-pulse'
                                        : 'text-gray-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                                    }`}
                            />
                            {isSubscribed && (
                                <span className="absolute inset-0 bg-blue-400/10 dark:bg-blue-400/5 animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>

                <nav className="lg:hidden mt-3 pt-1">
                    <div className="grid grid-cols-6 gap-1 p-1 bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-slate-700/50">
                        {navLinks.map(link => {
                            const active = isActive(link.to);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-all duration-200 ${active
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-slate-700/30'
                                        }`}
                                >
                                    <link.icon className={`w-4 h-4 ${active ? 'stroke-[2.5px]' : ''}`} />
                                    <span className={`text-[9px] font-bold leading-none ${active ? 'opacity-100' : 'opacity-70'}`}>
                                        {link.label}
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>
        </header>
    )
}