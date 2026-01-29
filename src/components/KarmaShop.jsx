import React, { useState } from 'react';
import { useKarmaShop } from '../hooks/useKarmaShop';
import { Loader2, ShoppingBag, Zap, Palette, Crown, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KarmaShop() {
    const userId = localStorage.getItem('anonId');
    const { balance, items, inventory, loading, buyItem, equipItem } = useKarmaShop(userId);
    const [activeTab, setActiveTab] = useState('shop');

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    const getIcon = (iconName) => {
        const icons = { Crown: <Crown />, Zap: <Zap />, Palette: <Palette />, Pin: <Zap />, Highlighter: <Palette /> };
        return icons[iconName] || <ShoppingBag />;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Karma Shop</h1>
                        <p className="text-indigo-100 opacity-90">Spend your reputation points on exclusive rewards.</p>
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20">
                        <span className="block text-sm text-indigo-200">Your Balance</span>
                        <span className="text-4xl font-extrabold text-amber-300 drop-shadow-sm">{balance} KP</span>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-1">
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'shop' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Browse Items
                </button>
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'inventory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    My Inventory ({inventory.length})
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'shop' ? (
                    <motion.div
                        key="shop"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {items.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${item.category === 'powerup' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {getIcon(item.icon)}
                                    </div>
                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">
                                        {item.cost} KP
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2 dark:text-white">{item.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm flex-1 mb-4">{item.description}</p>

                                <button
                                    onClick={() => buyItem.mutate(item.id)}
                                    disabled={balance < item.cost || buyItem.isPending}
                                    className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
                                        ${balance >= item.cost
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {balance >= item.cost ? (
                                        <>Buy Now</>
                                    ) : (
                                        <><Lock className="w-4 h-4" /> Insufficient Karma</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="inventory"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {inventory.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Your inventory is empty. Go shopping!</p>
                            </div>
                        )}
                        {inventory.map(slot => (
                            <div key={slot.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                    {getIcon(slot.shop_items.icon)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold dark:text-white flex items-center gap-2">
                                        {slot.shop_items.name}
                                        {slot.quantity > 1 && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">x{slot.quantity}</span>}
                                    </h4>
                                    <p className="text-sm text-gray-500">{slot.shop_items.description}</p>
                                </div>

                                {slot.shop_items.category === 'cosmetic' && (
                                    <button
                                        onClick={() => equipItem.mutate(slot.item_id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                                            ${slot.is_equipped
                                                ? 'bg-green-100 border-green-200 text-green-700 cursor-default'
                                                : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        {slot.is_equipped ? <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Equipped</span> : 'Equip'}
                                    </button>
                                )}

                                {slot.shop_items.type === 'pin_ticket' && (
                                    <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md font-medium">
                                        Use on your post
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}