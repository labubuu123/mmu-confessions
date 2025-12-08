import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LostFoundCreator({ onData, onRemove }) {
    const [type, setType] = useState('lost');
    const [itemName, setItemName] = useState('');
    const [location, setLocation] = useState('');
    const [contact, setContact] = useState('');

    useEffect(() => {
        if (itemName && location) {
            onData({ type, itemName, location, contact });
        } else {
            onData(null);
        }
    }, [type, itemName, location, contact, onData]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Lost & Found</h3>
                        <p className="text-xs text-gray-500">Help the community locate items</p>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    type="button"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg mb-4">
                <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${type === 'lost'
                            ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    I Lost Something
                </button>
                <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${type === 'found'
                            ? 'bg-white dark:bg-gray-800 text-green-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    I Found Something
                </button>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        What is it? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="e.g., Student Card, Blue Bottle, AirPods"
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last seen location / Found at <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., FOL Library, Male Toilet"
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contact Info (Optional)
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="Phone number, IG username, etc."
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:text-white"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}