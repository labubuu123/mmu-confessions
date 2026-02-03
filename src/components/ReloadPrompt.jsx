import React, { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X, Zap, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            if (r) {
                r.update().catch(err => console.log('SW update check failed:', err))

                setInterval(() => {
                    console.log('Checking for new service worker version (interval)...')
                    r.update()
                }, 30 * 60 * 1000)

                const checkUpdate = () => {
                    if (document.visibilityState === 'visible') {
                        console.log('User returned to app, checking for updates...')
                        r.update().catch(e => console.error(e))
                    }
                }

                document.addEventListener('visibilitychange', checkUpdate)
                window.addEventListener('focus', checkUpdate)
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    const remindLater = () => {
        setNeedRefresh(false)
        setTimeout(() => {
            setNeedRefresh(true)
        }, 60 * 60 * 1000)
    }

    return (
        <AnimatePresence>
            {(needRefresh || offlineReady) && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col gap-3"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {needRefresh ? 'New Version Available' : 'Ready to work offline'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {needRefresh
                                    ? 'A new update is available. Refresh to see the latest content.'
                                    : 'App has been cached for offline use.'}
                            </p>
                        </div>
                        <button
                            onClick={close}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {needRefresh ? (
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => updateServiceWorker(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-indigo-500/20"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Refresh Now
                            </button>
                            <button
                                onClick={remindLater}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                Later
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={close}
                                className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}