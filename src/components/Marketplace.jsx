import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import MarketplaceForm from './MarketplaceForm';
import MarketplaceItemCard from './MarketplaceItemCard';
import { ShoppingBag, Search, Filter, Plus, Store } from 'lucide-react';
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
            .eq('is_sold', false)
            .order('created_at', { ascending: false });

        if (data) setItems(data);
        if (error) console.error('Error fetching items:', error);
        setLoading(false);
    }

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

            <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Store className="w-8 h-8 text-indigo-600" />
                            MMU Student Marketplace
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Buy, sell, and trade with fellow MMU students.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSellForm(!showSellForm)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
                    >
                        {showSellForm ? 'Close Form' : 'Sell an Item'}
                        {!showSellForm && <Plus className="w-5 h-5" />}
                    </button>
                </div>

                {showSellForm && (
                    <div className="mb-10 animate-fade-in-down">
                        <MarketplaceForm
                            onItemPosted={(newItem) => {
                                setItems([newItem, ...items]);
                                setShowSellForm(false);
                            }}
                        />
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterCategory === cat
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                        : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <MarketplaceItemCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Be the first to list something in this category!
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}