import React, { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

export const campuses = [
    { id: 'melaka', label: 'Melaka', emoji: '🏰' },
    { id: 'cyberjaya', label: 'Cyberjaya', emoji: '🏰' },
];

export function CampusBadge({ campus }) {
    if (!campus) return null;

    const label = typeof campus === 'string' ? campus : campus.label;
    const campusInfo = campuses.find(c => c.label.toLowerCase() === label.toLowerCase());

    if (!campusInfo) return null;

    return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-full">
            <span className="text-sm">{campusInfo.emoji}</span>
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                {campusInfo.label}
            </span>
        </div>
    );
}

export default function CampusSelector({ selectedCampus, onSelectCampus }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (campus) => {
        onSelectCampus(campus);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${selectedCampus
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                title="Select Campus"
            >
                {selectedCampus ? (
                    <span className="text-lg">{selectedCampus.emoji}</span>
                ) : (
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                )}
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {selectedCampus ? selectedCampus.label : 'Campus'}
                </span>
            </button>

            {selectedCampus && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectCampus(null);
                        setIsOpen(false);
                    }}
                    className="absolute -top-1.5 -right-1.5 z-10 bg-red-500 text-white rounded-full p-0.5 transition-transform hover:scale-110"
                    title="Clear campus"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 p-2 left-0"
                >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-2 block">
                        Select Campus
                    </span>
                    <div className="flex flex-col gap-1">
                        {campuses.map((campus) => (
                            <button
                                key={campus.id}
                                type="button"
                                onClick={() => handleSelect(campus)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition w-full text-left"
                            >
                                <span className="text-xl">{campus.emoji}</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {campus.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}