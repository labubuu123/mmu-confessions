import React, { useState, useContext, createContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((type, message, duration = 5000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);

        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const success = (message) => addNotification('success', message);
    const error = (message) => addNotification('error', message);
    const warning = (message) => addNotification('warning', message);
    const info = (message) => addNotification('info', message);

    const value = { success, error, warning, info };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 left-4 right-4 z-[100] space-y-3 sm:left-auto sm:w-full sm:max-w-sm">
                {notifications.map(n => (
                    <Notification key={n.id} {...n} onClose={() => removeNotification(n.id)} />
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
}

const Notification = ({ id, type, message, onClose }) => {
    return (
        <div
            className={`relative w-full p-4 border rounded-lg shadow-lg flex items-start gap-3 animate-slide-in-right ${bgColors[type]}`}
        >
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
            <div className={`flex-1 text-sm font-medium ${textColors[type]}`}>
                {message}
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            >
                <X className="w-4 h-4 text-gray-500" />
            </button>
        </div>
    );
};