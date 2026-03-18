import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Gift, Sparkles, Coins, PackageOpen, Ticket, Palette, Shield } from 'lucide-react';
import { useKarma } from '../hooks/useKarma';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const rarityColors = {
    common: 'from-gray-400 to-gray-500 text-gray-700',
    rare: 'from-blue-400 to-blue-600 text-blue-700',
    epic: 'from-purple-500 to-pink-500 text-purple-700',
    legendary: 'from-yellow-400 to-yellow-600 text-yellow-800',
};

export default function KarmaShop() {
    const anonId = localStorage.getItem('anonId');
    const { profile, inventory, isLoading, checkIn, pullGacha, GACHA_COST } = useKarma(anonId);

    const [isOpeningBox, setIsOpeningBox] = useState(false);
    const [reward, setReward] = useState(null);

    const isCheckedInToday = profile?.last_login_date === dayjs().format('YYYY-MM-DD');

    const handleCheckIn = () => {
        if (!isCheckedInToday) {
            checkIn.mutate();
        }
    };

    const handlePullGacha = async () => {
        if (profile?.karma_points < GACHA_COST) return;

        setIsOpeningBox(true);
        setReward(null);

        try {
            const droppedItem = await pullGacha.mutateAsync();
            setTimeout(() => {
                setIsOpeningBox(false);
                setReward(droppedItem);
            }, 2000);
        } catch (error) {
            setIsOpeningBox(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
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
                        <span className="font-bold">{profile?.karma_points || 0}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Flame className="w-24 h-24 text-orange-500" />
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                                Daily Login Streak
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-xs rounded-full font-bold">
                                    {profile?.current_streak || 0} Days
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Log in every day to earn Karma. Bonus every 7 days
                            </p>
                        </div>

                        <button
                            onClick={handleCheckIn}
                            disabled={isCheckedInToday || checkIn.isPending}
                            className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 shrink-0
                                ${isCheckedInToday
                                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {checkIn.isPending ? 'Claiming...' : isCheckedInToday ? 'Claimed Today' : 'Claim Daily Karma'}
                            {!isCheckedInToday && <Flame className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full z-0"></div>
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-orange-500 rounded-full z-0 transition-all duration-1000"
                            style={{ width: `${Math.min(((profile?.current_streak || 0) % 7) / 7 * 100, 100)}%` }}
                        ></div>

                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const currentCycleDay = (profile?.current_streak || 0) % 7 || (profile?.current_streak > 0 ? 7 : 0);
                            const isPast = day <= currentCycleDay;
                            return (
                                <div key={day} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2
                                        ${isPast
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                        }`}
                                    >
                                        {day === 7 ? <Gift className="w-4 h-4" /> : day}
                                    </div>
                                    <span className={`text-[10px] font-bold ${day === 7 ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {day === 7 ? '+50' : '+10'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 rounded-2xl p-8 shadow-xl text-center relative overflow-hidden border border-purple-500/30">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <Sparkles className="w-8 h-8 text-yellow-400 mb-2 animate-pulse" />
                        <h2 className="text-3xl font-black text-white mb-2">Mystery Box</h2>
                        <p className="text-purple-200 text-sm max-w-sm mb-8">
                            Spend your Karma to win rare avatar borders, custom post themes, and premium Pin Tickets!
                        </p>

                        <AnimatePresence mode="wait">
                            {isOpeningBox ? (
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
                                <motion.div
                                    key="reward"
                                    initial={{ scale: 0, opacity: 0, y: 50 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    className={`mb-8 p-6 rounded-2xl bg-gradient-to-br ${rarityColors[reward.rarity]} border-2 border-white/20 shadow-2xl backdrop-blur-md`}
                                >
                                    <div className="bg-white/90 rounded-xl p-4 flex flex-col items-center">
                                        <span className="text-xs font-black uppercase tracking-widest mb-2 opacity-70">
                                            {reward.rarity} Drop!
                                        </span>
                                        <span className="text-xl font-bold text-center">
                                            {reward.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setReward(null)}
                                        className="mt-4 text-sm font-bold text-white/80 hover:text-white underline"
                                    >
                                        Pull Again
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div key="idle" className="mb-8">
                                    <Gift className="w-24 h-24 text-indigo-400 drop-shadow-lg" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handlePullGacha}
                            disabled={isOpeningBox || profile?.karma_points < GACHA_COST}
                            className={`group relative px-8 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all overflow-hidden
                                ${profile?.karma_points < GACHA_COST || isOpeningBox
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:scale-105 active:scale-95 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full -translate-x-full skew-x-12 transition-transform duration-700"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {isOpeningBox ? 'Opening...' : `Pull 1x (${GACHA_COST} Karma)`}
                            </span>
                        </button>

                        {profile?.karma_points < GACHA_COST && (
                            <p className="text-red-400 text-xs mt-3 font-medium">Not enough Karma points.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <PackageOpen className="w-5 h-5" /> My Inventory
                    </h2>

                    {(!inventory || inventory.length === 0) ? (
                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">Your inventory is empty.</p>
                            <p className="text-sm text-gray-400 mt-1">Pull from the mystery box to get items!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {inventory.map((item) => (
                                <div key={item.id} className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center text-center group hover:border-indigo-500 transition-colors">
                                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        x{item.quantity}
                                    </div>

                                    <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center bg-gradient-to-br ${rarityColors[item.rarity]} shadow-inner`}>
                                        {item.item_type === 'border' && <Shield className="w-6 h-6 text-white" />}
                                        {item.item_type === 'theme' && <Palette className="w-6 h-6 text-white" />}
                                        {item.item_type === 'ticket' && <Ticket className="w-6 h-6 text-white" />}
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">
                                        {item.item_name}
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                                        {item.rarity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}