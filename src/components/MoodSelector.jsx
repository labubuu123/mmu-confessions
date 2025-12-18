import React, { useState, useRef, useEffect } from 'react';
import { Smile, X, Zap, BookOpen } from 'lucide-react';

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
        <div className="relative inline-block" ref={wrapperRef}>
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
                    className="absolute -top-1.5 -right-1.5 z-10 bg-red-500 text-white rounded-full p-0.5 transition-transform hover:scale-110 shadow-sm"
                    title="Clear mood"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    <div
                        className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm p-4 transform transition-all scale-100 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                How are you feeling?
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                            {moods.map((mood) => (
                                <button
                                    key={mood.label}
                                    type="button"
                                    onClick={() => handleSelectMood(mood)}
                                    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition active:scale-95"
                                    title={mood.label}
                                >
                                    <span className="text-3xl mb-1 filter drop-shadow-sm">{mood.emoji}</span>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center">
                                        {mood.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}