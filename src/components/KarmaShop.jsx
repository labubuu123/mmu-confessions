import React, { useState } from 'react';
import { useKarmaShop } from '../hooks/useKarmaShop';
import {
    Loader2, ShoppingBag, Zap, Palette, Crown, Lock, Check,
    Sparkles, Box, Wallet, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotifications } from './NotificationSystem';

export default function KarmaShop() {
    const userId = localStorage.getItem('anonId');
    const { balance, items, inventory, loading, buyItem, equipItem } = useKarmaShop(userId);
    const [activeTab, setActiveTab] = useState('shop');
    const { success, error } = useNotifications();

    if (loading) return (
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
            <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
            <p className="text-gray-500 font-medium animate-pulse">Loading marketplace...</p>
        </div>
    );

    const getIcon = (iconName) => {
        const icons = {
            Crown: <Crown className="w-6 h-6" />,
            Zap: <Zap className="w-6 h-6" />,
            Palette: <Palette className="w-6 h-6" />,
            Pin: <Zap className="w-6 h-6" />,
            Highlighter: <Palette className="w-6 h-6" />
        };
        return icons[iconName] || <ShoppingBag className="w-6 h-6" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                <div className="md:hidden mb-4">
                    <Link to="/analytics" className="inline-flex items-center gap-2 text-gray-500 font-bold text-sm hover:text-indigo-600">
                        <ArrowLeft className="w-4 h-4" /> Back to Analytics
                    </Link>
                </div>

                <div className="relative overflow-hidden bg-gray-900 rounded-3xl p-6 md:p-12 mb-8 shadow-2xl">
                    <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-600/30 rounded-full blur-[80px] md:blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-fuchsia-600/20 rounded-full blur-[60px] md:blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
                        <div className="space-y-2 md:space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-3 h-3" />
                                Official Marketplace
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white">
                                Karma Shop
                            </h1>
                            <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed max-w-xl">
                                Spend your hard-earned reputation on exclusive cosmetics and profile upgrades.
                            </p>
                        </div>

                        <div className="w-full md:w-auto bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-row md:flex-col justify-between items-center md:items-start gap-4 shadow-xl">
                            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest">
                                <Wallet className="w-4 h-4" />
                                Balance
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                                    {balance}
                                </span>
                                <span className="text-amber-400/80 font-bold text-sm">PTS</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky top-4 z-30 flex justify-center mb-8">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex w-full md:w-auto max-w-md">
                        <TabButton
                            active={activeTab === 'shop'}
                            onClick={() => setActiveTab('shop')}
                            icon={ShoppingBag}
                            label="Browse"
                        />
                        <TabButton
                            active={activeTab === 'inventory'}
                            onClick={() => setActiveTab('inventory')}
                            icon={Box}
                            label="My Stash"
                            badge={inventory.length > 0 ? inventory.length : null}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'shop' ? (
                        <motion.div
                            key="shop"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                        >
                            {items.map(item => (
                                <ShopItemCard
                                    key={item.id}
                                    item={item}
                                    balance={balance}
                                    onBuy={() => buyItem.mutate(item.id, {
                                        onSuccess: () => {
                                            success(`Successfully purchased ${item.name}!`);
                                        },
                                        onError: (err) => {
                                            error(err.message || 'Failed to purchase item.');
                                        }
                                    })}
                                    isPending={buyItem.isPending}
                                    getIcon={getIcon}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4 max-w-3xl mx-auto"
                        >
                            {inventory.length === 0 ? (
                                <EmptyState onNavigate={() => setActiveTab('shop')} />
                            ) : (
                                inventory.map(slot => (
                                    <InventoryItem
                                        key={slot.id}
                                        slot={slot}
                                        onEquip={() => equipItem.mutate(slot.item_id, {
                                            onSuccess: () => success('Item equipped successfully!'),
                                            onError: () => error('Failed to equip item.')
                                        })}
                                        getIcon={getIcon}
                                    />
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label, badge }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 md:flex-none px-6 md:px-8 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 relative ${active
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
            {badge && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
                    }`}>
                    {badge}
                </span>
            )}
        </button>
    )
}

function ShopItemCard({ item, balance, onBuy, isPending, getIcon }) {
    const canAfford = balance >= item.cost;
    const isPowerup = item.category === 'powerup';

    const theme = isPowerup ? {
        bg: 'bg-rose-50 dark:bg-rose-900/10',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        iconText: 'text-rose-600 dark:text-rose-400'
    } : {
        bg: 'bg-amber-50 dark:bg-amber-900/10',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconText: 'text-amber-600 dark:text-amber-400'
    };

    return (
        <div className="group bg-white dark:bg-gray-800 rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-700 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[4rem] opacity-50 transition-colors ${theme.bg}`}></div>

            <div className="relative z-10 mb-5 flex justify-between items-start">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${theme.iconBg} ${theme.iconText}`}>
                    {getIcon(item.icon)}
                </div>
                <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest border border-gray-100 dark:border-gray-600">
                    {item.category}
                </div>
            </div>

            <h3 className="font-bold text-lg md:text-xl mb-2 text-gray-900 dark:text-white leading-tight">
                {item.name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm leading-relaxed mb-6 flex-grow">
                {item.description}
            </p>

            <div className="mt-auto pt-5 border-t border-gray-50 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cost</span>
                    <span className={`text-lg md:text-xl font-black ${canAfford ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                        {item.cost}
                    </span>
                </div>

                <button
                    onClick={onBuy}
                    disabled={!canAfford || isPending}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]
                        ${canAfford
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-lg shadow-gray-200 dark:shadow-none'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'}`}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : canAfford ? (
                        <>
                            <span>Unlock</span>
                            <Sparkles className="w-3.5 h-3.5" />
                        </>
                    ) : (
                        <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Too expensive</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}

function InventoryItem({ slot, onEquip, getIcon }) {
    const isCosmetic = slot.shop_items.category === 'cosmetic';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 flex items-center gap-4 md:gap-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
            <div className={`p-3 md:p-4 rounded-xl flex-shrink-0 transition-colors ${slot.is_equipped
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-2 ring-green-500/20'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400'
                }`}>
                {getIcon(slot.shop_items.icon)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate">
                        {slot.shop_items.name}
                    </h4>
                    {slot.quantity > 1 && (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 flex-shrink-0">
                            x{slot.quantity}
                        </span>
                    )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm line-clamp-1">{slot.shop_items.description}</p>
            </div>

            <div className="flex-shrink-0">
                {isCosmetic ? (
                    <button
                        onClick={onEquip}
                        className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold border-2 transition-all transform active:scale-95 flex items-center gap-2
                            ${slot.is_equipped
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-500/50 text-green-700 dark:text-green-400 cursor-default'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-600 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-400'}`}
                    >
                        {slot.is_equipped ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Active</span>
                            </>
                        ) : 'Equip'}
                    </button>
                ) : (
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/30 rounded-lg text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                        Consumable
                    </div>
                )}
            </div>
        </div>
    )
}

function EmptyState({ onNavigate }) {
    return (
        <div className="text-center py-16 md:py-24 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm px-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2">Inventory Empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs mx-auto text-sm md:text-base">
                You haven't purchased any items yet.
            </p>
            <button
                onClick={onNavigate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none text-sm"
            >
                Go to Shop
            </button>
        </div>
    )
}