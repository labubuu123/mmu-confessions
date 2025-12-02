import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import MarketplaceForm from './MarketplaceForm';
import MarketplaceItemCard from './MarketplaceItemCard';
import { ShoppingBag, Search, Plus, Store, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Marketplace() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSellForm, setShowSellForm] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', 'Textbooks', 'Electronics', 'Furniture', 'Fashion', 'Room Rental', 'Others'];

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        setLoading(true);
        const { data, error } = await supabase
            .from('marketplace_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setItems(data);
        if (error) console.error('Error fetching items:', error);
        setLoading(false);
    }

    const handleDeleteItem = (deletedId) => {
        setItems(prev => prev.filter(item => item.id !== deletedId));
    };

    const filteredItems = items.filter(item => {
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <>
            <Helmet>
                <title>MMU Marketplace - Buy & Sell</title>
            </Helmet>

            <style>{`
                .category-scroll::-webkit-scrollbar {
                    height: 6px;
                }
                .category-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .category-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(203, 213, 225, 0.5); 
                    border-radius: 20px;
                }
                .dark .category-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.5);
                }
                .category-scroll::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(148, 163, 184, 0.8);
                }
            `}</style>

            <div className="min-h-screen pb-12">
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-start justify-between mb-4 gap-2">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Store className="w-6 h-6 text-indigo-600 shrink-0" />
                                    Marketplace
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                    Buy, sell, and trade with fellow MMU students.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSellForm(!showSellForm)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0 whitespace-nowrap"
                            >
                                {showSellForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                <span>{showSellForm ? 'Close' : 'Sell Item'}</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search textbooks, gadgets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-transparent focus:bg-white dark:focus:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all text-sm"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 category-scroll">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${filterCategory === cat
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-6">
                    {showSellForm && (
                        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <MarketplaceForm
                                onItemPosted={(newItem) => {
                                    setItems([newItem, ...items]);
                                    setShowSellForm(false);
                                }}
                                onCancel={() => setShowSellForm(false)}
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="aspect-[4/5] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                            {filteredItems.map(item => (
                                <MarketplaceItemCard
                                    key={item.id}
                                    item={item}
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No items found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                                Try adjusting your search or be the first to sell something in {filterCategory}!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}