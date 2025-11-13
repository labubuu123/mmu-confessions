import React, { useState } from 'react'
import { Smile } from 'lucide-react'

const MOODS = [
    { emoji: '😊', label: 'Happy', color: 'from-yellow-400 to-orange-400' },
    { emoji: '😢', label: 'Sad', color: 'from-blue-400 to-indigo-500' },
    { emoji: '😤', label: 'Angry', color: 'from-red-400 to-pink-500' },
    { emoji: '😰', label: 'Anxious', color: 'from-purple-400 to-pink-400' },
    { emoji: '🤔', label: 'Confused', color: 'from-gray-400 to-gray-500' },
    { emoji: '😴', label: 'Tired', color: 'from-indigo-400 to-purple-500' },
    { emoji: '🥳', label: 'Excited', color: 'from-green-400 to-cyan-500' },
    { emoji: '😨', label: 'Scared', color: 'from-purple-500 to-pink-500' },
    { emoji: '🤗', label: 'Grateful', color: 'from-pink-400 to-rose-400' },
    { emoji: '😎', label: 'Cool', color: 'from-cyan-400 to-blue-500' },
]

export default function MoodSelector({ selectedMood, onSelectMood }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    selectedMood
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
                {selectedMood ? (
                    <>
                        <span className="text-xl">{selectedMood.emoji}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                            {selectedMood.label}
                        </span>
                    </>
                ) : (
                    <>
                        <Smile className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                            Mood
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                How are you feeling?
                            </h3>
                            {selectedMood && (
                                <button
                                    onClick={() => {
                                        onSelectMood(null)
                                        setIsOpen(false)
                                    }}
                                    className="text-xs text-gray-500 hover:text-red-500"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {MOODS.map(mood => (
                                <button
                                    key={mood.label}
                                    type="button"
                                    onClick={() => {
                                        onSelectMood(mood)
                                        setIsOpen(false)
                                    }}
                                    className={`group relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                                        selectedMood?.label === mood.label
                                            ? `bg-gradient-to-br ${mood.color} shadow-lg scale-110`
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-110'
                                    }`}
                                    title={mood.label}
                                >
                                    <span className="text-2xl">{mood.emoji}</span>
                                    <span className={`text-[10px] font-medium transition ${
                                        selectedMood?.label === mood.label
                                            ? 'text-white'
                                            : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        {mood.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export function MoodBadge({ mood }) {
    if (!mood) return null

    const moodData = MOODS.find(m => m.label === mood.label) || mood

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${moodData.color} shadow-md`}>
            <span className="text-base">{moodData.emoji}</span>
            <span className="text-xs font-medium text-white">{moodData.label}</span>
        </div>
    )
}