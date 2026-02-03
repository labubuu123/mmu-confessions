import React from 'react';

const GRADIENTS = [
    'from-indigo-500/85 to-purple-600/85',
    'from-green-400/85 to-blue-500/85',
    'from-pink-500/85 to-rose-500/85',
    'from-yellow-400/85 to-orange-500/85',
    'from-teal-400/85 to-cyan-500/85',
    'from-red-500/85 to-pink-600/85',
    'from-blue-500/85 to-indigo-600/85',
    'from-purple-400/85 to-pink-500/85',
    'from-fuchsia-500/85 to-purple-600/85',
    'from-rose-400/85 to-red-500/85',
    'from-emerald-400/85 to-teal-500/85',
    'from-cyan-400/85 to-blue-500/85',
    'from-amber-400/85 to-orange-500/85',
    'from-violet-500/85 to-fuchsia-500/85',
    'from-lime-400/85 to-green-500/85',
    'from-sky-400/85 to-indigo-500/85',
    'from-orange-400/85 to-red-500/85',
    'from-blue-400/85 to-violet-500/85',
    'from-pink-400/85 to-fuchsia-500/85',
    'from-teal-300/85 to-blue-500/85',
    'from-indigo-400/85 to-cyan-400/85',
    'from-rose-500/85 to-orange-400/85',
    'from-green-300/85 to-emerald-600/85',
    'from-purple-500/85 to-indigo-500/85',
    'from-slate-500/85 to-gray-600/85',
    'from-zinc-400/85 to-neutral-600/85',
    'from-stone-400/85 to-red-400/85',
    'from-red-600/85 to-orange-600/85',
    'from-orange-500/85 to-amber-500/85',
    'from-amber-300/85 to-yellow-500/85',
    'from-yellow-300/85 to-lime-500/85',
    'from-lime-500/85 to-green-600/85',
    'from-green-500/85 to-emerald-700/85',
    'from-emerald-300/85 to-teal-600/85',
    'from-teal-500/85 to-cyan-600/85',
    'from-cyan-300/85 to-sky-600/85',
    'from-sky-500/85 to-blue-600/85',
    'from-blue-600/85 to-indigo-700/85',
    'from-indigo-300/85 to-violet-600/85',
    'from-violet-600/85 to-purple-700/85',
    'from-purple-300/85 to-fuchsia-600/85',
    'from-fuchsia-600/85 to-pink-600/85',
    'from-pink-300/85 to-rose-600/85',
    'from-rose-600/85 to-red-700/85',
    'from-slate-600/85 to-zinc-700/85',
    'from-gray-500/85 to-neutral-700/85',
    'from-neutral-500/85 to-stone-600/85',
    'from-red-300/85 to-blue-300/85',
    'from-yellow-200/85 to-green-300/85',
    'from-pink-300/85 to-purple-300/85'
];

const PATTERNS = [
    '🎭', '🎨', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻',
    '🎹', '🎷', '🥁', '🎤', '🎧', '🎼', '🎬', '🎩',
    '🪄', '🎟️', '🍿', '🎮', '👾', '🎱', '🎳', '🧩',
    '🪁', '🪀', '🎡', '🎢', '🖌️', '🖍️', '🧵', '🧶',
    '🚀', '🛸', '⚓', '🗺️', '🏝️', '🌋', '⛺', '🌌',
    '🌠', '🔥', '💧', '⚡', '❄️', '🌈', '☀️', '🌙',
    '⭐', '🌍', '🍄', '🌷', '🌵', '🌴', '🌲', '🍀',
    '🍁', '🍂', '🍃', '🕊️', '🦅', '🦆', '🦉', '🦇',
    '🦈', '🦖', '🤖', '👻', '💀', '👽', '👾', '🤖',
    '🦊', '🦁', '🐯', '🐼', '🐨', '🐸', '🦄', '🐝'
];

const AVATAR_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
            <div className={`rounded-full bg-gradient-to-br from-gray-400/85 to-gray-600/85 flex items-center justify-center text-white font-bold flex-shrink-0 ${sizes[size]}`}>
                ?
            </div>
        );
    }

    const hash = simpleHash(authorId);
    const gradient = GRADIENTS[hash % GRADIENTS.length];
    const pattern = PATTERNS[hash % PATTERNS.length];
    const letter = AVATAR_CHARS[hash % AVATAR_CHARS.length];

    const topBadge = badges && badges.length > 0 ? badges[0] : null;

    return (
        <div className="relative">
            <div className={`rounded-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white font-bold flex-shrink-0 ${sizes[size]} shadow-lg backdrop-blur-sm`}>
                <span className="opacity-50 text-xs">{pattern}</span>
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