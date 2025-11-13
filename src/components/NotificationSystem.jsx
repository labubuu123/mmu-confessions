import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const NotificationContext = createContext()

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider')
    }
    return context
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([])

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now()
        const notification = { id, message, type, duration }
        
        setNotifications(prev => [...prev, notification])

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, duration)
        }

        return id
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const success = useCallback((message, duration) => {
        return addNotification(message, 'success', duration)
    }, [addNotification])

    const error = useCallback((message, duration) => {
        return addNotification(message, 'error', duration)
    }, [addNotification])

    const warning = useCallback((message, duration) => {
        return addNotification(message, 'warning', duration)
    }, [addNotification])

    const info = useCallback((message, duration) => {
        return addNotification(message, 'info', duration)
    }, [addNotification])

    return (
        <NotificationContext.Provider value={{ success, error, warning, info, removeNotification }}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    )
}

function NotificationContainer({ notifications, onRemove }) {
    return (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map(notification => (
                <Notification
                    key={notification.id}
                    notification={notification}
                    onRemove={onRemove}
                />
            ))}
        </div>
    )
}

function Notification({ notification, onRemove }) {
    const { id, message, type } = notification

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-500',
            textColor: 'text-green-800 dark:text-green-200'
        },
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-500',
            textColor: 'text-red-800 dark:text-red-200'
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-800',
            iconColor: 'text-yellow-500',
            textColor: 'text-yellow-800 dark:text-yellow-200'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-800 dark:text-blue-200'
        }
    }

    const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type]

    return (
        <div
            className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in-right backdrop-blur-sm`}
        >
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
            <p className={`flex-1 text-sm font-medium ${textColor}`}>
                {message}
            </p>
            <button
                onClick={() => onRemove(id)}
                className={`flex-shrink-0 ${iconColor} hover:opacity-70 transition`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

// Add to your CSS:
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
//
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }