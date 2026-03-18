import React, { useState, useContext, createContext, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import useWhisperNotifications from '../hooks/useWhisperNotifications';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((type, message, duration = 5000) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { id, type, message, duration }]);
    }, []);

    const success = (message, duration) => addNotification('success', message, duration);
    const error = (message, duration) => addNotification('error', message, duration);
    const warning = (message, duration) => addNotification('warning', message, duration);
    const info = (message, duration) => addNotification('info', message, duration);

    const value = { success, error, warning, info };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none sm:left-auto sm:right-4 sm:w-96 sm:items-end">
                {notifications.map(n => (
                    <ToastNotification key={n.id} {...n} onClose={() => removeNotification(n.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
};

const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    info: 'text-blue-800 dark:text-blue-200',
};

const ToastNotification = ({ id, type, message, onClose, duration }) => {
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose, isPaused]);

    return (
        <div
            className={`pointer-events-auto relative w-full p-4 border rounded-lg shadow-lg flex items-start gap-3 animate-slide-in-right ${bgColors[type]} transition-transform hover:scale-[1.02]`}
            role="alert"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
            <div className={`flex-1 text-sm font-medium ${textColors[type]} break-words`}>
                {message}
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close notification"
            >
                <X className="w-4 h-4 opacity-60 hover:opacity-100 text-current" />
            </button>
        </div>
    );
};

export default function NotificationSystem({ currentIdentity }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { unreadWhispers, clearUnreadWhispers } = useWhisperNotifications(currentIdentity);

    const totalUnread = unreadWhispers.length;

    const handleToggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            clearUnreadWhispers();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>

            <button
                onClick={handleToggleDropdown}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {totalUnread > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full animate-pulse">
                        {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 w-80 sm:w-96 mt-2 origin-top-right bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden flex flex-col max-h-[80vh]">

                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center shrink-0">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Live Whispers</h3>
                        {totalUnread > 0 && (
                            <button
                                className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline focus:outline-none"
                                onClick={clearUnreadWhispers}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain">
                        {totalUnread === 0 && unreadWhispers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="text-3xl mb-2">📭</span>
                                <p>No new whispers!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {unreadWhispers.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className="p-4 transition-colors cursor-default border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-750"
                                    >
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 whitespace-nowrap">
                                                {msg.room_tag}
                                            </span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                                                {formatTime(msg.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-2 line-clamp-3">
                                            <span className="font-semibold" style={{ color: msg.author_color }}>
                                                {msg.author_name}:
                                            </span>
                                            {' '}{msg.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800/80 shrink-0">
                        <Link
                            to="/whisper"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                            Go to Whisper Rooms
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}