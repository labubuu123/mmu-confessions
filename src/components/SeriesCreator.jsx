import React, { useState } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';

export default function SeriesCreator({ onSeriesData, onRemoveSeries }) {
    const [seriesName, setSeriesName] = useState('');
    const [seriesDescription, setSeriesDescription] = useState('');
    const [totalParts, setTotalParts] = useState(2);
    const [currentPart, setCurrentPart] = useState(1);

    React.useEffect(() => {
        if (seriesName.trim()) {
            onSeriesData({
                series_name: seriesName.trim(),
                series_description: seriesDescription.trim(),
                series_part: currentPart,
                series_total: totalParts,
                series_id: `series_${Date.now()}`
            });
        } else {
            onSeriesData(null);
        }
    }, [seriesName, seriesDescription, currentPart, totalParts]);

    return (
        <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-900/10 relative">
            <button
                type="button"
                onClick={onRemoveSeries}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-500 transition"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create a Story Series</h3>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Series Name *
                    </label>
                    <input
                        type="text"
                        value={seriesName}
                        onChange={(e) => setSeriesName(e.target.value)}
                        placeholder="e.g., My University Journey"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Series Description (Optional)
                    </label>
                    <textarea
                        value={seriesDescription}
                        onChange={(e) => setSeriesDescription(e.target.value)}
                        placeholder="Brief description of this series..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        rows="2"
                        maxLength={200}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Part
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={totalParts}
                            value={currentPart}
                            onChange={(e) => setCurrentPart(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total Parts
                        </label>
                        <input
                            type="number"
                            min={currentPart}
                            max="20"
                            value={totalParts}
                            onChange={(e) => setTotalParts(Math.max(currentPart, parseInt(e.target.value) || 2))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        💡 <strong>Tip:</strong> Series posts let you tell a longer story across multiple confessions.
                        Readers can navigate between parts easily!
                    </p>
                </div>
            </div>
        </div>
    );
}