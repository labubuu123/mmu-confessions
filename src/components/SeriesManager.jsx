import React, { useState } from 'react';
import SeriesCreator from './SeriesCreator';
import { X, Plus, List, Loader2 } from 'lucide-react';

export default function SeriesManager({ onSeriesData, onRemoveSeries, existingSeries = [], loadingSeries }) {
    const [mode, setMode] = useState('select');
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [currentPart, setCurrentPart] = useState(1);

    const handleSelectSeries = (series) => {
        setSelectedSeries(series);
        const nextPart = (series.max_part || 0) + 1;
        setCurrentPart(nextPart);
        setMode('add');

        onSeriesData({
            series_id: series.series_id,
            series_name: series.series_name,
            series_total: series.series_total,
            series_part: nextPart,
        });
    };

    React.useEffect(() => {
        if (mode === 'add' && selectedSeries) {
            onSeriesData({
                series_id: selectedSeries.series_id,
                series_name: selectedSeries.series_name,
                series_total: selectedSeries.series_total,
                series_part: currentPart,
            });
        }
    }, [currentPart, mode, selectedSeries, onSeriesData]);

    const handleNewSeriesData = (data) => {
        onSeriesData(data);
    };

    if (mode === 'create') {
        return (
            <SeriesCreator
                onSeriesData={handleNewSeriesData}
                onRemoveSeries={() => {
                    setMode('select');
                    onSeriesData(null);
                }}
            />
        );
    }

    if (mode === 'add') {
        return (
            <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-900/10 relative">
                <button
                    type="button"
                    onClick={onRemoveSeries}
                    className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-500 transition"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Add to Series: {selectedSeries.series_name}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Part
                        </label>
                        <input
                            type="number"
                            min={(selectedSeries.max_part || 0) + 1}
                            value={currentPart}
                            onChange={(e) => setCurrentPart(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total Parts
                        </label>
                        <input
                            type="text"
                            value={selectedSeries.series_total || '?'}
                            disabled
                            className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 outline-none"
                        />
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setMode('select');
                        onSeriesData(null);
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-3"
                >
                    &larr; Choose a different series
                </button>
            </div>
        );
    }

    return (
        <div className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-900/10 relative">
            <button
                type="button"
                onClick={onRemoveSeries}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full text-red-500 transition"
            >
                <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Story Series</h3>

            <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
                <Plus className="w-5 h-5" />
                Create New Series
            </button>

            {loadingSeries && (
                <div className="flex justify-center items-center gap-2 my-4 text-xs text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading existing series...
                </div>
            )}

            {!loadingSeries && existingSeries.length > 0 && (
                <>
                    <div className="my-4 flex items-center gap-2">
                        <span className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></span>
                        <span className="text-xs font-medium text-gray-500">OR</span>
                        <span className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Add to Existing Series:
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg p-2 bg-purple-100/30 dark:bg-purple-900/20">
                        {existingSeries.map(series => (
                            <button
                                key={series.series_id}
                                type="button"
                                onClick={() => handleSelectSeries(series)}
                                className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-gray-200 dark:border-gray-700 transition"
                            >
                                <div className="font-semibold text-purple-800 dark:text-purple-300">{series.series_name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {series.max_part || 0} / {series.series_total || '?'} parts posted
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}