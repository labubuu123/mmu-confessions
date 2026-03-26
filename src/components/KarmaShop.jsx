import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, Flame, Gift, Sparkles, Coins,
    PackageOpen, Ticket, Palette, Shield, History, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

import { useKarma, useKarmaActivityLog, GACHA_COST } from '../hooks/useKarma';

const STREAK_DAYS = [1, 2, 3, 4, 5, 6, 7];

const RARITY_STYLES = {
    common: { gradient: 'from-gray-400 to-gray-500', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-600' },
    rare: { gradient: 'from-blue-400 to-blue-600', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    epic: { gradient: 'from-purple-500 to-pink-500', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
    legendary: { gradient: 'from-yellow-400 to-yellow-600', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-800' },
};

const ITEM_ICONS = {
    border: Shield,
    theme: Palette,
    ticket: Ticket,
};

function KarmaHeader({ karmaPoints }) {
    return (
        <div className="bg-indigo-600 dark:bg-indigo-900 text-white sticky top-0 z-30 shadow-md">
            <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Gift className="w-5 h-5" /> Karma Shop
                    </h1>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    <Coins className="w-5 h-5 text-yellow-300" />
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
                        Log in every day to earn Karma. Bonus reward every 7 days!
                    </p>
                </div>

                <button
                    onClick={onCheckIn}
                    disabled={isCheckedInToday || isPending}
                    aria-label={isCheckedInToday ? 'Already claimed today' : 'Claim daily karma'}
                    className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 shrink-0
                        ${isCheckedInToday
                            ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 active:scale-95'
                        }`}
                >
                    {isPending ? 'Claiming…' : isCheckedInToday ? '✓ Claimed Today' : 'Claim Daily Karma'}
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
                                {isBonus ? <Gift className="w-4 h-4" /> : day}
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

function GachaBox({ karmaPoints, canAfford, isOpening, reward, onPull, onReset }) {
    return (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 rounded-2xl p-8 shadow-xl text-center relative overflow-hidden border border-purple-500/30">
            <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }}
            />

            <div className="relative z-10 flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-yellow-400 mb-2 animate-pulse" />
                <h2 className="text-3xl font-black text-white mb-2">Mystery Box</h2>
                <p className="text-purple-200 text-sm max-w-sm mb-8">
                    Spend Karma to win rare avatar borders, custom post themes, and premium Pin Tickets!
                </p>

                <AnimatePresence mode="wait">
                    {isOpening ? (
                        <motion.div
                            key="opening"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: [0, -10, 10, -10, 10, 0] }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.5, repeat: 3 }}
                            className="w-32 h-32 mb-8 flex items-center justify-center"
                        >
                            <PackageOpen className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        </motion.div>
                    ) : reward ? (
                        <GachaReward reward={reward} onReset={onReset} />
                    ) : (
                        <motion.div key="idle" className="mb-8">
                            <Gift className="w-24 h-24 text-indigo-400 drop-shadow-lg" />
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={onPull}
                    disabled={isOpening || !canAfford}
                    className={`group relative px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all overflow-hidden
                        ${!canAfford || isOpening
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]'
                        }`}
                >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full skew-x-12 transition-transform duration-700" />
                    <span className="relative flex items-center justify-center gap-2">
                        {isOpening ? 'Opening…' : `Pull 1× (${GACHA_COST} Karma)`}
                    </span>
                </button>

                {!canAfford && !isOpening && (
                    <p className="text-red-400 text-xs mt-3 font-medium">
                        Need {GACHA_COST - karmaPoints} more Karma to pull.
                    </p>
                )}
            </div>
        </div>
    );
}

function GachaReward({ reward, onReset }) {
    const rarity = reward?.rarity ?? 'common';
    const styles = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
    const isNew = reward?.isNew !== false;

    return (
        <motion.div
            key="reward"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`mb-8 p-6 rounded-2xl bg-gradient-to-br ${styles.gradient} border-2 border-white/20 shadow-2xl backdrop-blur-md`}
        >
            <div className="bg-white/90 rounded-xl p-4 flex flex-col items-center gap-1 min-w-[180px]">
                {isNew && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700 mb-1">
                        New!
                    </span>
                )}
                <span className={`text-xs font-black uppercase tracking-widest opacity-70 ${RARITY_STYLES[rarity]?.text}`}>
                    {rarity} Drop!
                </span>
                <span className="text-xl font-bold text-center text-gray-900">{reward?.name}</span>
            </div>
            <button
                onClick={onReset}
                className="mt-4 text-sm font-bold text-white/80 hover:text-white underline underline-offset-2"
            >
                Pull Again
            </button>
        </motion.div>
    );
}

function InventoryGrid({ inventory }) {
    if (!inventory?.length) {
        return (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <PackageOpen className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Your inventory is empty.</p>
                <p className="text-sm text-gray-400 mt-1">Pull from the mystery box to get items!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {inventory.map((item) => {
                const styles = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
                const Icon = ITEM_ICONS[item.item_type] ?? Gift;

                return (
                    <div
                        key={item.id}
                        className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center text-center group hover:border-indigo-500 hover:shadow-md transition-all"
                    >
                        {item.quantity > 1 && (
                            <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ×{item.quantity}
                            </div>
                        )}

                        <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-gradient-to-br ${styles.gradient} shadow-inner`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                            {item.item_name}
                        </h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                            {item.rarity}
                        </span>
                    </div>
                );
            })}
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
                                        <span className={`font-bold ${entry.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {entry.amount >= 0 ? '+' : ''}{entry.amount}
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
    const {
        anonId,
        profile,
        inventory,
        isLoading,
        checkIn,
        pullGacha,
        karmaPoints,
        currentStreak,
        canAffordGacha,
    } = useKarma();

    const [isOpeningBox, setIsOpeningBox] = useState(false);
    const [reward, setReward] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const isCheckedInToday = useMemo(
        () => profile?.last_login_date === dayjs().format('YYYY-MM-DD'),
        [profile?.last_login_date],
    );

    const handleCheckIn = useCallback(() => {
        if (!isCheckedInToday && !checkIn.isPending) checkIn.mutate();
    }, [isCheckedInToday, checkIn]);

    const handlePullGacha = useCallback(async () => {
        if (!canAffordGacha || isOpeningBox || pullGacha.isPending) return;

        setIsOpeningBox(true);
        setReward(null);

        try {
            const droppedItem = await pullGacha.mutateAsync();
            const alreadyOwned = inventory?.some((inv) => inv.item_id === droppedItem?.id);
            timerRef.current = setTimeout(() => {
                setIsOpeningBox(false);
                setReward({ ...droppedItem, isNew: !alreadyOwned });
            }, 1800);
        } catch {
            setIsOpeningBox(false);
        }
    }, [canAffordGacha, isOpeningBox, pullGacha, inventory]);

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

                <GachaBox
                    karmaPoints={karmaPoints}
                    canAfford={canAffordGacha}
                    isOpening={isOpeningBox}
                    reward={reward}
                    onPull={handlePullGacha}
                    onReset={() => setReward(null)}
                />

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <PackageOpen className="w-5 h-5" /> My Inventory
                        {inventory?.length > 0 && (
                            <span className="ml-auto text-sm font-normal text-gray-400">
                                {inventory.length} {inventory.length === 1 ? 'item' : 'items'}
                            </span>
                        )}
                    </h2>
                    <InventoryGrid inventory={inventory} />
                </div>

                <ActivityLog anonId={anonId} />
            </div>
        </div>
    );
}
