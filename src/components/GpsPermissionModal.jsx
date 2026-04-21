import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Lock, RefreshCw } from 'lucide-react';

export default function GpsPermissionModal({ onAllow, onDismiss }) {
    const [state, setState] = useState('prompt');

    const handleAllow = async () => {
        setState('requesting');
        try {
            const pos = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                })
            );
            onAllow(pos);
        } catch {
            setState('denied');
        }
    };

    return (
        <>
            <motion.div
                key="gps-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
                onClick={state === 'requesting' ? undefined : onDismiss}
            />

            <motion.div
                key="gps-card"
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="fixed z-[90] left-0 right-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none"
            >
                <div className="pointer-events-auto w-full sm:w-[390px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400" />

                    <div className="flex justify-center pt-3 sm:hidden">
                        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <div className="px-6 pt-4 pb-7">
                        <div className="flex justify-center mb-5">
                            <div className="relative">
                                {state === 'prompt' && (
                                    <>
                                        <span className="absolute inset-0 rounded-full bg-indigo-400/25 animate-ping" />
                                        <span className="absolute -inset-3 rounded-full bg-indigo-400/10 animate-ping [animation-delay:350ms]" />
                                    </>
                                )}
                                <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300
                                    ${state === 'denied'
                                        ? 'bg-red-100 dark:bg-red-900/30'
                                        : state === 'requesting'
                                            ? 'bg-blue-100 dark:bg-blue-900/30'
                                            : 'bg-indigo-100 dark:bg-indigo-900/30'
                                    }`}
                                >
                                    {state === 'denied' ? (
                                        <Lock className="w-7 h-7 text-red-500" />
                                    ) : state === 'requesting' ? (
                                        <Navigation className="w-7 h-7 text-blue-500 animate-pulse" />
                                    ) : (
                                        <MapPin className="w-7 h-7 text-indigo-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {state === 'denied' ? (
                            <>
                                <h2 className="text-center text-lg font-bold text-slate-800 dark:text-white mb-2">
                                    Location Access Blocked
                                </h2>
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Your browser has blocked location access. To appear on the Live Map, re-enable it:
                                </p>
                                <div className="mt-4 space-y-2">
                                    {[
                                        { step: '1', text: 'Tap the lock / info icon in your browser\'s address bar' },
                                        { step: '2', text: 'Find "Location" and set it to Allow' },
                                        { step: '3', text: 'Reload the page and try again' },
                                    ].map(({ step, text }) => (
                                        <div key={step} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
                                                {step}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-300">{text}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : state === 'requesting' ? (
                            <>
                                <h2 className="text-center text-lg font-bold text-slate-800 dark:text-white mb-2">
                                    Getting your location…
                                </h2>
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    A browser prompt may appear. Please tap <strong className="text-slate-700 dark:text-white">Allow</strong> to continue.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-center text-lg font-bold text-slate-800 dark:text-white mb-1">
                                    Enable Location Access
                                </h2>
                                <p className="text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                    Share your location to appear as a live marker on the{' '}
                                    <span className="text-indigo-500 font-semibold">Live User Map</span>.
                                </p>

                                <div className="space-y-2">
                                    {[
                                        { icon: '🗺️', title: 'Show up on the map', desc: 'Others nearby can see your live marker.' },
                                        { icon: '🔒', title: 'Privacy first', desc: 'Location is only stored while you\'re active.' },
                                        { icon: '👥', title: 'See others', desc: 'Discover users around you in real time.' },
                                    ].map(({ icon, title, desc }) => (
                                        <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                            <span className="text-xl leading-none shrink-0 mt-0.5">{icon}</span>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="mt-5 flex flex-col gap-2">
                            {state === 'denied' ? (
                                <>
                                    <button
                                        onClick={() => setState('prompt')}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={onDismiss}
                                        className="w-full py-3 text-slate-400 dark:text-slate-500 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Skip for now
                                    </button>
                                </>
                            ) : state === 'requesting' ? (
                                <div className="flex items-center justify-center gap-2.5 py-3.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-sm font-semibold rounded-xl">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Waiting for browser permission…
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAllow}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        Allow Location Access
                                    </button>
                                    <button
                                        onClick={onDismiss}
                                        className="w-full py-3 text-slate-400 dark:text-slate-500 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Not now
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}