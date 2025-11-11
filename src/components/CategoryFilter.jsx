import React from 'react'
import { Heart, Book, Coffee, Users, Briefcase, MessageSquare, Lightbulb, Smile } from 'lucide-react'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: MessageSquare, color: 'indigo' },
    { id: 'study', label: 'Study & Academics', icon: Book, color: 'blue' },
    { id: 'love', label: 'Love & Relationships', icon: Heart, color: 'pink' },
    { id: 'campus', label: 'Campus Life', icon: Coffee, color: 'orange' },
    { id: 'friends', label: 'Friendship', icon: Users, color: 'green' },
    { id: 'career', label: 'Career & Internship', icon: Briefcase, color: 'purple' },
    { id: 'thoughts', label: 'Random Thoughts', icon: Lightbulb, color: 'yellow' },
    { id: 'fun', label: 'Fun & Memes', icon: Smile, color: 'red' }
]

export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
    return (
        <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 pb-2">
                {CATEGORIES.map(({ id, label, icon: Icon, color }) => (
                    <button
                        key={id}
                        onClick={() => onSelectCategory(id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                            selectedCategory === id
                                ? `bg-${color}-600 text-white shadow-lg scale-105`
                                : `bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-${color}-50 dark:hover:bg-${color}-900/20 border border-gray-200 dark:border-gray-700`
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
