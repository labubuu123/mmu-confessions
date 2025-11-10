import React from 'react'

const gradients = [
    'from-indigo-500 to-purple-600',
    'from-green-400 to-blue-500',
    'from-pink-500 to-rose-500',
    'from-yellow-400 to-orange-500',
    'from-teal-400 to-cyan-500',
    'from-red-500 to-yellow-500',
    'from-blue-500 to-indigo-600',
    'from-purple-400 to-pink-500',
]

function simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
        hash = hash & hash
    }
    return Math.abs(hash)
}

export default function AnonAvatar({ authorId, size = 'md' }) {
    if (!authorId) {
        return (
            <div className={`rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${
                size === 'md' ? 'w-10 h-10' : 'w-8 h-8 text-xs'
            }`}>
                A
            </div>
        )
    }

    const hash = simpleHash(authorId)
    const gradient = gradients[hash % gradients.length]
    const letter = authorId.substring(0, 1).toUpperCase()

    return (
        <div className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 ${
            size === 'md' ? 'w-10 h-10' : 'w-8 h-8 text-xs'
        }`}>
            {letter}
        </div>
    )
}