import React, { useState } from 'react';
import { useKarma } from '../hooks/useKarma';
import {
    Loader2, ShoppingBag, Zap, Palette, Crown, Lock, Check,
    Sparkles, Box, Wallet, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotifications } from './NotificationSystem';

export default function KarmaShop() {
    const userId = localStorage.getItem('anonId');
    const { balance, items, inventory, loading, buyItem, equipItem } = useKarma(userId);
    const [activeTab, setActiveTab] = useState('shop');
    const { success, error } = useNotifications();

    const [filter, setFilter] = useState('all');

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
            <p className="text-gray-500 font-medium animate-pulse">Loading Karma Shop...</p>
        </div>
    );

    const inventoryIds = new Set(inventory?.map(slot => slot.item_id));

    const shopCategories = [
        { id: 'all', label: 'All Items' },
        { id: 'cosmetic', label: 'Cosmetics' },
        { id: 'feature', label: 'Features' },
        { id: 'badge', label: 'Badges' }
    ];

    const filteredItems = items?.filter(item =>
        filter === 'all' ? true : item.category === filter
    );

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'crown': return <Crown className="w-5 h-5 text-yellow-500" />;
            case 'palette': return <Palette className="w-5 h-5 text-pink-500" />;
            case 'zap': return <Zap className="w-5 h-5 text-blue-500" />;
            case 'sparkles': return <Sparkles className="w-5 h-5 text-purple-500" />;
            default: return <Box className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <div className="mb-6">
                    <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Feed
                    </Link>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-8 h-8 text-indigo-600" />
                            Karma Shop
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
                            Spend your reputation points on exclusive features, cosmetics, and badges.
                            Items are tied to your anonymous ID.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 w-full md:w-auto min-w-[200px]">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
                            <Wallet className="w-4 h-4" /> Available Balance
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                {balance}
                            </span>
                            <span className="text-gray-400 font-bold text-sm">PTS</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('shop')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'shop'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Browse Shop
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'inventory'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        My Inventory ({inventory?.length || 0})
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'shop' ? (
                        <motion.div
                            key="shop"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                                {shopCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setFilter(cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === cat.id
                                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems?.map(item => {
                                    const owned = inventoryIds.has(item.id);
                                    const canAfford = balance >= item.cost;

                                    return (
                                        <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                            {owned && (
                                                <div className="absolute top-3 right-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Owned
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                                    {getIcon(item.icon)}
                                                </div>
                                                {!owned && (
                                                    <span className={`font-black text-lg ${canAfford ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                                                        {item.cost}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex-grow leading-relaxed">
                                                {item.description}
                                            </p>

                                            {owned ? (
                                                <button
                                                    disabled
                                                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-default"
                                                >
                                                    Already Owned
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => buyItem.mutate(item.id, {
                                                        onSuccess: () => success(`Successfully purchased ${item.name}!`),
                                                        onError: (err) => error(err.message)
                                                    })}
                                                    disabled={!canAfford || buyItem.isPending}
                                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${canAfford
                                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {buyItem.isPending ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : !canAfford ? (
                                                        <>Need {item.cost - balance} more</>
                                                    ) : (
                                                        'Purchase Now'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {inventory?.length === 0 ? (
                                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                    <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-gray-900 dark:text-white font-bold">Your inventory is empty</h3>
                                    <p className="text-gray-500 text-sm">Buy items from the shop to see them here.</p>
                                </div>
                            ) : (
                                inventory?.map(slot => (
                                    <div key={slot.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                {getIcon(slot.shop_items.icon)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {slot.shop_items.name}
                                                    {slot.is_equipped && (
                                                        <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                                            Active
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{slot.shop_items.category}</p>
                                            </div>
                                        </div>

                                        {slot.shop_items.category === 'cosmetic' && (
                                            <button
                                                onClick={() => equipItem.mutate(slot.item_id)}
                                                disabled={slot.is_equipped || equipItem.isPending}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${slot.is_equipped
                                                    ? 'text-gray-400 cursor-default'
                                                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                                    }`}
                                            >
                                                {slot.is_equipped ? 'Equipped' : 'Equip'}
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}