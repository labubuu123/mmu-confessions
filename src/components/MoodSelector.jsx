import React, { useState, useRef, useEffect } from 'react';
import { Smile, X, Star, Zap, Coffee, BookOpen } from 'lucide-react';

export const moods = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😠', label: 'Angry' },
    { emoji: '❤️', label: 'Loved' },
    { emoji: '😂', label: 'Funny' },
    { emoji: '😮', label: 'Surprised' },
    { emoji: '🤔', label: 'Thinking' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🙏', label: 'Grateful' },
    { emoji: '🎉', label: 'Celebrating' },
    { emoji: '😔', label: 'Lonely' },
    { emoji: '🤯', label: 'Mind-blown' },
    { emoji: ' venting', label: 'Venting' },
    { emoji: '🌟', label: 'Inspired' },
    { emoji: '🔥', label: 'Motivated' },
    { emoji: '😌', label: 'Relaxed' },
];

export function MoodBadge({ mood }) {
    if (!mood) return null;

    if (typeof mood === 'string') {
        let icon = <Smile className="w-3 h-3" />;
        if (mood.toLowerCase() === 'venting') icon = <Zap className="w-3 h-3" />;
        if (mood.toLowerCase() === 'studying') icon = <BookOpen className="w-3 h-3" />;

        return (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                {icon}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {mood}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            <span className="text-sm">{mood.emoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {mood.label}
            </span>
        </div>
    );
}

export default function MoodSelector({ selectedMood, onSelectMood }) {
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

    const handleSelectMood = (mood) => {
        onSelectMood(mood);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition ${selectedMood
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                title="Add a mood"
            >
                {selectedMood ? (
                    <span className="text-lg">{selectedMood.emoji}</span>
                ) : (
                    <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                )}
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                    {selectedMood ? selectedMood.label : 'Mood'}
                </span>
            </button>

            {selectedMood && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectMood(null);
                        setIsOpen(false);
                    }}
                    className="absolute -top-1.5 -right-1.5 z-10 bg-red-500 text-white rounded-full p-0.5 transition-transform hover:scale-110"
                    title="Clear mood"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {isOpen && (
                <div
                    className="absolute top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 p-3 right-0 sm:left-0"
                >
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1 mb-2 block">
                        How are you feeling?
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                        {moods.map((mood) => (
                            <button
                                key={mood.label}
                                type="button"
                                onClick={() => handleSelectMood(mood)}
                                className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title={mood.label}
                            >
                                <span className="text-2xl">{mood.emoji}</span>
                                <span className="text-[10px] text-gray-700 dark:text-gray-300">
                                    {mood.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}