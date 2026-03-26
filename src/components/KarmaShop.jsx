import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Award, History, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useKarma, useKarmaActivityLog } from '../hooks/useKarma';

dayjs.extend(relativeTime);

const STREAK_DAYS = [1, 2, 3, 4, 5, 6, 7];

function KarmaHeader({ karmaPoints }) {
    return (
        <div className="bg-indigo-600 dark:bg-indigo-900 text-white sticky top-0 z-30 shadow-md">
            <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Award className="w-5 h-5" /> Karma Hub
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="text-xs uppercase font-bold tracking-wider opacity-80">Points</span>
                    <span className="font-bold tabular-nums">{karmaPoints.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

function StreakCalendar({ currentStreak, isCheckedInToday, onCheckIn, isPending }) {
    const cycleDay = currentStreak % 7 || (currentStreak > 0 ? 7 : 0);
    const progressPct = Math.min((cycleDay / 7) * 100, 100);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none">
                <Flame className="w-24 h-24 text-orange-500" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                        Daily Login Streak
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs rounded-full font-bold">
                            {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Log in every day to earn points. Bonus reward every 7 days!
                    </p>
                </div>

                <button
                    onClick={onCheckIn}
                    disabled={isCheckedInToday || isPending}
                    className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 shrink-0
                        ${isCheckedInToday
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 active:scale-95'
                        }`}
                >
                    {isPending ? 'Claiming…' : isCheckedInToday ? '✓ Claimed Today' : 'Claim Daily Points'}
                    {!isCheckedInToday && !isPending && <Flame className="w-5 h-5" />}
                </button>
            </div>

            <div className="mt-6 flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full z-0" />
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-orange-500 rounded-full z-0"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {STREAK_DAYS.map((day) => {
                    const isPast = day <= cycleDay;
                    const isBonus = day === 7;
                    return (
                        <div key={day} className="relative z-10 flex flex-col items-center gap-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2
                                    ${isPast
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30 scale-110'
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                    }`}
                            >
                                {isBonus ? <Award className="w-4 h-4" /> : day}
                            </div>
                            <span className={`text-[10px] font-bold ${isBonus ? 'text-orange-500' : 'text-gray-400'}`}>
                                {isBonus ? '+50' : '+10'}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ActivityLog({ anonId }) {
    const [open, setOpen] = useState(false);
    const { data: log, isLoading } = useKarmaActivityLog(anonId, { enabled: open });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
                <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    Activity Log
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoading && (
                                <p className="py-6 text-center text-sm text-gray-400">Loading history…</p>
                            )}
                            {!isLoading && !log?.length && (
                                <p className="py-6 text-center text-sm text-gray-400 italic">No activity yet.</p>
                            )}
                            {log?.map((entry) => (
                                <div key={entry.id} className="py-3 flex items-center justify-between gap-2 text-sm">
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate capitalize">
                                            {entry.activity_type.replace(/_/g, ' ')}
                                        </p>
                                        {entry.description && (
                                            <p className="text-xs text-gray-400 truncate">{entry.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-bold text-green-500">
                                            +{entry.amount}
                                        </span>
                                        <p className="text-[10px] text-gray-400">
                                            {dayjs(entry.created_at).fromNow()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function KarmaShop() {
    const { anonId, profile, isLoading, checkIn, karmaPoints, currentStreak } = useKarma();

    const isCheckedInToday = useMemo(
        () => profile?.last_login_date === dayjs().format('YYYY-MM-DD'),
        [profile?.last_login_date],
    );

    const handleCheckIn = useCallback(() => {
        if (!isCheckedInToday && !checkIn.isPending) checkIn.mutate();
    }, [isCheckedInToday, checkIn]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    <p className="text-sm">Loading your Karma…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <KarmaHeader karmaPoints={karmaPoints} />

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <StreakCalendar
                    currentStreak={currentStreak}
                    isCheckedInToday={isCheckedInToday}
                    onCheckIn={handleCheckIn}
                    isPending={checkIn.isPending}
                />

                <ActivityLog anonId={anonId} />
            </div>
        </div>
    );
}