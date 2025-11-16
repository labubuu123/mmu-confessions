import React from 'react';

const GRADIENTS = [
    'from-indigo-500 to-purple-600',
    'from-green-400 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-yellow-400 to-orange-500',
    'from-teal-400 to-cyan-500',
    'from-red-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-purple-400 to-pink-500',
];

const PATTERNS = ['🎭', '🎨', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻'];

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

export default function AnonAvatar({ authorId, size = 'md', showBadge = false, badges = [] }) {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
        xl: 'w-24 h-24 text-3xl'
    };

    if (!authorId) {
        return (
            <div className={`rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${sizes[size]}`}>
                A
            </div>
        );
    }

    const hash = simpleHash(authorId);
    const gradient = GRADIENTS[hash % GRADIENTS.length];
    const pattern = PATTERNS[hash % PATTERNS.length];
    const letter = authorId.substring(0, 1).toUpperCase();

    const topBadge = badges && badges.length > 0 ? badges[0] : null;

    return (
        <div className="relative">
            <div className={`rounded-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white font-bold flex-shrink-0 ${sizes[size]} shadow-lg`}>
                <span className="opacity-30 text-xs">{pattern}</span>
                <span className="-mt-1">{letter}</span>
            </div>
            {showBadge && topBadge && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white dark:border-gray-800 shadow-lg">
                    <span className="text-xs">{topBadge.icon}</span>
                </div>
            )}
        </div>
    );
}